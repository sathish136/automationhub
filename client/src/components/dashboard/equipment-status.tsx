import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Cpu, Monitor, Zap } from "lucide-react";
import type { VfdParameter } from "@shared/schema";

export default function EquipmentStatus() {
  const { data: vfdParameters, isLoading } = useQuery<VfdParameter[]>({
    queryKey: ["/api/vfd-parameters"],
    refetchInterval: 30000,
  });

  const getLoadColor = (loadPercentage: string | number | null) => {
    if (!loadPercentage) return "text-gray-500";
    const load = typeof loadPercentage === "string" ? parseFloat(loadPercentage) : loadPercentage;
    if (load >= 90) return "text-red-600";
    if (load >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const formatLoad = (loadPercentage: string | number | null) => {
    if (!loadPercentage) return "N/A";
    const load = typeof loadPercentage === "string" ? parseFloat(loadPercentage) : loadPercentage;
    return `${load.toFixed(0)}%`;
  };

  return (
    <div className="space-y-6">
      {/* PLC & HMI Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>PLC & HMI Status</CardTitle>
            <span className="text-sm text-gray-600">Beckhoff TwinCAT Focus</span>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Mock PLC/HMI data - in real app this would come from API */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Cpu className="text-primary" />
                <div>
                  <p className="font-medium text-gray-900">Site A - PLC01</p>
                  <p className="text-sm text-gray-600">TwinCAT 3.1.4024</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Running
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Monitor className="text-primary" />
                <div>
                  <p className="font-medium text-gray-900">Site A - HMI01</p>
                  <p className="text-sm text-gray-600">TE2000 v3.1</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Connected
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VFD Parameters Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>VFD Parameter Status</CardTitle>
            <button className="text-sm text-primary hover:underline">
              View All
            </button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : vfdParameters && vfdParameters.length > 0 ? (
              vfdParameters.slice(0, 3).map((vfd) => (
                <div
                  key={vfd.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  data-testid={`vfd-${vfd.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Zap className="text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">{vfd.name}</p>
                      <p className="text-sm text-gray-600">
                        {vfd.frequency ? `${vfd.frequency}Hz` : 'N/A'}, {vfd.rpm ? `${vfd.rpm} RPM` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getLoadColor(vfd.loadPercentage)}`}>
                      {formatLoad(vfd.loadPercentage)}
                    </p>
                    <p className="text-xs text-gray-600">Load</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No VFD parameters configured</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
