import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

interface PropertyRow {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  price: string | number;
  area: string | number;
  location: string;
  address: string;
  coordinates: string;
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
  createdAt: Date;
  updatedAt: Date;
  latitude?: number;
  longitude?: number;
  created_at?: Date;
  updated_at?: Date;
}

// GET /api/properties - Get all properties with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const transactionType = searchParams.get('transactionType');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minArea = searchParams.get('minArea');
    const maxArea = searchParams.get('maxArea');
    const minInvestmentReturn = searchParams.get('minInvestmentReturn');
    const maxInvestmentReturn = searchParams.get('maxInvestmentReturn');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (type && type !== 'all') {
      conditions.push('type = ?');
      params.push(type);
    }

    if (transactionType && transactionType !== 'all') {
      conditions.push('transactionType = ?');
      params.push(transactionType);
    }

    if (minPrice) {
      conditions.push('price >= ?');
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      conditions.push('price <= ?');
      params.push(parseFloat(maxPrice));
    }

    if (minArea) {
      conditions.push('area >= ?');
      params.push(parseFloat(minArea));
    }

    if (maxArea) {
      conditions.push('area <= ?');
      params.push(parseFloat(maxArea));
    }

    if (minInvestmentReturn) {
      conditions.push('investmentReturn >= ?');
      params.push(parseFloat(minInvestmentReturn));
    }

    if (maxInvestmentReturn) {
      conditions.push('investmentReturn <= ?');
      params.push(parseFloat(maxInvestmentReturn));
    }

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ? OR shortDescription LIKE ? OR location LIKE ? OR address LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const validSortFields = ['created_at', 'updated_at', 'price', 'area', 'views', 'featured'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    let orderClause: string;
    if (sortField === 'featured') {
      orderClause = `ORDER BY isFeatured DESC, created_at DESC`;
    } else if (sortField === 'created_at' || sortField === 'updated_at') {
      orderClause = `ORDER BY isFeatured DESC, ${sortField} ${orderDirection}`;
    } else {
      orderClause = `ORDER BY ${sortField} ${orderDirection}`;
    }

    // Get total count
    interface CountRow {
      total: number;
    }
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM properties ${whereClause}`,
      params
    ) as [CountRow[], unknown];
    const total = countRows[0].total;

    // Get properties
    // Убеждаемся, что limit и offset являются целыми числами
    const safeLimit = Math.max(1, Math.min(100, parseInt(String(limit), 10)));
    const safeOffset = Math.max(0, parseInt(String((page - 1) * limit), 10));
    
    // MySQL2 может иметь проблемы с параметрами LIMIT/OFFSET в prepared statements
    // Используем безопасную подстановку с валидацией
    const [rows] = await pool.execute(
      `SELECT 
        id,
        title,
        description,
        shortDescription,
        price,
        area,
        location,
        address,
        JSON_ARRAY(latitude, longitude) as coordinates,
        type,
        transactionType,
        investmentReturn,
        images,
        isFeatured,
        layout,
        rooms,
        bathrooms,
        parking,
        balcony,
        elevator,
        furnished,
        views,
        submissions,
        created_at as createdAt,
        updated_at as updatedAt
      FROM properties 
      ${whereClause}
      ${orderClause}
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    ) as [PropertyRow[], unknown];

    // Parse JSON fields
    const properties = rows.map((row) => ({
      _id: row.id,
      title: row.title,
      description: row.description,
      shortDescription: row.shortDescription,
      price: parseFloat(String(row.price)),
      area: parseFloat(String(row.area)),
      location: row.location,
      address: row.address,
      coordinates: JSON.parse(row.coordinates),
      type: row.type,
      transactionType: row.transactionType,
      investmentReturn: row.investmentReturn ? parseFloat(String(row.investmentReturn)) : undefined,
      images: JSON.parse(row.images),
      isFeatured: Boolean(row.isFeatured),
      layout: row.layout || undefined,
      specifications: {
        rooms: row.rooms || undefined,
        bathrooms: row.bathrooms || undefined,
        parking: Boolean(row.parking),
        balcony: Boolean(row.balcony),
        elevator: Boolean(row.elevator),
        furnished: Boolean(row.furnished),
      },
      views: row.views,
      formSubmissions: row.submissions,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error: unknown) {
    console.error('Get properties error:', error);
    
    const err = error as { code?: string; message?: string };
    
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

// POST /api/properties - Create new property (admin only)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('adminToken')?.value || 
                  request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      );
    }

    await verifyToken(token);

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

    // Validate required fields
    const requiredFields = ['title', 'description', 'shortDescription', 'price', 'area', 'location', 'address', 'coordinates', 'type', 'transactionType', 'images'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { message: `Field ${field} is required` },
          { status: 400 }
        );
      }
    }

    const id = randomUUID();
    const [latitude, longitude] = coordinates;

    await pool.execute(
      `INSERT INTO properties (
        id, title, description, shortDescription, price, area, location, address,
        latitude, longitude, type, transactionType, investmentReturn, images,
        isFeatured, layout, rooms, bathrooms, parking, balcony, elevator, furnished
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        description,
        shortDescription,
        price,
        area,
        location,
        address,
        latitude,
        longitude,
        type,
        transactionType,
        investmentReturn || null,
        JSON.stringify(images),
        isFeatured || false,
        layout || null,
        specifications?.rooms || null,
        specifications?.bathrooms || null,
        specifications?.parking || false,
        specifications?.balcony || false,
        specifications?.elevator || false,
        specifications?.furnished || false,
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM properties WHERE id = ?',
      [id]
    ) as [PropertyRow[], unknown];

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
      coordinates: [
        property.latitude ? parseFloat(String(property.latitude)) : 0,
        property.longitude ? parseFloat(String(property.longitude)) : 0
      ],
      type: property.type,
      transactionType: property.transactionType,
      investmentReturn: property.investmentReturn ? parseFloat(String(property.investmentReturn)) : undefined,
      images: JSON.parse(property.images),
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
      createdAt: (property.created_at || property.createdAt).toISOString(),
      updatedAt: (property.updated_at || property.updatedAt).toISOString(),
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create property error:', error);
    
    const err = error as { code?: string; message?: string };
    
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

