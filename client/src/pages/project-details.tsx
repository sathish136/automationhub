import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Building2, Cpu, Droplets, Zap, Settings, CheckCircle, ArrowLeft, Calendar, MapPin, Plus } from "lucide-react";

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
  const [projects] = useState<Project[]>([
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProjectId(project.id)}
                data-testid={`project-card-${project.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">
                        {project.projectName}
                      </CardTitle>
                      <p className="text-xs text-gray-600 mt-1">
                        {project.projectNumber}
                      </p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs text-white ${getStatusColor(project.status)}`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-xs text-gray-600">
                      <MapPin size={12} className="mr-2" />
                      <span className="truncate">{project.location}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Calendar size={12} className="mr-2" />
                      <span>{project.createdDate}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Droplets size={12} className="mr-2" />
                      <span>Capacity: {project.capacity}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Systems:</p>
                      <div className="flex flex-wrap gap-1">
                        {project.selectedSystems.map(system => (
                          <Badge key={system} variant="outline" className="text-xs px-2 py-1">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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