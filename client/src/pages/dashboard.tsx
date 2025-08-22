import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import MetricsCards from "@/components/dashboard/metrics-cards";
import SiteStatusOverview from "@/components/dashboard/site-status-overview";
import RecentAlerts from "@/components/dashboard/recent-alerts";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<{
    totalSites: number;
    onlineSites: number;
    criticalAlerts: number;
    avgResponseTime: number;
  }>({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Dashboard Overview"
        subtitle="Real-time monitoring of all automation sites"
      />

      <div className="p-6">
        {/* Key Metrics Cards */}
        <MetricsCards metrics={metrics} isLoading={metricsLoading} />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Site Status Overview */}
          <div className="lg:col-span-2">
            <SiteStatusOverview />
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            <RecentAlerts />
          </div>
        </div>

      </div>
    </div>
  );
}
