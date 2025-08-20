import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Cpu, Monitor } from "lucide-react";


export default function EquipmentStatus() {
  // VFD functionality has been removed

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

      {/* Equipment monitoring section - VFD functionality removed */}
    </div>
  );
}
