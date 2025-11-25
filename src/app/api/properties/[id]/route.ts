import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// Helper function to safely parse images field
function parseImages(images: string | string[]): string[] {
  // If already an array, return as is
  if (Array.isArray(images)) {
    return images;
  }
  
  // If empty string, return empty array
  if (!images || images.trim() === '') {
    return [];
  }
  
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // If parsed but not an array, wrap in array
    return [String(images)];
  } catch {
    // If parsing fails, check if it's a data URI
    if (typeof images === 'string' && images.startsWith('data:')) {
      return [images];
    }
    // Otherwise, wrap in array
    return [String(images)];
  }
}

interface PropertyDBRow {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  price: string | number;
  area: string | number;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  transactionType: string;
  investmentReturn: string | number | null;
  images: string;
  isFeatured: number | boolean;
  layout: string | null;
  rooms: number | null;
  bathrooms: number | null;
  parking: number | boolean;
  balcony: number | boolean;
  elevator: number | boolean;
  furnished: number | boolean;
  views: number;
  submissions: number;
  created_at: Date;
  updated_at: Date;
}

// GET /api/properties/[id] - Get single property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await pool.execute(
      'SELECT * FROM properties WHERE id = ?',
      [id]
    ) as [PropertyDBRow[], unknown];

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      );
    }

    const property = rows[0];

    // Increment view count
    await pool.execute(
      'UPDATE properties SET views = views + 1 WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      _id: property.id,
      title: property.title,
      description: property.description,
      shortDescription: property.shortDescription,
      price: parseFloat(String(property.price)),
      area: parseFloat(String(property.area)),
      location: property.location,
      address: property.address,
      coordinates: [property.latitude, property.longitude],
      type: property.type,
      transactionType: property.transactionType,
      investmentReturn: property.investmentReturn ? parseFloat(String(property.investmentReturn)) : undefined,
      images: parseImages(property.images),
      isFeatured: Boolean(property.isFeatured),
      layout: property.layout || undefined,
      specifications: {
        rooms: property.rooms || undefined,
        bathrooms: property.bathrooms || undefined,
        parking: Boolean(property.parking),
        balcony: Boolean(property.balcony),
        elevator: Boolean(property.elevator),
        furnished: Boolean(property.furnished),
      },
      views: property.views,
      formSubmissions: property.submissions,
      createdAt: property.created_at.toISOString(),
      updatedAt: property.updated_at.toISOString(),
    });
  } catch (error: unknown) {
    // Обрабатываем ошибки авторизации
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: err.message },
        { status: 401 }
      );
    }
    
    console.error('Get property by ID error:', error);
    
    // Check if table doesn't exist
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes("doesn't exist")) {
      return NextResponse.json(
        { message: 'Database not initialized. Please call POST /api/admin/init first.' },
        { status: 503 }
      );
    }

    // Check if connection failed
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return NextResponse.json(
        { message: 'Database connection failed. Please check your database configuration.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: err.message || 'Server error' },
      { status: 500 }
    );
  }
}

// PUT /api/properties/[id] - Update property (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      shortDescription,
      price,
      area,
      location,
      address,
      coordinates,
      type,
      transactionType,
      investmentReturn,
      images,
      isFeatured,
      layout,
      specifications,
    } = body;

    const [latitude, longitude] = coordinates || [];

    // Get current property to preserve values that aren't being updated
    const [currentRows] = await pool.execute(
      'SELECT * FROM properties WHERE id = ?',
      [id]
    ) as [PropertyDBRow[], unknown];

    if (currentRows.length === 0) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      );
    }

    const current = currentRows[0];

    // Validate values if provided - exact match required (validated at application level)
    const validTypes = ['Жилые помещения', 'Нежилые помещения', 'Машино-места', 'Гараж-боксы'];
    const validTransactionTypes = ['Продажа', 'Аренда'];
    
    // Normalize: trim and ensure exact match
    const normalizedType = type !== undefined ? String(type).trim() : current.type;
    const normalizedTransactionType = transactionType !== undefined ? String(transactionType).trim() : current.transactionType;
    
    // Find exact match (case-sensitive) or use current value if not provided
    const matchedType = type !== undefined 
      ? validTypes.find(t => t === normalizedType)
      : current.type;
    if (type !== undefined && !matchedType) {
      return NextResponse.json(
        { 
          message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
          received: normalizedType,
          receivedLength: normalizedType.length
        },
        { status: 400 }
      );
    }
    
    const matchedTransactionType = transactionType !== undefined
      ? validTransactionTypes.find(t => t === normalizedTransactionType)
      : current.transactionType;
    if (transactionType !== undefined && !matchedTransactionType) {
      return NextResponse.json(
        { 
          message: `Invalid transactionType. Must be one of: ${validTransactionTypes.join(', ')}`,
          received: normalizedTransactionType,
          receivedLength: normalizedTransactionType.length
        },
        { status: 400 }
      );
    }

    await pool.execute(
      `UPDATE properties SET
        title = ?, description = ?, shortDescription = ?, price = ?, area = ?,
        location = ?, address = ?, latitude = ?, longitude = ?, type = ?,
        transactionType = ?, investmentReturn = ?, images = ?, isFeatured = ?,
        layout = ?, rooms = ?, bathrooms = ?, parking = ?, balcony = ?,
        elevator = ?, furnished = ?
      WHERE id = ?`,
      [
        title ?? current.title,
        description ?? current.description,
        shortDescription ?? current.shortDescription,
        price ?? current.price,
        area ?? current.area,
        location ?? current.location,
        address ?? current.address,
        latitude ?? current.latitude,
        longitude ?? current.longitude,
        matchedType, // Use exact matched value
        matchedTransactionType, // Use exact matched value
        investmentReturn !== undefined ? investmentReturn : current.investmentReturn,
        images !== undefined ? JSON.stringify(images) : current.images,
        isFeatured !== undefined ? isFeatured : current.isFeatured,
        layout !== undefined ? layout : current.layout,
        specifications?.rooms !== undefined ? specifications.rooms : current.rooms,
        specifications?.bathrooms !== undefined ? specifications.bathrooms : current.bathrooms,
        specifications?.parking !== undefined ? specifications.parking : current.parking,
        specifications?.balcony !== undefined ? specifications.balcony : current.balcony,
        specifications?.elevator !== undefined ? specifications.elevator : current.elevator,
        specifications?.furnished !== undefined ? specifications.furnished : current.furnished,
        id,
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM properties WHERE id = ?',
      [id]
    ) as [PropertyDBRow[], unknown];

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      );
    }

    const property = rows[0];
    return NextResponse.json({
      _id: property.id,
      title: property.title,
      description: property.description,
      shortDescription: property.shortDescription,
      price: parseFloat(String(property.price)),
      area: parseFloat(String(property.area)),
      location: property.location,
      address: property.address,
      coordinates: [property.latitude, property.longitude],
      type: property.type,
      transactionType: property.transactionType,
      investmentReturn: property.investmentReturn ? parseFloat(String(property.investmentReturn)) : undefined,
      images: parseImages(property.images),
      isFeatured: Boolean(property.isFeatured),
      layout: property.layout || undefined,
      specifications: {
        rooms: property.rooms || undefined,
        bathrooms: property.bathrooms || undefined,
        parking: Boolean(property.parking),
        balcony: Boolean(property.balcony),
        elevator: Boolean(property.elevator),
        furnished: Boolean(property.furnished),
      },
      views: property.views,
      formSubmissions: property.submissions,
      createdAt: property.created_at.toISOString(),
      updatedAt: property.updated_at.toISOString(),
    });
  } catch (error: unknown) {
    // Обрабатываем ошибки авторизации
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: err.message },
        { status: 401 }
      );
    }
    
    console.error('Update property error:', error);
    
    // Check if table doesn't exist
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes("doesn't exist")) {
      return NextResponse.json(
        { message: 'Database not initialized. Please call POST /api/admin/init first.' },
        { status: 503 }
      );
    }

    // Check if connection failed
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return NextResponse.json(
        { message: 'Database connection failed. Please check your database configuration.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: err.message || 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - Delete property (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;

    interface DeleteResult {
      affectedRows: number;
    }
    
    const [result] = await pool.execute(
      'DELETE FROM properties WHERE id = ?',
      [id]
    ) as [DeleteResult, unknown];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error: unknown) {
    // Обрабатываем ошибки авторизации
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: err.message },
        { status: 401 }
      );
    }
    
    console.error('Delete property error:', error);
    
    // Check if table doesn't exist
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes("doesn't exist")) {
      return NextResponse.json(
        { message: 'Database not initialized. Please call POST /api/admin/init first.' },
        { status: 503 }
      );
    }

    // Check if connection failed
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return NextResponse.json(
        { message: 'Database connection failed. Please check your database configuration.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: err.message || 'Server error' },
      { status: 500 }
    );
  }
}

