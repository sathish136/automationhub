import sql from 'mssql';

const sqlConfig = {
  user: process.env.SQL_SERVER_USER,
  password: process.env.SQL_SERVER_PASSWORD,
  server: process.env.SQL_SERVER_HOST || 'localhost',
  options: {
    encrypt: false, // Use true for Azure SQL Database, or if you have an SSL certificate
    trustServerCertificate: true, // Change to true for local dev / self-signed certs
  },
};

class SQLViewerService {
  private pool: sql.ConnectionPool;

  constructor() {
    this.pool = new sql.ConnectionPool(sqlConfig);
  }

  private async connect() {
    if (!this.pool.connected) {
      try {
        await this.pool.connect();
        console.log('[SQL Viewer] Successfully connected to SQL Server.');
      } catch (err) {
        console.error('[SQL Viewer] Database Connection Failed! Bad Config: ', err);
        throw err; // Rethrow the error to be handled by the caller
      }
    }
  }

  public async testConnection(): Promise<void> {
    // This method tries to connect and immediately disconnects.
    // Useful for checking credentials and connectivity at startup.
    try {
      const testPool = new sql.ConnectionPool(sqlConfig);
      await testPool.connect();
      console.log('[SQL Viewer] Startup connection test successful.');
      await testPool.close();
    } catch (err) {
      console.error('[SQL Viewer] Startup connection test failed.');
      throw err; // Rethrow to be caught by the startup process
    }
  }

  public async getDatabases(): Promise<string[]> {
    await this.connect();
    const result = await this.pool.request().query('SELECT name FROM sys.databases WHERE database_id > 4;'); // Exclude system databases
    return result.recordset.map((row) => row.name);
  }

  public async getTables(database: string): Promise<string[]> {
    await this.connect();
    const result = await this.pool.request().query(`USE [${database}]; SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';`);
    return result.recordset.map((row) => row.TABLE_NAME);
  }

  public async getTableData(database: string, table: string, options?: {
    limit?: number;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<any[]> {
    await this.connect();
    try {
      // Sanitize database and table names to prevent SQL injection
      const sanitizedDatabase = database.replace(/[\[\]';"--]/g, '');
      const sanitizedTable = table.replace(/[\[\]';"--]/g, '');
      
      const limit = options?.limit || 100;
      let query = `USE [${sanitizedDatabase}]; SELECT TOP ${limit} * FROM [${sanitizedTable}]`;
      
      // Add ORDER BY clause if sorting is specified
      if (options?.sortColumn && options?.sortDirection) {
        // First verify the column exists
        const columnCheckQuery = `
          USE [${sanitizedDatabase}];
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = '${sanitizedTable}' 
          AND COLUMN_NAME = '${options.sortColumn}'
        `;
        
        const columnCheck = await this.pool.request().query(columnCheckQuery);
        if (columnCheck.recordset.length > 0) {
          const sanitizedSortColumn = options.sortColumn.replace(/[\[\]';"--]/g, '');
          query += ` ORDER BY [${sanitizedSortColumn}] ${options.sortDirection.toUpperCase()}`;
        }
      }
      
      query += ';';
      const result = await this.pool.request().query(query);
      return result.recordset.map(row => ({ ...row, isRead: false, isResolved: false }));
    } catch (error) {
      console.error(`Error fetching data for table ${table}:`, error);
      // Return empty array instead of throwing error
      return [];
    }
  }
}

export const sqlViewerService = new SQLViewerService();
