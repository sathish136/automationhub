import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

  // Fetch sites for filtering
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });

  // Fetch instrumentation for status reports
  const { data: devices = [] } = useQuery<Instrumentation[]>({
    queryKey: ['/api/instrumentation'],
  });

  const handleGenerateReport = async () => {
    if (!selectedReportType) return;
    
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      // Here you would typically generate and download the actual report
      console.log('Report generated:', {
        type: selectedReportType,
        timeRange: selectedTimeRange,
        site: selectedSite,
        customDates: selectedTimeRange === 'custom' ? { start: customStartDate, end: customEndDate } : null
      });
    }, 2000);
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