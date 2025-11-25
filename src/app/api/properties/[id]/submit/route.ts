import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/properties/[id]/submit - Increment submission count
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await pool.execute(
      'UPDATE properties SET submissions = submissions + 1 WHERE id = ?',
      [id]
    );

    const [rows] = await pool.execute(
      'SELECT submissions FROM properties WHERE id = ?',
      [id]
    ) as any[];

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Submission recorded',
      formSubmissions: rows[0].submissions,
    });
  } catch (error) {
    console.error('Increment submissions error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

