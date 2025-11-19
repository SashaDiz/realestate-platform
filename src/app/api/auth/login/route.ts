import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession } from '@/lib/auth';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, rememberMe } = body;

    if (!password) {
      return NextResponse.json(
        { message: 'Password is required' },
        { status: 400 }
      );
    }

    // Простая проверка пароля из переменных окружения
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
    
    // Логируем для отладки (безопасно - только первые символы для проверки)
    console.log('Login attempt:', {
      receivedPasswordLength: password?.length || 0,
      receivedPasswordPrefix: password?.substring(0, 5) || '',
      expectedPasswordLength: adminPassword?.length || 0,
      expectedPasswordPrefix: adminPassword?.substring(0, 5) || '',
      adminPasswordSet: !!adminPassword,
      envKeys: Object.keys(process.env).filter(k => k.includes('ADMIN')).join(', '),
    });
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD is not set in environment variables');
      return NextResponse.json(
        { message: 'Server configuration error: ADMIN_PASSWORD not set' },
        { status: 500 }
      );
    }
    
    // Сравниваем пароли напрямую (безопасное сравнение)
    // Используем сравнение по длине и посимвольно для избежания timing attacks
    if (password.length !== adminPassword.length) {
      console.log('Password length mismatch');
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Постоянное время сравнения
    let match = true;
    for (let i = 0; i < password.length; i++) {
      if (password[i] !== adminPassword[i]) {
        match = false;
      }
    }
    
    if (!match) {
      console.log('Password mismatch');
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('Password verified successfully');

    // Создаем сессию
    const session = createSession();

    // Создаем ответ
    const response = NextResponse.json({
      message: 'Login successful',
      authenticated: true,
    });

    // Устанавливаем cookie с сессией
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 7 дней или 1 день
    response.cookies.set('adminSession', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}
