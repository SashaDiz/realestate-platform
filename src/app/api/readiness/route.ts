import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * Readiness check endpoint for Docker and monitoring
 * Returns 200 OK if the server is ready to accept traffic
 * Checks database connection and critical dependencies
 */
export async function GET() {
  try {
    // Check database connection
    await pool.query('SELECT 1');

    // Check critical environment variables
    const requiredVars = [
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      'JWT_SECRET',
      'ADMIN_PASSWORD',
      'S3_ENDPOINT',
      'S3_BUCKET_NAME',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      return NextResponse.json({
        status: 'not ready',
        reason: 'Missing environment variables',
        missing: missingVars,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: 'ok',
        environment: 'ok',
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Readiness check failed:', error);
    
    return NextResponse.json({
      status: 'not ready',
      reason: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}

