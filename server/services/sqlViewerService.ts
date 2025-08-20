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

  public async getTableData(database: string, table: string): Promise<any[]> {
    await this.connect();
    // Basic protection against SQL injection, but a more robust solution is recommended for production
    if (!/^[a-zA-Z0-9_]+$/.test(database) || !/^[a-zA-Z0-9_]+$/.test(table)) {
      throw new Error('Invalid database or table name.');
    }
    const result = await this.pool.request().query(`USE [${database}]; SELECT TOP 100 * FROM [${table}];`); // Limit to 100 rows for performance
    return result.recordset;
  }
}

export const sqlViewerService = new SQLViewerService();
