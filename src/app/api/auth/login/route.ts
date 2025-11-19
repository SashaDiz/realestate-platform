import { NextRequest, NextResponse } from 'next/server';
import { findAdminByUsername, getAdminPasswordHash, comparePassword, createAdmin, updateLastLogin, generateToken, updateAdminPassword } from '@/lib/auth';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, rememberMe } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if admin exists
    let admin = await findAdminByUsername(username);

    // If no admin exists, create default admin
    if (!admin) {
      const defaultUsername = (process.env.ADMIN_USERNAME || '').trim();
      const defaultPassword = (process.env.ADMIN_PASSWORD || '').trim();

      if (!defaultUsername || !defaultPassword) {
        return NextResponse.json(
          { message: 'Admin credentials are not set in environment variables' },
          { status: 500 }
        );
      }

      if (username.toLowerCase() === defaultUsername.toLowerCase()) {
        admin = await createAdmin(defaultUsername, defaultPassword);
      } else {
        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // Check password
    const passwordHash = await getAdminPasswordHash(username);
    if (!passwordHash) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, passwordHash);
    if (!isPasswordValid) {
      // If password doesn't match, but this is the default admin from env vars, update the password
      const defaultUsername = (process.env.ADMIN_USERNAME || '').trim();
      const defaultPassword = (process.env.ADMIN_PASSWORD || '').trim();
      
      if (username.toLowerCase() === defaultUsername.toLowerCase() && 
          password === defaultPassword && 
          defaultPassword) {
        // Update password to match the one in env vars
        await updateAdminPassword(username, defaultPassword);
      } else {
        return NextResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // Update last login
    await updateLastLogin(admin.id);

    // Generate token
    const token = generateToken(admin.id);

    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        lastLogin: admin.lastLogin?.toISOString(),
      },
    });

    // Set cookie
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 7 days or 1 day
    response.cookies.set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

