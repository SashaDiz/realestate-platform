import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/admin/check-db - Check database structure and encoding
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const checks = {
      connection: false,
      tableExists: false,
      charset: '',
      collation: '',
      typeColumn: null as any,
      transactionTypeColumn: null as any,
      sampleData: [] as any[],
    };

    // Check connection
    try {
      await pool.query('SELECT 1');
      checks.connection = true;
    } catch (err) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        checks,
        error: String(err),
      }, { status: 500 });
    }

    // Check table exists
    try {
      const [tables] = await pool.query(
        `SHOW TABLES LIKE 'properties'`
      );
      checks.tableExists = Array.isArray(tables) && tables.length > 0;
    } catch (err) {
      // Table doesn't exist
    }

    if (!checks.tableExists) {
      return NextResponse.json({
        success: false,
        message: 'Properties table does not exist. Please initialize database.',
        checks,
      }, { status: 404 });
    }

    // Check table charset and collation
    try {
      const [tableInfo] = await pool.query(
        `SHOW TABLE STATUS LIKE 'properties'`
      ) as any;
      
      if (tableInfo && tableInfo.length > 0) {
        checks.charset = tableInfo[0].Collation?.split('_')[0] || 'unknown';
        checks.collation = tableInfo[0].Collation || 'unknown';
      }
    } catch (err) {
      console.error('Error checking table status:', err);
    }

    // Check column definitions
    try {
      const [columns] = await pool.query(
        `SHOW FULL COLUMNS FROM properties WHERE Field IN ('type', 'transactionType')`
      ) as any;
      
      for (const col of columns) {
        if (col.Field === 'type') {
          checks.typeColumn = {
            type: col.Type,
            collation: col.Collation,
            nullable: col.Null,
          };
        }
        if (col.Field === 'transactionType') {
          checks.transactionTypeColumn = {
            type: col.Type,
            collation: col.Collation,
            nullable: col.Null,
          };
        }
      }
    } catch (err) {
      console.error('Error checking columns:', err);
    }

    // Get sample data
    try {
      const [rows] = await pool.query(
        `SELECT id, type, transactionType, 
         LENGTH(type) as type_length, 
         CHAR_LENGTH(type) as type_char_length,
         HEX(type) as type_hex
         FROM properties LIMIT 5`
      );
      checks.sampleData = rows as any[];
    } catch (err) {
      console.error('Error getting sample data:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Database structure check completed',
      checks,
      recommendations: generateRecommendations(checks),
    });
  } catch (error) {
    console.error('Check DB error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error checking database',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(checks: any): string[] {
  const recommendations: string[] = [];

  if (!checks.connection) {
    recommendations.push('Fix database connection configuration');
  }

  if (!checks.tableExists) {
    recommendations.push('Initialize database by calling POST /api/admin/init');
  }

  if (checks.charset && !checks.charset.includes('utf8mb4')) {
    recommendations.push('Table charset is not utf8mb4. Consider recreating the table.');
  }

  if (checks.typeColumn && !checks.typeColumn.type.includes('varchar')) {
    recommendations.push('Type column should be VARCHAR(50) for proper UTF-8 support. Consider recreating the table.');
  }

  if (checks.typeColumn && checks.typeColumn.collation && !checks.typeColumn.collation.includes('utf8mb4')) {
    recommendations.push('Type column collation is not utf8mb4. This may cause data truncation issues.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Database structure looks correct');
  }

  return recommendations;
}

