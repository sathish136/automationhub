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

    // Use the same configuration as SQL Viewer for external database connections
    const config: DatabaseConfig = {
      server: process.env.SQL_SERVER_HOST || '10.15.5.51',
      database: databaseName,
      user: process.env.SQL_SERVER_USER || 'sa',
      password: process.env.SQL_SERVER_PASSWORD || 'admin',
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

      // First, check what columns exist in the table
      const columnsQuery = `
        USE [${databaseName}];
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${tableName}'
      `;
      
      const columnsResult = await request.query(columnsQuery);
      const columns = columnsResult.recordset.map((row: any) => row.COLUMN_NAME.toLowerCase());
      
      // Determine the best column to order by (prefer datetime columns)
      let orderByClause = '';
      const dateColumns = ['date_time', 'datetime', 'timestamp', 'created_at', 'updated_at', 'date', 'time'];
      const foundDateColumn = dateColumns.find(col => columns.includes(col));
      
      if (foundDateColumn) {
        orderByClause = `ORDER BY [${foundDateColumn}] DESC`;
      } else if (columns.length > 0) {
        // If no date column, order by the first column
        const firstColumn = columnsResult.recordset[0]?.COLUMN_NAME;
        if (firstColumn) {
          orderByClause = `ORDER BY [${firstColumn}]`;
        }
      }

      // Build the final query
      const query = `
        USE [${databaseName}];
        SELECT TOP ${limit} *
        FROM [${tableName}]
        ${orderByClause}
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