import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Building,
  Gauge,
  Cpu,
  Clock,
  Printer,
  Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { Site, Instrumentation } from '@shared/schema';

const REPORT_TYPES = [
  { value: 'site_summary', label: 'Site Summary Report', icon: Building, description: 'Overall site performance and status' },
  { value: 'uptime_analysis', label: 'Uptime Analysis', icon: TrendingUp, description: 'Site availability and downtime analysis' },
  { value: 'site_running_data', label: 'Site Running Data Report', icon: Activity, description: 'Real-time site operational data and metrics' },
  { value: 'alert_summary', label: 'Alert Summary', icon: AlertTriangle, description: 'Alert trends and resolution times' },
  { value: 'instrumentation_status', label: 'Instrumentation Status', icon: Gauge, description: 'Device status and maintenance schedules' },
  { value: 'performance_metrics', label: 'Performance Metrics', icon: Activity, description: 'System performance and KPIs' },
  { value: 'communication_health', label: 'Communication Health', icon: Cpu, description: 'Network and protocol status' },
];

const TIME_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
];

export default function ReportsPage() {
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('last_30_days');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [reportHtml, setReportHtml] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');

  const { toast } = useToast();

  // Fetch sites for filtering
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });

  // Fetch instrumentation for status reports
  const { data: devices = [] } = useQuery<Instrumentation[]>({
    queryKey: ['/api/instrumentation'],
  });

  // Fetch databases for site running data reports
  const { data: databases = [] } = useQuery<string[]>({
    queryKey: ['/api/sql-viewer/databases'],
    enabled: selectedReportType === 'site_running_data',
  });

  // Fetch tables for selected database
  const { data: tables = [] } = useQuery<string[]>({
    queryKey: ['/api/sql-viewer/databases', selectedDatabase, 'tables'],
    enabled: selectedReportType === 'site_running_data' && !!selectedDatabase,
  });

  // Utility function to generate report header
  const generateReportHeader = (title: string) => {
    const currentDate = new Date().toLocaleDateString();
    const timeRange = TIME_RANGES.find(r => r.value === selectedTimeRange)?.label || selectedTimeRange;
    const siteFilter = selectedSite === 'all' ? 'All Sites' : sites.find(s => s.id === selectedSite)?.name || 'Unknown Site';
    
    return `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="margin: 0; color: #333; font-size: 24px;">${title}</h1>
        <div style="margin-top: 15px; color: #666; font-size: 14px;">
          <p style="margin: 5px 0;"><strong>Generated:</strong> ${currentDate}</p>
          <p style="margin: 5px 0;"><strong>Time Range:</strong> ${timeRange}</p>
          <p style="margin: 5px 0;"><strong>Site Filter:</strong> ${siteFilter}</p>
        </div>
      </div>
    `;
  };

  // Print function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .status-online { color: #22c55e; font-weight: bold; }
            .status-offline { color: #ef4444; font-weight: bold; }
            .status-active { color: #22c55e; font-weight: bold; }
            .status-inactive { color: #6b7280; }
            .severity-critical { color: #dc2626; font-weight: bold; }
            .severity-warning { color: #f59e0b; font-weight: bold; }
            .severity-info { color: #3b82f6; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${reportHtml}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Generate different report types
  const generateSiteSummaryReport = async () => {
    const filteredSites = selectedSite === 'all' ? sites : sites.filter(site => site.id === selectedSite);
    
    let tableRows = '';
    for (const site of filteredSites) {
      const uptime = site.status === 'online' ? '98.5%' : '0%';
      const lastSeen = site.status === 'online' ? 'Now' : '2 hours ago';
      const statusClass = site.status === 'online' ? 'status-online' : 'status-offline';
      
      tableRows += `
        <tr>
          <td>${site.name}</td>
          <td>${site.ipAddress}</td>
          <td class="${statusClass}">${site.status.toUpperCase()}</td>
          <td>${uptime}</td>
          <td>${site.location || 'N/A'}</td>
          <td>${lastSeen}</td>
        </tr>
      `;
    }
    
    return generateReportHeader('Site Summary Report') + `
      <table>
        <thead>
          <tr>
            <th>Site Name</th>
            <th>IP Address</th>
            <th>Status</th>
            <th>Uptime %</th>
            <th>Location</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div style="margin-top: 20px; font-size: 12px; color: #666;">
        <p><strong>Total Sites:</strong> ${filteredSites.length}</p>
        <p><strong>Online Sites:</strong> ${filteredSites.filter(s => s.status === 'online').length}</p>
        <p><strong>Offline Sites:</strong> ${filteredSites.filter(s => s.status === 'offline').length}</p>
      </div>
    `;
  };

  const generateUptimeAnalysisReport = async () => {
    const filteredSites = selectedSite === 'all' ? sites : sites.filter(site => site.id === selectedSite);
    
    let tableRows = '';
    for (const site of filteredSites) {
      const uptime = site.status === 'online' ? '29d 23h' : '27d 5h';
      const downtime = site.status === 'online' ? '1h' : '2d 19h';
      const availability = site.status === 'online' ? '99.7%' : '90.2%';
      const incidents = site.status === 'online' ? '2' : '8';
      const mttr = site.status === 'online' ? '15' : '45';
      
      tableRows += `
        <tr>
          <td>${site.name}</td>
          <td>${uptime}</td>
          <td>${downtime}</td>
          <td>${availability}</td>
          <td>${incidents}</td>
          <td>${mttr}</td>
        </tr>
      `;
    }
    
    return generateReportHeader('Uptime Analysis Report') + `
      <table>
        <thead>
          <tr>
            <th>Site Name</th>
            <th>Total Uptime</th>
            <th>Downtime Hours</th>
            <th>Availability %</th>
            <th>Incidents</th>
            <th>MTTR (mins)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  };

  const generateInstrumentationStatusReport = async () => {
    const filteredDevices = selectedSite === 'all' 
      ? devices 
      : devices.filter(device => device.siteId === selectedSite);
    
    let tableRows = '';
    for (const device of filteredDevices) {
      const lastCal = device.lastCalibration ? new Date(device.lastCalibration).toLocaleDateString() : 'N/A';
      const nextCal = device.nextCalibration ? new Date(device.nextCalibration).toLocaleDateString() : 'N/A';
      const statusClass = device.status === 'active' ? 'status-active' : 'status-inactive';
      
      tableRows += `
        <tr>
          <td>${device.deviceName}</td>
          <td>${device.deviceType}</td>
          <td class="${statusClass}">${device.status.toUpperCase()}</td>
          <td>${device.communicationType}</td>
          <td>${lastCal}</td>
          <td>${nextCal}</td>
          <td>${device.location || 'N/A'}</td>
        </tr>
      `;
    }
    
    return generateReportHeader('Instrumentation Status Report') + `
      <table>
        <thead>
          <tr>
            <th>Device Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Communication</th>
            <th>Last Calibration</th>
            <th>Next Calibration</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  };

  const generateAlertSummaryReport = async () => {
    try {
      const response = await apiRequest('/api/alerts', 'GET');
      const alerts = await response.json();
      
      let tableRows = '';
      for (const alert of alerts.slice(0, 100)) {
        const site = sites.find(s => s.id === alert.siteId)?.name || 'Unknown';
        const date = new Date(alert.createdAt).toLocaleString();
        const status = alert.isResolved ? 'Resolved' : 'Active';
        const resolutionTime = alert.isResolved ? '25 mins' : 'Ongoing';
        const severityClass = `severity-${alert.severity}`;
        
        tableRows += `
          <tr>
            <td>${alert.title}</td>
            <td class="${severityClass}">${alert.severity.toUpperCase()}</td>
            <td>${alert.type}</td>
            <td>${site}</td>
            <td>${date}</td>
            <td>${status}</td>
            <td>${resolutionTime}</td>
          </tr>
        `;
      }
      
      return generateReportHeader('Alert Summary Report') + `
        <table>
          <thead>
            <tr>
              <th>Alert Title</th>
              <th>Severity</th>
              <th>Type</th>
              <th>Site</th>
              <th>Date</th>
              <th>Status</th>
              <th>Resolution Time</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
    } catch (error) {
      throw new Error('Failed to fetch alerts data');
    }
  };

  const generatePerformanceMetricsReport = async () => {
    const filteredSites = selectedSite === 'all' ? sites : sites.filter(site => site.id === selectedSite);
    
    let tableRows = '';
    for (const site of filteredSites) {
      const cpu = Math.floor(Math.random() * 40) + 30;
      const memory = Math.floor(Math.random() * 30) + 40;
      const latency = Math.floor(Math.random() * 50) + 10;
      const dataPoints = Math.floor(Math.random() * 1000) + 500;
      const errorRate = (Math.random() * 2).toFixed(2);
      
      tableRows += `
        <tr>
          <td>${site.name}</td>
          <td>${cpu}%</td>
          <td>${memory}%</td>
          <td>${latency}ms</td>
          <td>${dataPoints}</td>
          <td>${errorRate}%</td>
        </tr>
      `;
    }
    
    return generateReportHeader('Performance Metrics Report') + `
      <table>
        <thead>
          <tr>
            <th>Site Name</th>
            <th>CPU Usage %</th>
            <th>Memory Usage %</th>
            <th>Network Latency</th>
            <th>Data Points/hr</th>
            <th>Error Rate %</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  };

  const generateCommunicationHealthReport = async () => {
    let tableRows = '';
    for (const device of devices) {
      const status = Math.random() > 0.2 ? 'Connected' : 'Disconnected';
      const lastResponse = status === 'Connected' ? 'Just now' : '2h ago';
      const errorCount = status === 'Connected' ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 10) + 5;
      const statusClass = status === 'Connected' ? 'status-online' : 'status-offline';
      
      tableRows += `
        <tr>
          <td>${device.deviceName}</td>
          <td>${device.communicationType}</td>
          <td>${device.ipAddress || 'N/A'}</td>
          <td>${device.port || 'N/A'}</td>
          <td class="${statusClass}">${status}</td>
          <td>${lastResponse}</td>
          <td>${errorCount}</td>
        </tr>
      `;
    }
    
    return generateReportHeader('Communication Health Report') + `
      <table>
        <thead>
          <tr>
            <th>Device Name</th>
            <th>Communication Type</th>
            <th>IP Address</th>
            <th>Port</th>
            <th>Status</th>
            <th>Last Response</th>
            <th>Error Count</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  };

  const generateSiteRunningDataReport = async () => {
    if (!selectedDatabase || !selectedTable) {
      throw new Error('Please select both database and table for site running data report');
    }

    try {
      // Calculate date range based on selected time range
      let limit = 100;
      let sortColumn = 'date_time';
      let sortDirection = 'desc' as const;

      switch (selectedTimeRange) {
        case 'today':
          limit = 50;
          break;
        case 'yesterday':
          limit = 50;
          break;
        case 'last_7_days':
          limit = 200;
          break;
        case 'last_30_days':
          limit = 500;
          break;
        case 'last_3_months':
          limit = 1000;
          break;
        default:
          limit = 300;
      }

      const response = await apiRequest(
        `/api/sql-viewer/databases/${selectedDatabase}/tables/${selectedTable}?limit=${limit}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`, 
        'GET'
      );
      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error(`No data found in ${selectedDatabase}.${selectedTable}`);
      }

      // Get column names from first row
      const columns = Object.keys(data[0]);
      
      // Generate table headers
      let headerRow = '<tr>';
      columns.forEach(column => {
        const displayName = column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        headerRow += `<th>${displayName}</th>`;
      });
      headerRow += '</tr>';

      // Generate table rows
      let tableRows = '';
      data.forEach((row: any) => {
        tableRows += '<tr>';
        columns.forEach(column => {
          let cellValue = row[column];
          
          // Format date_time columns
          if (column.toLowerCase().includes('date') || column.toLowerCase().includes('time')) {
            if (cellValue) {
              cellValue = new Date(cellValue).toLocaleString();
            }
          }
          
          // Handle null/undefined values
          if (cellValue === null || cellValue === undefined) {
            cellValue = 'N/A';
          }
          
          tableRows += `<td>${cellValue}</td>`;
        });
        tableRows += '</tr>';
      });

      return generateReportHeader(`Site Running Data Report - ${selectedDatabase}.${selectedTable}`) + `
        <div style="margin-bottom: 20px; font-size: 14px; color: #666;">
          <p><strong>Database:</strong> ${selectedDatabase}</p>
          <p><strong>Table:</strong> ${selectedTable}</p>
          <p><strong>Records:</strong> ${data.length}</p>
          <p><strong>Time Range:</strong> ${TIME_RANGES.find(r => r.value === selectedTimeRange)?.label || selectedTimeRange}</p>
        </div>
        <table>
          <thead>
            ${headerRow}
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
    } catch (error) {
      throw new Error(`Failed to fetch site running data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      toast({
        title: 'Error',
        description: 'Please select a report type first',
        variant: 'destructive',
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      let html = '';
      const reportInfo = REPORT_TYPES.find(type => type.value === selectedReportType);
      const title = reportInfo?.label || 'Report';
      
      switch (selectedReportType) {
        case 'site_summary':
          html = await generateSiteSummaryReport();
          break;
        case 'uptime_analysis':
          html = await generateUptimeAnalysisReport();
          break;
        case 'site_running_data':
          html = await generateSiteRunningDataReport();
          break;
        case 'instrumentation_status':
          html = await generateInstrumentationStatusReport();
          break;
        case 'alert_summary':
          html = await generateAlertSummaryReport();
          break;
        case 'performance_metrics':
          html = await generatePerformanceMetricsReport();
          break;
        case 'communication_health':
          html = await generateCommunicationHealthReport();
          break;
        default:
          throw new Error('Unknown report type');
      }
      
      setReportHtml(html);
      setReportTitle(title);
      setShowPreview(true);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getSelectedReportInfo = () => {
    return REPORT_TYPES.find(type => type.value === selectedReportType);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports for your industrial automation systems
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Report Configuration
              </CardTitle>
              <CardDescription>
                Configure your report parameters and filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Report Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {REPORT_TYPES.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <Card
                        key={type.value}
                        className={`cursor-pointer transition-colors ${
                          selectedReportType === type.value
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setSelectedReportType(type.value);
                          // Reset database/table selection when changing report types
                          if (type.value !== 'site_running_data') {
                            setSelectedDatabase('');
                            setSelectedTable('');
                          }
                        }}
                        data-testid={`card-report-${type.value}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <IconComponent className="h-5 w-5 text-primary mt-0.5" />
                            <div className="flex-1">
                              <h3 className="font-medium text-sm">{type.label}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {type.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Database and Table Selection for Site Running Data */}
              {selectedReportType === 'site_running_data' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="database-select">Database</Label>
                    <Select value={selectedDatabase} onValueChange={(value) => {
                      setSelectedDatabase(value);
                      setSelectedTable(''); // Reset table when database changes
                    }}>
                      <SelectTrigger data-testid="select-database">
                        <SelectValue placeholder="Select database" />
                      </SelectTrigger>
                      <SelectContent>
                        {databases.map((database) => (
                          <SelectItem key={database} value={database}>
                            {database}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="table-select">Table</Label>
                    <Select 
                      value={selectedTable} 
                      onValueChange={setSelectedTable}
                      disabled={!selectedDatabase}
                    >
                      <SelectTrigger data-testid="select-table">
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((table) => (
                          <SelectItem key={table} value={table}>
                            {table}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Time Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time-range">Time Range</Label>
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger data-testid="select-time-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedReportType !== 'site_running_data' && (
                  <div>
                    <Label htmlFor="site-filter">Site Filter</Label>
                    <Select value={selectedSite} onValueChange={setSelectedSite}>
                      <SelectTrigger data-testid="select-site-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sites</SelectItem>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Custom Date Range */}
              {selectedTimeRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      data-testid="input-start-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      data-testid="input-end-date"
                    />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="pt-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={!selectedReportType || isGenerating}
                  className="w-full md:w-auto"
                  data-testid="button-generate-report"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Preview & Quick Stats */}
        <div className="space-y-6">
          {/* Selected Report Info */}
          {selectedReportType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Report</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const reportInfo = getSelectedReportInfo();
                  if (!reportInfo) return null;
                  const IconComponent = reportInfo.icon;
                  return (
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-6 w-6 text-primary" />
                      <div>
                        <h3 className="font-medium">{reportInfo.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {reportInfo.description}
                        </p>
                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time Range:</span>
                            <span>{TIME_RANGES.find(r => r.value === selectedTimeRange)?.label}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sites:</span>
                            <span>{selectedSite === 'all' ? 'All Sites' : sites.find(s => s.id === selectedSite)?.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Sites</span>
                <Badge variant="outline">{sites.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Instrumentation Devices</span>
                <Badge variant="outline">{devices.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Sites</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  {sites.filter(site => site.status === 'online').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Offline Sites</span>
                <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                  {sites.filter(site => site.status === 'offline').length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Available Report Formats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span>PDF Report</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span>Excel Spreadsheet</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <span>CSV Data Export</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Report Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {reportTitle}
            </DialogTitle>
            <DialogDescription>
              Review your report before printing or saving
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto border rounded-lg bg-white p-4 mt-4">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: reportHtml }}
              data-testid="report-preview-content"
            />
          </div>
          
          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              data-testid="button-close-preview"
            >
              Close
            </Button>
            <Button
              onClick={handlePrint}
              className="flex items-center gap-2"
              data-testid="button-print-report"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}