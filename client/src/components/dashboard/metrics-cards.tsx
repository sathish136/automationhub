import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Building, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricsCardsProps {
  metrics?: {
    totalSites: number;
    onlineSites: number;
    criticalAlerts: number;
    avgResponseTime: number;
  };
  isLoading: boolean;
}

export default function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const uptimePercentage = metrics.totalSites > 0 
    ? ((metrics.onlineSites / metrics.totalSites) * 100).toFixed(1) 
    : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card data-testid="metric-total-sites">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sites</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalSites}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building className="text-xl text-primary" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 flex items-center">
              <ArrowUp className="w-3 h-3 mr-1" />
              Active
            </span>
            <span className="text-gray-600 ml-1">automation sites</span>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="metric-online-sites">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sites Online</p>
              <p className="text-3xl font-bold text-green-600">{metrics.onlineSites}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-xl text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">{uptimePercentage}%</span>
            <span className="text-gray-600 ml-1">uptime average</span>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="metric-critical-alerts">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
              <p className="text-3xl font-bold text-red-600">{metrics.criticalAlerts}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-xl text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600">
              {metrics.totalSites - metrics.onlineSites} offline
            </span>
            <span className="text-gray-600 ml-1">requires attention</span>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="metric-avg-response">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.avgResponseTime}ms</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-xl text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 flex items-center">
              <ArrowDown className="w-3 h-3 mr-1" />
              Good
            </span>
            <span className="text-gray-600 ml-1">network performance</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
