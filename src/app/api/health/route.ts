import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker and monitoring
 * Returns 200 OK if the server is running
 * Does not check database or external dependencies
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }, { status: 200 });
}

