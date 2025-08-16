import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Building2, Cpu, Droplets, Zap, Settings, CheckCircle, ArrowLeft, Calendar, MapPin, Plus, Eye, Edit, Save, X, Check } from "lucide-react";

interface Project {
  id: number;
  projectNumber: string;
  projectName: string;
  location: string;
  status: string;
  plcName: string;
  ipcName: string;
  selectedSystems: string[];
  createdDate: string;
  capacity: string;
}

export default function ProjectDetails() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Project>>({});
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      projectNumber: 'PRJ-2025-001',
      projectName: 'Water Treatment Plant Automation',
      location: 'Industrial Complex A',
      status: 'Active',
      plcName: 'Siemens S7-1500',
      ipcName: 'Advantech IPC-610H',
      selectedSystems: ['ETP', 'RO'],
      createdDate: '2025-01-15',
      capacity: '700 KLD'
    },
    {
      id: 2,
      projectNumber: 'PRJ-2025-002', 
      projectName: 'Industrial Waste Management',
      location: 'Manufacturing Plant B',
      status: 'In Progress',
      plcName: 'Allen-Bradley ControlLogix',
      ipcName: 'Beckhoff CX5020',
      selectedSystems: ['ETP', 'MBR', 'VTS'],
      createdDate: '2025-01-10',
      capacity: '1200 KLD'
    },
    {
      id: 3,
      projectNumber: 'PRJ-2025-003',
      projectName: 'Chemical Processing Automation',
      location: 'Chemical Complex C',
      status: 'Planning',
      plcName: 'Schneider Electric M580',
      ipcName: 'SIMATIC IPC477E',
      selectedSystems: ['RO', 'REJECT_RO'],
      createdDate: '2025-01-08',
      capacity: '300 KLD'
    },
    {
      id: 4,
      projectNumber: 'PRJ-2024-015',
      projectName: 'Pharmaceutical Water Treatment',
      location: 'Pharma Facility D',
      status: 'Completed',
      plcName: 'Siemens S7-1200',
      ipcName: 'Advantech UNO-2372G',
      selectedSystems: ['ETP', 'RO', 'MBR'],
      createdDate: '2024-12-20',
      capacity: '500 KLD'
    }
  ]);
  
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);

  const plantSystems = [
    { id: 'ETP', name: 'Effluent Treatment Plant', capacity: '500 KLD', icon: Droplets, color: 'bg-blue-500' },
    { id: 'MBR', name: 'Membrane Bioreactor', capacity: '300 KLD', icon: Settings, color: 'bg-green-500' },
    { id: 'RO', name: 'Reverse Osmosis', capacity: '200 KLD', icon: Droplets, color: 'bg-cyan-500' },
    { id: 'VTS', name: 'Vapor Treatment System', capacity: '150 KLD', icon: Zap, color: 'bg-purple-500' },
    { id: 'REJECT_RO', name: 'Reject RO', capacity: '100 KLD', icon: Droplets, color: 'bg-orange-500' }
  ];

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystems(prev => 
      prev.includes(systemId) 
        ? prev.filter(id => id !== systemId)
        : [...prev, systemId]
    );
  };

  const isSystemSelected = (systemId: string) => {
    return selectedProject ? selectedProject.selectedSystems.includes(systemId) : false;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Planning': return 'bg-yellow-500';
      case 'Completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const statusOptions = ['Active', 'In Progress', 'Planning', 'Completed'];

  const handleEditStart = (project: Project) => {
    setEditingProjectId(project.id);
    setEditFormData(project);
  };

  const handleEditCancel = () => {
    setEditingProjectId(null);
    setEditFormData({});
  };

  const handleEditSave = () => {
    if (editingProjectId && editFormData) {
      setProjects(prev => prev.map(p => 
        p.id === editingProjectId 
          ? { ...p, ...editFormData } as Project
          : p
      ));
      setEditingProjectId(null);
      setEditFormData({});
    }
  };

  const handleFieldChange = (field: keyof Project, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  // If no project selected, show project list
  if (!selectedProjectId) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          title="Project Details" 
          subtitle="Manage all automation projects and configurations" 
        />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">All Projects</h3>
            <Button data-testid="button-new-project">
              <Plus size={16} className="mr-2" />
              New Project
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Project No.</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Project Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Capacity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">PLC</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">IPC</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Systems</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project, index) => {
                      const isEditing = editingProjectId === project.id;
                      return (
                        <tr 
                          key={project.id} 
                          className={`border-b hover:bg-gray-50 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                          } ${isEditing ? 'bg-blue-50 border-blue-200' : ''}`}
                          data-testid={`project-row-${project.id}`}
                        >
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <Input 
                                value={editFormData.projectNumber || ''}
                                onChange={(e) => handleFieldChange('projectNumber', e.target.value)}
                                className="text-sm h-8"
                                data-testid={`edit-project-number-${project.id}`}
                              />
                            ) : (
                              <div className="font-medium text-gray-900 text-sm">
                                {project.projectNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <Input 
                                value={editFormData.projectName || ''}
                                onChange={(e) => handleFieldChange('projectName', e.target.value)}
                                className="text-sm h-8"
                                data-testid={`edit-project-name-${project.id}`}
                              />
                            ) : (
                              <div className="font-medium text-gray-900 text-sm">
                                {project.projectName}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <Input 
                                value={editFormData.location || ''}
                                onChange={(e) => handleFieldChange('location', e.target.value)}
                                className="text-sm h-8"
                                data-testid={`edit-location-${project.id}`}
                              />
                            ) : (
                              <div className="text-gray-600 text-sm">
                                {project.location}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <select 
                                value={editFormData.status || project.status}
                                onChange={(e) => handleFieldChange('status', e.target.value)}
                                className="text-sm h-8 px-2 border border-gray-300 rounded-md bg-white"
                                data-testid={`edit-status-${project.id}`}
                              >
                                {statusOptions.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            ) : (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs text-white ${getStatusColor(project.status)}`}
                              >
                                {project.status}
                              </Badge>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <Input 
                                value={editFormData.capacity || ''}
                                onChange={(e) => handleFieldChange('capacity', e.target.value)}
                                className="text-sm h-8"
                                data-testid={`edit-capacity-${project.id}`}
                              />
                            ) : (
                              <div className="text-gray-600 text-sm">
                                {project.capacity}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <Input 
                                value={editFormData.plcName || ''}
                                onChange={(e) => handleFieldChange('plcName', e.target.value)}
                                className="text-sm h-8"
                                data-testid={`edit-plc-${project.id}`}
                              />
                            ) : (
                              <div className="text-gray-600 text-sm">
                                {project.plcName}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <Input 
                                value={editFormData.ipcName || ''}
                                onChange={(e) => handleFieldChange('ipcName', e.target.value)}
                                className="text-sm h-8"
                                data-testid={`edit-ipc-${project.id}`}
                              />
                            ) : (
                              <div className="text-gray-600 text-sm">
                                {project.ipcName}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {project.selectedSystems.slice(0, 2).map(system => (
                                <Badge key={system} variant="outline" className="text-xs px-2 py-1">
                                  {system}
                                </Badge>
                              ))}
                              {project.selectedSystems.length > 2 && (
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                  +{project.selectedSystems.length - 2}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={handleEditSave}
                                    data-testid={`save-project-${project.id}`}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check size={14} />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={handleEditCancel}
                                    data-testid={`cancel-edit-${project.id}`}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X size={14} />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleEditStart(project)}
                                    data-testid={`edit-project-${project.id}`}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setSelectedProjectId(project.id)}
                                    data-testid={`view-project-${project.id}`}
                                  >
                                    <Eye size={14} />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show detailed view for selected project
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title={selectedProject?.projectName || "Project Details"} 
        subtitle={`${selectedProject?.projectNumber} - Detailed Configuration`}
      />
      
      <div className="p-6">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedProjectId(null)}
          className="mb-4"
          data-testid="button-back-to-list"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Project List
        </Button>
      </div>
      
      <div className="px-6 pb-6 space-y-6">
        {/* Project Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 size={18} />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-700">Project Number</Label>
                <Input 
                  value={selectedProject?.projectNumber || ''} 
                  className="mt-1 text-sm" 
                  readOnly
                  data-testid="input-project-number"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Project Name</Label>
                <Input 
                  value={selectedProject?.projectName || ''} 
                  className="mt-1 text-sm" 
                  data-testid="input-project-name"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Location</Label>
                <Input 
                  value={selectedProject?.location || ''} 
                  className="mt-1 text-sm" 
                  data-testid="input-location"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Status</Label>
                <Badge 
                  variant="secondary" 
                  className={`mt-2 text-xs text-white ${getStatusColor(selectedProject?.status || '')}`}
                >
                  {selectedProject?.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PLC/IPC Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu size={18} />
              PLC & IPC Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-700">PLC Name</Label>
                <Input 
                  value={selectedProject?.plcName || ''} 
                  className="mt-1 text-sm" 
                  data-testid="input-plc-name"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">IPC Name</Label>
                <Input 
                  value={selectedProject?.ipcName || ''} 
                  className="mt-1 text-sm" 
                  data-testid="input-ipc-name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plant Systems Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plant Systems Configuration</CardTitle>
            <p className="text-xs text-gray-600">Select systems to include in this project</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plantSystems.map((system) => {
                const Icon = system.icon;
                const selected = isSystemSelected(system.id);
                
                return (
                  <div 
                    key={system.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selected 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSystemToggle(system.id)}
                    data-testid={`system-${system.id.toLowerCase()}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${system.color} text-white`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {system.name}
                          </h4>
                          {selected && (
                            <CheckCircle size={16} className="text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Capacity: {system.capacity}
                        </p>
                        <div className="mt-2 flex items-center">
                          <Checkbox 
                            checked={selected}
                            onCheckedChange={() => handleSystemToggle(system.id)}
                            data-testid={`checkbox-${system.id.toLowerCase()}`}
                          />
                          <span className="ml-2 text-xs">
                            {selected ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Selected Systems ({selectedSystems.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedSystems.map(systemId => {
                  const system = plantSystems.find(s => s.id === systemId);
                  return system ? (
                    <Badge key={systemId} variant="secondary" className="text-xs">
                      {system.name} - {system.capacity}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" data-testid="button-reset">
            Reset Configuration
          </Button>
          <Button data-testid="button-save">
            Save Project Details
          </Button>
        </div>
      </div>
    </div>
  );
}