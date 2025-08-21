import sql from 'mssql';

interface DatabaseConfig {
  server: string;
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
}

class ExternalDatabaseService {
  private connections: Map<string, sql.ConnectionPool> = new Map();

  // Get or create a connection pool for a database
  private async getConnection(databaseName: string): Promise<sql.ConnectionPool> {
    const key = databaseName.toLowerCase();
    
    if (this.connections.has(key)) {
      const pool = this.connections.get(key)!;
      if (pool.connected) {
        return pool;
      }
    }

    // For demonstration purposes, using environment variables or default config
    // In production, this should be configurable per site/database
    const config: DatabaseConfig = {
      server: process.env.EXTERNAL_DB_SERVER || 'localhost',
      database: databaseName,
      user: process.env.EXTERNAL_DB_USER || 'sa',
      password: process.env.EXTERNAL_DB_PASSWORD || 'password',
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    };

    const pool = new sql.ConnectionPool(config);
    
    try {
      await pool.connect();
      this.connections.set(key, pool);
      console.log(`Connected to external database: ${databaseName}`);
      return pool;
    } catch (error) {
      console.error(`Failed to connect to external database ${databaseName}:`, error);
      throw error;
    }
  }

  // Query custom site events from external database table
  async queryCustomSiteEvents(databaseName: string, tableName: string, limit: number = 100): Promise<any[]> {
    try {
      const pool = await this.getConnection(databaseName);
      const request = pool.request();

      // Basic query with common fields that might exist in alerts tables
      const query = `
        SELECT TOP ${limit}
          *
        FROM [${tableName}]
        ORDER BY 
          CASE 
            WHEN COLUMNPROPERTY(OBJECT_ID('[${tableName}]'), 'date_time', 'ColumnId') IS NOT NULL THEN date_time
            WHEN COLUMNPROPERTY(OBJECT_ID('[${tableName}]'), 'timestamp', 'ColumnId') IS NOT NULL THEN timestamp
            WHEN COLUMNPROPERTY(OBJECT_ID('[${tableName}]'), 'created_at', 'ColumnId') IS NOT NULL THEN created_at
            ELSE (SELECT TOP 1 name FROM sys.columns WHERE object_id = OBJECT_ID('[${tableName}]') AND system_type_id IN (61, 42))
          END DESC
      `;

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error(`Error querying custom site events from ${databaseName}.${tableName}:`, error);
      // Return empty array instead of demo data when database connection fails
      return [];
    }
  }



  // Get available tables in external database
  async getDatabaseTables(databaseName: string): Promise<string[]> {
    try {
      const pool = await this.getConnection(databaseName);
      const request = pool.request();
      
      const query = `
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        AND TABLE_NAME LIKE '%alert%' OR TABLE_NAME LIKE '%event%' OR TABLE_NAME LIKE '%alarm%'
        ORDER BY TABLE_NAME
      `;
      
      const result = await request.query(query);
      return result.recordset.map((row: any) => row.TABLE_NAME);
    } catch (error) {
      console.error(`Error getting tables from ${databaseName}:`, error);
      // Return empty array instead of demo table names when database connection fails
      return [];
    }
  }

  // Test database connection
  async testConnection(databaseName: string): Promise<{ success: boolean; message: string }> {
    try {
      const pool = await this.getConnection(databaseName);
      return { 
        success: true, 
        message: `Successfully connected to ${databaseName}` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to connect to ${databaseName}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Close all connections
  async closeAllConnections(): Promise<void> {
    for (const [key, pool] of this.connections.entries()) {
      try {
        await pool.close();
        console.log(`Closed connection to ${key}`);
      } catch (error) {
        console.error(`Error closing connection to ${key}:`, error);
      }
    }
    this.connections.clear();
  }
}

export const externalDatabaseService = new ExternalDatabaseService();