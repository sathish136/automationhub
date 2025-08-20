import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlcIoCalculationSchema, type PlcIoCalculation, type InsertPlcIoCalculation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Plus, Settings, Play, Pause, Edit, Trash2 } from "lucide-react";
import { z } from "zod";

const PlcCalculationsPage = () => {
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCalculation, setEditingCalculation] = useState<PlcIoCalculation | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch sites for dropdown
  const { data: sites = [] } = useQuery({
    queryKey: ["/api/sites"],
  });

  // Fetch PLC I/O calculations
  const { data: calculations = [], isLoading } = useQuery({
    queryKey: ["/api/plc-calculations", selectedSite],
  });

  // Fetch PLC I/O points for calculations
  const { data: ioPoints = [] } = useQuery({
    queryKey: ["/api/plc-io-points"],
  });

  const form = useForm<InsertPlcIoCalculation>({
    resolver: zodResolver(insertPlcIoCalculationSchema),
    defaultValues: {
      siteId: "",
      calculationName: "",
      calculationDescription: "",
      calculationType: "scaling",
      inputPoints: [],
      formula: "",
      constants: {},
      outputVariable: "",
      outputUnit: "",
      outputDataType: "REAL",
      executionInterval: 1000,
      isActive: true,
      priority: 5,
    },
  });

  // Create/Update calculation mutation
  const createCalculationMutation = useMutation({
    mutationFn: async (data: InsertPlcIoCalculation) => {
      const url = editingCalculation ? `/api/plc-calculations/${editingCalculation.id}` : "/api/plc-calculations";
      const method = editingCalculation ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save calculation");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plc-calculations"] });
      setIsDialogOpen(false);
      setEditingCalculation(null);
      form.reset();
      toast({
        title: editingCalculation ? "Calculation Updated" : "Calculation Created",
        description: "PLC I/O calculation has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save calculation.",
        variant: "destructive",
      });
    },
  });

  // Delete calculation mutation
  const deleteCalculationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/plc-calculations/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete calculation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plc-calculations"] });
      toast({
        title: "Calculation Deleted",
        description: "PLC I/O calculation has been deleted successfully.",
      });
    },
  });

  // Toggle calculation active status
  const toggleCalculationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/plc-calculations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plc-calculations"] });
      toast({
        title: "Status Updated",
        description: "Calculation status has been updated.",
      });
    },
  });

  const openDialog = (calculation?: PlcIoCalculation) => {
    if (calculation) {
      setEditingCalculation(calculation);
      form.reset({
        siteId: calculation.siteId,
        calculationName: calculation.calculationName,
        calculationDescription: calculation.calculationDescription || "",
        calculationType: calculation.calculationType,
        inputPoints: calculation.inputPoints as any[] || [],
        formula: calculation.formula || "",
        constants: calculation.constants as any || {},
        outputVariable: calculation.outputVariable,
        outputUnit: calculation.outputUnit || "",
        outputDataType: calculation.outputDataType,
        executionInterval: calculation.executionInterval,
        isActive: calculation.isActive,
        priority: calculation.priority,
        resultMin: calculation.resultMin ? Number(calculation.resultMin) : undefined,
        resultMax: calculation.resultMax ? Number(calculation.resultMax) : undefined,
        validationRules: calculation.validationRules as any || {},
        exampleCalculation: calculation.exampleCalculation || "",
        notes: calculation.notes || "",
        version: calculation.version || "1.0",
      });
    } else {
      setEditingCalculation(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: InsertPlcIoCalculation) => {
    createCalculationMutation.mutate(data);
  };

  const getStatusBadge = (calculation: PlcIoCalculation) => {
    if (!calculation.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return "text-gray-600";
    if (priority >= 8) return "text-red-600";
    if (priority >= 6) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            PLC I/O Calculations
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage Beckhoff TwinCAT calculation logic and real-time processing
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Calculation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCalculation ? "Edit Calculation" : "Create New Calculation"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList>
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="calculation">Calculation</TabsTrigger>
                    <TabsTrigger value="execution">Execution</TabsTrigger>
                    <TabsTrigger value="validation">Validation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="siteId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select site" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(sites) && sites.map((site: any) => (
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
                        name="calculationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calculation Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="scaling">Scaling</SelectItem>
                                <SelectItem value="flow_compensation">Flow Compensation</SelectItem>
                                <SelectItem value="temperature_correction">Temperature Correction</SelectItem>
                                <SelectItem value="pressure_correction">Pressure Correction</SelectItem>
                                <SelectItem value="ph_compensation">pH Compensation</SelectItem>
                                <SelectItem value="energy_calculation">Energy Calculation</SelectItem>
                                <SelectItem value="efficiency_calculation">Efficiency Calculation</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="calculationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calculation Name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="e.g., MBR Flow Compensation" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="calculationDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} placeholder="Describe what this calculation does..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="calculation" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="formula"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formula</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              value={field.value || ""}
                              placeholder="e.g., (input1 * constant1) + (input2 / constant2)"
                              className="font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="outputVariable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Output Variable</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="e.g., GVL.CalculatedFlow" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="outputUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Output Unit</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="e.g., L/min, °C, bar" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="outputDataType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Output Data Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="REAL">REAL</SelectItem>
                              <SelectItem value="DINT">DINT</SelectItem>
                              <SelectItem value="INT">INT</SelectItem>
                              <SelectItem value="BOOL">BOOL</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="execution" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="executionInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Execution Interval (ms)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority (1-10)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="10"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Enable this calculation for execution
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="validation" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="resultMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Result Minimum</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="any"
                                {...field}
                                value={field.value?.toString() || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="resultMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Result Maximum</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="any"
                                {...field}
                                value={field.value?.toString() || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="exampleCalculation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Example Calculation</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} placeholder="Example: (25.5 * 1.2) + (30.0 / 2.0) = 45.6" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} placeholder="Additional notes or documentation..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCalculationMutation.isPending}>
                    {createCalculationMutation.isPending ? "Saving..." : "Save Calculation"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Site Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Filter & Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium">Site Filter:</label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {Array.isArray(sites) && sites.map((site: any) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : !Array.isArray(calculations) || calculations.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No calculations configured</p>
              <p className="text-muted-foreground mb-4">
                Create your first PLC I/O calculation to get started
              </p>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Calculation
              </Button>
            </CardContent>
          </Card>
        ) : (
          Array.isArray(calculations) && calculations.map((calculation: PlcIoCalculation) => (
            <Card key={calculation.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{calculation.calculationName}</CardTitle>
                    <CardDescription>{calculation.calculationType}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(calculation)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {calculation.calculationDescription}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Output:</span>
                    <div className="text-muted-foreground">{calculation.outputVariable}</div>
                  </div>
                  <div>
                    <span className="font-medium">Unit:</span>
                    <div className="text-muted-foreground">{calculation.outputUnit || "N/A"}</div>
                  </div>
                  <div>
                    <span className="font-medium">Interval:</span>
                    <div className="text-muted-foreground">{calculation.executionInterval}ms</div>
                  </div>
                  <div>
                    <span className="font-medium">Priority:</span>
                    <div className={`font-medium ${getPriorityColor(calculation.priority)}`}>
                      {calculation.priority}/10
                    </div>
                  </div>
                </div>

                {calculation.formula && (
                  <div>
                    <span className="font-medium text-sm">Formula:</span>
                    <div className="bg-muted p-2 rounded text-xs font-mono mt-1">
                      {calculation.formula}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleCalculationMutation.mutate({
                        id: calculation.id,
                        isActive: !calculation.isActive
                      })}
                    >
                      {calculation.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog(calculation)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this calculation?")) {
                          deleteCalculationMutation.mutate(calculation.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    v{calculation.version}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PlcCalculationsPage;