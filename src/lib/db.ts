import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Валидация обязательных переменных окружения
const validateDbConfig = () => {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(', ')}. ` +
      `Please check your .env file or environment configuration.`
    );
  }
};

// Конфигурация SSL для MySQL
const getSSLConfig = () => {
  // Для Timeweb Cloud и других облачных БД SSL обязателен
  // Можно переопределить через переменную окружения ALLOW_SELF_SIGNED_CERT=true
  const allowSelfSignedCert = process.env.ALLOW_SELF_SIGNED_CERT === 'true';
  
  // Путь к сертификату (в контейнере или локально)
  // Проверяем несколько возможных путей
  const possiblePaths = [
    process.env.DB_SSL_CA_PATH,
    path.join(process.cwd(), 'ca.crt'),
    path.join(process.cwd(), 'root.crt'),
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.cloud-certs', 'root.crt'),
    '/app/ca.crt', // Docker контейнер
  ].filter(Boolean) as string[];
  
  // Ищем существующий сертификат
  let certPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      certPath = possiblePath;
      break;
    }
  }
  
  // Если сертификат найден, используем его с проверкой идентичности (VERIFY_IDENTITY)
  if (certPath) {
    try {
      const cert = fs.readFileSync(certPath);
      return {
        ca: cert,
        rejectUnauthorized: !allowSelfSignedCert, // true для VERIFY_IDENTITY режима
      };
    } catch (error) {
      console.error(`Error reading SSL certificate from ${certPath}:`, error);
    }
  }
  
  // Если сертификат не найден, но требуется SSL для облачных БД
  // Для Timeweb Cloud SSL обязателен, поэтому предупреждаем
  if (process.env.DB_HOST && process.env.DB_HOST.includes('.twc1.net')) {
    console.warn(
      `SSL certificate not found for Timeweb Cloud database. ` +
      `Please download certificate from https://st.timeweb.com/cloud-static/ca.crt ` +
      `and set DB_SSL_CA_PATH or place it as ca.crt in project root. ` +
      `Using SSL without certificate verification (not recommended for production).`
    );
    
    if (allowSelfSignedCert) {
      return {
        rejectUnauthorized: false,
      };
    }
  }
  
  // Если сертификат не найден и не разрешены self-signed, SSL не будет использоваться
  // Но для облачных БД это может вызвать ошибку подключения
  return undefined;
};

// Валидация конфигурации при загрузке модуля
try {
  validateDbConfig();
} catch (error) {
  console.error('Database configuration error:', error instanceof Error ? error.message : error);
}

const sslConfig = getSSLConfig();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  connectTimeout: 10000, // 10 seconds timeout for connection attempts
  ...(sslConfig && { ssl: sslConfig }),
});

// Обработка ошибок пула соединений
// Примечание: pool.on('error') не поддерживается в promise API
// Ошибки обрабатываются при попытке получения соединения через try/catch
pool.on('connection', (connection) => {
  console.log('New MySQL connection established');
  
  connection.on('error', (err: Error & { code?: string; errno?: number; sqlState?: string; fatal?: boolean }) => {
    console.error('MySQL connection error:', {
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      message: err.message,
      fatal: err.fatal,
    });
    
    if (err.fatal) {
      console.error('Fatal connection error - connection will be closed');
    }
  });
});

export default pool;

