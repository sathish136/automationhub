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
import { CompactDateRange } from '@/components/ui/compact-date-range';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ChevronDown,
  BarChart3,
  LineChart,
  Calendar,
  GitCompare,
  TrendingUp,
  Eye
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
  const [sortColumn, setSortColumn] = useState<string>('date_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [maxRows, setMaxRows] = useState(100);
  const [columnFilter, setColumnFilter] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  
  // Demo data for when database is not available
  const [demoData, setDemoData] = useState<any[]>([]);
  const [sortedDemoData, setSortedDemoData] = useState<any[]>([]);
  
  // New visualization and comparison states
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'comparison'>('table');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [comparisonStartDate, setComparisonStartDate] = useState<string>('');
  const [comparisonEndDate, setComparisonEndDate] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<{ period1: any[], period2: any[] }>({ period1: [], period2: [] });

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
    
    // Sort by date_time DESC by default (newest first)
    const sortedData = [...data].sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
    setSortedDemoData(sortedData);
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
    } else {
      // Default sort: show newest dates first when no sort is applied
      sorted.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
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

  // Reset sort when table changes
  useEffect(() => {
    if (selectedTable) {
      setSortColumn('date_time');
      setSortDirection('desc');
    }
  }, [selectedTable]);

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
        
        // Always add default sorting parameters to URL (date_time DESC by default)
        const currentSortColumn = sortColumn || 'date_time';
        const currentSortDirection = sortDirection || 'desc';
        url += `&sortColumn=${encodeURIComponent(currentSortColumn)}&sortDirection=${currentSortDirection}`;
        
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
      // For date_time column, start with DESC (newest first), for others start with ASC
      const defaultDirection = column === 'date_time' ? 'desc' : 'asc';
      setSortDirection(defaultDirection);
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

  // Get numeric columns for chart visualization
  const getNumericColumns = () => {
    if (filteredData.length === 0) return [];
    const sample = filteredData[0];
    return Object.keys(sample).filter(key => {
      if (key === 'id' || key === 'date_time') return false;
      const value = sample[key];
      return !isNaN(parseFloat(value)) && isFinite(value);
    });
  };

  // Prepare chart data with date filtering
  const getChartData = () => {
    let dataToChart = filteredData;
    
    // Apply date range filter if dates are selected
    if (startDate && endDate) {
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      // Set end time to end of day
      endDateTime.setHours(23, 59, 59, 999);
      dataToChart = dataToChart.filter(row => {
        const rowDate = new Date(row.date_time);
        return rowDate >= startDateTime && rowDate <= endDateTime;
      });
    } else if (startDate) {
      // If only start date is selected, filter from that date onwards
      const startDateTime = new Date(startDate);
      dataToChart = dataToChart.filter(row => {
        const rowDate = new Date(row.date_time);
        return rowDate >= startDateTime;
      });
    } else if (endDate) {
      // If only end date is selected, filter up to that date
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      dataToChart = dataToChart.filter(row => {
        const rowDate = new Date(row.date_time);
        return rowDate <= endDateTime;
      });
    }
    
    return dataToChart.map(row => {
      const chartRow: any = {
        timestamp: row.date_time ? new Date(row.date_time).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) : '',
        fullTimestamp: row.date_time ? new Date(row.date_time).toLocaleString('en-GB') : '',
      };
      selectedMetrics.forEach(metric => {
        chartRow[metric] = parseFloat(row[metric]) || 0;
      });
      return chartRow;
    }).slice(0, 100); // Show more data points for better charts
  };

  // Export chart functionality
  const exportChart = async (format: 'pdf' | 'jpeg' | 'png') => {
    try {
      const chartElement = document.querySelector('[data-chart-container]') as HTMLElement;
      if (!chartElement) {
        alert('Chart not found. Please ensure a chart is displayed.');
        return;
      }

      // Create a temporary canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size for high quality
      canvas.width = 1200;
      canvas.height = 600;
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Get chart data
      const chartData = getChartData();
      if (chartData.length === 0) {
        alert('No data available to export.');
        return;
      }

      // Draw title
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${selectedTable || 'Data'} - ${selectedMetrics.join(', ')}`, canvas.width / 2, 40);
      
      // Draw subtitle with date range
      ctx.font = '16px Arial';
      ctx.fillStyle = '#6b7280';
      const dateRange = startDate && endDate 
        ? `${startDate} to ${endDate}` 
        : startDate 
          ? `From ${startDate}` 
          : endDate 
            ? `Until ${endDate}`
            : 'All Data';
      ctx.fillText(dateRange, canvas.width / 2, 65);

      // Simple chart drawing (basic implementation)
      const chartArea = {
        x: 80,
        y: 100,
        width: canvas.width - 160,
        height: canvas.height - 200
      };

      // Draw chart background
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(chartArea.x, chartArea.y, chartArea.width, chartArea.height);
      
      // Draw border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

      // Add message about chart export
      ctx.fillStyle = '#374151';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Chart visualization exported', chartArea.x + chartArea.width / 2, chartArea.y + chartArea.height / 2);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`${chartData.length} data points | ${selectedMetrics.length} metrics`, chartArea.x + chartArea.width / 2, chartArea.y + chartArea.height / 2 + 30);

      // Export based on format
      if (format === 'pdf') {
        // Simple PDF export using canvas
        const link = document.createElement('a');
        link.download = `${selectedTable || 'chart'}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        alert('Chart exported as PNG (PDF export requires additional setup)');
      } else {
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const link = document.createElement('a');
        link.download = `${selectedTable || 'chart'}_${new Date().toISOString().split('T')[0]}.${format}`;
        link.href = canvas.toDataURL(mimeType, 0.9);
        link.click();
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Initialize default metrics when data changes
  useEffect(() => {
    if (filteredData.length > 0 && selectedMetrics.length === 0) {
      const numericCols = getNumericColumns();
      setSelectedMetrics(numericCols.slice(0, 3)); // Select first 3 numeric columns by default
    }
  }, [filteredData]);

  // Filter data by date range for comparison
  const filterDataByDateRange = (data: any[], start: string, end: string) => {
    if (!start || !end) return data;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return data.filter(row => {
      const rowDate = new Date(row.date_time);
      return rowDate >= startDate && rowDate <= endDate;
    });
  };

  // Calculate comparison metrics
  const getComparisonMetrics = (data1: any[], data2: any[], metric: string) => {
    const avg1 = data1.reduce((sum, row) => sum + (parseFloat(row[metric]) || 0), 0) / data1.length;
    const avg2 = data2.reduce((sum, row) => sum + (parseFloat(row[metric]) || 0), 0) / data2.length;
    const change = ((avg2 - avg1) / avg1) * 100;
    return { avg1, avg2, change: isFinite(change) ? change : 0 };
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

        {/* Enhanced Data Viewer with Visualization Options */}
        {selectedDatabase && (
          <Card className="shadow-lg">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg font-semibold">
                    {selectedTable ? (
                      <>
                        <Database className="h-5 w-5 mr-2 text-blue-600" />
                        {selectedTable}
                        <Badge variant="secondary" className="ml-3 text-sm px-2 py-1">
                          {filteredData.length} records
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2 text-gray-400" />
                        Select a table to view data
                      </>
                    )}
                  </CardTitle>
                  
                  {selectedTable && tableData.length > 0 && (
                    <div className="flex items-center space-x-2">
                      {/* View Mode Toggle */}
                      <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border">
                        <Button
                          variant={viewMode === 'table' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('table')}
                          className="h-8 px-3 text-xs"
                          data-testid="view-table"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Table
                        </Button>
                        <Button
                          variant={viewMode === 'chart' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('chart')}
                          className="h-8 px-3 text-xs"
                          data-testid="view-chart"
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Chart
                        </Button>
                        <Button
                          variant={viewMode === 'comparison' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('comparison')}
                          className="h-8 px-3 text-xs"
                          data-testid="view-comparison"
                        >
                          <GitCompare className="h-4 w-4 mr-1" />
                          Compare
                        </Button>
                      </div>
                      
                      <Separator orientation="vertical" className="h-8" />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        data-testid="button-export-csv"
                        className="h-8 px-3 text-xs"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={loading}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {selectedTable ? (
                  <>
                    {/* Universal Search and Filter Controls */}
                    {tableData.length > 0 && (
                      <div className="mb-4 space-y-3">
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-4 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search all columns..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 h-9 text-sm"
                              data-testid="input-search-data"
                            />
                          </div>
                          
                          <div className="col-span-3 relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Filter columns..."
                              value={columnFilter}
                              onChange={(e) => setColumnFilter(e.target.value)}
                              className="pl-10 h-9 text-sm"
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <Select value={maxRows.toString()} onValueChange={(value) => setMaxRows(Number(value))}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="25">25 rows</SelectItem>
                                <SelectItem value="50">50 rows</SelectItem>
                                <SelectItem value="100">100 rows</SelectItem>
                                <SelectItem value="200">200 rows</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-2">
                            <Badge variant="outline" className="text-sm px-3 py-2 w-full justify-center">
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
                                className="h-9 px-3 text-sm"
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

                    {/* View-specific Controls */}
                    {viewMode === 'chart' && tableData.length > 0 && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border shadow-sm">
                        <div className="space-y-4">
                          {/* Chart Configuration Row */}
                          <div className="grid grid-cols-12 gap-4 items-start">
                            <div className="col-span-2">
                              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Chart Type</Label>
                              <div className="flex mt-2 gap-1">
                                <Button
                                  variant={chartType === 'line' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setChartType('line')}
                                  className="flex-1 h-7 text-xs"
                                >
                                  <LineChart className="h-3 w-3 mr-1" />
                                  Line
                                </Button>
                                <Button
                                  variant={chartType === 'bar' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setChartType('bar')}
                                  className="flex-1 h-7 text-xs"
                                >
                                  <BarChart3 className="h-3 w-3 mr-1" />
                                  Bar
                                </Button>
                              </div>
                            </div>
                            
                            <div className="col-span-6">
                              <div className="mt-2">
                                <CompactDateRange
                                  fromDate={startDate}
                                  toDate={endDate}
                                  onFromDateChange={setStartDate}
                                  onToDateChange={setEndDate}
                                />
                              </div>
                            </div>
                            
                            <div className="col-span-4">
                              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Export Options</Label>
                              <div className="mt-2">
                                <Select onValueChange={(value) => exportChart(value as 'pdf' | 'jpeg' | 'png')}>
                                  <SelectTrigger className="h-8 text-xs">
                                    <div className="flex items-center">
                                      <Download className="h-2 w-2 mr-1" />
                                      <SelectValue placeholder="Export" />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pdf" className="text-xs">
                                      <div className="flex items-center">
                                        <Download className="h-2 w-2 mr-1" />
                                        PDF
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="jpeg" className="text-xs">
                                      <div className="flex items-center">
                                        <Download className="h-2 w-2 mr-1" />
                                        JPEG
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="png" className="text-xs">
                                      <div className="flex items-center">
                                        <Download className="h-2 w-2 mr-1" />
                                        PNG
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          
                          {/* Metrics Selection Row */}
                          <div>
                            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">Select Metrics to Display</Label>
                            <div className="flex flex-wrap gap-1">
                              {getNumericColumns().map(column => (
                                <Badge
                                  key={column}
                                  variant={selectedMetrics.includes(column) ? 'default' : 'outline'}
                                  className="cursor-pointer px-2 py-1 text-xs hover:scale-105 transition-transform"
                                  onClick={() => {
                                    setSelectedMetrics(prev => 
                                      prev.includes(column) 
                                        ? prev.filter(m => m !== column)
                                        : [...prev, column]
                                    );
                                  }}
                                >
                                  {column.replace(/_/g, ' ').toUpperCase()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {viewMode === 'comparison' && tableData.length > 0 && (
                      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-5">
                            <Label className="text-sm font-medium">Period 1</Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-sm"
                              />
                              <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <div className="col-span-2 text-center">
                            <GitCompare className="h-6 w-6 mx-auto text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">vs</span>
                          </div>
                          <div className="col-span-5">
                            <Label className="text-sm font-medium">Period 2</Label>
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="date"
                                value={comparisonStartDate}
                                onChange={(e) => setComparisonStartDate(e.target.value)}
                                className="text-sm"
                              />
                              <Input
                                type="date"
                                value={comparisonEndDate}
                                onChange={(e) => setComparisonEndDate(e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Loading States */}
                    {loading && tableData.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3" />
                        <p className="text-lg font-medium">Loading data...</p>
                        <p className="text-sm">Please wait while we fetch your data</p>
                      </div>
                    ) : filteredData.length === 0 && tableData.length > 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <Search className="h-6 w-6 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No matches found</p>
                        <p className="text-sm">Try adjusting your search criteria</p>
                      </div>
                    ) : filteredData.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <TableIcon className="h-6 w-6 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No data available</p>
                        <p className="text-sm">This table appears to be empty</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* TABLE VIEW */}
                        {viewMode === 'table' && (
                          <div className="border rounded-lg bg-white dark:bg-gray-950 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <div className="max-h-[500px] overflow-y-auto">
                                <table className="w-full">
                                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-10">
                                    <tr className="border-b border-gray-200 dark:border-gray-600">
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[60px]">
                                        #
                                      </th>
                                      {columns.map((column) => (
                                        <th 
                                          key={column} 
                                          className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                          style={{ minWidth: column === 'date_time' ? '180px' : '140px' }}
                                          onClick={() => handleSort(column)}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span>{column === 'date_time' ? 'Date & Time' : column.replace(/_/g, ' ').toUpperCase()}</span>
                                            <div className="flex flex-col ml-2">
                                              <ChevronUp 
                                                className={`h-3 w-3 ${
                                                  sortColumn === column && sortDirection === 'asc' 
                                                    ? 'text-blue-600 dark:text-blue-400' 
                                                    : 'text-gray-400'
                                                }`} 
                                              />
                                              <ChevronDown 
                                                className={`h-3 w-3 -mt-1 ${
                                                  sortColumn === column && sortDirection === 'desc' 
                                                    ? 'text-blue-600 dark:text-blue-400' 
                                                    : 'text-gray-400'
                                                }`} 
                                              />
                                            </div>
                                          </div>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredData.map((row, index) => (
                                      <tr 
                                        key={index} 
                                        className={`border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                                          index % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50/50 dark:bg-gray-900/50'
                                        }`}
                                      >
                                        <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                                          {index + 1}
                                        </td>
                                        {columns.map((column) => (
                                          <td 
                                            key={column} 
                                            className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100"
                                            title={String(row[column] || '')}
                                          >
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
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CHART VIEW */}
                        {viewMode === 'chart' && (
                          <div className="space-y-6">
                            {selectedMetrics.length > 0 ? (
                              <div 
                                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-lg"
                                data-chart-container
                              >
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                        Industrial Data Visualization
                                      </h3>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {selectedMetrics.map(m => m.replace(/_/g, ' ').toUpperCase()).join(' • ')}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-muted-foreground">Data Points</div>
                                      <div className="text-lg font-bold text-blue-600">{getChartData().length}</div>
                                    </div>
                                  </div>
                                  
                                  {/* Date Filter Info */}
                                  {(startDate || endDate) && (
                                    <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                      <Calendar className="h-3 w-3 text-blue-600" />
                                      <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                        Filtered: {startDate && endDate 
                                          ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                                          : startDate 
                                            ? `From ${new Date(startDate).toLocaleDateString()}`
                                            : `Until ${new Date(endDate).toLocaleDateString()}`
                                        }
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Metrics Info */}
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {selectedMetrics.map((metric, index) => (
                                      <div 
                                        key={metric}
                                        className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded-full border shadow-sm"
                                      >
                                        <div 
                                          className="w-2 h-2 rounded-full" 
                                          style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}
                                        />
                                        <span className="text-xs font-medium">{metric.replace(/_/g, ' ').toUpperCase()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="bg-white dark:bg-gray-950 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                                  <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                      {chartType === 'line' ? (
                                        <RechartsLineChart data={getChartData()} margin={{ top: 15, right: 20, left: 15, bottom: 60 }}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                                          <XAxis 
                                            dataKey="timestamp" 
                                            tick={{ fontSize: 9, fill: '#6b7280' }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                            stroke="#9ca3af"
                                          />
                                          <YAxis 
                                            tick={{ fontSize: 9, fill: '#6b7280' }} 
                                            stroke="#9ca3af"
                                          />
                                          <Tooltip 
                                            contentStyle={{ 
                                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                              border: '1px solid #e5e7eb',
                                              borderRadius: '8px',
                                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                              fontSize: '11px'
                                            }}
                                            labelStyle={{ fontWeight: 'bold', color: '#374151', fontSize: '11px' }}
                                          />
                                          <Legend 
                                            wrapperStyle={{ paddingTop: '15px', fontSize: '10px' }}
                                            iconType="line"
                                          />
                                          {selectedMetrics.map((metric, index) => (
                                            <Line 
                                              key={metric}
                                              type="monotone" 
                                              dataKey={metric} 
                                              stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                                              strokeWidth={2}
                                              dot={{ r: 3, strokeWidth: 1, fill: '#fff' }}
                                              activeDot={{ r: 4, strokeWidth: 1 }}
                                              name={metric.replace(/_/g, ' ').toUpperCase()}
                                            />
                                          ))}
                                        </RechartsLineChart>
                                      ) : (
                                        <BarChart data={getChartData()} margin={{ top: 15, right: 20, left: 15, bottom: 60 }}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                                          <XAxis 
                                            dataKey="timestamp" 
                                            tick={{ fontSize: 9, fill: '#6b7280' }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                            stroke="#9ca3af"
                                          />
                                          <YAxis 
                                            tick={{ fontSize: 9, fill: '#6b7280' }} 
                                            stroke="#9ca3af"
                                          />
                                          <Tooltip 
                                            contentStyle={{ 
                                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                              border: '1px solid #e5e7eb',
                                              borderRadius: '8px',
                                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                              fontSize: '11px'
                                            }}
                                            labelStyle={{ fontWeight: 'bold', color: '#374151', fontSize: '11px' }}
                                          />
                                          <Legend 
                                            wrapperStyle={{ paddingTop: '15px', fontSize: '10px' }}
                                          />
                                          {selectedMetrics.map((metric, index) => (
                                            <Bar 
                                              key={metric}
                                              dataKey={metric} 
                                              fill={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                                              name={metric.replace(/_/g, ' ').toUpperCase()}
                                              radius={[2, 2, 0, 0]}
                                            />
                                          ))}
                                        </BarChart>
                                      )}
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground py-16 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-xl font-medium mb-2">No metrics selected</p>
                                <p className="text-sm">Select some metrics above to view beautiful charts</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* COMPARISON VIEW */}
                        {viewMode === 'comparison' && (
                          <div className="space-y-6">
                            {startDate && endDate && comparisonStartDate && comparisonEndDate ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {getNumericColumns().slice(0, 4).map(metric => {
                                  const period1Data = filterDataByDateRange(filteredData, startDate, endDate);
                                  const period2Data = filterDataByDateRange(filteredData, comparisonStartDate, comparisonEndDate);
                                  const comparison = getComparisonMetrics(period1Data, period2Data, metric);
                                  
                                  return (
                                    <Card key={metric} className="p-4">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-semibold">
                                          {metric.replace(/_/g, ' ').toUpperCase()}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Period 1 Avg</p>
                                            <p className="text-lg font-bold text-blue-600">{comparison.avg1.toFixed(2)}</p>
                                          </div>
                                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Period 2 Avg</p>
                                            <p className="text-lg font-bold text-green-600">{comparison.avg2.toFixed(2)}</p>
                                          </div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                          <p className="text-xs text-muted-foreground">Change</p>
                                          <p className={`text-lg font-bold ${comparison.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {comparison.change >= 0 ? '+' : ''}{comparison.change.toFixed(1)}%
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground py-12">
                                <Calendar className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                <p className="text-lg font-medium">Select date ranges to compare</p>
                                <p className="text-sm">Choose start and end dates for both periods above</p>
                              </div>
                            )}
                          </div>
                        )}
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
          <Card className="shadow-lg">
            <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg font-semibold">
                  <Database className="h-5 w-5 mr-2 text-orange-600" />
                  Demo Data - kanchan_rej
                  <Badge variant="secondary" className="ml-3 text-sm px-2 py-1">
                    100 records
                  </Badge>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {/* View Mode Toggle for Demo */}
                  <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="h-8 px-3 text-xs"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Table
                    </Button>
                    <Button
                      variant={viewMode === 'chart' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('chart')}
                      className="h-8 px-3 text-xs"
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Chart
                    </Button>
                    <Button
                      variant={viewMode === 'comparison' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('comparison')}
                      className="h-8 px-3 text-xs"
                    >
                      <GitCompare className="h-4 w-4 mr-1" />
                      Compare
                    </Button>
                  </div>
                </div>
              </div>
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
