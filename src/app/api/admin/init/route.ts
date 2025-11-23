import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// SQL statements for database initialization
const INIT_SQL = `
-- Создание таблицы properties
CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  shortDescription VARCHAR(500) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  area DECIMAL(10, 2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  transactionType VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  investmentReturn DECIMAL(5, 2),
  images JSON NOT NULL,
  isFeatured BOOLEAN DEFAULT FALSE,
  layout VARCHAR(500),
  rooms INT,
  bathrooms INT,
  parking BOOLEAN DEFAULT FALSE,
  balcony BOOLEAN DEFAULT FALSE,
  elevator BOOLEAN DEFAULT FALSE,
  furnished BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0,
  submissions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_transaction_type (transactionType),
  INDEX idx_price (price),
  INDEX idx_area (area),
  INDEX idx_is_featured (isFeatured),
  INDEX idx_created_at (created_at),
  INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Создание таблицы admins
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  lastLogin TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// POST /api/admin/init - Initialize database
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    // Split SQL into individual statements more carefully
    // Remove comments first
    const sqlWithoutComments = INIT_SQL
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('--');
        return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
      })
      .join('\n');

    // Split by semicolon, but keep multi-line statements together
    const statements = sqlWithoutComments
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    interface StatementResult {
      statement: number;
      success: boolean;
      result?: unknown;
    }

    interface StatementError {
      statement: number;
      sql: string;
      error: {
        code?: string;
        errno?: number;
        sqlState?: string;
        message?: string;
      };
    }

    const results: StatementResult[] = [];
    const errors: StatementError[] = [];

    // Execute each statement with detailed logging
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}:`, statement.substring(0, 100) + '...');
          const [result] = await pool.execute(statement);
          results.push({ statement: i + 1, success: true, result });
        } catch (error: unknown) {
          const dbError = error as { code?: string; errno?: number; sqlState?: string; message?: string };
          console.error(`Error executing statement ${i + 1}:`, error);
          errors.push({
            statement: i + 1,
            sql: statement.substring(0, 200),
            error: {
              code: dbError.code,
              errno: dbError.errno,
              sqlState: dbError.sqlState,
              message: dbError.message,
            },
          });
        }
      }
    }

    // Verify tables were created
    const [tables] = await pool.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [process.env.DB_NAME]
    ) as [Array<{ TABLE_NAME: string }>, unknown];

    const tableNames = tables.map(t => t.TABLE_NAME);
    const expectedTables = ['properties', 'admins'];
    const missingTables = expectedTables.filter(t => !tableNames.includes(t));

    if (errors.length > 0) {
      console.error('Some statements failed:', errors);
    }

    if (missingTables.length > 0) {
      return NextResponse.json(
        {
          message: 'Database initialization completed with issues',
          createdTables: tableNames,
          missingTables,
          errors,
          results,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Database initialized successfully',
      createdTables: tableNames,
      results,
    });
  } catch (error: unknown) {
    const dbError = error as { code?: string; errno?: number; sqlState?: string; message?: string };
    console.error('Database initialization error:', error);
    return NextResponse.json(
      {
        message: 'Database initialization failed',
        error: {
          code: dbError.code,
          errno: dbError.errno,
          sqlState: dbError.sqlState,
          message: dbError.message,
        },
      },
      { status: 500 }
    );
  }
}

