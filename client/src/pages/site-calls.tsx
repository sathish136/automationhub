import React, { useState, useEffect } from "react";
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
  Calendar,
  MapPin,
  Zap,
  Cpu,
  Settings,
  Search,
  Filter
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
  siteEngineer: z.string().min(1, "Site engineer is required"),
  assignedEngineer: z.string().optional(),
  targetResolutionTime: z.string().optional(),
});

// Engineer options
const siteEngineers = [
  "Mr.Vignesh",
  "Mr.Hariharan", 
  "Mr.Rajesh",
  "Mr.Arjun",
  "Mr.Sakthivel",
  "Ms.Sopana"
];

const attendingEngineers = [
  "Mr.Parthiban",
  "Mr.Gokul",
  "Mr.Raja", 
  "Mr.Nishanth"
];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [engineerFilter, setEngineerFilter] = useState("all");
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

  // Fetch site calls
  const { data: siteCalls = [], isLoading: callsLoading, refetch } = useQuery<SiteCall[]>({
    queryKey: ["/api/site-calls"],
  });

  // Generate call number
  const { data: callNumberData } = useQuery({
    queryKey: ["/api/site-calls/generate/call-number"],
    enabled: isCreateDialogOpen,
  });

  // Create site call mutation
  const createCallMutation = useMutation({
    mutationFn: (data: SiteCallFormData) => 
      apiRequest("/api/site-calls", "POST", {
        ...data,
        callNumber: (callNumberData as any)?.callNumber,
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
      apiRequest(`/api/site-calls/${id}/status`, "PATCH", { status, engineerRemarks }),
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
      apiRequest(`/api/site-calls/${id}/assign`, "PATCH", { assignedEngineer }),
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

  // Filter site calls
  const filteredSiteCalls = siteCalls.filter((call) => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      call.callNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.siteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.issueTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Site filter
    const matchesSite = siteFilter === "all" || call.siteId === siteFilter;
    
    // Type filter
    const matchesType = typeFilter === "all" || call.issueType === typeFilter;
    
    // Priority filter
    const matchesPriority = priorityFilter === "all" || call.issuePriority === priorityFilter;
    
    // Status filter
    const matchesStatus = statusFilter === "all" || call.callStatus === statusFilter;
    
    // Engineer filter
    const matchesEngineer = engineerFilter === "all" || call.assignedEngineer === engineerFilter;
    
    return matchesSearch && matchesSite && matchesType && matchesPriority && matchesStatus && matchesEngineer;
  });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-blue-100 dark:border-slate-700 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-700 dark:from-gray-100 dark:to-blue-300 bg-clip-text text-transparent">
                Site Calls
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Manage and track service calls efficiently
              </p>
            </div>
          </div>
          <div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 h-10 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200" data-testid="button-create-call">
              <Plus className="h-4 w-4" />
              New Call
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-lg">Create Site Call</DialogTitle>
              <DialogDescription className="text-sm">
                Report a new issue
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="siteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Site</FormLabel>
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
                            <SelectTrigger data-testid="select-site" className="h-8 text-sm">
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
                        <FormLabel className="text-sm">Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority" className="h-8 text-sm">
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

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="issueType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Issue Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-issue-type" className="h-8 text-sm">
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
                        <FormLabel className="text-sm">Category (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category" className="h-8 text-sm">
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
                      <FormLabel className="text-sm">Issue Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description" {...field} data-testid="input-issue-title" className="h-8 text-sm" />
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
                      <FormLabel className="text-sm">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed issue description..."
                          className="min-h-[60px] text-sm"
                          {...field} 
                          data-testid="textarea-issue-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="siteEngineer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Site Engineer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-site-engineer" className="h-8 text-sm">
                            <SelectValue placeholder="Select site engineer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {siteEngineers.map((engineer) => (
                            <SelectItem key={engineer} value={engineer}>
                              {engineer}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="assignedEngineer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Assigned Engineer (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-assigned-engineer" className="h-8 text-sm">
                              <SelectValue placeholder="Select engineer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {attendingEngineers.map((engineer) => (
                              <SelectItem key={engineer} value={engineer}>
                                {engineer}
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
                    name="targetResolutionTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Target Resolution (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            data-testid="input-target-resolution"
                            className="h-8 text-sm"
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
                    className="h-8 px-3 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCallMutation.isPending}
                    data-testid="button-submit-call"
                    className="h-8 px-3 text-sm"
                  >
                    {createCallMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              <div className="relative col-span-1 md:col-span-2 lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search calls, sites, or issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="input-search-calls"
                />
              </div>
              
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="h-9 text-sm border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" data-testid="select-site-filter">
                  <SelectValue placeholder="Site" />
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

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 text-sm border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" data-testid="select-type-filter">
                  <SelectValue placeholder="Type" />
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

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-9 text-sm border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" data-testid="select-priority-filter">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-sm border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={engineerFilter} onValueChange={setEngineerFilter}>
                <SelectTrigger className="h-9 text-sm border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" data-testid="select-engineer-filter">
                  <SelectValue placeholder="Engineer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Engineers</SelectItem>
                  {attendingEngineers.map((engineer) => (
                    <SelectItem key={engineer} value={engineer}>
                      {engineer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSiteFilter("all");
                  setTypeFilter("all");
                  setPriorityFilter("all");
                  setStatusFilter("all");
                  setEngineerFilter("all");
                }}
                className="h-9 px-4 text-sm border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                data-testid="button-clear-filters"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

      {/* Site Calls Table */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-gray-900 dark:text-gray-100">Site Calls</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-3 py-1">
                {filteredSiteCalls.length}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-0 pb-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-slate-800 border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-sm font-semibold py-4 px-6 text-gray-700 dark:text-gray-300">Call #</TableHead>
                  <TableHead className="text-sm font-semibold py-4 px-6 text-gray-700 dark:text-gray-300">Site</TableHead>
                  <TableHead className="text-sm font-semibold py-4 px-6 text-gray-700 dark:text-gray-300">Issue</TableHead>
                  <TableHead className="text-sm font-semibold py-4 px-6 text-gray-700 dark:text-gray-300">Type</TableHead>
                  <TableHead className="text-sm font-semibold py-4 px-6 text-gray-700 dark:text-gray-300">Priority</TableHead>
                  <TableHead className="text-sm font-semibold py-4 px-6 text-gray-700 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-sm font-semibold py-4 px-6 text-gray-700 dark:text-gray-300">Engineer</TableHead>
                  <TableHead className="text-sm font-semibold py-4 px-6 text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSiteCalls.map((call) => {
                  const issueTypeInfo = issueTypeConfig[call.issueType as keyof typeof issueTypeConfig];
                  const priorityInfo = priorityConfig[call.issuePriority as keyof typeof priorityConfig];
                  const statusInfo = statusConfig[call.callStatus as keyof typeof statusConfig];
                  const IconComponent = issueTypeInfo?.icon || AlertTriangle;

                  return (
                    <TableRow key={call.id} data-testid={`row-call-${call.id}`} className="hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-150 border-b border-gray-100 dark:border-gray-700">
                      <TableCell className="text-sm py-4 px-6 font-mono text-blue-600 dark:text-blue-400 font-medium">
                        {call.callNumber}
                      </TableCell>
                      <TableCell className="text-sm py-4 px-6 font-medium text-gray-900 dark:text-gray-100">
                        {call.siteName}
                      </TableCell>
                      <TableCell className="text-sm py-4 px-6 max-w-xs">
                        <div className="truncate font-medium text-gray-900 dark:text-gray-100">{call.issueTitle}</div>
                      </TableCell>
                      <TableCell className="text-sm py-4 px-6">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">{issueTypeInfo?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm py-4 px-6">
                        <Badge variant="secondary" className={`${priorityInfo?.color} text-white text-sm px-3 py-1 font-medium shadow-sm`}>
                          {priorityInfo?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm py-4 px-6">
                        <Badge variant="secondary" className={`${statusInfo?.color} text-white text-sm px-3 py-1 font-medium shadow-sm`}>
                          {statusInfo?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm py-4 px-6 text-gray-700 dark:text-gray-300">
                        {call.assignedEngineer || <span className="text-gray-400 italic">Unassigned</span>}
                      </TableCell>
                      <TableCell className="text-sm py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900 border-gray-200 dark:border-gray-600"
                            onClick={() => {
                              setSelectedCall(call);
                              setIsViewDialogOpen(true);
                            }}
                            data-testid={`button-view-${call.id}`}
                          >
                            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </Button>
                          <Select
                            value={call.callStatus || undefined}
                            onValueChange={(status) => handleStatusChange(call.id, status)}
                          >
                            <SelectTrigger className="w-28 h-8 text-sm border-gray-200 dark:border-gray-600">
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
                {filteredSiteCalls.length === 0 && siteCalls.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                        <span>No calls match your current filters</span>
                        <Button variant="outline" size="sm" onClick={() => {
                          setSearchTerm("");
                          setSiteFilter("all");
                          setTypeFilter("all");
                          setPriorityFilter("all");
                          setStatusFilter("all");
                          setEngineerFilter("all");
                        }} className="mt-2">
                          Clear Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {siteCalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Phone className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                        <span>No site calls found</span>
                        <p className="text-xs text-gray-400">Create your first call to get started</p>
                      </div>
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
                      <div>{formatDateTime(selectedCall.reportedAt?.toISOString() || null)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Assigned At</Label>
                      <div>{formatDateTime(selectedCall.assignedAt?.toISOString() || null)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Resolved At</Label>
                      <div>{formatDateTime(selectedCall.resolvedAt?.toISOString() || null)}</div>
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
    </div>
  );
}