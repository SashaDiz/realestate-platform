import { cookies } from 'next/headers';
import { createHmac } from 'crypto';

// Простая функция для получения секрета из переменных окружения
function getSecret(): string {
  const secret = (process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || 'default-secret-change-me').trim();
  return secret;
}

// Создаем простую сессию на основе пароля
export function createSession(): string {
  const secret = getSecret();
  const timestamp = Date.now();
  const sessionData = `admin-${timestamp}`;
  
  // Создаем HMAC подпись для сессии
  const hmac = createHmac('sha256', secret);
  hmac.update(sessionData);
  const signature = hmac.digest('hex');
  
  return `${sessionData}-${signature}`;
}

// Проверяем валидность сессии
export function verifySession(session: string): boolean {
  if (!session) return false;
  
  try {
    const parts = session.split('-');
    if (parts.length < 3) return false;
    
    const timestamp = parseInt(parts[1]);
    const providedSignature = parts.slice(2).join('-');
    
    // Проверяем, что сессия не старше 7 дней
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней
    if (Date.now() - timestamp > maxAge) {
      return false;
    }
    
    // Восстанавливаем сессию и проверяем подпись
    const sessionData = `admin-${timestamp}`;
    const secret = getSecret();
    const hmac = createHmac('sha256', secret);
    hmac.update(sessionData);
    const expectedSignature = hmac.digest('hex');
    
    return providedSignature === expectedSignature;
  } catch {
    return false;
  }
}

// Проверяем пароль администратора
export function verifyPassword(password: string): boolean {
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (!adminPassword) {
    return false;
  }
  return password === adminPassword;
}

// Получаем сессию из cookies
export async function getSessionFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('adminSession')?.value || null;
}

// Проверяем авторизацию администратора (helper для API routes)
export async function requireAuth(): Promise<void> {
  const session = await getSessionFromCookies();
  
  if (!session) {
    throw new Error('Unauthorized: No session found');
  }
  
  const isValid = verifySession(session);
  
  if (!isValid) {
    throw new Error('Unauthorized: Invalid or expired session');
  }
}
