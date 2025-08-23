import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Plus, 
  Edit3, 
  Eye, 
  Wrench,
  AlertTriangle,
  Clock,
  User,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  MapPin,
  Zap,
  Cpu,
  Settings
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { SiteCall, InsertSiteCall, Site } from "@shared/schema";

// Form schemas
const siteCallSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  siteName: z.string().min(1, "Site name is required"),
  issueType: z.enum(["program", "instrument", "electrical", "operational"]),
  issueCategory: z.string().optional(),
  issuePriority: z.enum(["low", "medium", "high", "critical"]),
  issueTitle: z.string().min(1, "Issue title is required"),
  issueDescription: z.string().min(1, "Issue description is required"),
  callerName: z.string().min(1, "Caller name is required"),
  callerContact: z.string().optional(),
  callerDepartment: z.string().optional(),
  assignedEngineer: z.string().optional(),
  targetResolutionTime: z.string().optional(),
});

type SiteCallFormData = z.infer<typeof siteCallSchema>;

// Issue type configurations
const issueTypeConfig = {
  program: {
    label: "Program Issue",
    icon: Cpu,
    color: "bg-blue-500",
    categories: ["Logic Error", "Sequence Problem", "Timer Issue", "Counter Issue", "Function Block Error"]
  },
  instrument: {
    label: "Instrument Issue", 
    icon: Wrench,
    color: "bg-green-500",
    categories: ["Sensor Failure", "Calibration Error", "Communication Loss", "Reading Accuracy", "Physical Damage"]
  },
  electrical: {
    label: "Electrical Issue",
    icon: Zap, 
    color: "bg-yellow-500",
    categories: ["Power Supply", "Wiring Fault", "Short Circuit", "Relay Problem", "Contactor Issue"]
  },
  operational: {
    label: "Operational Mistake",
    icon: Settings,
    color: "bg-purple-500", 
    categories: ["Wrong Operation", "Parameter Setting", "User Error", "Process Deviation", "Safety Protocol"]
  }
};

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-500" },
  medium: { label: "Medium", color: "bg-blue-500" },
  high: { label: "High", color: "bg-orange-500" },
  critical: { label: "Critical", color: "bg-red-500" }
};

const statusConfig = {
  open: { label: "Open", color: "bg-red-500" },
  assigned: { label: "Assigned", color: "bg-blue-500" },
  in_progress: { label: "In Progress", color: "bg-yellow-500" },
  resolved: { label: "Resolved", color: "bg-green-500" },
  closed: { label: "Closed", color: "bg-gray-500" }
};

export default function SiteCallsPage() {
  const [selectedCall, setSelectedCall] = useState<SiteCall | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    siteId: "",
    status: "",
    issueType: "",
    assignedEngineer: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SiteCallFormData>({
    resolver: zodResolver(siteCallSchema),
    defaultValues: {
      issuePriority: "medium",
      issueType: "program",
    },
  });

  // Fetch sites for dropdown
  const { data: sites = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  // Fetch site calls with filters
  const { data: siteCalls = [], isLoading: callsLoading, refetch } = useQuery<SiteCall[]>({
    queryKey: ["/api/site-calls", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return apiRequest(`/api/site-calls?${params.toString()}`);
    },
  });

  // Generate call number
  const { data: callNumberData } = useQuery({
    queryKey: ["/api/site-calls/generate/call-number"],
    enabled: isCreateDialogOpen,
  });

  // Create site call mutation
  const createCallMutation = useMutation({
    mutationFn: (data: SiteCallFormData) => 
      apiRequest("/api/site-calls", { 
        method: "POST", 
        body: JSON.stringify({
          ...data,
          callNumber: callNumberData?.callNumber,
        }) 
      }),
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/site-calls"] });
      toast({ title: "Site call created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create site call", variant: "destructive" });
    },
  });

  // Update call status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, engineerRemarks }: { id: string; status: string; engineerRemarks?: string }) =>
      apiRequest(`/api/site-calls/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, engineerRemarks }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-calls"] });
      toast({ title: "Call status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update call status", variant: "destructive" });
    },
  });

  // Assign engineer mutation
  const assignEngineerMutation = useMutation({
    mutationFn: ({ id, assignedEngineer }: { id: string; assignedEngineer: string }) =>
      apiRequest(`/api/site-calls/${id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ assignedEngineer }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-calls"] });
      toast({ title: "Engineer assigned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to assign engineer", variant: "destructive" });
    },
  });

  const onSubmit = (data: SiteCallFormData) => {
    createCallMutation.mutate(data);
  };

  const handleStatusChange = (callId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: callId, status: newStatus });
  };

  const handleAssignEngineer = (callId: string, engineer: string) => {
    assignEngineerMutation.mutate({ id: callId, assignedEngineer: engineer });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString();
  };

  const getTimeSinceReported = (reportedAt: string) => {
    const reported = new Date(reportedAt);
    const now = new Date();
    const diffMs = now.getTime() - reported.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)} days ago`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    } else {
      return `${minutes}m ago`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Phone className="h-5 w-5 text-blue-600" />
            Site Calls Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage service calls across all sites
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 h-9 px-3" data-testid="button-create-call">
              <Plus className="h-4 w-4" />
              <span className="text-sm">New Site Call</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Site Call</DialogTitle>
              <DialogDescription>
                Report a new issue that needs engineering attention
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="siteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            const site = sites.find(s => s.id === value);
                            if (site) {
                              form.setValue("siteName", site.name);
                            }
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-site">
                              <SelectValue placeholder="Select site" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sites.map((site) => (
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
                    name="issuePriority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(priorityConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-issue-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(issueTypeConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <config.icon className="h-4 w-4" />
                                  {config.label}
                                </div>
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
                    name="issueCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.watch("issueType") && issueTypeConfig[form.watch("issueType") as keyof typeof issueTypeConfig]?.categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="issueTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of the issue" {...field} data-testid="input-issue-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issueDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide detailed information about the issue, what happened, when it started, and any error messages..."
                          className="min-h-[100px]"
                          {...field} 
                          data-testid="textarea-issue-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="callerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caller Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Who is reporting" {...field} data-testid="input-caller-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="callerContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone or email" {...field} data-testid="input-caller-contact" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="callerDepartment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Which department" {...field} data-testid="input-caller-department" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assignedEngineer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Engineer (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Engineer name" {...field} data-testid="input-assigned-engineer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetResolutionTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Resolution (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            data-testid="input-target-resolution"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCallMutation.isPending}
                    data-testid="button-submit-call"
                  >
                    {createCallMutation.isPending ? "Creating..." : "Create Call"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label htmlFor="site-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300">Site</Label>
              <Select 
                value={filters.siteId || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, siteId: value === 'all' ? '' : value }))}
              >
                <SelectTrigger data-testid="filter-site" className="h-8 text-sm">
                  <SelectValue placeholder="All sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300">Status</Label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
              >
                <SelectTrigger data-testid="filter-status" className="h-8 text-sm">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300">Issue Type</Label>
              <Select 
                value={filters.issueType || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, issueType: value === 'all' ? '' : value }))}
              >
                <SelectTrigger data-testid="filter-issue-type" className="h-8 text-sm">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(issueTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="engineer-filter" className="text-xs font-medium text-gray-700 dark:text-gray-300">Engineer</Label>
              <Input
                placeholder="Engineer name..."
                value={filters.assignedEngineer}
                onChange={(e) => setFilters(prev => ({ ...prev, assignedEngineer: e.target.value }))}
                data-testid="filter-engineer"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Calls Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Active Site Calls 
            <Badge variant="secondary" className="ml-2 text-xs">{siteCalls.length}</Badge>
          </CardTitle>
          <CardDescription className="text-sm">
            Manage and track all site service calls
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 py-2">Call #</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 py-2">Site</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 py-2">Issue</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 py-2">Type</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 py-2">Priority</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 py-2">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 py-2">Engineer</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 py-2">Reported</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siteCalls.map((call) => {
                  const issueTypeInfo = issueTypeConfig[call.issueType as keyof typeof issueTypeConfig];
                  const priorityInfo = priorityConfig[call.issuePriority as keyof typeof priorityConfig];
                  const statusInfo = statusConfig[call.callStatus as keyof typeof statusConfig];
                  const IconComponent = issueTypeInfo?.icon || AlertTriangle;

                  return (
                    <TableRow key={call.id} data-testid={`row-call-${call.id}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <TableCell className="font-mono text-xs py-2 font-medium text-blue-600">
                        {call.callNumber}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{call.siteName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs py-2">
                        <div className="truncate font-medium text-xs">{call.issueTitle}</div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {call.issueDescription}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1">
                          <IconComponent className="h-3 w-3" />
                          <span className="text-xs">{issueTypeInfo?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary" className={`${priorityInfo?.color} text-white text-xs px-2 py-1`}>
                          {priorityInfo?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary" className={`${statusInfo?.color} text-white text-xs px-2 py-1`}>
                          {statusInfo?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{call.assignedEngineer || "Unassigned"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-xs">
                          <div className="font-medium">{formatDateTime(call.reportedAt)}</div>
                          <div className="text-muted-foreground">
                            {getTimeSinceReported(call.reportedAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setSelectedCall(call);
                              setIsViewDialogOpen(true);
                            }}
                            data-testid={`button-view-${call.id}`}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Select
                            value={call.callStatus}
                            onValueChange={(status) => handleStatusChange(call.id, status)}
                          >
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {siteCalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground text-sm">
                      No site calls found. Create your first site call to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Call Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Site Call Details - {selectedCall?.callNumber}
            </DialogTitle>
            <DialogDescription>
              Complete information and history for this service call
            </DialogDescription>
          </DialogHeader>
          
          {selectedCall && (
            <div className="space-y-6">
              {/* Call Overview */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Call Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Call Number</Label>
                      <div className="font-mono text-lg">{selectedCall.callNumber}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Site</Label>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {selectedCall.siteName}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Issue Type</Label>
                      <div className="flex items-center gap-2">
                        {issueTypeConfig[selectedCall.issueType as keyof typeof issueTypeConfig]?.icon && (
                          React.createElement(issueTypeConfig[selectedCall.issueType as keyof typeof issueTypeConfig].icon, { className: "h-4 w-4" })
                        )}
                        {issueTypeConfig[selectedCall.issueType as keyof typeof issueTypeConfig]?.label}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                      <Badge variant="secondary" className={`${priorityConfig[selectedCall.issuePriority as keyof typeof priorityConfig]?.color} text-white`}>
                        {priorityConfig[selectedCall.issuePriority as keyof typeof priorityConfig]?.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status & Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Current Status</Label>
                      <Badge variant="secondary" className={`${statusConfig[selectedCall.callStatus as keyof typeof statusConfig]?.color} text-white`}>
                        {statusConfig[selectedCall.callStatus as keyof typeof statusConfig]?.label}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Reported At</Label>
                      <div>{formatDateTime(selectedCall.reportedAt)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Assigned At</Label>
                      <div>{formatDateTime(selectedCall.assignedAt)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Resolved At</Label>
                      <div>{formatDateTime(selectedCall.resolvedAt)}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Issue Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Issue Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                    <div className="text-lg font-medium">{selectedCall.issueTitle}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">
                      {selectedCall.issueDescription}
                    </div>
                  </div>
                  {selectedCall.issueCategory && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                      <div>{selectedCall.issueCategory}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* People Involved */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Caller Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedCall.callerName}
                      </div>
                    </div>
                    {selectedCall.callerContact && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                        <div>{selectedCall.callerContact}</div>
                      </div>
                    )}
                    {selectedCall.callerDepartment && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                        <div>{selectedCall.callerDepartment}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Engineering Response</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Assigned Engineer</Label>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        {selectedCall.assignedEngineer || "Not assigned"}
                      </div>
                    </div>
                    {selectedCall.engineerRemarks && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Engineer Remarks</Label>
                        <div className="bg-muted p-3 rounded-md">
                          {selectedCall.engineerRemarks}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Call
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}