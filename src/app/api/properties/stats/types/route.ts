import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/properties/stats/types - Get property type statistics
export async function GET() {
  try {
    // Check if database connection is available
    if (!process.env.DB_HOST || !process.env.DB_NAME) {
      return NextResponse.json(
        { message: 'Database not configured. Please set DB_HOST and DB_NAME environment variables.' },
        { status: 503 }
      );
    }

    interface StatsRow {
      type: string;
      count: number;
    }
    
    const [rows] = await pool.execute(
      'SELECT type, COUNT(*) as count FROM properties GROUP BY type'
    ) as [StatsRow[], unknown];

    const result: Record<string, number> = {};
    rows.forEach((row) => {
      result[row.type] = Number(row.count);
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Get property type stats error:', error);
    
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

