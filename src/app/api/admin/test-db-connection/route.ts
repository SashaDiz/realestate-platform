import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/admin/test-db-connection - Test database connection with detailed diagnostics
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const diagnostics = {
      config: {
        host: process.env.DB_HOST || 'not set',
        port: process.env.DB_PORT || '3306',
        user: process.env.DB_USER || 'not set',
        password: process.env.DB_PASSWORD ? '***set***' : 'not set',
        database: process.env.DB_NAME || 'not set',
        sslEnabled: !!process.env.DB_SSL_CA_PATH || process.env.ALLOW_SELF_SIGNED_CERT === 'true',
        sslCertPath: process.env.DB_SSL_CA_PATH || 'not set',
        allowSelfSignedCert: process.env.ALLOW_SELF_SIGNED_CERT === 'true',
      },
      connection: {
        success: false,
        error: null as any,
        details: {} as any,
      },
      serverInfo: null as any,
      databaseInfo: null as any,
    };

    // Test connection
    try {
      const connection = await pool.getConnection();
      
      try {
        // Test basic query
        const [result] = await connection.query('SELECT 1 as test') as any;
        diagnostics.connection.success = true;
        diagnostics.connection.details = {
          testQuery: result[0]?.test === 1 ? 'OK' : 'Failed',
        };

        // Get server info
        const [serverInfo] = await connection.query(
          'SELECT VERSION() as version, DATABASE() as current_database, USER() as current_user, @@hostname as hostname'
        ) as any;
        diagnostics.serverInfo = serverInfo[0] || null;

        // Get database info
        const [dbInfo] = await connection.query(
          `SELECT 
            SCHEMA_NAME as name,
            DEFAULT_CHARACTER_SET_NAME as charset,
            DEFAULT_COLLATION_NAME as collation
          FROM information_schema.SCHEMATA 
          WHERE SCHEMA_NAME = ?`,
          [process.env.DB_NAME]
        ) as any;
        diagnostics.databaseInfo = dbInfo[0] || null;

        // Check SSL status
        const [sslStatus] = await connection.query('SHOW STATUS LIKE "Ssl_cipher"') as any;
        diagnostics.connection.details.ssl = {
          enabled: sslStatus.length > 0 && sslStatus[0].Value !== '',
          cipher: sslStatus[0]?.Value || 'none',
        };

        // Check tables
        const [tables] = await connection.query(
          `SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH 
           FROM information_schema.TABLES 
           WHERE TABLE_SCHEMA = ?`,
          [process.env.DB_NAME]
        ) as any;
        diagnostics.connection.details.tables = tables || [];

      } finally {
        connection.release();
      }

    } catch (error: any) {
      diagnostics.connection.success = false;
      diagnostics.connection.error = {
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        message: error.message,
        sql: error.sql,
      };

      // Detailed error analysis
      if (error.code === 'ENOTFOUND') {
        diagnostics.connection.error.analysis = 
          `DNS lookup failed. The host "${process.env.DB_HOST}" cannot be resolved. ` +
          `Please verify DB_HOST is correct. For Timeweb Cloud, use the public IP or full domain name.`;
      } else if (error.code === 'ECONNREFUSED') {
        diagnostics.connection.error.analysis = 
          `Connection refused. The MySQL server at ${process.env.DB_HOST}:${process.env.DB_PORT} ` +
          `is not accepting connections. Check if the server is running and the port is correct.`;
      } else if (error.code === 'ETIMEDOUT') {
        diagnostics.connection.error.analysis = 
          `Connection timeout. Cannot reach ${process.env.DB_HOST}:${process.env.DB_PORT}. ` +
          `Check firewall settings and network connectivity.`;
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        diagnostics.connection.error.analysis = 
          `Access denied. Check DB_USER and DB_PASSWORD credentials.`;
      } else if (error.code === 'ER_BAD_DB_ERROR') {
        diagnostics.connection.error.analysis = 
          `Database "${process.env.DB_NAME}" does not exist. Please create it first.`;
      } else if (error.code === 'ENOTSUP' || error.message?.includes('SSL')) {
        diagnostics.connection.error.analysis = 
          `SSL connection issue. For Timeweb Cloud, you may need to download the SSL certificate ` +
          `and set DB_SSL_CA_PATH or set ALLOW_SELF_SIGNED_CERT=true for development.`;
      }
    }

    return NextResponse.json({
      success: diagnostics.connection.success,
      message: diagnostics.connection.success 
        ? 'Database connection successful' 
        : 'Database connection failed',
      diagnostics,
      recommendations: generateRecommendations(diagnostics),
    }, {
      status: diagnostics.connection.success ? 200 : 503
    });

  } catch (error) {
    console.error('Test DB connection error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error testing database connection',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(diagnostics: any): string[] {
  const recommendations: string[] = [];

  if (!diagnostics.connection.success) {
    const error = diagnostics.connection.error;
    
    if (error?.code === 'ENOTFOUND') {
      recommendations.push(`Update DB_HOST in your .env file. For Timeweb Cloud, use the public IP (e.g., 193.160.209.34) or the full domain name.`);
      recommendations.push(`If using Docker, ensure DB_HOST points to the external database, not 'mysql' service name.`);
    }
    
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
      recommendations.push(`Verify that the MySQL server is running and accessible from your network.`);
      recommendations.push(`Check firewall rules to ensure port ${diagnostics.config.port} is open.`);
      recommendations.push(`For Timeweb Cloud, ensure your IP is whitelisted in the database access settings.`);
    }
    
    if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
      recommendations.push(`Verify DB_USER and DB_PASSWORD in your .env file match the database credentials.`);
    }
    
    if (error?.code === 'ER_BAD_DB_ERROR') {
      recommendations.push(`Create the database "${diagnostics.config.database}" or update DB_NAME in your .env file.`);
    }
    
    if (error?.message?.includes('SSL') || error?.code === 'ENOTSUP') {
      recommendations.push(`For Timeweb Cloud SSL connection:`);
      recommendations.push(`1. Download the SSL certificate from the Timeweb Cloud panel`);
      recommendations.push(`2. Save it as 'ca.crt' in your project root or set DB_SSL_CA_PATH`);
      recommendations.push(`3. Or set ALLOW_SELF_SIGNED_CERT=true for development (not recommended for production)`);
    }
  } else {
    if (!diagnostics.connection.details.ssl?.enabled && diagnostics.config.host !== 'mysql') {
      recommendations.push(`SSL is not enabled. Consider enabling SSL for secure connections to external databases.`);
    }
    
    if (diagnostics.databaseInfo && diagnostics.databaseInfo.charset !== 'utf8mb4') {
      recommendations.push(`Database charset is ${diagnostics.databaseInfo.charset}. Consider using utf8mb4 for full Unicode support.`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Database connection is properly configured.');
  }

  return recommendations;
}

