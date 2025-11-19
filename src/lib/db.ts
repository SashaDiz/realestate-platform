import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Конфигурация SSL для MySQL
const getSSLConfig = () => {
  // Можно переопределить через переменную окружения ALLOW_SELF_SIGNED_CERT=true
  const allowSelfSignedCert = process.env.ALLOW_SELF_SIGNED_CERT === 'true' || process.env.NODE_ENV !== 'production';
  
  // Путь к сертификату (в контейнере или локально)
  const certPath = process.env.DB_SSL_CA_PATH || path.join(process.cwd(), 'ca.crt');
  
  // Проверяем, существует ли сертификат
  if (fs.existsSync(certPath)) {
    return {
      ca: fs.readFileSync(certPath),
      rejectUnauthorized: !allowSelfSignedCert,
    };
  }
  
  // Если сертификат не найден, но требуется SSL (например, для облачных БД),
  // используем пустую конфигурацию SSL с отключенной проверкой для разработки
  if (allowSelfSignedCert) {
    return {
      rejectUnauthorized: false,
    };
  }
  
  // Если сертификат не найден и не разрешены self-signed, SSL не будет использоваться
  return undefined;
};

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
  ...(sslConfig && { ssl: sslConfig }),
});

export default pool;

