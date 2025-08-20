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
  ChevronRight,
  ChevronUp,
  ChevronDown
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
  const [maxRows, setMaxRows] = useState(100);
  const [columnFilter, setColumnFilter] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  
  // Demo data for when database is not available
  const [demoData, setDemoData] = useState<any[]>([]);
  const [sortedDemoData, setSortedDemoData] = useState<any[]>([]);

  // Generate demo data once
  useEffect(() => {
    const generateDemoData = () => {
      return Array.from({ length: 100 }, (_, index) => {
        const date = new Date(2023, 2, (index % 31) + 1, 11, 20 + (index % 24) * 4, 5 + (index % 60));
        return {
          id: index + 1,
          date_time: date,
          rej_recovery: +(55 + Math.sin(index * 0.1) * 10).toFixed(1),
          rej_feed: +(30 + Math.cos(index * 0.15) * 10).toFixed(1),
          rej_1st_db: +(0.5 + Math.sin(index * 0.2) * 0.5).toFixed(1),
          rej_1st_stg_fm: +(42 + Math.cos(index * 0.12) * 5).toFixed(1),
          rej_1st_stg_in: +(40 + Math.sin(index * 0.18) * 5).toFixed(1),
          rej_1st_stg_out: +(6 + Math.cos(index * 0.25) * 2).toFixed(1),
          rej_2nd_stg_fm: +(59 + Math.sin(index * 0.14) * 2).toFixed(1),
          rej_2nd_stg_in: +(58 + Math.cos(index * 0.16) * 2).toFixed(1),
          rej_2nd_stg_out: +(5.5 + Math.sin(index * 0.22) * 1).toFixed(1),
          rej_feed_lt: +(1.5 + Math.cos(index * 0.28) * 0.5).toFixed(1),
          rej_ph_out: +(32 + Math.sin(index * 0.13) * 3).toFixed(1)
        };
      });
    };
    const data = generateDemoData();
    setDemoData(data);
    setSortedDemoData(data);
  }, []);
  
  // Sort demo data when sort parameters change
  useEffect(() => {
    if (demoData.length === 0) return;
    
    let sorted = [...demoData];
    
    if (sortColumn) {
      sorted.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        
        // Handle date sorting
        if (sortColumn === 'date_time') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        } else {
          // Convert to numbers for numeric sorting
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        }
        
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    setSortedDemoData(sorted);
  }, [demoData, sortColumn, sortDirection]);

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

  // Fetch table data when a table is selected or sorting changes
  useEffect(() => {
    if (!selectedDatabase || !selectedTable) {
      setTableData([]);
      setColumns([]);
      return;
    }

    const fetchTableData = async () => {
      try {
        setLoading(true);
        
        let url = `/api/sql-viewer/databases/${selectedDatabase}/tables/${selectedTable}?limit=${maxRows}`;
        
        // Add sorting parameters to URL
        if (sortColumn && sortDirection) {
          url += `&sortColumn=${encodeURIComponent(sortColumn)}&sortDirection=${sortDirection}`;
        }
        
        const response = await fetch(url);
        
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
  }, [selectedDatabase, selectedTable, sortColumn, sortDirection, maxRows]);

  // Filter and search functionality (without sorting since it's done server-side)
  useEffect(() => {
    let filtered = [...tableData];

    // Apply search filter first
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filter
    if (columnFilter) {
      filtered = filtered.filter(row =>
        Object.entries(row).some(([key, value]) =>
          key.toLowerCase().includes(columnFilter.toLowerCase()) ||
          String(value).toLowerCase().includes(columnFilter.toLowerCase())
        )
      );
    }

    // Note: Sorting is now handled server-side via database ORDER BY
    // Row limit is also handled server-side via TOP clause

    setFilteredData(filtered);
  }, [tableData, searchTerm, columnFilter]);

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
      <div className="w-full p-2 space-y-3">
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

        {/* Database Selection and Tables */}
        <div className="grid grid-cols-12 gap-3">
          {/* Database Selection */}
          <Card className="col-span-12 lg:col-span-6">
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

          {/* Tables List */}
          {selectedDatabase && (
            <Card className="col-span-12 lg:col-span-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-sm">
                  <TableIcon className="h-4 w-4 mr-1" />
                  Tables ({tables.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="py-3">
                <ScrollArea className="h-24">
                  <div className="grid grid-cols-2 gap-1">
                    {loading && tables.length === 0 ? (
                      <div className="col-span-2 text-center text-muted-foreground py-2">
                        <RefreshCw className="h-3 w-3 animate-spin mx-auto mb-1" />
                        <div className="text-xs">Loading...</div>
                      </div>
                    ) : tables.length === 0 ? (
                      <div className="col-span-2 text-center text-muted-foreground py-2">
                        <TableIcon className="h-3 w-3 mx-auto mb-1 opacity-50" />
                        <div className="text-xs">No tables</div>
                      </div>
                    ) : (
                      tables.map((table) => (
                        <Button
                          key={table}
                          variant={selectedTable === table ? 'default' : 'ghost'}
                          className="h-5 px-2 text-xs font-mono rounded-sm justify-start"
                          onClick={() => setSelectedTable(table)}
                          data-testid={`button-select-table-${table}`}
                        >
                          <TableIcon className="h-2 w-2 mr-1 flex-shrink-0" />
                          <span className="truncate text-xs">{table}</span>
                        </Button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Data Viewer */}
        {selectedDatabase && (
          <Card>
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
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4 relative">
                            <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                            <Input
                              placeholder="Search all columns..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-7 h-6 text-xs"
                              data-testid="input-search-data"
                            />
                          </div>
                          
                          <div className="col-span-3 relative">
                            <Filter className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                            <Input
                              placeholder="Filter columns..."
                              value={columnFilter}
                              onChange={(e) => setColumnFilter(e.target.value)}
                              className="pl-7 h-6 text-xs"
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <select
                              value={maxRows}
                              onChange={(e) => setMaxRows(Number(e.target.value))}
                              className="h-6 w-full text-xs border rounded px-2 bg-background"
                              title="Rows to display"
                            >
                              <option value={25}>25 rows</option>
                              <option value={50}>50 rows</option>
                              <option value={100}>100 rows</option>
                              <option value={200}>200 rows</option>
                            </select>
                          </div>
                          
                          <div className="col-span-2">
                            <Badge variant="outline" className="text-xs px-2 py-1 w-full justify-center">
                              {filteredData.length}/{Math.min(tableData.length, maxRows)}
                            </Badge>
                          </div>
                          
                          <div className="col-span-1 flex gap-1">
                            {(searchTerm || columnFilter) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSearchTerm('');
                                  setColumnFilter('');
                                }}
                                className="h-6 px-1 text-xs"
                                title="Clear filters"
                              >
                                ✕
                              </Button>
                            )}
                          </div>
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
                      <div className="w-full border rounded-sm bg-white dark:bg-gray-950 overflow-hidden">
                        {/* Table Container with Both Horizontal and Vertical Scroll */}
                        <div className="overflow-x-auto max-w-full max-h-96 overflow-y-auto">
                          <div className="min-w-fit">
                            {/* Frozen Header */}
                            <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 sticky top-0 z-10">
                              <div className="flex">
                                {/* S.No Header */}
                                <div className="px-2 py-1 text-xs font-semibold border-r border-gray-300 dark:border-gray-600 whitespace-nowrap" style={{ minWidth: '60px', width: 'auto' }}>
                                  <span className="text-xs">S.No</span>
                                </div>
                                {columns.map((column) => (
                                  <div 
                                    key={column} 
                                    className="px-2 py-1 text-xs font-semibold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 border-r border-gray-300 dark:border-gray-600 last:border-r-0 whitespace-nowrap"
                                    style={{ minWidth: column === 'date_time' ? '150px' : '120px', width: 'auto' }}
                                    onClick={() => handleSort(column)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs">{column === 'date_time' ? 'Date & Time' : column}</span>
                                      {sortColumn === column && (
                                        <span className="text-xs ml-1 flex-shrink-0">
                                          {sortDirection === 'asc' ? '↑' : '↓'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Data Rows */}
                            <div>
                              {filteredData.map((row, index) => (
                                <div 
                                  key={index} 
                                  className={`flex hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700 ${
                                    index % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900'
                                  }`}
                                >
                                  {/* S.No Column */}
                                  <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '60px', width: 'auto' }}>
                                    <div className="text-xs">{index + 1}</div>
                                  </div>
                                  {columns.map((column) => (
                                    <div 
                                      key={column} 
                                      className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 last:border-r-0 whitespace-nowrap"
                                      style={{ minWidth: column === 'date_time' ? '150px' : '120px', width: 'auto' }}
                                      title={String(row[column] || '')}
                                    >
                                      <div className="text-xs">
                                        {column === 'date_time' 
                                          ? new Date(row[column]).toLocaleString('en-GB', {
                                              day: '2-digit',
                                              month: '2-digit', 
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              second: '2-digit'
                                            })
                                          : String(row[column] || '')
                                        }
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
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
        )}

        {/* Demo Data When Database Not Available */}
        {!selectedDatabase && error && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                Demo Data - kanchan_rej
                <Badge variant="secondary" className="ml-2 text-xs px-1 py-0">
                  100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 space-y-2">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 relative">
                    <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Search all columns..."
                      className="pl-7 h-6 text-xs"
                    />
                  </div>
                  
                  <div className="col-span-3 relative">
                    <Filter className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Filter columns..."
                      className="pl-7 h-6 text-xs"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <select className="h-6 w-full text-xs border rounded px-2 bg-background">
                      <option value={100}>100 rows</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-xs px-2 py-1 w-full justify-center">
                      100/100
                    </Badge>
                  </div>
                  
                  <div className="col-span-1">
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                  </div>
                </div>
                <Separator />
              </div>

              <div className="w-full border rounded-sm bg-white dark:bg-gray-950 overflow-hidden">
                {/* Table Container with Both Horizontal and Vertical Scroll */}
                <div className="overflow-x-auto max-w-full max-h-96 overflow-y-auto">
                  <div className="min-w-fit">
                    {/* Demo Table Headers */}
                    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 sticky top-0 z-10">
                      <div className="flex">
                        {/* S.No Header */}
                        <div className="px-2 py-1 text-xs font-semibold border-r border-gray-300 dark:border-gray-600 whitespace-nowrap" style={{ minWidth: '60px', width: 'auto' }}>
                          <span className="text-xs">S.No</span>
                        </div>
                        {['date_time', 'rej_recovery', 'rej_feed', 'rej_1st_db', 'rej_1st_stg_fm', 'rej_1st_stg_in', 'rej_1st_stg_out', 'rej_2nd_stg_fm', 'rej_2nd_stg_in', 'rej_2nd_stg_out', 'rej_feed_lt', 'rej_ph_out'].map((column) => (
                          <div 
                            key={column} 
                            className="px-2 py-1 text-xs font-semibold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 border-r border-gray-300 dark:border-gray-600 last:border-r-0 whitespace-nowrap"
                            style={{ minWidth: column === 'date_time' ? '150px' : '120px', width: 'auto' }}
                            onClick={() => handleSort(column)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs">{column === 'date_time' ? 'Date & Time' : column}</span>
                              <div className="flex flex-col ml-1">
                                <ChevronUp 
                                  className={`h-2.5 w-2.5 ${
                                    sortColumn === column && sortDirection === 'asc' 
                                      ? 'text-blue-600 dark:text-blue-400' 
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`} 
                                />
                                <ChevronDown 
                                  className={`h-2.5 w-2.5 -mt-0.5 ${
                                    sortColumn === column && sortDirection === 'desc' 
                                      ? 'text-blue-600 dark:text-blue-400' 
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`} 
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Demo Data Rows */}
                    <div>
                      {sortedDemoData.slice(0, 25).map((row, index) => (
                        <div 
                          key={row.id} 
                          className={`flex hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900'
                          }`}
                        >
                          {/* S.No Column */}
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '60px', width: 'auto' }}>
                            <div className="text-xs">{index + 1}</div>
                          </div>
                          {/* Date & Time Column */}
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '150px', width: 'auto' }}>
                            <div className="text-xs">{row.date_time.toLocaleString('en-GB', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}</div>
                          </div>
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '120px', width: 'auto' }}>
                            <div className="text-xs">{row.rej_recovery}</div>
                          </div>
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '120px', width: 'auto' }}>
                            <div className="text-xs">{row.rej_feed}</div>
                          </div>
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '120px', width: 'auto' }}>
                            <div className="text-xs">{row.rej_1st_db}</div>
                          </div>
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '120px', width: 'auto' }}>
                            <div className="text-xs">{row.rej_1st_stg_fm}</div>
                          </div>
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '120px', width: 'auto' }}>
                            <div className="text-xs">{row.rej_1st_stg_in}</div>
                          </div>
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '120px', width: 'auto' }}>
                            <div className="text-xs">{row.rej_1st_stg_out}</div>
                          </div>
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '120px', width: 'auto' }}>
                            <div className="text-xs">{row.rej_2nd_stg_fm}</div>
                          </div>
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '120px', width: 'auto' }}>
                            <div className="text-xs">{row.rej_2nd_stg_in}</div>
                          </div>
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '120px', width: 'auto' }}>
                            <div className="text-xs">{row.rej_2nd_stg_out}</div>
                          </div>
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap" style={{ minWidth: '120px', width: 'auto' }}>
                            <div className="text-xs">{row.rej_feed_lt}</div>
                          </div>
                          <div className="px-2 py-0.5 text-xs font-mono border-r border-gray-200 dark:border-gray-700 last:border-r-0 whitespace-nowrap" style={{ minWidth: '120px', width: 'auto' }}>
                            <div className="text-xs">{row.rej_ph_out}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
