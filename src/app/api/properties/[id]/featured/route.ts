import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// PATCH /api/properties/[id]/featured - Toggle featured status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const { id } = params;

    // Get current featured status
    const [rows] = await pool.execute(
      'SELECT isFeatured FROM properties WHERE id = ?',
      [id]
    ) as any[];

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
    ) as any[];

    const property = updatedRows[0];
    return NextResponse.json({
      _id: property.id,
      title: property.title,
      description: property.description,
      shortDescription: property.shortDescription,
      price: parseFloat(property.price),
      area: parseFloat(property.area),
      location: property.location,
      address: property.address,
      coordinates: [parseFloat(property.latitude), parseFloat(property.longitude)],
      type: property.type,
      transactionType: property.transactionType,
      investmentReturn: property.investmentReturn ? parseFloat(property.investmentReturn) : undefined,
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
  } catch (error: any) {
    console.error('Toggle featured error:', error);
    
    // Обрабатываем ошибки авторизации
    if (error?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { message: 'Server error', error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

