import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Table as TableIcon, 
  Download, 
  Filter, 
  RefreshCw, 
  Search, 
  AlertCircle, 
  Settings,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface DatabaseInfo {
  name: string;
  status: 'connected' | 'error' | 'unknown';
  tableCount?: number;
}

const SQLViewerPage: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('disconnected');
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch databases on component mount
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setLoading(true);
        setConnectionStatus('checking');
        const response = await fetch('/api/sql-viewer/databases');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch databases' }));
          throw new Error(errorData.message || 'Failed to fetch databases');
        }
        
        const data = await response.json();
        const databaseInfo: DatabaseInfo[] = data.map((name: string) => ({
          name,
          status: 'connected' as const,
          tableCount: 0
        }));
        
        setDatabases(databaseInfo);
        setConnectionStatus('connected');
        setError(null);
      } catch (err) {
        console.error('Database fetch error:', err);
        setConnectionStatus('disconnected');
        setError((err as Error).message);
        setDatabases([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDatabases();
  }, []);

  // Fetch tables when a database is selected
  useEffect(() => {
    if (!selectedDatabase) {
      setTables([]);
      return;
    }

    const fetchTables = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sql-viewer/databases/${selectedDatabase}/tables`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch tables' }));
          throw new Error(errorData.message || 'Failed to fetch tables');
        }
        
        const data = await response.json();
        setTables(data);
        setSelectedTable('');
        setTableData([]);
        setError(null);
        
        // Update database info with table count
        setDatabases(prev => prev.map(db => 
          db.name === selectedDatabase 
            ? { ...db, tableCount: data.length }
            : db
        ));
      } catch (err) {
        console.error('Tables fetch error:', err);
        setError((err as Error).message);
        setTables([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, [selectedDatabase]);

  // Fetch table data when a table is selected
  useEffect(() => {
    if (!selectedDatabase || !selectedTable) {
      setTableData([]);
      setColumns([]);
      return;
    }

    const fetchTableData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sql-viewer/databases/${selectedDatabase}/tables/${selectedTable}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch table data' }));
          throw new Error(errorData.message || 'Failed to fetch table data');
        }
        
        const data = await response.json();
        setTableData(data);
        
        if (data.length > 0) {
          setColumns(Object.keys(data[0]));
        } else {
          setColumns([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Table data fetch error:', err);
        setError((err as Error).message);
        setTableData([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTableData();
  }, [selectedDatabase, selectedTable]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = tableData;

    if (searchTerm) {
      filtered = tableData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (sortColumn && columns.includes(sortColumn)) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = String(a[sortColumn]);
        const bValue = String(b[sortColumn]);
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredData(filtered);
  }, [tableData, searchTerm, sortColumn, sortDirection, columns]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const csvContent = [
      columns.join(','),
      ...filteredData.map(row => 
        columns.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedTable || 'data'}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const refreshData = () => {
    if (selectedDatabase && selectedTable) {
      // Trigger refresh by updating the dependency
      setTableData([]);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">SQL Viewer</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
              className="text-xs px-2 py-1"
            >
              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'checking' ? 'Connecting' : 'Disconnected'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <Settings className="h-3 w-3 mr-1" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-base">
              <strong>Connection Error:</strong> {error}
              <div className="mt-2 text-sm">
                Please check your SQL Server connection settings and ensure the server is accessible.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Database Selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm">
              <Database className="h-4 w-4 mr-1" />
              Database Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select 
                  value={selectedDatabase} 
                  onValueChange={setSelectedDatabase}
                  disabled={loading || databases.length === 0}
                >
                  <SelectTrigger className="h-8 text-sm" data-testid="select-database">
                    <SelectValue placeholder="Select Database" />
                  </SelectTrigger>
                  <SelectContent>
                    {databases.map((db) => (
                      <SelectItem key={db.name} value={db.name}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">{db.name}</span>
                          <Badge variant="secondary" className="ml-2 text-xs px-1 py-0">
                            {db.tableCount || 0}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedDatabase && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    {tables.length} tables
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={refreshData} disabled={loading} className="h-7 w-7 p-0">
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {selectedDatabase && (
          <div className="grid grid-cols-12 gap-6">
            {/* Tables Sidebar */}
            <Card className="col-span-12 lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-sm">
                  <TableIcon className="h-3 w-3 mr-1" />
                  Tables ({tables.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-72">
                  <div className="space-y-1 p-2">
                    {loading && tables.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" />
                        <div className="text-xs">Loading...</div>
                      </div>
                    ) : tables.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        <TableIcon className="h-4 w-4 mx-auto mb-1 opacity-50" />
                        <div className="text-xs">No tables</div>
                      </div>
                    ) : (
                      tables.map((table) => (
                        <Button
                          key={table}
                          variant={selectedTable === table ? 'default' : 'ghost'}
                          className="w-full justify-start h-7 px-2 text-left text-xs"
                          onClick={() => setSelectedTable(table)}
                          data-testid={`button-select-table-${table}`}
                        >
                          <TableIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{table}</span>
                        </Button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Data Viewer */}
            <Card className="col-span-12 lg:col-span-9">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-sm">
                    {selectedTable ? (
                      <>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {selectedTable}
                        <Badge variant="secondary" className="ml-2 text-xs px-1 py-0">
                          {filteredData.length}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Search className="h-3 w-3 mr-1" />
                        Select table
                      </>
                    )}
                  </CardTitle>
                  
                  {selectedTable && tableData.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        data-testid="button-export-csv"
                        className="h-7 px-2 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={loading}
                        className="h-7 w-7 p-0"
                      >
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {selectedTable ? (
                  <>
                    {/* Search and Filter Controls */}
                    {tableData.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                            <Input
                              id="search"
                              placeholder="Search..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-7 h-7 text-xs"
                              data-testid="input-search-data"
                            />
                          </div>
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            <Filter className="h-3 w-3 mr-1" />
                            {filteredData.length}/{tableData.length}
                          </Badge>
                          {searchTerm && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSearchTerm('')}
                              className="h-7 px-2 text-xs"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        <Separator />
                      </div>
                    )}

                    {/* Data Table */}
                    {loading && tableData.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                        <p className="text-xs">Loading...</p>
                      </div>
                    ) : filteredData.length === 0 && tableData.length > 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Search className="h-4 w-4 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No matches</p>
                      </div>
                    ) : filteredData.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <TableIcon className="h-4 w-4 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No data</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg bg-white dark:bg-gray-900">
                        <ScrollArea className="h-64 w-full">
                          <Table>
                            <TableHeader>
                              <TableRow className="h-7">
                                {columns.map((column) => (
                                  <TableHead 
                                    key={column} 
                                    className="h-7 px-2 py-1 font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors text-xs"
                                    onClick={() => handleSort(column)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs truncate">{column}</span>
                                      {sortColumn === column && (
                                        <span className="text-xs ml-1 flex-shrink-0">
                                          {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                      )}
                                    </div>
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredData.map((row, index) => (
                                <TableRow key={index} className="hover:bg-muted/30 h-6">
                                  {columns.map((column) => (
                                    <TableCell key={column} className="px-2 py-0 text-xs font-mono">
                                      <div className="max-w-24 truncate" title={String(row[column] || '')}>
                                        {String(row[column] || '')}
                                      </div>
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <TableIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a table</p>
                    <p className="text-xs mt-1">
                      Choose from the sidebar
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Database Selected State */}
        {!selectedDatabase && !error && (
          <Card>
            <CardContent className="text-center py-8">
              <Database className="h-8 w-8 mx-auto mb-3 opacity-50 text-muted-foreground" />
              <h3 className="text-sm font-medium mb-2">Welcome to SQL Viewer</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Select a database above to explore your data
              </p>
              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                <div className="text-center p-3 bg-muted/30 rounded">
                  <Search className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <h4 className="text-xs font-medium mb-1">Search</h4>
                  <p className="text-xs text-muted-foreground">Filter data</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded">
                  <Download className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <h4 className="text-xs font-medium mb-1">Export</h4>
                  <p className="text-xs text-muted-foreground">CSV download</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded">
                  <Filter className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <h4 className="text-xs font-medium mb-1">Filter</h4>
                  <p className="text-xs text-muted-foreground">Sort columns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SQLViewerPage;
