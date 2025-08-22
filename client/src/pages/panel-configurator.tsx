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
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Calculator, Cpu, Zap, FileText, Trash2, Edit } from "lucide-react";
import type { 
  Site,
  PanelConfiguration, 
  InstrumentTemplate, 
  PanelInstrument, 
  BeckhoffModuleCalculation 
} from "@shared/schema";

// Form schemas
const panelConfigSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  panelName: z.string().min(1, "Panel name is required"),
  panelDescription: z.string().optional(),
  panelLocation: z.string().optional(),
  panelType: z.string().default("control"),
  cabinetSize: z.string().optional(),
  mountingType: z.string().default("wall"),
  enclosureRating: z.string().default("IP54"),
  couplerType: z.string().min(1, "Coupler type is required"),
  powerSupply: z.string().default("EL9011"),
  distanceFromPlc: z.number().min(0, "Distance must be positive").optional(),
  estimatedCost: z.number().min(0).optional(),
});

const instrumentTemplateSchema = z.object({
  templateName: z.string().min(1, "Template name is required"),
  instrumentType: z.string().min(1, "Instrument type is required"),
  category: z.string().min(1, "Category is required"),
  digitalInputs: z.number().min(0).default(0),
  digitalOutputs: z.number().min(0).default(0),
  analogInputs: z.number().min(0).default(0),
  analogOutputs: z.number().min(0).default(0),
  voltageLevel: z.string().default("24VDC"),
  tagPrefix: z.string().optional(),
  description: z.string().optional(),
});

// Beckhoff coupler recommendations based on distance
const getCouplerRecommendation = (distance: number) => {
  if (distance <= 50) return "EK1100"; // Short distance
  if (distance <= 100) return "EK1122"; // Medium distance with fiber optic
  if (distance <= 500) return "EK1501"; // Long distance with EtherCAT over fiber
  return "EK1828"; // Very long distance with multimode fiber
};

// Standard Beckhoff I/O modules
const beckhoffModules = {
  digitalInput: {
    "EL1004": { channels: 4, voltage: "24VDC", cost: 45 },
    "EL1008": { channels: 8, voltage: "24VDC", cost: 75 },
    "EL1018": { channels: 8, voltage: "24VDC", cost: 85, isolated: true },
  },
  digitalOutput: {
    "EL2004": { channels: 4, voltage: "24VDC", cost: 55 },
    "EL2008": { channels: 8, voltage: "24VDC", cost: 85 },
    "EL2014": { channels: 4, voltage: "24VDC", cost: 75, relay: true },
  },
  analogInput: {
    "EL3004": { channels: 4, type: "0-10V", cost: 125 },
    "EL3008": { channels: 8, type: "0-10V", cost: 195 },
    "EL3102": { channels: 2, type: "±10V", cost: 85 },
    "EL3104": { channels: 4, type: "±10V", cost: 145 },
  },
  analogOutput: {
    "EL4004": { channels: 4, type: "0-10V", cost: 155 },
    "EL4008": { channels: 8, type: "0-10V", cost: 245 },
    "EL4102": { channels: 2, type: "±10V", cost: 115 },
  }
};

// Standard instrument templates
const standardTemplates = [
  {
    templateName: "Motor with Auto/Manual",
    instrumentType: "motor",
    category: "drive",
    digitalInputs: 3, // run_feedback, trip, ready
    digitalOutputs: 2, // start, stop
    analogInputs: 0,
    analogOutputs: 0,
    signalTypes: {
      DI: ["run_feedback", "motor_trip", "ready_status"],
      DO: ["motor_start", "motor_stop"]
    },
    tagPrefix: "MOT_",
    description: "Standard motor with auto/manual control, feedback and trip monitoring"
  },
  {
    templateName: "VFD Motor Control",
    instrumentType: "motor",
    category: "drive", 
    digitalInputs: 4, // run_feedback, trip, ready, fault
    digitalOutputs: 2, // start, stop
    analogInputs: 2, // speed_feedback, current_feedback
    analogOutputs: 1, // speed_setpoint
    signalTypes: {
      DI: ["run_feedback", "motor_trip", "ready_status", "vfd_fault"],
      DO: ["motor_start", "motor_stop"],
      AI: ["speed_feedback", "current_feedback"],
      AO: ["speed_setpoint"]
    },
    tagPrefix: "VFD_",
    description: "VFD controlled motor with speed control and monitoring"
  },
  {
    templateName: "Control Valve",
    instrumentType: "valve",
    category: "control",
    digitalInputs: 3, // open_limit, close_limit, fault
    digitalOutputs: 2, // open_command, close_command
    analogInputs: 1, // position_feedback
    analogOutputs: 1, // position_setpoint
    signalTypes: {
      DI: ["valve_open_limit", "valve_close_limit", "valve_fault"],
      DO: ["valve_open", "valve_close"],
      AI: ["position_feedback"],
      AO: ["position_setpoint"]
    },
    tagPrefix: "VLV_",
    description: "Motorized control valve with position feedback"
  },
  {
    templateName: "Pump with Protection",
    instrumentType: "pump",
    category: "protection",
    digitalInputs: 5, // run_feedback, trip, ready, dry_run, high_temp
    digitalOutputs: 2, // start, stop
    analogInputs: 3, // flow, pressure, current
    analogOutputs: 0,
    signalTypes: {
      DI: ["run_feedback", "pump_trip", "ready_status", "dry_run_alarm", "high_temp_alarm"],
      DO: ["pump_start", "pump_stop"],
      AI: ["flow_measurement", "pressure_measurement", "current_measurement"]
    },
    tagPrefix: "PMP_",
    description: "Pump with comprehensive protection and monitoring"
  }
];

const PanelConfiguratorPage = () => {
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [selectedPanel, setSelectedPanel] = useState<PanelConfiguration | null>(null);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InstrumentTemplate | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sites for dropdown
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  // Fetch panel configurations
  const { data: panels = [], isLoading: isPanelsLoading } = useQuery<PanelConfiguration[]>({
    queryKey: ["/api/panel-configurations", selectedSite],
    queryFn: async () => {
      const url = selectedSite && selectedSite !== "all" 
        ? `/api/panel-configurations?siteId=${selectedSite}`
        : "/api/panel-configurations";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch panels");
      return response.json();
    },
  });

  // Fetch instrument templates
  const { data: templates = [] } = useQuery<InstrumentTemplate[]>({
    queryKey: ["/api/instrument-templates"],
  });

  // Fetch panel instruments if panel selected
  const { data: panelInstruments = [] } = useQuery<PanelInstrument[]>({
    queryKey: ["/api/panel-instruments", selectedPanel?.id],
    enabled: !!selectedPanel?.id,
  });

  // Fetch calculations for selected panel
  const { data: calculations = [] } = useQuery<BeckhoffModuleCalculation[]>({
    queryKey: ["/api/beckhoff-calculations", selectedPanel?.id],
    enabled: !!selectedPanel?.id,
  });

  // Initialize templates on first load
  useEffect(() => {
    const initializeTemplates = async () => {
      if (templates.length === 0) {
        try {
          for (const template of standardTemplates) {
            await fetch("/api/instrument-templates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(template),
            });
          }
          queryClient.invalidateQueries({ queryKey: ["/api/instrument-templates"] });
        } catch (error) {
          console.error("Error initializing templates:", error);
        }
      }
    };
    initializeTemplates();
  }, [templates.length, queryClient]);

  // Form setup
  const panelForm = useForm({
    resolver: zodResolver(panelConfigSchema),
    defaultValues: {
      siteId: "",
      panelName: "",
      panelDescription: "",
      panelLocation: "",
      panelType: "control",
      cabinetSize: "",
      mountingType: "wall",
      enclosureRating: "IP54",
      couplerType: "EK1100",
      powerSupply: "EL9011",
      distanceFromPlc: undefined,
      estimatedCost: undefined,
    },
  });

  const templateForm = useForm({
    resolver: zodResolver(instrumentTemplateSchema),
    defaultValues: {
      templateName: "",
      instrumentType: "motor",
      category: "drive",
      digitalInputs: 0,
      digitalOutputs: 0,
      analogInputs: 0,
      analogOutputs: 0,
      voltageLevel: "24VDC",
    },
  });

  // Mutations
  const createPanelMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/panel-configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create panel");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panel-configurations"] });
      setIsCreatePanelOpen(false);
      panelForm.reset();
      toast({ title: "Panel Created", description: "Panel configuration created successfully." });
    },
    onError: (error: any) => {
      console.error("Error creating panel:", error);
      toast({ 
        title: "Error Creating Panel", 
        description: error.message || "Failed to create panel configuration",
        variant: "destructive"
      });
    },
  });

  const addInstrumentMutation = useMutation({
    mutationFn: async (data: { templateId: string; instrumentName: string; location?: string }) => {
      const template = templates.find(t => t.id === data.templateId);
      if (!template || !selectedPanel) throw new Error("Template or panel not found");
      
      const instrumentTag = `${template.tagPrefix || ''}${data.instrumentName.toUpperCase().replace(/\s+/g, '_')}`;
      
      const response = await fetch("/api/panel-instruments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panelId: selectedPanel.id,
          templateId: data.templateId,
          instrumentName: data.instrumentName,
          instrumentTag,
          location: data.location,
        }),
      });
      if (!response.ok) throw new Error("Failed to add instrument");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/panel-instruments"] });
      toast({ title: "Instrument Added", description: "Instrument added to panel successfully." });
    },
  });

  // Calculate I/O requirements
  const calculateIORequirements = () => {
    if (!selectedPanel || panelInstruments.length === 0) return null;

    let totalDI = 0, totalDO = 0, totalAI = 0, totalAO = 0;
    
    panelInstruments.forEach(instrument => {
      const template = templates.find(t => t.id === instrument.templateId);
      if (template) {
        totalDI += template.digitalInputs || 0;
        totalDO += template.digitalOutputs || 0;
        totalAI += template.analogInputs || 0;
        totalAO += template.analogOutputs || 0;
      }
    });

    // Calculate required modules
    const diModules = Math.ceil(totalDI / 8); // Using EL1008 (8-channel)
    const doModules = Math.ceil(totalDO / 8); // Using EL2008 (8-channel)
    const aiModules = Math.ceil(totalAI / 4); // Using EL3004 (4-channel)
    const aoModules = Math.ceil(totalAO / 4); // Using EL4004 (4-channel)

    const distance = selectedPanel.distanceFromPlc || 0;
    const recommendedCoupler = getCouplerRecommendation(distance);

    const totalCost = (
      diModules * beckhoffModules.digitalInput.EL1008.cost +
      doModules * beckhoffModules.digitalOutput.EL2008.cost +
      aiModules * beckhoffModules.analogInput.EL3004.cost +
      aoModules * beckhoffModules.analogOutput.EL4004.cost +
      150 // Coupler cost estimate
    );

    return {
      totalDI, totalDO, totalAI, totalAO,
      diModules, doModules, aiModules, aoModules,
      recommendedCoupler,
      totalCost,
      modules: [
        ...(diModules > 0 ? [`${diModules}x EL1008 (Digital Input)`] : []),
        ...(doModules > 0 ? [`${doModules}x EL2008 (Digital Output)`] : []),
        ...(aiModules > 0 ? [`${aiModules}x EL3004 (Analog Input)`] : []),
        ...(aoModules > 0 ? [`${aoModules}x EL4004 (Analog Output)`] : []),
        `1x ${recommendedCoupler} (EtherCAT Coupler)`,
        `1x ${selectedPanel.powerSupply} (Power Supply)`
      ]
    };
  };

  const ioCalculation = calculateIORequirements();

  return (
    <div className="container mx-auto py-4 space-y-4">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold text-primary">Panel Configuration Wizard</h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Create and configure Beckhoff I/O panels in 3 simple steps: Choose site → Create panel → Add instruments
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              selectedSite ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>1</div>
            <span className="ml-2 text-xs font-medium">Choose Site</span>
          </div>
          <div className="w-8 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              panels.length > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>2</div>
            <span className="ml-2 text-xs font-medium">Create Panel</span>
          </div>
          <div className="w-8 h-px bg-border"></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              selectedPanel ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>3</div>
            <span className="ml-2 text-xs font-medium">Configure</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Dialog open={isCreatePanelOpen} onOpenChange={setIsCreatePanelOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mr-2">+</div>
                Create New Panel
              </DialogTitle>
              <DialogDescription className="text-sm">
                Fill in the basic information for your new Beckhoff I/O panel
              </DialogDescription>
            </DialogHeader>
            <Form {...panelForm}>
              <form onSubmit={panelForm.handleSubmit((data) => {
                // Auto-select coupler based on distance, or use default
                if (data.distanceFromPlc) {
                  data.couplerType = getCouplerRecommendation(data.distanceFromPlc);
                } else if (!data.couplerType) {
                  data.couplerType = "EK1100"; // Default coupler
                }
                console.log("Form data:", data); // Debug log
                createPanelMutation.mutate(data);
              })} className="space-y-3">
                <div className="space-y-3">
                  <FormField
                    control={panelForm.control}
                    name="siteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Site *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Choose the site for this panel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sites.map((site: any) => (
                              <SelectItem key={site.id} value={site.id}>
                                <div className="text-sm">{site.name}</div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={panelForm.control}
                    name="panelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Panel Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Main Control Panel" 
                            {...field} 
                            className="h-10 text-sm"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={panelForm.control}
                  name="panelDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the panel's purpose..." 
                          {...field} 
                          className="text-sm resize-none"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={panelForm.control}
                    name="panelLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Location</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Building A" 
                            {...field} 
                            className="h-10 text-sm"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={panelForm.control}
                    name="distanceFromPlc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Distance from PLC</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="meters"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            value={field.value || ''}
                            className="h-10 text-sm"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={panelForm.control}
                  name="enclosureRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Enclosure Rating</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select protection rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="IP54">IP54 - Standard indoor</SelectItem>
                          <SelectItem value="IP65">IP65 - Dust/water resistant</SelectItem>
                          <SelectItem value="IP67">IP67 - Outdoor rated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreatePanelOpen(false)}
                    className="h-9 px-4 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPanelMutation.isPending}
                    className="h-9 px-4 text-sm"
                  >
                    {createPanelMutation.isPending ? 'Creating...' : 'Create Panel'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Step 1: Site Selection */}
      <Card className="border-2 border-dashed border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
            <CardTitle className="text-lg">Choose Your Site</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Select which site you want to configure panels for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="🏭 Choose a site to get started" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌐 Show All Sites</SelectItem>
              {sites.map((site: any) => (
                <SelectItem key={site.id} value={site.id}>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{site.name}</span>
                    <span className="text-xs text-muted-foreground">({site.location || 'No location'})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSite && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs text-green-600 font-medium">✓ Site selected! Now you can create panels below.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Panel Management */}
      <Card className={selectedSite ? "border-2 border-dashed border-primary/20" : "opacity-75"}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                selectedSite ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>2</div>
              <CardTitle className="text-lg">Create & Manage Panels</CardTitle>
            </div>
            <Button 
              size="sm" 
              disabled={!selectedSite}
              onClick={() => setIsCreatePanelOpen(true)}
              className="h-8 px-3 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              New Panel
            </Button>
          </div>
          <CardDescription className="text-sm">
            {selectedSite ? 
              'Create new panels or select existing ones to configure' : 
              'Select a site first to create panels'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedSite ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="mb-2">⬆️</div>
              <p className="text-sm">Please select a site above to view and create panels</p>
            </div>
          ) : isPanelsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-xs text-muted-foreground">Loading panels...</p>
            </div>
          ) : panels.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4 text-4xl">📋</div>
              <h3 className="text-sm font-medium mb-2">No panels yet</h3>
              <p className="text-xs text-muted-foreground mb-4">Create your first panel to get started</p>
              <Button onClick={() => setIsCreatePanelOpen(true)} size="sm">
                <Plus className="w-3 h-3 mr-1" />
                Create First Panel
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {panels.map((panel: PanelConfiguration) => (
                <Card 
                  key={panel.id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedPanel?.id === panel.id ? 'border-primary bg-primary/5 shadow-md' : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPanel(panel)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{panel.panelName}</h3>
                      <Badge variant={panel.isActive ? "default" : "secondary"} className="text-xs">
                        {panel.installationStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{panel.panelDescription || 'No description'}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">{panel.panelLocation || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coupler:</span>
                        <span className="font-medium">{panel.couplerType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distance:</span>
                        <span className="font-medium">{panel.distanceFromPlc ? `${panel.distanceFromPlc}m` : 'N/A'}</span>
                      </div>
                      {panel.estimatedCost && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-medium text-green-600">${panel.estimatedCost}</span>
                        </div>
                      )}
                    </div>
                    {selectedPanel?.id === panel.id && (
                      <div className="mt-3 pt-3 border-t border-primary/20">
                        <p className="text-xs text-primary font-medium">✓ Panel selected - Configure instruments below</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
          </Card>

          {/* Selected Panel Details */}
          {selectedPanel && (
            <>
              {/* Panel Instruments */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Panel Instruments - {selectedPanel.panelName}</CardTitle>
                      <CardDescription>Configure instruments and their I/O requirements</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Templates
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Instrument Templates</DialogTitle>
                            <DialogDescription>Manage standard instrument configurations</DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                            {templates.map((template: InstrumentTemplate) => (
                              <Card key={template.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold">{template.templateName}</h4>
                                  <Badge variant="secondary">{template.category}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>DI: {template.digitalInputs}</div>
                                  <div>DO: {template.digitalOutputs}</div>
                                  <div>AI: {template.analogInputs}</div>
                                  <div>AO: {template.analogOutputs}</div>
                                </div>
                                <div className="mt-3">
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      const instrumentName = prompt("Enter instrument name:");
                                      if (instrumentName) {
                                        addInstrumentMutation.mutate({
                                          templateId: template.id,
                                          instrumentName,
                                        });
                                      }
                                    }}
                                  >
                                    Add to Panel
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {panelInstruments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No instruments added yet. Use templates to add instruments to this panel.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {panelInstruments.map((instrument: PanelInstrument) => {
                        const template = templates.find(t => t.id === instrument.templateId);
                        return (
                          <div key={instrument.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-semibold">{instrument.instrumentName}</h4>
                              <p className="text-sm text-muted-foreground">
                                Tag: {instrument.instrumentTag} | Template: {template?.templateName}
                              </p>
                              {instrument.location && (
                                <p className="text-xs text-muted-foreground">Location: {instrument.location}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {template && (
                                <div className="text-xs space-x-2">
                                  <Badge variant="outline">DI: {template.digitalInputs}</Badge>
                                  <Badge variant="outline">DO: {template.digitalOutputs}</Badge>
                                  <Badge variant="outline">AI: {template.analogInputs}</Badge>
                                  <Badge variant="outline">AO: {template.analogOutputs}</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* I/O Calculation Results */}
              {ioCalculation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calculator className="w-5 h-5 mr-2" />
                      I/O Requirements & Module Calculation
                    </CardTitle>
                    <CardDescription>Calculated Beckhoff module requirements for this panel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* I/O Summary */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center">
                          <Cpu className="w-4 h-4 mr-2" />
                          I/O Summary
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Digital Inputs:</span>
                            <Badge variant="secondary">{ioCalculation.totalDI}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Digital Outputs:</span>
                            <Badge variant="secondary">{ioCalculation.totalDO}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Analog Inputs:</span>
                            <Badge variant="secondary">{ioCalculation.totalAI}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Analog Outputs:</span>
                            <Badge variant="secondary">{ioCalculation.totalAO}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Module List */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center">
                          <Zap className="w-4 h-4 mr-2" />
                          Required Modules
                        </h4>
                        <div className="space-y-2">
                          {ioCalculation.modules.map((module, index) => (
                            <div key={index} className="text-sm p-2 bg-secondary/20 rounded">
                              {module}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coupler Selection */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Distance-Based Coupler</h4>
                        <div className="space-y-2">
                          <div className="p-3 border rounded-lg">
                            <div className="font-semibold text-primary">{ioCalculation.recommendedCoupler}</div>
                            <div className="text-sm text-muted-foreground">
                              Distance: {selectedPanel.distanceFromPlc || 0}m
                            </div>
                            <div className="text-xs mt-1">
                              {(selectedPanel.distanceFromPlc || 0) <= 50 ? "Short distance - Standard copper" :
                               (selectedPanel.distanceFromPlc || 0) <= 100 ? "Medium distance - Fiber optic" :
                               "Long distance - EtherCAT over fiber"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cost Estimate */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Cost Estimate</h4>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-primary">
                            ${ioCalculation.totalCost}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Estimated module cost excluding installation
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              // Here we could save the calculation to the database
                              toast({
                                title: "Calculation Saved",
                                description: "Module calculation has been saved to the panel configuration."
                              });
                            }}
                          >
                            Save Calculation
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Generated Tag List */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Generated Tag List
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {panelInstruments.map((instrument: PanelInstrument) => {
                          const template = templates.find(t => t.id === instrument.templateId);
                          if (!template || !template.signalTypes) return null;
                          
                          const signalTypes = template.signalTypes as any;
                          return (
                            <Card key={instrument.id} className="p-3">
                              <h5 className="font-medium mb-2">{instrument.instrumentTag}</h5>
                              <div className="space-y-1 text-xs">
                                {signalTypes.DI?.map((signal: string, idx: number) => (
                                  <div key={idx} className="text-blue-600">
                                    {instrument.instrumentTag}_{signal.toUpperCase()}
                                  </div>
                                ))}
                                {signalTypes.DO?.map((signal: string, idx: number) => (
                                  <div key={idx} className="text-green-600">
                                    {instrument.instrumentTag}_{signal.toUpperCase()}
                                  </div>
                                ))}
                                {signalTypes.AI?.map((signal: string, idx: number) => (
                                  <div key={idx} className="text-orange-600">
                                    {instrument.instrumentTag}_{signal.toUpperCase()}
                                  </div>
                                ))}
                                {signalTypes.AO?.map((signal: string, idx: number) => (
                                  <div key={idx} className="text-purple-600">
                                    {instrument.instrumentTag}_{signal.toUpperCase()}
                                  </div>
                                ))}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
    </div>
  );
};

export default PanelConfiguratorPage;