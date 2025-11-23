import { NextRequest, NextResponse } from 'next/server';
import { createSession, verifyPassword } from '@/lib/auth';

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

    // Проверка ТОЛЬКО пароля из переменных окружения
    // Имя пользователя НЕ используется - вход только по паролю!
    // ВАЖНО: Перезапустите сервер после изменения .env файла!
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD is not set in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('ADMIN')).join(', '));
      return NextResponse.json(
        { message: 'Server configuration error: ADMIN_PASSWORD not set' },
        { status: 500 }
      );
    }
    
    // Детальное логирование для отладки
    const trimmedPassword = (password || '').trim();
    console.log('Login attempt:', {
      receivedPasswordLength: password?.length || 0,
      trimmedPasswordLength: trimmedPassword.length,
      expectedPasswordLength: adminPassword.length,
      receivedPasswordPrefix: password?.substring(0, 5) || '',
      trimmedPasswordPrefix: trimmedPassword.substring(0, 5),
      expectedPasswordPrefix: adminPassword.substring(0, 5),
      passwordsMatch: trimmedPassword === adminPassword,
      adminPasswordSet: !!adminPassword,
      envSource: process.env.ADMIN_PASSWORD ? 'process.env' : 'NOT FOUND',
    });
    
    // Проверяем пароль используя функцию verifyPassword
    const isValid = verifyPassword(password);
    
    if (!isValid) {
      console.log('Password verification failed');
      return NextResponse.json(
        { message: 'Invalid password' },
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
