import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Cpu, Droplets, Zap, Settings, CheckCircle, ArrowLeft, Calendar, MapPin, Plus, Eye, Edit, Save, X, Check, Trash2 } from "lucide-react";
import type { Project, InsertProject, IpcManagement } from "@shared/schema";

interface Project {
  id: string;
  projectNumber: string;
  projectName: string;
  location: string | null;
  status: string;
  selectedIpcId: string | null;
  selectedSystems: string[] | null;
  createdDate: string;
  planStartDate: string | null;
  capacity: string | null;
  ipcName: string | null;
}

export default function ProjectDetails() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Project>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState<Partial<Project>>({});
  
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Fetch projects from database
  const { data: projectsData = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects']
  });

  // Fetch IPC management items for dropdown
  const { data: ipcItems = [], isLoading: ipcLoading } = useQuery<IpcManagement[]>({
    queryKey: ['/api/ipc-management']
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: InsertProject) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      refetchProjects();
      setShowNewProjectForm(false);
      setNewProjectData({});
      setSelectedSystems([]);
    },
    onError: (error: Error) => {
      console.error('Project creation error:', error);
      if (error.message.includes('duplicate key')) {
        alert('Project number already exists. Please use a unique project number.');
      } else {
        alert('Failed to create project. Please check your data and try again.');
      }
    }
  });

  const handleViewProject = (projectId: string) => {
    const project = projectsData.find(p => p.id === projectId);
    if (project) {
      setSelectedProjectId(projectId);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditFormData(project);
    setSelectedSystems(project.selectedSystems || []);
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      // TODO: Implement delete API call
      refetchProjects();
    }
  };

  const handleUpdateProject = () => {
    if (editingProjectId) {
      // TODO: Implement update API call
      setEditingProjectId(null);
      setEditFormData({});
      refetchProjects();
    }
  };

  const handleCreateProject = () => {
    if (!newProjectData.projectNumber || !newProjectData.projectName) {
      alert('Please fill in project number and name');
      return;
    }

    const selectedIpc = ipcItems.find(item => item.id === newProjectData.selectedIpcId);
    
    const projectData: InsertProject = {
      projectNumber: newProjectData.projectNumber || '',
      projectName: newProjectData.projectName || '',
      location: newProjectData.location || null,
      status: newProjectData.status || 'planning',
      capacity: newProjectData.capacity || null,
      selectedIpcId: newProjectData.selectedIpcId || null,
      ipcName: selectedIpc?.deviceName || null,
      selectedSystems: selectedSystems.length > 0 ? selectedSystems : null,
      createdDate: newProjectData.createdDate ? new Date(newProjectData.createdDate) : new Date(),
      planStartDate: newProjectData.planStartDate ? new Date(newProjectData.planStartDate) : null
    };

    createProjectMutation.mutate(projectData);
  };

  const systemOptions = [
    "ETP",
    "MBR", 
    "RO",
    "VTS",
    "REJECT_RO"
  ];

  const handleSystemChange = (system: string, checked: boolean) => {
    if (checked) {
      setSelectedSystems(prev => [...prev, system]);
    } else {
      setSelectedSystems(prev => prev.filter(s => s !== system));
    }
  };

  const getSelectedIpcDetails = (ipcId: string) => {
    return ipcItems.find(item => item.id === ipcId);
  };

  const selectedProject = projectsData.find(p => p.id === selectedProjectId);

  if (ipcLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="project-details-page">
      <Header />
      <div className="p-6">
        {selectedProject ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => setSelectedProjectId(null)}
                className="flex items-center gap-2"
                data-testid="button-back-to-list"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
              <h1 className="text-2xl font-bold" data-testid="text-project-title">
                {selectedProject.projectName}
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card data-testid="card-project-info">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Project Number</Label>
                    <p className="text-lg" data-testid="text-project-number">{selectedProject.projectNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Location</Label>
                    <p data-testid="text-project-location">{selectedProject.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Capacity</Label>
                    <p data-testid="text-project-capacity">{selectedProject.capacity || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                    <p data-testid="text-project-created">{selectedProject.createdDate || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Plan Start Date</Label>
                    <p data-testid="text-project-start">{selectedProject.planStartDate || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              {selectedProject.selectedIpcId && (
                <Card data-testid="card-ipc-details">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      IPC Details (Read-Only)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const ipcDetails = getSelectedIpcDetails(selectedProject.selectedIpcId);
                      if (!ipcDetails) return <p>IPC details not found</p>;
                      
                      return (
                        <>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">IPC Name</Label>
                            <p data-testid="text-ipc-name">{ipcDetails.deviceName}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">VPN IP Address</Label>
                            <p data-testid="text-ipc-ip">{ipcDetails.vpnIp}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">LAN IP Address</Label>
                            <p data-testid="text-ipc-lan-ip">{ipcDetails.lanIp || 'Not specified'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Status</Label>
                            <Badge className={ipcDetails.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {ipcDetails.status}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Manufacture</Label>
                            <p data-testid="text-ipc-manufacture">{ipcDetails.manufacture || 'Not specified'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Model</Label>
                            <p data-testid="text-ipc-model">{ipcDetails.model || 'Not specified'}</p>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-page-title">Project Details</h1>
              <p className="text-gray-600">Manage all automation projects and configurations</p>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">All Projects ({projectsData.length})</h2>
              <Button
                onClick={() => setShowNewProjectForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                data-testid="button-new-project"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>

            {showNewProjectForm && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6" data-testid="card-new-project-form">
                <h3 className="text-lg font-semibold text-blue-600 mb-6">Create New Project</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <Label htmlFor="projectNumber" className="text-sm font-medium text-gray-700 mb-2 block">Project Number</Label>
                    <Input
                      id="projectNumber"
                      value={newProjectData.projectNumber || ''}
                      onChange={(e) => setNewProjectData(prev => ({ ...prev, projectNumber: e.target.value }))}
                      placeholder="PRJ-2025-XXX"
                      className="w-full"
                      data-testid="input-project-number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="projectName" className="text-sm font-medium text-gray-700 mb-2 block">Project Name</Label>
                    <Input
                      id="projectName"
                      value={newProjectData.projectName || ''}
                      onChange={(e) => setNewProjectData(prev => ({ ...prev, projectName: e.target.value }))}
                      placeholder="Enter project name"
                      className="w-full"
                      data-testid="input-project-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700 mb-2 block">Location</Label>
                    <Input
                      id="location"
                      value={newProjectData.location || ''}
                      onChange={(e) => setNewProjectData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Project location"
                      className="w-full"
                      data-testid="input-project-location"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                    <Select
                      value={newProjectData.status || 'Planning'}
                      onValueChange={(value) => setNewProjectData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="w-full" data-testid="select-project-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <Label htmlFor="capacity" className="text-sm font-medium text-gray-700 mb-2 block">Capacity</Label>
                    <Input
                      id="capacity"
                      value={newProjectData.capacity || ''}
                      onChange={(e) => setNewProjectData(prev => ({ ...prev, capacity: e.target.value }))}
                      placeholder="500 KLD"
                      className="w-full"
                      data-testid="input-project-capacity"
                    />
                  </div>
                  <div>
                    <Label htmlFor="selectedIpcId" className="text-sm font-medium text-gray-700 mb-2 block">IPC Name</Label>
                    <Select
                      value={newProjectData.selectedIpcId || ''}
                      onValueChange={(value) => setNewProjectData(prev => ({ ...prev, selectedIpcId: value }))}
                    >
                      <SelectTrigger className="w-full" data-testid="select-ipc-item">
                        <SelectValue placeholder="IPC model" />
                      </SelectTrigger>
                      <SelectContent>
                        {ipcItems && ipcItems.length > 0 ? (
                          ipcItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.deviceName} - {item.vpnIp}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No IPC items available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="createdDate" className="text-sm font-medium text-gray-700 mb-2 block">Created Date</Label>
                    <Input
                      id="createdDate"
                      type="date"
                      value={newProjectData.createdDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewProjectData(prev => ({ ...prev, createdDate: e.target.value }))}
                      className="w-full"
                      data-testid="input-created-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="planStartDate" className="text-sm font-medium text-gray-700 mb-2 block">Plan Start Date</Label>
                    <Input
                      id="planStartDate"
                      type="date"
                      value={newProjectData.planStartDate || ''}
                      onChange={(e) => setNewProjectData(prev => ({ ...prev, planStartDate: e.target.value }))}
                      className="w-full"
                      data-testid="input-plan-start-date"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Plant Systems</Label>
                  <div className="flex gap-6">
                    {systemOptions.map((system) => (
                      <div key={system} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={system}
                          name="plantSystem"
                          checked={selectedSystems.includes(system)}
                          onChange={(e) => handleSystemChange(system, e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                          data-testid={`radio-system-${system.toLowerCase()}`}
                        />
                        <Label htmlFor={system} className="text-sm font-medium text-gray-700">{system}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateProject}
                    disabled={!newProjectData.projectNumber || !newProjectData.projectName || createProjectMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                    data-testid="button-create-project"
                  >
                    {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewProjectForm(false)}
                    className="px-6 py-2 rounded-lg"
                    data-testid="button-cancel-project"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200" data-testid="card-projects-list">
              <div className="p-6">
                {projectsData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500" data-testid="text-no-projects">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-500">Create your first project to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectsData.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50" data-testid={`card-project-${project.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-semibold" data-testid={`text-project-name-${project.id}`}>{project.projectName}</h3>
                              <p className="text-sm text-gray-600" data-testid={`text-project-number-${project.id}`}>{project.projectNumber}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">{project.status}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {project.location || 'No location'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {project.createdDate || 'No date'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProject(project.id)}
                            data-testid={`button-view-${project.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProject(project)}
                            data-testid={`button-edit-${project.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-${project.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}