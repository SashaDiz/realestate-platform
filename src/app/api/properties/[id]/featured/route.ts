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

interface FeaturedRow {
  isFeatured: number | boolean;
}

// PATCH /api/properties/[id]/featured - Toggle featured status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;

    // Get current featured status
    const [rows] = await pool.execute(
      'SELECT isFeatured FROM properties WHERE id = ?',
      [id]
    ) as [FeaturedRow[], unknown];

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      );
    }

    const newFeaturedStatus = !rows[0].isFeatured;

    await pool.execute(
      'UPDATE properties SET isFeatured = ? WHERE id = ?',
      [newFeaturedStatus, id]
    );

    const [updatedRows] = await pool.execute(
      'SELECT * FROM properties WHERE id = ?',
      [id]
    ) as [PropertyDBRow[], unknown];

    const property = updatedRows[0];
    return NextResponse.json({
      _id: property.id,
      title: property.title,
      description: property.description,
      shortDescription: property.shortDescription,
      price: parseFloat(String(property.price)),
      area: parseFloat(String(property.area)),
      location: property.location,
      address: property.address,
      coordinates: [parseFloat(String(property.latitude)), parseFloat(String(property.longitude))],
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
    console.error('Toggle featured error:', error);
    
    const err = error as { message?: string };
    
    // Обрабатываем ошибки авторизации
    if (err?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: err.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: 'Server error', error: err?.message || String(error) },
      { status: 500 }
    );
  }
}

