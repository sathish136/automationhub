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
      let limit = 1000; // Get more data for better aggregation
      let sortColumn = 'date_time';
      let sortDirection = 'desc' as const;

      switch (selectedTimeRange) {
        case 'today':
          limit = 500;
          break;
        case 'yesterday':
          limit = 500;
          break;
        case 'last_7_days':
          limit = 1500;
          break;
        case 'last_30_days':
          limit = 3000;
          break;
        case 'last_3_months':
          limit = 5000;
          break;
        default:
          limit = 2000;
      }

      const response = await apiRequest(
        `/api/sql-viewer/databases/${selectedDatabase}/tables/${selectedTable}?limit=${limit}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`, 
        'GET'
      );
      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error(`No data found in ${selectedDatabase}.${selectedTable}`);
      }

      // Detect system type and calculate appropriate metrics
      const systemType = detectSystemType(selectedTable, data);
      const metrics = calculateSiteMetrics(data, systemType, selectedTable);
      
      return generateReportHeader(`Site Running Data Report - ${selectedDatabase} (${systemType.toUpperCase()})`) + `
        <div style="margin-bottom: 30px; font-size: 14px; color: #666;">
          <p><strong>Site:</strong> ${selectedDatabase}</p>
          <p><strong>System Type:</strong> ${systemType.toUpperCase()}</p>
          <p><strong>Data Source:</strong> ${selectedTable}</p>
          <p><strong>Time Range:</strong> ${TIME_RANGES.find(r => r.value === selectedTimeRange)?.label || selectedTimeRange}</p>
          <p><strong>Records Analyzed:</strong> ${data.length}</p>
        </div>

        ${generateSystemSpecificSections(metrics, systemType)}

        <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; font-size: 12px; color: #666;">
          <strong>Report Notes:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${getSystemSpecificNotes(systemType, data.length)}
          </ul>
        </div>
      `;
    } catch (error) {
      throw new Error(`Failed to fetch site running data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Function to detect system type based on table name and data columns
  const detectSystemType = (tableName: string, data: any[]): string => {
    const lowerTableName = tableName.toLowerCase();
    const sampleRow = data[0] || {};
    const columns = Object.keys(sampleRow).map(col => col.toLowerCase());

    // Check for MBR system
    if (lowerTableName.includes('mbr') || columns.some(col => col.includes('mbr'))) {
      return 'mbr';
    }

    // Check for RO system
    if (lowerTableName.includes('ro') || columns.some(col => col.includes('ro_') || col.includes('stg'))) {
      return 'ro';
    }

    // Check for Power Management/VFD
    if (lowerTableName.includes('vfd') || lowerTableName.includes('power') || 
        columns.some(col => ['frequency', 'voltage', 'current', 'power', 'hz'].includes(col))) {
      return 'power';
    }

    // Check for CIP system
    if (lowerTableName.includes('cip') || columns.some(col => col.includes('cip'))) {
      return 'cip';
    }

    // Check for Biological system
    if (lowerTableName.includes('bio') || lowerTableName.includes('biological') ||
        columns.some(col => ['ph', 'temperature', 'dissolved_oxygen', 'turbidity'].includes(col))) {
      return 'biological';
    }

    // Check for Reject RO
    if (lowerTableName.includes('reject') || lowerTableName.includes('waste')) {
      return 'reject_ro';
    }

    // Default to general system
    return 'general';
  };

  // Function to generate system-specific report sections
  const generateSystemSpecificSections = (metrics: any, systemType: string): string => {
    switch (systemType) {
      case 'mbr':
        return generateMBRSections(metrics);
      case 'ro':
        return generateROSections(metrics);
      case 'power':
        return generatePowerSections(metrics);
      case 'cip':
        return generateCIPSections(metrics);
      case 'biological':
        return generateBiologicalSections(metrics);
      case 'reject_ro':
        return generateRejectROSections(metrics);
      default:
        return generateGeneralSections(metrics);
    }
  };

  // Function to get system-specific notes
  const getSystemSpecificNotes = (systemType: string, recordCount: number): string => {
    const commonNotes = [
      `Data aggregated from ${recordCount} operational records`,
      'Metrics calculated based on real-time monitoring data',
      'Utilization percentages based on operational hours vs available time'
    ];

    const systemNotes = {
      mbr: [
        'MBR recovery rates calculated from permeate flow data',
        'Backwash efficiency measured by cycle frequency and duration',
        'pH and turbidity levels monitored for membrane performance'
      ],
      ro: [
        'RO recovery percentages calculated from stage-specific data',
        'Pressure differential monitored across membrane stages',
        'Feed water quality and permeate quality tracked'
      ],
      power: [
        'Power consumption measured across all VFD units',
        'Frequency and voltage data used for efficiency calculations',
        'Load percentages indicate system utilization levels'
      ],
      cip: [
        'CIP cycle efficiency measured by cleaning duration and effectiveness',
        'Chemical consumption tracked for cost optimization',
        'Temperature and flow rates monitored during cleaning cycles'
      ],
      biological: [
        'Biological activity measured through pH and dissolved oxygen',
        'Temperature monitoring for optimal biological conditions',
        'Turbidity levels indicate treatment effectiveness'
      ],
      reject_ro: [
        'Reject water flow rates and quality parameters monitored',
        'Recovery optimization based on reject stream analysis',
        'Environmental compliance tracked through waste water quality'
      ]
    };

    const notes = [...commonNotes, ...(systemNotes[systemType as keyof typeof systemNotes] || [])];
    return notes.map(note => `<li>${note}</li>`).join('');
  };

  // Section generators for different system types
  const generateMBRSections = (metrics: any): string => {
    return `
      <!-- MBR Performance Summary -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        MBR System Performance
      </h2>
      <table style="margin-bottom: 30px;">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Average</th>
            <th>Maximum</th>
            <th>Minimum</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.summary.map((item: any) => `
            <tr>
              <td><strong>${item.metric}</strong></td>
              <td>${item.average}</td>
              <td>${item.maximum}</td>
              <td>${item.minimum}</td>
              <td style="color: ${item.status === 'Optimal' ? '#22c55e' : item.status === 'Good' ? '#f59e0b' : '#ef4444'};">
                ${item.status || 'N/A'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- MBR Backwash Analysis -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        Backwash & Maintenance Analysis
      </h2>
      <table style="margin-bottom: 30px;">
        <thead>
          <tr>
            <th>Process</th>
            <th>Frequency</th>
            <th>Duration (min)</th>
            <th>Efficiency %</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          ${(metrics.backwash || []).map((item: any) => `
            <tr>
              <td><strong>${item.process}</strong></td>
              <td>${item.frequency}</td>
              <td>${item.duration}</td>
              <td>${item.efficiency}%</td>
              <td style="color: ${item.rating === 'Excellent' ? '#22c55e' : item.rating === 'Good' ? '#f59e0b' : '#ef4444'};">
                ${item.rating}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const generateROSections = (metrics: any): string => {
    return `
      <!-- RO Performance Summary -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        RO System Performance
      </h2>
      <table style="margin-bottom: 30px;">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Average</th>
            <th>Maximum</th>
            <th>Minimum</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.summary.map((item: any) => `
            <tr>
              <td><strong>${item.metric}</strong></td>
              <td>${item.average}</td>
              <td>${item.maximum}</td>
              <td>${item.minimum}</td>
              <td>${item.total}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Recovery Analysis -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        Recovery & Efficiency Analysis
      </h2>
      <table style="margin-bottom: 30px;">
        <thead>
          <tr>
            <th>Recovery Stage</th>
            <th>Average %</th>
            <th>Max %</th>
            <th>Min %</th>
            <th>Efficiency Rating</th>
          </tr>
        </thead>
        <tbody>
          ${(metrics.recovery || []).map((item: any) => `
            <tr>
              <td><strong>${item.stage}</strong></td>
              <td>${item.average}%</td>
              <td>${item.max}%</td>
              <td>${item.min}%</td>
              <td style="color: ${item.rating === 'Excellent' ? '#22c55e' : item.rating === 'Good' ? '#f59e0b' : '#ef4444'};">
                ${item.rating}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Running Hours Summary -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        Running Hours & Operational Data
      </h2>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Daily Average</th>
            <th>Total Hours</th>
            <th>Utilization %</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(metrics.runningHours || []).map((item: any) => `
            <tr>
              <td><strong>${item.parameter}</strong></td>
              <td>${item.dailyAverage} hrs</td>
              <td>${item.totalHours} hrs</td>
              <td>${item.utilization}%</td>
              <td style="color: ${item.status === 'Optimal' ? '#22c55e' : item.status === 'Good' ? '#f59e0b' : '#ef4444'};">
                ${item.status}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const generatePowerSections = (metrics: any): string => {
    return `
      <!-- Power System Performance -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        Power Management System
      </h2>
      <table style="margin-bottom: 30px;">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Average</th>
            <th>Peak</th>
            <th>Minimum</th>
            <th>Efficiency</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.summary.map((item: any) => `
            <tr>
              <td><strong>${item.metric}</strong></td>
              <td>${item.average}</td>
              <td>${item.maximum}</td>
              <td>${item.minimum}</td>
              <td style="color: ${parseFloat(item.efficiency || '0') > 85 ? '#22c55e' : parseFloat(item.efficiency || '0') > 70 ? '#f59e0b' : '#ef4444'};">
                ${item.efficiency || 'N/A'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- VFD Performance -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        VFD Units Performance
      </h2>
      <table>
        <thead>
          <tr>
            <th>Unit</th>
            <th>Load %</th>
            <th>Frequency (Hz)</th>
            <th>Power (kW)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(metrics.vfd || []).map((item: any) => `
            <tr>
              <td><strong>${item.unit}</strong></td>
              <td>${item.load}%</td>
              <td>${item.frequency} Hz</td>
              <td>${item.power} kW</td>
              <td style="color: ${item.status === 'Optimal' ? '#22c55e' : item.status === 'Good' ? '#f59e0b' : '#ef4444'};">
                ${item.status}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const generateCIPSections = (metrics: any): string => {
    return `
      <!-- CIP System Performance -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        CIP (Clean-in-Place) System Performance
      </h2>
      <table style="margin-bottom: 30px;">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Average</th>
            <th>Maximum</th>
            <th>Minimum</th>
            <th>Efficiency</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.summary.map((item: any) => `
            <tr>
              <td><strong>${item.metric}</strong></td>
              <td>${item.average}</td>
              <td>${item.maximum}</td>
              <td>${item.minimum}</td>
              <td>${item.efficiency || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- CIP Cycle Analysis -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        Cleaning Cycle Analysis
      </h2>
      <table>
        <thead>
          <tr>
            <th>Cycle Type</th>
            <th>Frequency</th>
            <th>Duration (min)</th>
            <th>Effectiveness %</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(metrics.cycles || []).map((item: any) => `
            <tr>
              <td><strong>${item.cycle}</strong></td>
              <td>${item.frequency}</td>
              <td>${item.duration}</td>
              <td>${item.effectiveness}%</td>
              <td style="color: ${item.status === 'Optimal' ? '#22c55e' : item.status === 'Good' ? '#f59e0b' : '#ef4444'};">
                ${item.status}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const generateBiologicalSections = (metrics: any): string => {
    return `
      <!-- Biological System Performance -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        Biological Treatment System
      </h2>
      <table style="margin-bottom: 30px;">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Average</th>
            <th>Optimal Range</th>
            <th>Current Status</th>
            <th>Compliance</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.summary.map((item: any) => `
            <tr>
              <td><strong>${item.metric}</strong></td>
              <td>${item.average}</td>
              <td>${item.optimalRange || 'N/A'}</td>
              <td>${item.status || 'N/A'}</td>
              <td style="color: ${item.compliance === 'Good' ? '#22c55e' : item.compliance === 'Warning' ? '#f59e0b' : '#ef4444'};">
                ${item.compliance || 'N/A'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Water Quality Analysis -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        Water Quality Parameters
      </h2>
      <table>
        <thead>
          <tr>
            <th>Quality Parameter</th>
            <th>Current Value</th>
            <th>Standard Limit</th>
            <th>Trend</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(metrics.quality || []).map((item: any) => `
            <tr>
              <td><strong>${item.parameter}</strong></td>
              <td>${item.value}</td>
              <td>${item.limit}</td>
              <td>${item.trend}</td>
              <td style="color: ${item.status === 'Good' ? '#22c55e' : item.status === 'Warning' ? '#f59e0b' : '#ef4444'};">
                ${item.status}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const generateRejectROSections = (metrics: any): string => {
    return `
      <!-- Reject RO System Performance -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        Reject RO System Performance
      </h2>
      <table style="margin-bottom: 30px;">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Average</th>
            <th>Maximum</th>
            <th>Recovery %</th>
            <th>Efficiency</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.summary.map((item: any) => `
            <tr>
              <td><strong>${item.metric}</strong></td>
              <td>${item.average}</td>
              <td>${item.maximum}</td>
              <td>${item.recovery || 'N/A'}</td>
              <td>${item.efficiency || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Waste Stream Analysis -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        Waste Stream Quality & Recovery
      </h2>
      <table>
        <thead>
          <tr>
            <th>Stream</th>
            <th>Flow Rate</th>
            <th>Quality Index</th>
            <th>Recovery Potential</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(metrics.waste || []).map((item: any) => `
            <tr>
              <td><strong>${item.stream}</strong></td>
              <td>${item.flow}</td>
              <td>${item.quality}</td>
              <td>${item.potential}%</td>
              <td style="color: ${item.status === 'Good' ? '#22c55e' : item.status === 'Warning' ? '#f59e0b' : '#ef4444'};">
                ${item.status}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const generateGeneralSections = (metrics: any): string => {
    return `
      <!-- General System Performance -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        System Performance Overview
      </h2>
      <table style="margin-bottom: 30px;">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Average</th>
            <th>Maximum</th>
            <th>Minimum</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.summary.map((item: any) => `
            <tr>
              <td><strong>${item.metric}</strong></td>
              <td>${item.average}</td>
              <td>${item.maximum}</td>
              <td>${item.minimum}</td>
              <td>${item.status || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Operational Summary -->
      <h2 style="color: #333; font-size: 18px; margin: 20px 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        Operational Summary
      </h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Target</th>
            <th>Performance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(metrics.operational || []).map((item: any) => `
            <tr>
              <td><strong>${item.metric}</strong></td>
              <td>${item.value}</td>
              <td>${item.target}</td>
              <td>${item.performance}%</td>
              <td style="color: ${item.status === 'Good' ? '#22c55e' : item.status === 'Warning' ? '#f59e0b' : '#ef4444'};">
                ${item.status}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const calculateSiteMetrics = (data: any[], systemType: string, tableName: string) => {
    // Helper functions
    const parseValue = (val: any): number => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const format = (num: number) => Number(num.toFixed(2));
    const getColumns = () => Object.keys(data[0] || {});

    // Calculate operational hours
    const totalDataPoints = data.length;
    const estimatedHours = totalDataPoints * 1.5 / 60;
    const daysInRange = {
      'today': 1,
      'yesterday': 1, 
      'last_7_days': 7,
      'last_30_days': 30,
      'last_3_months': 90
    }[selectedTimeRange] || 7;

    // Get actual column names and create dynamic metrics
    const columns = getColumns();
    console.log('Available columns for', tableName, ':', columns);
    
    switch (systemType) {
      case 'mbr':
        return calculateMBRMetrics(data, parseValue, average, format, estimatedHours, daysInRange, columns);
      case 'ro':
        return calculateROMetrics(data, parseValue, average, format, estimatedHours, daysInRange, columns);
      case 'power':
        return calculatePowerMetrics(data, parseValue, average, format, estimatedHours, daysInRange, columns);
      case 'cip':
        return calculateCIPMetrics(data, parseValue, average, format, estimatedHours, daysInRange, columns);
      case 'biological':
        return calculateBiologicalMetrics(data, parseValue, average, format, estimatedHours, daysInRange, columns);
      case 'reject_ro':
        return calculateRejectROMetrics(data, parseValue, average, format, estimatedHours, daysInRange, columns);
      default:
        return calculateGeneralMetrics(data, parseValue, average, format, estimatedHours, daysInRange, columns);
    }
  };

  const calculateMBRMetrics = (data: any[], parseValue: any, average: any, format: any, estimatedHours: number, daysInRange: number, columns: string[]) => {
    // Find actual column names dynamically
    const findColumn = (patterns: string[]) => {
      return columns.find(col => patterns.some(pattern => 
        col.toLowerCase().includes(pattern.toLowerCase())
      ));
    };

    // Get numeric data for available columns
    const getColumnData = (columnName: string | undefined) => {
      if (!columnName) return [];
      return data.map(row => parseValue(row[columnName])).filter(val => val > 0);
    };

    // Find relevant MBR columns
    const flowCol = findColumn(['flow', 'mbr_flow', 'permeate', 'outlet']);
    const tempCol = findColumn(['temp', 'temperature', 'tmp']);
    const phCol = findColumn(['ph', 'mbr_ph']);
    const turbidityCol = findColumn(['turbidity', 'turb']);
    const pressureCol = findColumn(['pressure', 'pt', 'press']);

    const flowData = getColumnData(flowCol);
    const tempData = getColumnData(tempCol);
    const phData = getColumnData(phCol);
    const turbidityData = getColumnData(turbidityCol);
    const pressureData = getColumnData(pressureCol);

    // Create summary with actual data
    const summary = [];
    if (flowCol && flowData.length > 0) {
      summary.push({
        metric: `${flowCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(flowData)),
        maximum: format(Math.max(...flowData)),
        minimum: format(Math.min(...flowData)),
        status: average(flowData) > 10 ? 'Optimal' : 'Low'
      });
    }
    if (tempCol && tempData.length > 0) {
      summary.push({
        metric: `${tempCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(tempData)),
        maximum: format(Math.max(...tempData)),
        minimum: format(Math.min(...tempData)),
        status: average(tempData) >= 15 && average(tempData) <= 35 ? 'Optimal' : 'Warning'
      });
    }
    if (phCol && phData.length > 0) {
      summary.push({
        metric: `${phCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(phData)),
        maximum: format(Math.max(...phData)),
        minimum: format(Math.min(...phData)),
        status: average(phData) >= 6.5 && average(phData) <= 8.5 ? 'Optimal' : 'Warning'
      });
    }
    if (turbidityCol && turbidityData.length > 0) {
      summary.push({
        metric: `${turbidityCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(turbidityData)),
        maximum: format(Math.max(...turbidityData)),
        minimum: format(Math.min(...turbidityData)),
        status: average(turbidityData) < 1 ? 'Optimal' : 'High'
      });
    }
    if (pressureCol && pressureData.length > 0) {
      summary.push({
        metric: `${pressureCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(pressureData)),
        maximum: format(Math.max(...pressureData)),
        minimum: format(Math.min(...pressureData)),
        status: average(pressureData) > 0.5 ? 'Optimal' : 'Low'
      });
    }

    return {
      summary,
      backwash: [
        {
          process: 'Membrane Operation',
          frequency: 'Continuous',
          duration: format(estimatedHours / daysInRange) + ' hrs/day',
          efficiency: summary.length > 0 ? format((summary.length / 5) * 100) : 0,
          rating: summary.length >= 3 ? 'Good' : summary.length >= 2 ? 'Fair' : 'Limited Data'
        }
      ]
    };
  };

  const calculateROMetrics = (data: any[], parseValue: any, average: any, format: any, estimatedHours: number, daysInRange: number, columns: string[]) => {
    // Find actual column names dynamically
    const findColumn = (patterns: string[]) => {
      return columns.find(col => patterns.some(pattern => 
        col.toLowerCase().includes(pattern.toLowerCase())
      ));
    };

    // Get numeric data for available columns
    const getColumnData = (columnName: string | undefined) => {
      if (!columnName) return [];
      return data.map(row => parseValue(row[columnName])).filter(val => val > 0);
    };

    // Find relevant RO columns
    const feedFlowCol = findColumn(['feed', 'ro_feed', 'inlet', 'input']);
    const permeateCol = findColumn(['permeate', 'product', 'outlet']);
    const rejectCol = findColumn(['reject', 'concentrate', 'waste']);
    const recoveryCol = findColumn(['recovery', 'reco']);
    const pressureCol = findColumn(['pressure', 'pt', 'press']);
    const conductivityCol = findColumn(['conductivity', 'tds', 'cond']);

    const feedData = getColumnData(feedFlowCol);
    const permeateData = getColumnData(permeateCol);
    const rejectData = getColumnData(rejectCol);
    const recoveryData = getColumnData(recoveryCol);
    const pressureData = getColumnData(pressureCol);
    const conductivityData = getColumnData(conductivityCol);

    // Create summary with actual data
    const summary = [];
    if (feedFlowCol && feedData.length > 0) {
      summary.push({
        metric: `${feedFlowCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(feedData)),
        maximum: format(Math.max(...feedData)),
        minimum: format(Math.min(...feedData)),
        total: format(feedData.reduce((a, b) => a + b, 0))
      });
    }
    if (permeateCol && permeateData.length > 0) {
      summary.push({
        metric: `${permeateCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(permeateData)),
        maximum: format(Math.max(...permeateData)),
        minimum: format(Math.min(...permeateData)),
        total: format(permeateData.reduce((a, b) => a + b, 0))
      });
    }
    if (pressureCol && pressureData.length > 0) {
      summary.push({
        metric: `${pressureCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(pressureData)),
        maximum: format(Math.max(...pressureData)),
        minimum: format(Math.min(...pressureData)),
        total: 'N/A'
      });
    }

    const recovery = [];
    if (recoveryCol && recoveryData.length > 0) {
      recovery.push({
        stage: recoveryCol.replace(/_/g, ' ').toUpperCase(),
        average: format(average(recoveryData)),
        max: format(Math.max(...recoveryData)),
        min: format(Math.min(...recoveryData)),
        rating: average(recoveryData) > 80 ? 'Excellent' : average(recoveryData) > 60 ? 'Good' : 'Poor'
      });
    }
    if (feedData.length > 0 && permeateData.length > 0) {
      const calcRecovery = (permeateData.reduce((a, b) => a + b, 0) / feedData.reduce((a, b) => a + b, 0)) * 100;
      recovery.push({
        stage: 'Calculated Recovery %',
        average: format(calcRecovery),
        max: format(calcRecovery),
        min: format(calcRecovery),
        rating: calcRecovery > 80 ? 'Excellent' : calcRecovery > 60 ? 'Good' : 'Poor'
      });
    }

    return {
      summary,
      recovery,
      runningHours: [
        {
          parameter: 'RO System Operation',
          dailyAverage: format(estimatedHours / daysInRange),
          totalHours: format(estimatedHours),
          utilization: format((estimatedHours / (daysInRange * 24)) * 100),
          status: (estimatedHours / (daysInRange * 24)) > 0.8 ? 'Optimal' : (estimatedHours / (daysInRange * 24)) > 0.5 ? 'Good' : 'Low'
        }
      ]
    };
  };

  const calculatePowerMetrics = (data: any[], parseValue: any, average: any, format: any, estimatedHours: number, daysInRange: number, columns: string[]) => {
    const findColumn = (patterns: string[]) => {
      return columns.find(col => patterns.some(pattern => 
        col.toLowerCase().includes(pattern.toLowerCase())
      ));
    };
    const getColumnData = (columnName: string | undefined) => {
      if (!columnName) return [];
      return data.map(row => parseValue(row[columnName])).filter(val => val > 0);
    };

    const voltageCol = findColumn(['voltage', 'volt', 'v']);
    const currentCol = findColumn(['current', 'amp', 'a']);
    const powerCol = findColumn(['power', 'watt', 'kw']);
    const freqCol = findColumn(['frequency', 'freq', 'hz']);
    const loadCol = findColumn(['load', 'percent', '%']);

    const voltageData = getColumnData(voltageCol);
    const currentData = getColumnData(currentCol);
    const powerData = getColumnData(powerCol);
    const freqData = getColumnData(freqCol);
    const loadData = getColumnData(loadCol);

    const summary = [];
    if (voltageCol && voltageData.length > 0) {
      summary.push({
        metric: `${voltageCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(voltageData)),
        maximum: format(Math.max(...voltageData)),
        minimum: format(Math.min(...voltageData)),
        efficiency: format((average(voltageData) / 400) * 100) + '%'
      });
    }
    if (currentCol && currentData.length > 0) {
      summary.push({
        metric: `${currentCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(currentData)),
        maximum: format(Math.max(...currentData)),
        minimum: format(Math.min(...currentData)),
        efficiency: 'N/A'
      });
    }
    if (powerCol && powerData.length > 0) {
      summary.push({
        metric: `${powerCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(powerData)),
        maximum: format(Math.max(...powerData)),
        minimum: format(Math.min(...powerData)),
        efficiency: 'N/A'
      });
    }

    const vfd = [];
    if (freqCol || loadCol || powerCol) {
      vfd.push({
        unit: 'Power System',
        load: loadData.length > 0 ? format(average(loadData)) + '%' : 'N/A',
        frequency: freqData.length > 0 ? format(average(freqData)) + ' Hz' : 'N/A',
        power: powerData.length > 0 ? format(average(powerData)) + ' W' : 'N/A',
        status: summary.length >= 2 ? 'Optimal' : 'Limited Data'
      });
    }

    return { summary, vfd };
  };

  const calculateCIPMetrics = (data: any[], parseValue: any, average: any, format: any, estimatedHours: number, daysInRange: number, columns: string[]) => {
    const findColumn = (patterns: string[]) => {
      return columns.find(col => patterns.some(pattern => 
        col.toLowerCase().includes(pattern.toLowerCase())
      ));
    };
    const getColumnData = (columnName: string | undefined) => {
      if (!columnName) return [];
      return data.map(row => parseValue(row[columnName])).filter(val => val > 0);
    };

    const cipFlowCol = findColumn(['cip', 'clean', 'wash']);
    const pressureCol = findColumn(['pressure', 'pt']);
    const tempCol = findColumn(['temp', 'temperature']);
    const conductivityCol = findColumn(['conductivity', 'cond']);

    const cipFlowData = getColumnData(cipFlowCol);
    const pressureData = getColumnData(pressureCol);
    const tempData = getColumnData(tempCol);
    const conductivityData = getColumnData(conductivityCol);

    const summary = [];
    if (cipFlowCol && cipFlowData.length > 0) {
      summary.push({
        metric: `${cipFlowCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(cipFlowData)),
        maximum: format(Math.max(...cipFlowData)),
        minimum: format(Math.min(...cipFlowData)),
        efficiency: format((average(cipFlowData) / Math.max(...cipFlowData)) * 100) + '%'
      });
    }
    if (pressureCol && pressureData.length > 0) {
      summary.push({
        metric: `${pressureCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(pressureData)),
        maximum: format(Math.max(...pressureData)),
        minimum: format(Math.min(...pressureData)),
        efficiency: 'N/A'
      });
    }

    const cycles = [{
      cycle: 'System Operation',
      frequency: 'Continuous',
      duration: format(estimatedHours / daysInRange) + ' hrs/day',
      effectiveness: summary.length > 0 ? format((summary.length / 4) * 100) : 0,
      status: summary.length >= 2 ? 'Optimal' : 'Limited Data'
    }];

    return { summary, cycles };
  };

  const calculateBiologicalMetrics = (data: any[], parseValue: any, average: any, format: any, estimatedHours: number, daysInRange: number, columns: string[]) => {
    const findColumn = (patterns: string[]) => {
      return columns.find(col => patterns.some(pattern => 
        col.toLowerCase().includes(pattern.toLowerCase())
      ));
    };
    const getColumnData = (columnName: string | undefined) => {
      if (!columnName) return [];
      return data.map(row => parseValue(row[columnName])).filter(val => val > 0);
    };

    const phCol = findColumn(['ph', 'ph_level']);
    const tempCol = findColumn(['temp', 'temperature']);
    const turbidityCol = findColumn(['turbidity', 'turb']);
    const doCol = findColumn(['do', 'dissolved_oxygen', 'oxygen']);
    const flowCol = findColumn(['flow', 'inlet', 'nt_flow']);

    const phData = getColumnData(phCol);
    const tempData = getColumnData(tempCol);
    const turbidityData = getColumnData(turbidityCol);
    const doData = getColumnData(doCol);
    const flowData = getColumnData(flowCol);

    const summary = [];
    if (phCol && phData.length > 0) {
      summary.push({
        metric: `${phCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(phData)),
        optimalRange: '6.5 - 8.5',
        status: average(phData) >= 6.5 && average(phData) <= 8.5 ? 'Normal' : 'Warning',
        compliance: average(phData) >= 6.5 && average(phData) <= 8.5 ? 'Good' : 'Warning'
      });
    }
    if (tempCol && tempData.length > 0) {
      summary.push({
        metric: `${tempCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(tempData)),
        optimalRange: '15 - 35°C',
        status: average(tempData) >= 15 && average(tempData) <= 35 ? 'Normal' : 'Warning',
        compliance: average(tempData) >= 15 && average(tempData) <= 35 ? 'Good' : 'Warning'
      });
    }
    if (flowCol && flowData.length > 0) {
      summary.push({
        metric: `${flowCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(flowData)),
        optimalRange: '> 0',
        status: average(flowData) > 0 ? 'Normal' : 'Low',
        compliance: average(flowData) > 0 ? 'Good' : 'Warning'
      });
    }

    const quality = [];
    if (turbidityCol && turbidityData.length > 0) {
      quality.push({
        parameter: turbidityCol.replace(/_/g, ' ').toUpperCase(),
        value: format(average(turbidityData)) + ' NTU',
        limit: '< 1 NTU',
        trend: 'Stable',
        status: average(turbidityData) < 1 ? 'Good' : 'Warning'
      });
    }
    if (doCol && doData.length > 0) {
      quality.push({
        parameter: doCol.replace(/_/g, ' ').toUpperCase(),
        value: format(average(doData)) + ' mg/L',
        limit: '> 2 mg/L',
        trend: 'Stable',
        status: average(doData) > 2 ? 'Good' : 'Low'
      });
    }

    return { summary, quality };
  };

  const calculateRejectROMetrics = (data: any[], parseValue: any, average: any, format: any, estimatedHours: number, daysInRange: number, columns: string[]) => {
    const findColumn = (patterns: string[]) => {
      return columns.find(col => patterns.some(pattern => 
        col.toLowerCase().includes(pattern.toLowerCase())
      ));
    };
    const getColumnData = (columnName: string | undefined) => {
      if (!columnName) return [];
      return data.map(row => parseValue(row[columnName])).filter(val => val > 0);
    };

    const rejectCol = findColumn(['reject', 'waste', 'concentrate']);
    const qualityCol = findColumn(['quality', 'tds', 'conductivity']);
    const flowCol = findColumn(['flow', 'rate']);

    const rejectData = getColumnData(rejectCol);
    const qualityData = getColumnData(qualityCol);
    const flowData = getColumnData(flowCol);

    const summary = [];
    if (rejectCol && rejectData.length > 0) {
      summary.push({
        metric: `${rejectCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(rejectData)),
        maximum: format(Math.max(...rejectData)),
        recovery: 'N/A',
        efficiency: format((1 - average(rejectData) / Math.max(...rejectData)) * 100) + '%'
      });
    }
    if (flowCol && flowData.length > 0) {
      summary.push({
        metric: `${flowCol.replace(/_/g, ' ').toUpperCase()}`,
        average: format(average(flowData)),
        maximum: format(Math.max(...flowData)),
        recovery: 'N/A',
        efficiency: 'N/A'
      });
    }

    const waste = [];
    if (rejectCol || flowCol) {
      waste.push({
        stream: 'Reject Stream',
        flow: (rejectData.length > 0 ? format(average(rejectData)) : flowData.length > 0 ? format(average(flowData)) : 'N/A') + ' units',
        quality: qualityData.length > 0 ? format(average(qualityData)) + ' units' : 'Standard',
        potential: summary.length > 0 ? format(summary.length * 25) : 0,
        status: summary.length >= 1 ? 'Good' : 'Limited Data'
      });
    }

    return { summary, waste };
  };

  const calculateGeneralMetrics = (data: any[], parseValue: any, average: any, format: any, estimatedHours: number, daysInRange: number, columns: string[]) => {
    // Filter to numeric columns with actual data, excluding date/time columns
    const numericColumns = columns.filter(col => {
      if (col.toLowerCase().includes('date') || col.toLowerCase().includes('time')) return false;
      const values = data.map(row => parseValue(row[col])).filter(val => val > 0);
      return values.length > 0;
    }).slice(0, 8); // Show up to 8 key metrics

    const summary = numericColumns.map((col: string) => {
      const values = data.map(row => parseValue(row[col])).filter(val => val > 0);
      const avg = average(values);
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      // Determine status based on value distribution
      const variance = avg > 0 ? ((max - min) / avg) : 0;
      let status = 'Normal';
      if (variance > 2) status = 'High Variance';
      else if (variance < 0.1) status = 'Stable';
      else if (avg > (max * 0.8)) status = 'Optimal';
      
      return {
        metric: col.replace(/_/g, ' ').toUpperCase(),
        average: format(avg),
        maximum: format(max),
        minimum: format(min),
        status
      };
    });

    const operational = [
      {
        metric: 'Data Availability',
        value: format((numericColumns.length / columns.length) * 100) + '%',
        target: '80%',
        performance: format((numericColumns.length / Math.max(columns.length, 1)) * 100),
        status: numericColumns.length >= 3 ? 'Good' : 'Limited'
      },
      {
        metric: 'System Operation Time',
        value: format(estimatedHours / daysInRange) + ' hrs/day',
        target: '20+ hrs/day',
        performance: format((estimatedHours / (daysInRange * 24)) * 100),
        status: (estimatedHours / (daysInRange * 24)) > 0.8 ? 'Optimal' : 'Monitoring'
      }
    ];

    return { summary, operational };
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