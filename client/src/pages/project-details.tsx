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

interface ProjectFormData {
  projectNumber: string;
  projectName: string;
  location: string;
  status: string;
  selectedIpcId: string;
  selectedSystems: string[];
  createdDate: string;
  planStartDate: string;
  capacity: string;
}

export default function ProjectDetails() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Project>>({});
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState<ProjectFormData>({
    projectNumber: '',
    projectName: '',
    location: '',
    status: 'planning',
    selectedIpcId: '',
    selectedSystems: [],
    createdDate: new Date().toISOString().split('T')[0],
    planStartDate: '',
    capacity: ''
  });
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects']
  });

  // Fetch IPC management items for dropdown
  const { data: ipcItems = [], isLoading: ipcLoading } = useQuery<IpcManagement[]>({
    queryKey: ['/api/ipc-management']
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (projectData: InsertProject) => 
      fetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
        headers: { 'Content-Type': 'application/json' }
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setShowNewProjectForm(false);
      setNewProjectData({
        projectNumber: '',
        projectName: '',
        location: '',
        status: 'planning',
        selectedIpcId: '',
        selectedSystems: [],
        createdDate: new Date().toISOString().split('T')[0],
        planStartDate: '',
        capacity: ''
      });
    }
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<InsertProject> }) => 
      fetch(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setEditingProjectId(null);
      setEditFormData({});
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    }
  });

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditFormData({
      projectNumber: project.projectNumber,
      projectName: project.projectName,
      location: project.location || '',
      status: project.status,
      capacity: project.capacity || '',
      selectedIpcId: project.selectedIpcId || '',
      selectedSystems: project.selectedSystems || [],
      planStartDate: project.planStartDate ? new Date(project.planStartDate).toISOString().split('T')[0] : ''
    });
    setSelectedSystems(project.selectedSystems || []);
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const handleUpdateProject = () => {
    if (editingProjectId) {
      const updateData: Partial<InsertProject> = {
        ...editFormData,
        selectedSystems,
        planStartDate: editFormData.planStartDate ? new Date(editFormData.planStartDate) : null,
        createdDate: editFormData.createdDate ? new Date(editFormData.createdDate) : null
      };
      updateProjectMutation.mutate({ id: editingProjectId, data: updateData });
    }
  };

  const handleCreateProject = () => {
    const selectedIpc = ipcItems.find(item => item.id === newProjectData.selectedIpcId);
    
    const projectData: InsertProject = {
      projectNumber: newProjectData.projectNumber,
      projectName: newProjectData.projectName,
      location: newProjectData.location || null,
      status: newProjectData.status,
      capacity: newProjectData.capacity || null,
      selectedIpcId: newProjectData.selectedIpcId || null,
      ipcName: selectedIpc?.ipcName || null,
      selectedSystems: selectedSystems.length > 0 ? selectedSystems : null,
      createdDate: new Date(newProjectData.createdDate),
      planStartDate: newProjectData.planStartDate ? new Date(newProjectData.planStartDate) : null
    };

    createProjectMutation.mutate(projectData);
  };

  const systemOptions = [
    "SCADA System",
    "HMI Interface", 
    "PLC Programming",
    "VFD Configuration",
    "Sensor Integration",
    "Data Logging",
    "Alarm System",
    "Remote Monitoring"
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'planning': { color: 'bg-blue-100 text-blue-800', label: 'Planning' },
      'in-progress': { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      'completed': { color: 'bg-green-100 text-green-800', label: 'Completed' },
      'on-hold': { color: 'bg-gray-100 text-gray-800', label: 'On Hold' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['planning'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const selectedProject = Array.isArray(projects) ? projects.find((p: Project) => p.id === selectedProjectId) : undefined;

  if (projectsLoading || ipcLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <div className="text-center">Loading projects...</div>
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
              {getStatusBadge(selectedProject.status)}
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
                    <p className="flex items-center gap-2" data-testid="text-project-location">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {selectedProject.location || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Capacity</Label>
                    <p data-testid="text-project-capacity">{selectedProject.capacity || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                    <p className="flex items-center gap-2" data-testid="text-project-created">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {selectedProject.createdDate ? new Date(selectedProject.createdDate).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Plan Start Date</Label>
                    <p className="flex items-center gap-2" data-testid="text-project-start">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {selectedProject.planStartDate ? new Date(selectedProject.planStartDate).toLocaleDateString() : 'Not specified'}
                    </p>
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
                            <p data-testid="text-ipc-name">{ipcDetails.ipcName}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">IP Address</Label>
                            <p data-testid="text-ipc-ip">{ipcDetails.ipAddress}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Status</Label>
                            <Badge className={ipcDetails.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {ipcDetails.status}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Location</Label>
                            <p data-testid="text-ipc-location">{ipcDetails.location || 'Not specified'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Operating System</Label>
                            <p data-testid="text-ipc-os">{ipcDetails.operatingSystem || 'Not specified'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Description</Label>
                            <p data-testid="text-ipc-description">{ipcDetails.description || 'No description'}</p>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>

            {selectedProject.selectedSystems && selectedProject.selectedSystems.length > 0 && (
              <Card className="mt-6" data-testid="card-project-systems">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Selected Systems
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProject.selectedSystems.map((system, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm" data-testid={`text-system-${index}`}>{system}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Project Management</h1>
              <Button
                onClick={() => setShowNewProjectForm(true)}
                className="flex items-center gap-2"
                data-testid="button-new-project"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>

            {showNewProjectForm && (
              <Card className="mb-6" data-testid="card-new-project-form">
                <CardHeader>
                  <CardTitle>Create New Project</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="projectNumber">Project Number</Label>
                      <Input
                        id="projectNumber"
                        value={newProjectData.projectNumber}
                        onChange={(e) => setNewProjectData(prev => ({ ...prev, projectNumber: e.target.value }))}
                        placeholder="e.g., PRJ-2024-001"
                        data-testid="input-project-number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input
                        id="projectName"
                        value={newProjectData.projectName}
                        onChange={(e) => setNewProjectData(prev => ({ ...prev, projectName: e.target.value }))}
                        placeholder="Enter project name"
                        data-testid="input-project-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newProjectData.location}
                        onChange={(e) => setNewProjectData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Project location"
                        data-testid="input-project-location"
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        value={newProjectData.capacity}
                        onChange={(e) => setNewProjectData(prev => ({ ...prev, capacity: e.target.value }))}
                        placeholder="e.g., 100 MW"
                        data-testid="input-project-capacity"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={newProjectData.status}
                        onValueChange={(value) => setNewProjectData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger data-testid="select-project-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="selectedIpcId">Select IPC Item</Label>
                      <Select
                        value={newProjectData.selectedIpcId}
                        onValueChange={(value) => setNewProjectData(prev => ({ ...prev, selectedIpcId: value }))}
                      >
                        <SelectTrigger data-testid="select-ipc-item">
                          <SelectValue placeholder="Choose IPC item" />
                        </SelectTrigger>
                        <SelectContent>
                          {ipcItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.ipcName} - {item.ipAddress}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="createdDate">Created Date</Label>
                      <Input
                        id="createdDate"
                        type="date"
                        value={newProjectData.createdDate}
                        onChange={(e) => setNewProjectData(prev => ({ ...prev, createdDate: e.target.value }))}
                        data-testid="input-created-date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="planStartDate">Plan Start Date</Label>
                      <Input
                        id="planStartDate"
                        type="date"
                        value={newProjectData.planStartDate}
                        onChange={(e) => setNewProjectData(prev => ({ ...prev, planStartDate: e.target.value }))}
                        data-testid="input-plan-start-date"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Systems to Include</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {systemOptions.map((system) => (
                        <div key={system} className="flex items-center space-x-2">
                          <Checkbox
                            id={system}
                            checked={selectedSystems.includes(system)}
                            onCheckedChange={(checked) => handleSystemChange(system, checked as boolean)}
                            data-testid={`checkbox-system-${system.toLowerCase().replace(/\s+/g, '-')}`}
                          />
                          <Label htmlFor={system} className="text-sm">{system}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateProject}
                      disabled={!newProjectData.projectNumber || !newProjectData.projectName || createProjectMutation.isPending}
                      data-testid="button-save-project"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewProjectForm(false)}
                      data-testid="button-cancel-project"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card data-testid="card-projects-list">
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {!Array.isArray(projects) || projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-projects">
                    No projects found. Create your first project to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project: Project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50" data-testid={`card-project-${project.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-semibold" data-testid={`text-project-name-${project.id}`}>{project.projectName}</h3>
                              <p className="text-sm text-gray-600" data-testid={`text-project-number-${project.id}`}>{project.projectNumber}</p>
                            </div>
                            {getStatusBadge(project.status)}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {project.location || 'No location'}
                            </span>
                            {project.createdDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(project.createdDate).toLocaleDateString()}
                              </span>
                            )}
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}