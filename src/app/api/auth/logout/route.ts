import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/logout
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Logout successful' });
    response.cookies.delete('adminToken');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

