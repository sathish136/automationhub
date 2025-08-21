import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  FileText, 
  HardDrive, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Tag,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { insertProgramBackupSchema, type ProgramBackup, type Site } from "@shared/schema";

const backupFormSchema = insertProgramBackupSchema.extend({
  file: z.instanceof(File).optional(),
});

type BackupFormData = z.infer<typeof backupFormSchema>;

export default function BackupsPage() {
  const [activeTab, setActiveTab] = useState<"program" | "hmi">("program");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<ProgramBackup | null>(null);
  const { toast } = useToast();

  // Fetch sites for dropdown
  const { data: sites } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  // Fetch backups based on active tab and selected site
  const { data: backups, isLoading } = useQuery<ProgramBackup[]>({
    queryKey: ["/api/backups", { type: activeTab, siteId: selectedSite === "all" ? undefined : selectedSite }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("type", activeTab);
      if (selectedSite !== "all") {
        params.append("siteId", selectedSite);
      }
      const response = await apiRequest(`/api/backups?${params}`, "GET");
      return response.json();
    },
  });

  const form = useForm<BackupFormData>({
    resolver: zodResolver(backupFormSchema),
    defaultValues: {
      type: activeTab,
      platform: "twincat",
      backupType: "manual",
      compileStatus: "unknown",
      createdBy: "Current User", // In real app, get from auth context
      isActive: true,
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: BackupFormData) => {
      const formData = new FormData();
      
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === "file" && value instanceof File) {
          formData.append("file", value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      return apiRequest("/api/backups", "POST", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      setShowUploadDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: "Backup uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload backup",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/backups/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      toast({
        title: "Success",
        description: "Backup deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete backup",
        variant: "destructive",
      });
    },
  });

  // Update form type when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as "program" | "hmi");
    form.setValue("type", value as "program" | "hmi");
  };

  const onSubmit = (data: BackupFormData) => {
    if (!data.file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(data);
  };

  const getCompileStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Warning</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Unknown</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter backups based on search term
  const filteredBackups = backups?.filter(backup =>
    backup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    backup.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    backup.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    backup.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Program & HMI Backup Management" 
        subtitle="Comprehensive backup management with detailed tracking and compilation status" 
      />
      
      <div className="p-6">
        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search backups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-backups"
              />
            </div>
          </div>
          
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-48" data-testid="select-site">
              <SelectValue placeholder="Select Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites?.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="whitespace-nowrap" data-testid="button-upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload Backup
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload {activeTab === "program" ? "Program" : "HMI"} Backup</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Backup Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter backup name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="siteId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select site" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sites?.map((site) => (
                                <SelectItem key={site.id} value={site.id}>
                                  {site.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="version"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Version</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., v1.0.0" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="twincat">TwinCAT</SelectItem>
                              <SelectItem value="codesys">CodeSys</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="compileStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compile Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="success">Success</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input placeholder="production, stable, test (comma-separated)" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe this backup..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comments</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional comments..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="compileErrors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compile Errors</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter compilation errors if any..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="file"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Backup File *</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".zip,.rar,.7z,.tar,.gz,.twincat,.pro"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                              }
                            }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowUploadDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={uploadMutation.isPending}
                      data-testid="button-submit-backup"
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Upload Backup"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs for Program/HMI */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="program" className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Program Backups
            </TabsTrigger>
            <TabsTrigger value="hmi" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              HMI Backups
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredBackups.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <HardDrive className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No {activeTab} backups found
                  </h3>
                  <p className="text-gray-600 text-center mb-4">
                    {searchTerm ? "No backups match your search criteria." : "Upload your first backup to get started."}
                  </p>
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Backup
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBackups.map((backup) => (
                  <Card key={backup.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-1" title={backup.name}>
                          {backup.name}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedBackup(backup)}
                            data-testid={`button-edit-${backup.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(backup.id)}
                            data-testid={`button-delete-${backup.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {backup.createdAt ? formatDate(backup.createdAt) : "N/A"}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        {getCompileStatusBadge(backup.compileStatus || "unknown")}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Version:</span>
                        <span className="text-sm text-gray-600">{backup.version || "N/A"}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Platform:</span>
                        <Badge variant="outline" className="capitalize">
                          {backup.platform}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Size:</span>
                        <span className="text-sm text-gray-600">
                          {backup.fileSize ? formatFileSize(backup.fileSize) : "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{backup.createdBy}</span>
                      </div>

                      {backup.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {backup.tags.split(',').map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              <Tag className="w-2 h-2 mr-1" />
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {backup.description && (
                        <p className="text-sm text-gray-600 line-clamp-2" title={backup.description}>
                          {backup.description}
                        </p>
                      )}

                      {backup.isActive && (
                        <Badge className="bg-blue-100 text-blue-800 w-fit">
                          Active Backup
                        </Badge>
                      )}

                      <div className="pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          data-testid={`button-download-${backup.id}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}