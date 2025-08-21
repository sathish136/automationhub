import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { IpcManagement, Project as DBProject, InsertProject } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Cpu,
  Droplets,
  Zap,
  Settings,
  CheckCircle,
  ArrowLeft,
  Calendar,
  MapPin,
  Plus,
  Eye,
  Edit,
  Save,
  X,
  Check,
  Trash2,
  Gauge,
} from "lucide-react";

// Use the database project type from schema
type Project = DBProject;

export default function ProjectDetails() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Project>>({});
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState<Partial<InsertProject>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch projects from database
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch IPC devices for dropdown
  const { data: ipcDevices = [], isLoading: isLoadingIpcDevices } = useQuery<IpcManagement[]>({
    queryKey: ['/api/ipc-management'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: InsertProject) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        body: JSON.stringify(projectData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to create project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setShowNewProjectForm(false);
      setNewProjectData({});
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
      console.error("Error creating project:", error);
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProject> }) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to update project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setEditingProjectId(null);
      setEditFormData({});
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
      console.error("Error updating project:", error);
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete project");
      }
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
      console.error("Error deleting project:", error);
    },
  });

  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);

  const plantSystems = [
    {
      id: "ETP",
      name: "Effluent Treatment Plant",
      capacity: "500 KLD",
      icon: Droplets,
      color: "bg-blue-500",
    },
    {
      id: "MBR",
      name: "Membrane Bioreactor",
      capacity: "300 KLD",
      icon: Settings,
      color: "bg-green-500",
    },
    {
      id: "RO",
      name: "Reverse Osmosis",
      capacity: "200 KLD",
      icon: Droplets,
      color: "bg-cyan-500",
    },
    {
      id: "VTS",
      name: "Vapor Treatment System",
      capacity: "150 KLD",
      icon: Zap,
      color: "bg-purple-500",
    },
    {
      id: "REJECT_RO",
      name: "Reject RO",
      capacity: "100 KLD",
      icon: Droplets,
      color: "bg-orange-500",
    },
  ];

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystems((prev) =>
      prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId],
    );
  };

  const isSystemSelected = (systemId: string) => {
    return selectedProject
      ? (selectedProject.selectedSystems || []).includes(systemId)
      : false;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "In Progress":
        return "bg-blue-500";
      case "Planning":
        return "bg-yellow-500";
      case "Completed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const statusOptions = ["Active", "In Progress", "Planning", "Completed"];
  const systemOptions = ["ETP", "MBR", "RO", "VTS", "REJECT_RO"];

  const handleEditStart = (project: Project) => {
    setEditingProjectId(project.id);
    setEditFormData({ ...project });
  };

  const handleEditCancel = () => {
    setEditingProjectId(null);
    setEditFormData({});
  };

  const handleEditSave = () => {
    if (editingProjectId && editFormData) {
      updateProjectMutation.mutate({ 
        id: editingProjectId, 
        data: editFormData as Partial<InsertProject> 
      });
    }
  };

  const handleFieldChange = (field: keyof Project, value: any) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSystemToggleEdit = (systemId: string) => {
    const currentSystems = editFormData.selectedSystems || [];
    const updatedSystems = currentSystems.includes(systemId)
      ? currentSystems.filter((s) => s !== systemId)
      : [...currentSystems, systemId];
    handleFieldChange("selectedSystems", updatedSystems);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProjectMutation.mutate(projectId);
  };

  const handleNewProject = () => {
    setShowNewProjectForm(true);
    setNewProjectData({
      projectNumber: "",
      projectName: "",
      location: "",
      status: "Planning",
      ipcName: "",
      selectedSystems: [],
      createdDate: new Date(),
      capacity: "",
    });
  };

  const handleNewProjectSave = () => {
    if (newProjectData.projectName && newProjectData.projectNumber) {
      createProjectMutation.mutate(newProjectData as InsertProject);
    }
  };

  const handleNewProjectCancel = () => {
    setShowNewProjectForm(false);
    setNewProjectData({});
  };

  const handleNewProjectChange = (field: keyof InsertProject, value: any) => {
    setNewProjectData((prev) => ({ ...prev, [field]: value }));
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
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              All Projects ({projects.length})
            </h3>
          </div>

          {/* New Project Form */}
          {showNewProjectForm && (
            <Card className="mb-6 border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-base text-primary">
                  Create New Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-medium">
                      Project Number
                    </Label>
                    <Input
                      value={newProjectData.projectNumber || ""}
                      onChange={(e) =>
                        handleNewProjectChange("projectNumber", e.target.value)
                      }
                      className="text-sm h-8 mt-1"
                      placeholder="PRJ-2025-XXX"
                      data-testid="new-project-number"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Project Name</Label>
                    <Input
                      value={newProjectData.projectName || ""}
                      onChange={(e) =>
                        handleNewProjectChange("projectName", e.target.value)
                      }
                      className="text-sm h-8 mt-1"
                      placeholder="Enter project name"
                      data-testid="new-project-name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Location</Label>
                    <Input
                      value={newProjectData.location || ""}
                      onChange={(e) =>
                        handleNewProjectChange("location", e.target.value)
                      }
                      className="text-sm h-8 mt-1"
                      placeholder="Project location"
                      data-testid="new-location"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Status</Label>
                    <select
                      value={newProjectData.status || "Planning"}
                      onChange={(e) =>
                        handleNewProjectChange("status", e.target.value)
                      }
                      className="text-sm h-8 px-2 border border-gray-300 rounded-md bg-white w-full mt-1"
                      data-testid="new-status"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Capacity</Label>
                    <Input
                      value={newProjectData.capacity || ""}
                      onChange={(e) =>
                        handleNewProjectChange("capacity", e.target.value)
                      }
                      className="text-sm h-8 mt-1"
                      placeholder="500 KLD"
                      data-testid="new-capacity"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">PLC Name</Label>
                    <Input
                      value=""
                      onChange={() => {}}
                      className="text-sm h-8 mt-1"
                      placeholder="PLC model (not implemented)"
                      data-testid="new-plc"
                      disabled
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">IPC Name</Label>
                    <select
                      value={newProjectData.ipcName || ""}
                      onChange={(e) =>
                        handleNewProjectChange("ipcName", e.target.value)
                      }
                      className="text-sm h-8 px-2 border border-gray-300 rounded-md bg-white w-full mt-1"
                      data-testid="new-ipc"
                      disabled={isLoadingIpcDevices}
                    >
                      <option value="">Select IPC Device</option>
                      {ipcDevices.map((ipc) => (
                        <option key={ipc.id} value={ipc.deviceName}>
                          {ipc.deviceName} ({ipc.amsNetId})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Created Date</Label>
                    <Input
                      type="date"
                      value={newProjectData.createdDate ? 
                        (newProjectData.createdDate instanceof Date ? 
                          newProjectData.createdDate.toISOString().split('T')[0] :
                          new Date(newProjectData.createdDate).toISOString().split('T')[0]
                        ) : ""
                      }
                      onChange={(e) =>
                        handleNewProjectChange("createdDate", new Date(e.target.value))
                      }
                      className="text-sm h-8 mt-1"
                      data-testid="new-date"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-xs font-medium">Plant Systems</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {systemOptions.map((system) => (
                      <label
                        key={system}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={(
                            newProjectData.selectedSystems || []
                          ).includes(system)}
                          onCheckedChange={() => {
                            const currentSystems =
                              newProjectData.selectedSystems || [];
                            const updatedSystems = currentSystems.includes(
                              system,
                            )
                              ? currentSystems.filter((s) => s !== system)
                              : [...currentSystems, system];
                            handleNewProjectChange(
                              "selectedSystems",
                              updatedSystems,
                            );
                          }}
                          data-testid={`new-system-${system.toLowerCase()}`}
                        />
                        <span className="text-sm">{system}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={handleNewProjectCancel}
                    data-testid="cancel-new-project"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNewProjectSave}
                    data-testid="save-new-project"
                  >
                    Create Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 size={22} className="text-blue-600" />
                    </div>
                    Project Portfolio
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Industrial automation projects overview</p>
                </div>
                <Button
                  onClick={handleNewProject}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                  data-testid="button-new-project"
                >
                  <Plus size={16} />
                  New Project
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700">
                        Project Details
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700">
                        Location
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700">
                        Capacity
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700">
                        IPC Device
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700">
                        Created
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700">
                        Systems
                      </th>
                      <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <div className="max-w-sm mx-auto">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                              <Building2
                                size={32}
                                className="text-blue-500"
                              />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              No Projects Yet
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                              Start managing your industrial automation projects by creating your first project
                            </p>
                            <Button 
                              onClick={handleNewProject}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 shadow-lg"
                            >
                              <Plus size={16} className="mr-2" />
                              Create First Project
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      projects.map((project, index) => {
                        const isEditing = editingProjectId === project.id;
                        return (
                          <tr
                            key={project.id}
                            className={`border-b border-gray-100 transition-all duration-200 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            } ${
                              isEditing 
                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md" 
                                : "hover:bg-gray-50 hover:shadow-sm"
                            }`}
                            data-testid={`project-row-${project.id}`}
                          >
                            <td className="py-5 px-6">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editFormData.projectNumber || ""}
                                    onChange={(e) =>
                                      handleFieldChange(
                                        "projectNumber",
                                        e.target.value,
                                      )
                                    }
                                    className="text-sm h-9 border-blue-200 focus:border-blue-400 bg-white"
                                    placeholder="Project Number"
                                    data-testid={`edit-project-number-${project.id}`}
                                  />
                                  <Input
                                    value={editFormData.projectName || ""}
                                    onChange={(e) =>
                                      handleFieldChange(
                                        "projectName",
                                        e.target.value,
                                      )
                                    }
                                    className="text-sm h-9 border-blue-200 focus:border-blue-400 bg-white"
                                    placeholder="Project Name"
                                    data-testid={`edit-project-name-${project.id}`}
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-900 text-sm">
                                    {project.projectNumber}
                                  </div>
                                  <div className="text-gray-600 text-sm font-medium">
                                    {project.projectName}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-5 px-6">
                              {isEditing ? (
                                <Input
                                  value={editFormData.location || ""}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "location",
                                      e.target.value,
                                    )
                                  }
                                  className="text-sm h-9 border-blue-200 focus:border-blue-400 bg-white"
                                  placeholder="Location"
                                  data-testid={`edit-location-${project.id}`}
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <MapPin size={14} className="text-gray-400" />
                                  <span className="text-gray-700 text-sm">
                                    {project.location || 'Not specified'}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-5 px-6">
                              {isEditing ? (
                                <select
                                  value={editFormData.status || project.status}
                                  onChange={(e) =>
                                    handleFieldChange("status", e.target.value)
                                  }
                                  className="text-sm h-9 px-3 border border-blue-200 focus:border-blue-400 rounded-md bg-white w-full"
                                  data-testid={`edit-status-${project.id}`}
                                >
                                  {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs text-white px-3 py-1.5 rounded-full font-medium shadow-sm ${getStatusColor(project.status)}`}
                                >
                                  {project.status}
                                </Badge>
                              )}
                            </td>
                            <td className="py-5 px-6">
                              {isEditing ? (
                                <Input
                                  value={editFormData.capacity || ""}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "capacity",
                                      e.target.value,
                                    )
                                  }
                                  className="text-sm h-9 border-blue-200 focus:border-blue-400 bg-white"
                                  placeholder="e.g., 500 KLD"
                                  data-testid={`edit-capacity-${project.id}`}
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Gauge size={14} className="text-gray-400" />
                                  <span className="text-gray-700 text-sm font-medium">
                                    {project.capacity || 'Not specified'}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-5 px-6">
                              {isEditing ? (
                                <select
                                  value={editFormData.ipcName || ""}
                                  onChange={(e) =>
                                    handleFieldChange("ipcName", e.target.value)
                                  }
                                  className="text-sm h-9 px-3 border border-blue-200 focus:border-blue-400 rounded-md bg-white w-full"
                                  data-testid={`edit-ipc-${project.id}`}
                                  disabled={isLoadingIpcDevices}
                                >
                                  <option value="">Select IPC Device</option>
                                  {ipcDevices.map((ipc) => (
                                    <option key={ipc.id} value={ipc.deviceName}>
                                      {ipc.deviceName} ({ipc.amsNetId})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Cpu size={14} className="text-gray-400" />
                                  <span className="text-gray-700 text-sm">
                                    {project.ipcName || 'Not assigned'}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-5 px-6">
                              {isEditing ? (
                                <Input
                                  type="date"
                                  value={editFormData.createdDate ? 
                                    (editFormData.createdDate instanceof Date ? 
                                      editFormData.createdDate.toISOString().split('T')[0] :
                                      new Date(editFormData.createdDate).toISOString().split('T')[0]
                                    ) : ""
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "createdDate",
                                      new Date(e.target.value),
                                    )
                                  }
                                  className="text-sm h-9 border-blue-200 focus:border-blue-400 bg-white"
                                  data-testid={`edit-date-${project.id}`}
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Calendar size={14} className="text-gray-400" />
                                  <span className="text-gray-700 text-sm">
                                    {project.createdDate ? 
                                      (project.createdDate instanceof Date ? 
                                        project.createdDate.toLocaleDateString() :
                                        new Date(project.createdDate).toLocaleDateString()
                                      ) : 'Not set'
                                    }
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-5 px-6">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-gray-600 mb-2">
                                    Plant Systems:
                                  </div>
                                  <div className="flex flex-wrap gap-2 max-w-xs">
                                    {systemOptions.map((system) => (
                                      <label
                                        key={system}
                                        className="flex items-center space-x-2 cursor-pointer bg-white rounded-lg p-2 border border-blue-200 hover:border-blue-300 transition-colors"
                                      >
                                        <Checkbox
                                          checked={(
                                            editFormData.selectedSystems || []
                                          ).includes(system)}
                                          onCheckedChange={() =>
                                            handleSystemToggleEdit(system)
                                          }
                                          data-testid={`edit-system-${system.toLowerCase()}-${project.id}`}
                                        />
                                        <span className="text-xs font-medium">
                                          {system}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {(project.selectedSystems || [])
                                    .slice(0, 2)
                                    .map((system) => (
                                      <Badge
                                        key={system}
                                        variant="outline"
                                        className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border-blue-200 font-medium"
                                      >
                                        {system}
                                      </Badge>
                                    ))}
                                  {(project.selectedSystems || []).length > 2 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 border-gray-300 font-medium"
                                    >
                                      +{(project.selectedSystems || []).length - 2}
                                    </Badge>
                                  )}
                                  {(project.selectedSystems || []).length === 0 && (
                                    <span className="text-xs text-gray-500 italic">No systems selected</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center justify-center gap-1">
                                {isEditing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={handleEditSave}
                                      data-testid={`save-project-${project.id}`}
                                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200"
                                      title="Save changes"
                                      disabled={updateProjectMutation.isPending}
                                    >
                                      <Check size={16} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={handleEditCancel}
                                      data-testid={`cancel-edit-${project.id}`}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                                      title="Cancel edit"
                                    >
                                      <X size={16} />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditStart(project)}
                                      data-testid={`edit-project-${project.id}`}
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
                                      title="Edit project"
                                    >
                                      <Edit size={16} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setSelectedProjectId(project.id)
                                      }
                                      data-testid={`view-project-${project.id}`}
                                      className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200"
                                      title="View details"
                                    >
                                      <Eye size={16} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleDeleteProject(project.id)
                                      }
                                      data-testid={`delete-project-${project.id}`}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                                      title="Delete project"
                                      disabled={deleteProjectMutation.isPending}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
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
                <Label className="text-xs font-medium text-gray-700">
                  Project Number
                </Label>
                <Input
                  value={selectedProject?.projectNumber || ""}
                  className="mt-1 text-sm"
                  readOnly
                  data-testid="input-project-number"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  Project Name
                </Label>
                <Input
                  value={selectedProject?.projectName || ""}
                  className="mt-1 text-sm"
                  data-testid="input-project-name"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  Location
                </Label>
                <Input
                  value={selectedProject?.location || ""}
                  className="mt-1 text-sm"
                  data-testid="input-location"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  Status
                </Label>
                <Badge
                  variant="secondary"
                  className={`mt-2 text-xs text-white ${getStatusColor(selectedProject?.status || "")}`}
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
                <Label className="text-xs font-medium text-gray-700">
                  PLC Name
                </Label>
                <Input
                  value="Not configured"
                  className="mt-1 text-sm"
                  data-testid="input-plc-name"
                  disabled
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  IPC Name
                </Label>
                <Input
                  value={selectedProject?.ipcName || ""}
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
            <CardTitle className="text-base">
              Plant Systems Configuration
            </CardTitle>
            <p className="text-xs text-gray-600">
              Select systems to include in this project
            </p>
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
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleSystemToggle(system.id)}
                    data-testid={`system-${system.id.toLowerCase()}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-lg ${system.color} text-white`}
                      >
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
                            onCheckedChange={() =>
                              handleSystemToggle(system.id)
                            }
                            data-testid={`checkbox-${system.id.toLowerCase()}`}
                          />
                          <span className="ml-2 text-xs">
                            {selected ? "Enabled" : "Disabled"}
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
                {selectedSystems.map((systemId) => {
                  const system = plantSystems.find((s) => s.id === systemId);
                  return system ? (
                    <Badge
                      key={systemId}
                      variant="secondary"
                      className="text-xs"
                    >
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
          <Button data-testid="button-save">Save Project Details</Button>
        </div>
      </div>
    </div>
  );
}
