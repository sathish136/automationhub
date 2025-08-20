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
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">SQL Database Viewer</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Professional database management and query interface
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
              className="text-sm"
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'checking' ? 'Connecting' : 'Disconnected'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
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
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl">
              <Database className="h-5 w-5 mr-2" />
              Database Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="database-select" className="text-base font-medium">
                    Select Database
                  </Label>
                  <Select 
                    value={selectedDatabase} 
                    onValueChange={setSelectedDatabase}
                    disabled={loading || databases.length === 0}
                  >
                    <SelectTrigger className="mt-2 h-11" data-testid="select-database">
                      <SelectValue placeholder="-- Select a Database --" />
                    </SelectTrigger>
                    <SelectContent>
                      {databases.map((db) => (
                        <SelectItem key={db.name} value={db.name}>
                          <div className="flex items-center justify-between w-full">
                            <span className="text-base">{db.name}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {db.tableCount ? `${db.tableCount} tables` : 'Unknown'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedDatabase && (
                  <div>
                    <Label className="text-base font-medium">Database Info</Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{selectedDatabase}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {tables.length} tables
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={refreshData} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {selectedDatabase && (
          <div className="grid grid-cols-12 gap-6">
            {/* Tables Sidebar */}
            <Card className="col-span-12 lg:col-span-3">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <TableIcon className="h-4 w-4 mr-2" />
                  Tables ({tables.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  <div className="space-y-1 p-4">
                    {loading && tables.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading tables...
                      </div>
                    ) : tables.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <TableIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        No tables found
                      </div>
                    ) : (
                      tables.map((table) => (
                        <Button
                          key={table}
                          variant={selectedTable === table ? 'default' : 'ghost'}
                          className="w-full justify-between h-auto py-3 px-3 text-left"
                          onClick={() => setSelectedTable(table)}
                          data-testid={`button-select-table-${table}`}
                        >
                          <div className="flex items-center">
                            <TableIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate text-sm font-medium">{table}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        </Button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Data Viewer */}
            <Card className="col-span-12 lg:col-span-9">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    {selectedTable ? (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Table: {selectedTable}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {filteredData.length} rows
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Select a table to view data
                      </>
                    )}
                  </CardTitle>
                  
                  {selectedTable && tableData.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        data-testid="button-export-csv"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={loading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
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
                      <div className="mb-6 space-y-4">
                        <Separator />
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <Label htmlFor="search" className="text-sm font-medium">
                              Search Data
                            </Label>
                            <div className="relative mt-2">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="search"
                                placeholder="Search across all columns..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11"
                                data-testid="input-search-data"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Filter Results</Label>
                            <div className="mt-2 flex items-center space-x-2">
                              <Badge variant="outline">
                                <Filter className="h-3 w-3 mr-1" />
                                {filteredData.length} of {tableData.length}
                              </Badge>
                              {searchTerm && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSearchTerm('')}
                                  className="h-8 px-2"
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    )}

                    {/* Data Table */}
                    {loading && tableData.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-lg">Loading table data...</p>
                      </div>
                    ) : filteredData.length === 0 && tableData.length > 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <Search className="h-8 w-8 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No data matches your search</p>
                        <p className="text-sm mt-2">Try adjusting your search terms</p>
                      </div>
                    ) : filteredData.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <TableIcon className="h-8 w-8 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No data available</p>
                        <p className="text-sm mt-2">This table appears to be empty</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg bg-white dark:bg-gray-900">
                        <ScrollArea className="h-80 w-full">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {columns.map((column) => (
                                  <TableHead 
                                    key={column} 
                                    className="h-8 px-2 py-1 font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors text-xs"
                                    onClick={() => handleSort(column)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium truncate">{column}</span>
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
                                <TableRow key={index} className="hover:bg-muted/30 h-8">
                                  {columns.map((column) => (
                                    <TableCell key={column} className="px-2 py-1 text-xs font-mono">
                                      <div className="max-w-32 truncate" title={String(row[column] || '')}>
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
                  <div className="text-center text-muted-foreground py-12">
                    <TableIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-medium">Select a table to get started</p>
                    <p className="text-sm mt-2">
                      Choose a table from the sidebar to view its data and schema
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
            <CardContent className="text-center py-12">
              <Database className="h-16 w-16 mx-auto mb-6 opacity-50 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Welcome to SQL Viewer</h3>
              <p className="text-muted-foreground mb-6">
                Select a database from the dropdown above to start exploring your data with professional tools and filtering options.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <Search className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium mb-1">Advanced Search</h4>
                  <p className="text-sm text-muted-foreground">Search across all columns with real-time filtering</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <Download className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium mb-1">Export Data</h4>
                  <p className="text-sm text-muted-foreground">Export filtered results to CSV format</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <Filter className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium mb-1">Smart Filtering</h4>
                  <p className="text-sm text-muted-foreground">Sort and filter data with professional controls</p>
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
