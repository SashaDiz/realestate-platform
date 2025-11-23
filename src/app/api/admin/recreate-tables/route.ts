import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// POST /api/admin/recreate-tables - Drop and recreate tables with correct charset
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { confirmDelete } = body;

    if (!confirmDelete) {
      return NextResponse.json(
        { message: 'Confirmation required. Set confirmDelete: true to proceed. WARNING: This will delete all data!' },
        { status: 400 }
      );
    }

    console.log('Starting table recreation...');

    // Drop existing tables
    try {
      await pool.execute('DROP TABLE IF EXISTS properties');
      console.log('Dropped properties table');
    } catch (err) {
      console.error('Error dropping properties table:', err);
    }

    try {
      await pool.execute('DROP TABLE IF EXISTS admins');
      console.log('Dropped admins table');
    } catch (err) {
      console.error('Error dropping admins table:', err);
    }

    // Recreate properties table with explicit charset
    await pool.execute(`
      CREATE TABLE properties (
        id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
        title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        shortDescription VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        price DECIMAL(15, 2) NOT NULL,
        area DECIMAL(10, 2) NOT NULL,
        location VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        address VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        transactionType VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        investmentReturn DECIMAL(5, 2),
        images JSON NOT NULL,
        isFeatured BOOLEAN DEFAULT FALSE,
        layout VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        rooms INT,
        bathrooms INT,
        parking BOOLEAN DEFAULT FALSE,
        balcony BOOLEAN DEFAULT FALSE,
        elevator BOOLEAN DEFAULT FALSE,
        furnished BOOLEAN DEFAULT FALSE,
        views INT DEFAULT 0,
        submissions INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_transaction_type (transactionType),
        INDEX idx_price (price),
        INDEX idx_area (area),
        INDEX idx_is_featured (isFeatured),
        INDEX idx_created_at (created_at),
        INDEX idx_location (latitude, longitude)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Created properties table');

    // Recreate admins table
    await pool.execute(`
      CREATE TABLE admins (
        id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
        password VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        lastLogin TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Created admins table');

    return NextResponse.json({
      success: true,
      message: 'Tables recreated successfully with utf8mb4 charset',
    });
  } catch (error) {
    console.error('Recreate tables error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error recreating tables',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

