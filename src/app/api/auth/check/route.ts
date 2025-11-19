import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies, verifySession } from '@/lib/auth';

// GET /api/auth/check
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();

    if (!session) {
      // Возвращаем 200, но isAuthenticated: false - это не ошибка
      return NextResponse.json(
        { message: 'No session found', isAuthenticated: false },
        { status: 200 }
      );
    }

    // Проверяем валидность сессии
    const isValid = verifySession(session);

    if (!isValid) {
      // Возвращаем 200, но isAuthenticated: false - это не ошибка
      return NextResponse.json(
        { message: 'Invalid or expired session', isAuthenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: 'Authenticated',
      isAuthenticated: true,
    });
  } catch (error: any) {
    console.error('Check auth error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error?.message || String(error), isAuthenticated: false },
      { status: 500 }
    );
  }
}
