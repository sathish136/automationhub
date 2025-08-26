import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Upload, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Zap,
  Shield,
  AlertCircle,
  Download,
  Trash2,
  Clock,
  FileImage,
  Activity,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { formatFileSize } from "@/lib/utils";

type DiagramType = "electrical" | "control" | "power" | "lighting" | "plc";
type RiskLevel = "low" | "medium" | "high" | "critical";
type AnalysisStatus = "pending" | "analyzing" | "completed" | "failed";

interface ElectricalDiagram {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  projectName?: string;
  diagramType: DiagramType;
  voltage?: string;
  description?: string;
  analysisStatus: AnalysisStatus;
  analysisResult?: any;
  corrections?: any[];
  safetyIssues?: any[];
  complianceIssues?: any[];
  recommendations?: any[];
  riskLevel?: RiskLevel;
  analysisScore?: number;
  processingTime?: number;
  createdAt: string;
  updatedAt: string;
}

const diagramTypeOptions = [
  { value: "electrical", label: "Electrical", icon: Zap },
  { value: "control", label: "Control System", icon: Activity },
  { value: "power", label: "Power Distribution", icon: TrendingUp },
  { value: "lighting", label: "Lighting", icon: Eye },
  { value: "plc", label: "PLC/Automation", icon: FileText },
  { value: "combined", label: "Combined Documentation", icon: FileImage },
  { value: "automation", label: "Automation Package", icon: Activity },
];

const riskColors = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

export default function ElectricalDiagrams() {
  const [selectedDiagram, setSelectedDiagram] = useState<ElectricalDiagram | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all diagrams
  const { data: diagrams = [], isLoading } = useQuery<ElectricalDiagram[]>({
    queryKey: ["/api/electrical-diagrams"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/electrical-diagrams/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electrical-diagrams"] });
      setShowUploadDialog(false);
      toast({
        title: "Success",
        description: "Diagram uploaded successfully. Analysis will begin shortly.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload diagram",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/electrical-diagrams/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electrical-diagrams"] });
      setSelectedDiagram(null);
      toast({
        title: "Success",
        description: "Diagram deleted successfully",
      });
    },
  });

  // Re-analyze mutation
  const reanalyzeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/electrical-diagrams/${id}/reanalyze`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reanalyze");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/electrical-diagrams"] });
      toast({
        title: "Success",
        description: "Analysis started. Please wait for results.",
      });
    },
  });

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (files: FileList) => {
    const file = files[0];
    const allowedTypes = ['image/', 'application/pdf'];
    const isValidFile = allowedTypes.some(type => file.type.startsWith(type));
    
    if (!isValidFile) {
      toast({
        title: "Error",
        description: "Please select an image file or PDF document",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error", 
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setShowUploadDialog(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = fileInputRef.current?.files?.[0];
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    formData.append("file", file);
    uploadMutation.mutate(formData);
  };

  const getStatusIcon = (status: AnalysisStatus) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "analyzing": return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getRiskBadge = (risk?: RiskLevel) => {
    if (!risk) return null;
    return (
      <Badge variant="outline" className={riskColors[risk]}>
        {risk.toUpperCase()}
      </Badge>
    );
  };

  const generateReport = async (diagram: ElectricalDiagram) => {
    try {
      const response = await fetch(`/api/electrical-diagrams/${diagram.id}/report`, {
        method: "GET",
      });
      if (!response.ok) throw new Error("Failed to generate report");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${diagram.projectName || diagram.originalFileName}_analysis_report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Automation Documentation Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            AI-powered analysis of electrical diagrams, automation systems, and technical documentation with safety and compliance recommendations
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} data-testid="button-upload-diagram">
          <Upload className="h-4 w-4 mr-2" />
          Upload Diagram
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileImage className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Diagrams</p>
                <p className="text-2xl font-bold">{diagrams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Analyzed</p>
                <p className="text-2xl font-bold">
                  {diagrams.filter(d => d.analysisStatus === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">High Risk</p>
                <p className="text-2xl font-bold">
                  {diagrams.filter(d => d.riskLevel === "high" || d.riskLevel === "critical").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Avg Score</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    diagrams.filter(d => d.analysisScore).reduce((acc, d) => acc + (d.analysisScore || 0), 0) / 
                    diagrams.filter(d => d.analysisScore).length || 0
                  )}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diagrams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading diagrams...</p>
          </div>
        ) : diagrams.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileImage className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No diagrams uploaded yet
            </h3>
            <p className="text-gray-500 mb-4">
              Upload your first electrical diagram to get AI-powered analysis
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Diagram
            </Button>
          </div>
        ) : (
          diagrams.map((diagram) => (
            <Card key={diagram.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedDiagram(diagram)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">
                    {diagram.projectName || diagram.originalFileName}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(diagram.analysisStatus)}
                    {getRiskBadge(diagram.riskLevel)}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="capitalize">{diagram.diagramType}</span>
                  <span>{formatFileSize(diagram.fileSize)}</span>
                </div>
              </CardHeader>
              <CardContent>
                {diagram.analysisStatus === "completed" && (
                  <div className="space-y-2">
                    {diagram.analysisScore && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Analysis Score</span>
                          <span>{diagram.analysisScore}%</span>
                        </div>
                        <Progress value={diagram.analysisScore} />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {diagram.safetyIssues && (
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-1 text-red-500" />
                          <span>{diagram.safetyIssues.length} Safety Issues</span>
                        </div>
                      )}
                      {diagram.corrections && (
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1 text-orange-500" />
                          <span>{diagram.corrections.length} Corrections</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {diagram.analysisStatus === "analyzing" && (
                  <div className="text-center py-4">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Analyzing diagram...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Electrical Diagram</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your documentation here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports images (PNG, JPG) and PDF documents
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input name="projectName" placeholder="Optional project name" />
              </div>

              <div>
                <Label htmlFor="diagramType">Documentation Type</Label>
                <Select name="diagramType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select documentation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {diagramTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <option.icon className="h-4 w-4 mr-2" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="voltage">Voltage (Optional)</Label>
                <Input name="voltage" placeholder="e.g., 240V, 480V, 11kV" />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  name="description" 
                  placeholder="Brief description of the diagram"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Upload & Analyze
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Analysis Details Dialog */}
      {selectedDiagram && (
        <Dialog open={!!selectedDiagram} onOpenChange={() => setSelectedDiagram(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {selectedDiagram.projectName || selectedDiagram.originalFileName}
                </DialogTitle>
                <div className="flex items-center space-x-2">
                  {selectedDiagram.analysisStatus === "completed" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateReport(selectedDiagram)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Report
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => reanalyzeMutation.mutate(selectedDiagram.id)}
                        disabled={reanalyzeMutation.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
                        Re-analyze
                      </Button>
                    </>
                  )}
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(selectedDiagram.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="safety">Safety Issues</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="corrections">Corrections</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Diagram Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="capitalize">{selectedDiagram.diagramType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>File Size:</span>
                        <span>{formatFileSize(selectedDiagram.fileSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uploaded:</span>
                        <span>{new Date(selectedDiagram.createdAt).toLocaleDateString()}</span>
                      </div>
                      {selectedDiagram.voltage && (
                        <div className="flex justify-between">
                          <span>Voltage:</span>
                          <span>{selectedDiagram.voltage}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Analysis Results</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Status:</span>
                        <div className="flex items-center">
                          {getStatusIcon(selectedDiagram.analysisStatus)}
                          <span className="ml-1 capitalize">{selectedDiagram.analysisStatus}</span>
                        </div>
                      </div>
                      {selectedDiagram.analysisScore && (
                        <div className="flex justify-between">
                          <span>Score:</span>
                          <span>{selectedDiagram.analysisScore}%</span>
                        </div>
                      )}
                      {selectedDiagram.riskLevel && (
                        <div className="flex justify-between items-center">
                          <span>Risk Level:</span>
                          {getRiskBadge(selectedDiagram.riskLevel)}
                        </div>
                      )}
                      {selectedDiagram.processingTime && (
                        <div className="flex justify-between">
                          <span>Processing Time:</span>
                          <span>{selectedDiagram.processingTime}s</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedDiagram.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedDiagram.description}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="safety" className="space-y-4">
                <h4 className="font-medium">Safety Issues</h4>
                {selectedDiagram.safetyIssues && selectedDiagram.safetyIssues.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDiagram.safetyIssues.map((issue: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                            <div className="flex-1">
                              <h5 className="font-medium">{issue.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                              {issue.severity && (
                                <Badge variant="outline" className={riskColors[issue.severity as RiskLevel]}>
                                  {issue.severity.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No safety issues identified</p>
                )}
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <h4 className="font-medium">Compliance Issues</h4>
                {selectedDiagram.complianceIssues && selectedDiagram.complianceIssues.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDiagram.complianceIssues.map((issue: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start">
                            <Shield className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />
                            <div className="flex-1">
                              <h5 className="font-medium">{issue.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                              {issue.standard && (
                                <p className="text-xs text-gray-500 mt-2">Standard: {issue.standard}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No compliance issues identified</p>
                )}
              </TabsContent>

              <TabsContent value="corrections" className="space-y-4">
                <h4 className="font-medium">Suggested Corrections</h4>
                {selectedDiagram.corrections && selectedDiagram.corrections.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDiagram.corrections.map((correction: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                            <div className="flex-1">
                              <h5 className="font-medium">{correction.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{correction.description}</p>
                              {correction.priority && (
                                <Badge variant="outline" className="mt-2">
                                  {correction.priority} Priority
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No corrections needed</p>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <h4 className="font-medium">Recommendations</h4>
                {selectedDiagram.recommendations && selectedDiagram.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDiagram.recommendations.map((rec: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                            <div className="flex-1">
                              <h5 className="font-medium">{rec.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                              {rec.benefit && (
                                <p className="text-xs text-green-600 mt-2">Benefit: {rec.benefit}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No additional recommendations</p>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}