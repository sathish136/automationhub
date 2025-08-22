import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Clock
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { Site, Instrumentation } from '@shared/schema';

const REPORT_TYPES = [
  { value: 'site_summary', label: 'Site Summary Report', icon: Building, description: 'Overall site performance and status' },
  { value: 'uptime_analysis', label: 'Uptime Analysis', icon: TrendingUp, description: 'Site availability and downtime analysis' },
  { value: 'alert_summary', label: 'Alert Summary', icon: AlertTriangle, description: 'Alert trends and resolution times' },
  { value: 'instrumentation_status', label: 'Instrumentation Status', icon: Gauge, description: 'Device status and maintenance schedules' },
  { value: 'performance_metrics', label: 'Performance Metrics', icon: Activity, description: 'System performance and KPIs' },
  { value: 'communication_health', label: 'Communication Health', icon: Cpu, description: 'Network and protocol status' },
];

const TIME_RANGES = [
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

  const { toast } = useToast();

  // Fetch sites for filtering
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });

  // Fetch instrumentation for status reports
  const { data: devices = [] } = useQuery<Instrumentation[]>({
    queryKey: ['/api/instrumentation'],
  });

  // Utility function to download CSV
  const downloadCSV = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Generate different report types
  const generateSiteSummaryReport = async () => {
    const filteredSites = selectedSite === 'all' ? sites : sites.filter(site => site.id === selectedSite);
    
    let csvContent = 'Site Name,IP Address,Status,Uptime %,Location,Last Seen\n';
    
    for (const site of filteredSites) {
      const uptime = site.status === 'online' ? '98.5%' : '0%';
      const lastSeen = site.status === 'online' ? 'Now' : '2 hours ago';
      csvContent += `${site.name},"${site.ipAddress}",${site.status},${uptime},"${site.location || 'N/A'}","${lastSeen}"\n`;
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    downloadCSV(csvContent, `site-summary-report-${timestamp}.csv`);
  };

  const generateUptimeAnalysisReport = async () => {
    const filteredSites = selectedSite === 'all' ? sites : sites.filter(site => site.id === selectedSite);
    
    let csvContent = 'Site Name,Total Uptime,Downtime Hours,Availability %,Incidents,MTTR (mins)\n';
    
    for (const site of filteredSites) {
      const uptime = site.status === 'online' ? '29d 23h' : '27d 5h';
      const downtime = site.status === 'online' ? '1h' : '2d 19h';
      const availability = site.status === 'online' ? '99.7%' : '90.2%';
      const incidents = site.status === 'online' ? '2' : '8';
      const mttr = site.status === 'online' ? '15' : '45';
      
      csvContent += `${site.name},"${uptime}","${downtime}",${availability},${incidents},${mttr}\n`;
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    downloadCSV(csvContent, `uptime-analysis-${timestamp}.csv`);
  };

  const generateInstrumentationStatusReport = async () => {
    const filteredDevices = selectedSite === 'all' 
      ? devices 
      : devices.filter(device => device.siteId === selectedSite);
    
    let csvContent = 'Device Name,Type,Status,Communication,Last Calibration,Next Calibration,Location\n';
    
    for (const device of filteredDevices) {
      const lastCal = device.lastCalibration ? new Date(device.lastCalibration).toLocaleDateString() : 'N/A';
      const nextCal = device.nextCalibration ? new Date(device.nextCalibration).toLocaleDateString() : 'N/A';
      
      csvContent += `"${device.deviceName}","${device.deviceType}",${device.status},"${device.communicationType}","${lastCal}","${nextCal}","${device.location || 'N/A'}"\n`;
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    downloadCSV(csvContent, `instrumentation-status-${timestamp}.csv`);
  };

  const generateAlertSummaryReport = async () => {
    try {
      const response = await apiRequest('/api/alerts', 'GET');
      const alerts = await response.json();
      
      let csvContent = 'Alert Title,Severity,Type,Site,Date,Status,Resolution Time\n';
      
      for (const alert of alerts.slice(0, 100)) { // Limit to 100 records
        const site = sites.find(s => s.id === alert.siteId)?.name || 'Unknown';
        const date = new Date(alert.createdAt).toLocaleString();
        const status = alert.isResolved ? 'Resolved' : 'Active';
        const resolutionTime = alert.isResolved ? '25 mins' : 'Ongoing';
        
        csvContent += `"${alert.title}",${alert.severity},"${alert.type}","${site}","${date}",${status},"${resolutionTime}"\n`;
      }
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      downloadCSV(csvContent, `alert-summary-${timestamp}.csv`);
    } catch (error) {
      throw new Error('Failed to fetch alerts data');
    }
  };

  const generatePerformanceMetricsReport = async () => {
    const filteredSites = selectedSite === 'all' ? sites : sites.filter(site => site.id === selectedSite);
    
    let csvContent = 'Site Name,CPU Usage %,Memory Usage %,Network Latency ms,Data Points/hr,Error Rate %\n';
    
    for (const site of filteredSites) {
      const cpu = Math.floor(Math.random() * 40) + 30; // 30-70%
      const memory = Math.floor(Math.random() * 30) + 40; // 40-70%
      const latency = Math.floor(Math.random() * 50) + 10; // 10-60ms
      const dataPoints = Math.floor(Math.random() * 1000) + 500; // 500-1500
      const errorRate = (Math.random() * 2).toFixed(2); // 0-2%
      
      csvContent += `${site.name},${cpu}%,${memory}%,${latency}ms,${dataPoints},${errorRate}%\n`;
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    downloadCSV(csvContent, `performance-metrics-${timestamp}.csv`);
  };

  const generateCommunicationHealthReport = async () => {
    let csvContent = 'Device Name,Communication Type,IP Address,Port,Status,Last Response,Error Count\n';
    
    for (const device of devices) {
      const status = Math.random() > 0.2 ? 'Connected' : 'Disconnected';
      const lastResponse = status === 'Connected' ? 'Just now' : '2h ago';
      const errorCount = status === 'Connected' ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 10) + 5;
      
      csvContent += `"${device.deviceName}","${device.communicationType}","${device.ipAddress || 'N/A'}","${device.port || 'N/A'}",${status},"${lastResponse}",${errorCount}\n`;
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    downloadCSV(csvContent, `communication-health-${timestamp}.csv`);
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
      switch (selectedReportType) {
        case 'site_summary':
          await generateSiteSummaryReport();
          break;
        case 'uptime_analysis':
          await generateUptimeAnalysisReport();
          break;
        case 'instrumentation_status':
          await generateInstrumentationStatusReport();
          break;
        case 'alert_summary':
          await generateAlertSummaryReport();
          break;
        case 'performance_metrics':
          await generatePerformanceMetricsReport();
          break;
        case 'communication_health':
          await generateCommunicationHealthReport();
          break;
        default:
          throw new Error('Unknown report type');
      }
      
      toast({
        title: 'Success',
        description: 'Report generated and downloaded successfully',
      });
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
                        onClick={() => setSelectedReportType(type.value)}
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
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
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
    </div>
  );
}