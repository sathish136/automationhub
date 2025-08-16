import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Monitor, Cpu, Wifi, Router, Key, Activity, Edit, Save, X, Check, Eye, EyeOff } from "lucide-react";

interface IPCDevice {
  id: number;
  // Details
  status: string;
  amsNetId: string;
  vpnIp: string;
  lanIp: string;
  anydesk: string;
  teamviewer: string;
  namingSeries: string;
  ipcUsername: string;
  ipcPassword: string;
  comments: string;
  
  // Hardware Specs
  manufacture: string;
  model: string;
  serialNo: string;
  mainboard: string;
  cpu: string;
  flash: string;
  powerSupply: string;
  memory: string;
  mac1: string;
  mac2: string;
  deviceName: string;
  operatingSystem: string;
  imageVersion: string;
  serialNumberOfIpc: string;
  
  // Network 1
  network1Name: string;
  network1VirtualDevice: string;
  network1Gateway: string;
  network1Address: string;
  network1Dhcp: string;
  network1SubnetMask: string;
  network1DnsServers: string;
  network1MacAddress: string;
  
  // Network 2
  network2Name: string;
  network2VirtualDevice: string;
  network2Gateway: string;
  network2Address: string;
  network2Dhcp: string;
  network2SubnetMask: string;
  network2DnsServers: string;
  network2MacAddress: string;
}

export default function IPCDetails() {
  const [selectedIPCId, setSelectedIPCId] = useState<number | null>(null);
  const [editingIPCId, setEditingIPCId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<IPCDevice>>({});
  const [ipcDevices, setIPCDevices] = useState<IPCDevice[]>([]);
  const [showNewIPCForm, setShowNewIPCForm] = useState(false);
  const [newIPCData, setNewIPCData] = useState<Partial<IPCDevice>>({});
  const [showPasswords, setShowPasswords] = useState<{[key: number]: boolean}>({});

  const statusOptions = ['Active', 'Inactive', 'Maintenance', 'Offline'];
  const dhcpOptions = ['Enable', 'Disabled'];

  const handleEditStart = (ipc: IPCDevice) => {
    setEditingIPCId(ipc.id);
    setEditFormData({ ...ipc });
  };

  const handleEditCancel = () => {
    setEditingIPCId(null);
    setEditFormData({});
  };

  const handleEditSave = () => {
    if (editingIPCId && editFormData) {
      setIPCDevices(prev => prev.map(ipc => 
        ipc.id === editingIPCId 
          ? { ...ipc, ...editFormData } as IPCDevice
          : ipc
      ));
      setEditingIPCId(null);
      setEditFormData({});
    }
  };

  const handleFieldChange = (field: keyof IPCDevice, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewIPC = () => {
    setShowNewIPCForm(true);
    setNewIPCData({
      status: 'Active',
      amsNetId: '',
      vpnIp: '',
      lanIp: '',
      anydesk: '',
      teamviewer: '',
      namingSeries: 'WTT-IPC-',
      ipcUsername: 'administrator',
      ipcPassword: '',
      comments: '',
      manufacture: 'Beckhoff',
      model: '',
      serialNo: '',
      mainboard: '',
      cpu: '',
      flash: '',
      powerSupply: '24V DC, Class2',
      memory: '',
      mac1: '',
      mac2: '',
      deviceName: '',
      operatingSystem: 'Windows 10',
      imageVersion: '',
      serialNumberOfIpc: '',
      network1Name: '',
      network1VirtualDevice: 'Ethernet',
      network1Gateway: '0.0.0.0',
      network1Address: '0.0.0.0',
      network1Dhcp: 'Enable',
      network1SubnetMask: '0.0.0.0',
      network1DnsServers: '0.0.0.0',
      network1MacAddress: '',
      network2Name: '',
      network2VirtualDevice: 'Ethernet 2',
      network2Gateway: '',
      network2Address: '',
      network2Dhcp: 'Disabled',
      network2SubnetMask: '',
      network2DnsServers: '',
      network2MacAddress: ''
    });
  };

  const handleNewIPCSave = () => {
    if (newIPCData.deviceName && newIPCData.amsNetId) {
      const newIPC: IPCDevice = {
        ...newIPCData as IPCDevice,
        id: Date.now()
      };
      setIPCDevices(prev => [...prev, newIPC]);
      setShowNewIPCForm(false);
      setNewIPCData({});
    }
  };

  const handleNewIPCCancel = () => {
    setShowNewIPCForm(false);
    setNewIPCData({});
  };

  const handleNewIPCChange = (field: keyof IPCDevice, value: any) => {
    setNewIPCData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (ipcId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [ipcId]: !prev[ipcId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Inactive': return 'bg-gray-500';
      case 'Maintenance': return 'bg-yellow-500';
      case 'Offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // If no IPC selected, show IPC list
  if (!selectedIPCId) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          title="IPC Management" 
          subtitle="Manage Industrial PC devices and configurations" 
        />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              IPC Devices ({ipcDevices.length})
            </h3>
            <Button onClick={handleNewIPC} data-testid="button-new-ipc">
              <Monitor size={16} className="mr-2" />
              Add IPC Device
            </Button>
          </div>
          
          {/* New IPC Form */}
          {showNewIPCForm && (
            <Card className="mb-6 border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-base text-primary">Add New IPC Device</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <Label className="text-xs font-medium">Device Name</Label>
                    <Input 
                      value={newIPCData.deviceName || ''}
                      onChange={(e) => handleNewIPCChange('deviceName', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                      placeholder="CP-922BF2"
                      data-testid="new-device-name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">AMS Net ID</Label>
                    <Input 
                      value={newIPCData.amsNetId || ''}
                      onChange={(e) => handleNewIPCChange('amsNetId', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                      placeholder="172.18.233.236.1.1"
                      data-testid="new-ams-id"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Status</Label>
                    <select 
                      value={newIPCData.status || 'Active'}
                      onChange={(e) => handleNewIPCChange('status', e.target.value)}
                      className="text-sm h-8 px-2 border border-gray-300 rounded-md bg-white w-full mt-1"
                      data-testid="new-status"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">VPN IP</Label>
                    <Input 
                      value={newIPCData.vpnIp || ''}
                      onChange={(e) => handleNewIPCChange('vpnIp', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                      placeholder="10.0.0.1"
                      data-testid="new-vpn-ip"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">LAN IP</Label>
                    <Input 
                      value={newIPCData.lanIp || ''}
                      onChange={(e) => handleNewIPCChange('lanIp', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                      placeholder="192.168.1.100"
                      data-testid="new-lan-ip"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Model</Label>
                    <Input 
                      value={newIPCData.model || ''}
                      onChange={(e) => handleNewIPCChange('model', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                      placeholder="C6015-0010"
                      data-testid="new-model"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={handleNewIPCCancel} data-testid="cancel-new-ipc">
                    Cancel
                  </Button>
                  <Button onClick={handleNewIPCSave} data-testid="save-new-ipc">
                    Add IPC Device
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Device Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">AMS Net ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">VPN IP</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">LAN IP</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Model</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ipcDevices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <div className="text-gray-500">
                            <Monitor size={48} className="mx-auto mb-4 text-gray-300" />
                            <h3 className="text-sm font-medium text-gray-900 mb-2">No IPC Devices Found</h3>
                            <p className="text-xs text-gray-600 mb-4">Get started by adding your first IPC device</p>
                            <Button onClick={handleNewIPC} size="sm">
                              <Monitor size={14} className="mr-2" />
                              Add First IPC Device
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : ipcDevices.map((ipc, index) => (
                      <tr 
                        key={ipc.id} 
                        className={`border-b hover:bg-gray-50 cursor-pointer ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                        onClick={() => setSelectedIPCId(ipc.id)}
                        data-testid={`ipc-row-${ipc.id}`}
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 text-sm">
                            {ipc.deviceName}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-600 text-sm">
                            {ipc.amsNetId}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs text-white ${getStatusColor(ipc.status)}`}
                          >
                            {ipc.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-600 text-sm">
                            {ipc.vpnIp}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-600 text-sm">
                            {ipc.lanIp}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-600 text-sm">
                            {ipc.model}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIPCId(ipc.id);
                              }}
                              data-testid={`view-ipc-${ipc.id}`}
                              title="View details"
                            >
                              <Eye size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show detailed view for selected IPC
  const selectedIPC = ipcDevices.find(ipc => ipc.id === selectedIPCId);
  if (!selectedIPC) return null;

  const isEditing = editingIPCId === selectedIPC.id;
  const currentData = isEditing ? { ...selectedIPC, ...editFormData } : selectedIPC;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title={`IPC Device - ${selectedIPC.deviceName}`} 
        subtitle={`${selectedIPC.amsNetId} - Device Configuration`}
      />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedIPCId(null)}
            data-testid="button-back-to-list"
          >
            ← Back to IPC List
          </Button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline"
                  onClick={handleEditCancel}
                  data-testid="cancel-edit-ipc"
                >
                  <X size={16} className="mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditSave}
                  data-testid="save-edit-ipc"
                >
                  <Save size={16} className="mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => handleEditStart(selectedIPC)}
                data-testid="edit-ipc"
              >
                <Edit size={16} className="mr-2" />
                Edit Device
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status & Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity size={18} />
                Status & Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Status</Label>
                  {isEditing ? (
                    <select 
                      value={currentData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className="text-sm h-8 px-2 border border-gray-300 rounded-md bg-white w-full mt-1"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  ) : (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs text-white ${getStatusColor(currentData.status)} mt-1`}
                    >
                      {currentData.status}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">AMS Net ID</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.amsNetId}
                      onChange={(e) => handleFieldChange('amsNetId', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.amsNetId}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">VPN IP</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.vpnIp}
                      onChange={(e) => handleFieldChange('vpnIp', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.vpnIp}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">LAN IP</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.lanIp}
                      onChange={(e) => handleFieldChange('lanIp', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.lanIp}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connectivity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wifi size={18} />
                Connectivity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700">AnyDesk ID</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.anydesk}
                      onChange={(e) => handleFieldChange('anydesk', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.anydesk}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">TeamViewer</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.teamviewer}
                      onChange={(e) => handleFieldChange('teamviewer', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.teamviewer}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IPC Login Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key size={18} />
                IPC Login Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700">IPC Username</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.ipcUsername}
                      onChange={(e) => handleFieldChange('ipcUsername', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.ipcUsername}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">IPC Password</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {isEditing ? (
                      <Input 
                        type={showPasswords[selectedIPC.id] ? "text" : "password"}
                        value={currentData.ipcPassword}
                        onChange={(e) => handleFieldChange('ipcPassword', e.target.value)}
                        className="text-sm h-8 !bg-white !border-gray-300"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 flex-1">
                        {showPasswords[selectedIPC.id] ? currentData.ipcPassword : '••••••••••••'}
                      </div>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => togglePasswordVisibility(selectedIPC.id)}
                    >
                      {showPasswords[selectedIPC.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Naming Series</Label>
                {isEditing ? (
                  <Input 
                    value={currentData.namingSeries}
                    onChange={(e) => handleFieldChange('namingSeries', e.target.value)}
                    className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                  />
                ) : (
                  <div className="text-sm text-gray-900 mt-1">{currentData.namingSeries}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hardware Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu size={18} />
                Hardware Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Device Name</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.deviceName}
                      onChange={(e) => handleFieldChange('deviceName', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.deviceName}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Manufacturer</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.manufacture}
                      onChange={(e) => handleFieldChange('manufacture', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.manufacture}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Model</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.model}
                      onChange={(e) => handleFieldChange('model', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.model}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Serial No</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.serialNo}
                      onChange={(e) => handleFieldChange('serialNo', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.serialNo}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">IPC Serial Number</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.serialNumberOfIpc}
                      onChange={(e) => handleFieldChange('serialNumberOfIpc', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.serialNumberOfIpc}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Mainboard</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.mainboard}
                      onChange={(e) => handleFieldChange('mainboard', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.mainboard}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">CPU</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.cpu}
                      onChange={(e) => handleFieldChange('cpu', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.cpu}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Memory</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.memory}
                      onChange={(e) => handleFieldChange('memory', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.memory}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Flash Storage</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.flash}
                      onChange={(e) => handleFieldChange('flash', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.flash}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Power Supply</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.powerSupply}
                      onChange={(e) => handleFieldChange('powerSupply', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.powerSupply}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Operating System</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.operatingSystem}
                      onChange={(e) => handleFieldChange('operatingSystem', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.operatingSystem}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Image Version</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.imageVersion}
                      onChange={(e) => handleFieldChange('imageVersion', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.imageVersion}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">MAC Address 1</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.mac1}
                      onChange={(e) => handleFieldChange('mac1', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.mac1}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">MAC Address 2</Label>
                  {isEditing ? (
                    <Input 
                      value={currentData.mac2}
                      onChange={(e) => handleFieldChange('mac2', e.target.value)}
                      className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">{currentData.mac2}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Configuration */}
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Router size={18} />
                Network Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Network 1 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Network 1</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Name</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1Name}
                          onChange={(e) => handleFieldChange('network1Name', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1Name}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Virtual Device</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1VirtualDevice}
                          onChange={(e) => handleFieldChange('network1VirtualDevice', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1VirtualDevice}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">IPv4 Address</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1Address}
                          onChange={(e) => handleFieldChange('network1Address', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1Address}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Subnet Mask</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1SubnetMask}
                          onChange={(e) => handleFieldChange('network1SubnetMask', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1SubnetMask}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Gateway</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1Gateway}
                          onChange={(e) => handleFieldChange('network1Gateway', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1Gateway}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">DNS Servers</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1DnsServers}
                          onChange={(e) => handleFieldChange('network1DnsServers', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1DnsServers}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">DHCP</Label>
                      {isEditing ? (
                        <select 
                          value={currentData.network1Dhcp}
                          onChange={(e) => handleFieldChange('network1Dhcp', e.target.value)}
                          className="text-sm h-8 px-2 border border-gray-300 rounded-md bg-white w-full mt-1"
                        >
                          {dhcpOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1Dhcp}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">MAC Address</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1MacAddress}
                          onChange={(e) => handleFieldChange('network1MacAddress', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1MacAddress}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Network 2 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Network 2</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Name</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2Name}
                          onChange={(e) => handleFieldChange('network2Name', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2Name}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Virtual Device</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2VirtualDevice}
                          onChange={(e) => handleFieldChange('network2VirtualDevice', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2VirtualDevice}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">IPv4 Address</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2Address}
                          onChange={(e) => handleFieldChange('network2Address', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2Address}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Subnet Mask</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2SubnetMask}
                          onChange={(e) => handleFieldChange('network2SubnetMask', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2SubnetMask}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Gateway</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2Gateway}
                          onChange={(e) => handleFieldChange('network2Gateway', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2Gateway}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">DNS Servers</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2DnsServers}
                          onChange={(e) => handleFieldChange('network2DnsServers', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2DnsServers}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">DHCP</Label>
                      {isEditing ? (
                        <select 
                          value={currentData.network2Dhcp}
                          onChange={(e) => handleFieldChange('network2Dhcp', e.target.value)}
                          className="text-sm h-8 px-2 border border-gray-300 rounded-md bg-white w-full mt-1"
                        >
                          {dhcpOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2Dhcp}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">MAC Address</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2MacAddress}
                          onChange={(e) => handleFieldChange('network2MacAddress', e.target.value)}
                          className="text-sm h-8 mt-1 !bg-white !border-gray-300"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2MacAddress}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea 
                  value={currentData.comments}
                  onChange={(e) => handleFieldChange('comments', e.target.value)}
                  className="text-sm min-h-20 !bg-white !border-gray-300"
                  placeholder="Add any additional comments or notes..."
                />
              ) : (
                <div className="text-sm text-gray-900">
                  {currentData.comments || 'No comments'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}