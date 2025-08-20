import React, { useState, useEffect } from 'react';

const SQLViewerPage: React.FC = () => {
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch databases on component mount
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/sql-viewer/databases');
        if (!response.ok) {
          throw new Error('Failed to fetch databases');
        }
        const data = await response.json();
        setDatabases(data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchDatabases();
  }, []);

  // Fetch tables when a database is selected
  useEffect(() => {
    if (!selectedDatabase) return;

    const fetchTables = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sql-viewer/databases/${selectedDatabase}/tables`);
        if (!response.ok) {
          throw new Error('Failed to fetch tables');
        }
        const data = await response.json();
        setTables(data);
        setSelectedTable('');
        setTableData([]);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, [selectedDatabase]);

  // Fetch table data when a table is selected
  useEffect(() => {
    if (!selectedDatabase || !selectedTable) return;

    const fetchTableData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sql-viewer/databases/${selectedDatabase}/tables/${selectedTable}`);
        if (!response.ok) {
          throw new Error('Failed to fetch table data');
        }
        const data = await response.json();
        setTableData(data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchTableData();
  }, [selectedDatabase, selectedTable]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">SQL Viewer</h1>
      {error && <div className="text-red-500">Error: {error}</div>}
      
      <div className="mb-4">
        <label htmlFor="database-select" className="block mb-2">Select Database:</label>
        <select
          id="database-select"
          value={selectedDatabase}
          onChange={(e) => setSelectedDatabase(e.target.value)}
          className="p-2 border rounded"
          disabled={loading}
        >
          <option value="">-- Select a Database --</option>
          {databases.map(db => (
            <option key={db} value={db}>{db}</option>
          ))}
        </select>
      </div>

      {selectedDatabase && (
        <div className='flex'>
          <div className="w-1/4 pr-4">
            <h2 className="text-xl font-semibold mb-2">Tables</h2>
            {loading && tables.length === 0 ? <p>Loading tables...</p> : (
              <ul className="list-disc pl-5">
                {tables.map(table => (
                  <li key={table} onClick={() => setSelectedTable(table)} className='cursor-pointer hover:text-blue-500'>
                    {table}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="w-3/4">
            {selectedTable && (
              <>
                <h2 className="text-xl font-semibold mb-2">Data for {selectedTable}</h2>
                {loading && tableData.length === 0 ? <p>Loading data...</p> : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                      <thead>
                        <tr>
                          {tableData.length > 0 && Object.keys(tableData[0]).map(key => (
                            <th key={key} className="py-2 px-4 border-b">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).map((value, i) => (
                              <td key={i} className="py-2 px-4 border-b">{String(value)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SQLViewerPage;
