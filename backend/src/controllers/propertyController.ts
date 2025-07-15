import { Request, Response } from 'express';
import Property, { IProperty } from '../models/Property';
import { AuthRequest } from '../middleware/auth';

// Get all properties with filtering and sorting
export const getProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      type,
      transactionType,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      minInvestmentReturn,
      maxInvestmentReturn,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (transactionType && transactionType !== 'all') {
      filter.transactionType = transactionType;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minArea || maxArea) {
      filter.area = {};
      if (minArea) filter.area.$gte = Number(minArea);
      if (maxArea) filter.area.$lte = Number(maxArea);
    }

    if (minInvestmentReturn || maxInvestmentReturn) {
      filter.investmentReturn = {};
      if (minInvestmentReturn) filter.investmentReturn.$gte = Number(minInvestmentReturn);
      if (maxInvestmentReturn) filter.investmentReturn.$lte = Number(maxInvestmentReturn);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Add featured properties first
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      sort.isFeatured = -1;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const properties = await Property.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Property.countDocuments(filter);

    res.json({
      properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single property by ID
export const getPropertyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);

    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    // Increment view count
    await Property.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Возвращаем объект с formSubmissions
    const propertyObj: any = property.toObject();
    propertyObj.formSubmissions = propertyObj.submissions;
    res.json(propertyObj);
  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new property (admin only)
export const createProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const propertyData = req.body;

    // Validate required fields
    const requiredFields = ['title', 'description', 'shortDescription', 'price', 'area', 'location', 'address', 'coordinates', 'type', 'transactionType', 'images'];

    for (const field of requiredFields) {
      if (!propertyData[field]) {
        res.status(400).json({ message: `Field ${field} is required` });
        return;
      }
    }

    const property = new Property(propertyData);
    await property.save();

    res.status(201).json(property);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update property (admin only)
export const updateProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const property = await Property.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    res.json(property);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete property (admin only)
export const deleteProperty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await Property.findByIdAndDelete(id);

    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle featured status (admin only)
export const toggleFeatured = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);

    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    property.isFeatured = !property.isFeatured;
    await property.save();

    res.json(property);
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Increment submission count
export const incrementSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await Property.findByIdAndUpdate(
      id,
      { $inc: { submissions: 1 } },
      { new: true }
    );

    if (!property) {
      res.status(404).json({ message: 'Property not found' });
      return;
    }

    res.json({ message: 'Submission recorded', formSubmissions: property.submissions });
  } catch (error) {
    console.error('Increment submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get property type statistics (total count per type)
export const getPropertyTypeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Property.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    // Преобразуем в объект { type: count }
    const result: Record<string, number> = {};
    stats.forEach((item: any) => {
      result[item._id] = item.count;
    });
    res.json(result);
  } catch (error) {
    console.error('Get property type stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

