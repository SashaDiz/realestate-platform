import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
      createdAt: property.created_at.toISOString(),
      updatedAt: property.updated_at.toISOString(),
    });
  } catch (error: unknown) {
    console.error('Get property by ID error:', error);
    
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

// PUT /api/properties/[id] - Update property (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
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

    await pool.execute(
      `UPDATE properties SET
        title = ?, description = ?, shortDescription = ?, price = ?, area = ?,
        location = ?, address = ?, latitude = ?, longitude = ?, type = ?,
        transactionType = ?, investmentReturn = ?, images = ?, isFeatured = ?,
        layout = ?, rooms = ?, bathrooms = ?, parking = ?, balcony = ?,
        elevator = ?, furnished = ?
      WHERE id = ?`,
      [
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
      createdAt: property.created_at.toISOString(),
      updatedAt: property.updated_at.toISOString(),
    });
  } catch (error: unknown) {
    console.error('Update property error:', error);
    
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

// DELETE /api/properties/[id] - Delete property (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

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
    console.error('Delete property error:', error);
    
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

