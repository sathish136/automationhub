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
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Zap, 
  Cpu, 
  Network, 
  Factory,
  Plus,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Play,
  Wrench,
  Database
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { 
  AutomationProject, 
  InsertAutomationProject, 
  BeckhoffProduct,
  Site 
} from "@shared/schema";

// Form schemas
const projectSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().optional(),
  projectType: z.enum(["greenfield", "brownfield", "upgrade"]).default("greenfield"),
  estimatedBudget: z.number().min(0).optional(),
  plannedStartDate: z.date().optional(),
});

const WIZARD_STEPS = [
  { id: 1, title: "Project Setup", description: "Basic project information", icon: Settings },
  { id: 2, title: "Main Controller", description: "Select primary PLC", icon: Cpu },
  { id: 3, title: "Panel Structure", description: "Define panel hierarchy", icon: Factory },
  { id: 4, title: "Device Selection", description: "Choose automation devices", icon: Zap },
  { id: 5, title: "Communication", description: "RS485, Profinet setup", icon: Network },
  { id: 6, title: "I/O Calculation", description: "Calculate module requirements", icon: Database },
  { id: 7, title: "Review & Generate", description: "Final preparation list", icon: CheckCircle },
];

export default function AutomationWizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentProject, setCurrentProject] = useState<AutomationProject | null>(null);
  const [isCatalogInitialized, setIsCatalogInitialized] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectType: "greenfield",
    },
  });

  // Fetch sites for project creation
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
    queryFn: () => apiRequest({ url: "/api/sites" }),
  });

  // Fetch automation projects
  const { data: automationProjects = [], isLoading: projectsLoading } = useQuery<AutomationProject[]>({
    queryKey: ["/api/automation-projects"],
    queryFn: () => apiRequest({ url: "/api/automation-projects" }),
  });

  // Fetch Beckhoff products
  const { data: beckhoffProducts = [], isLoading: productsLoading } = useQuery<BeckhoffProduct[]>({
    queryKey: ["/api/beckhoff-products"],
    queryFn: () => apiRequest({ url: "/api/beckhoff-products" }),
    enabled: isCatalogInitialized,
  });

  // Initialize Beckhoff catalog mutation
  const initializeCatalogMutation = useMutation({
    mutationFn: () => apiRequest({ url: "/api/automation/init-beckhoff-catalog", method: "POST" }),
    onSuccess: (data) => {
      toast({
        title: "Catalog Initialized",
        description: `${data.count} Beckhoff products loaded successfully`,
      });
      setIsCatalogInitialized(true);
      queryClient.invalidateQueries({ queryKey: ["/api/beckhoff-products"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initialize Beckhoff catalog",
        variant: "destructive",
      });
    },
  });

  // Create automation project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: z.infer<typeof projectSchema>) => 
      apiRequest({ 
        url: "/api/automation-projects", 
        method: "POST", 
        data: {
          ...data,
          wizardStep: 2, // Move to next step after creation
        }
      }),
    onSuccess: (project) => {
      toast({
        title: "Project Created",
        description: `${project.projectName} created successfully`,
      });
      setCurrentProject(project);
      setCurrentStep(2);
      queryClient.invalidateQueries({ queryKey: ["/api/automation-projects"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Initialize catalog on component mount
  useEffect(() => {
    if (beckhoffProducts.length === 0 && !productsLoading) {
      initializeCatalogMutation.mutate();
    } else if (beckhoffProducts.length > 0) {
      setIsCatalogInitialized(true);
    }
  }, [beckhoffProducts.length, productsLoading]);

  const onSubmitProject = (data: z.infer<typeof projectSchema>) => {
    createProjectMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectProject = (project: AutomationProject) => {
    setCurrentProject(project);
    setCurrentStep(project.wizardStep || 2);
  };

  const getMainControllers = () => beckhoffProducts.filter(p => p.category === "controller" && p.subcategory === "main_controller");
  const getCouplers = () => beckhoffProducts.filter(p => p.category === "coupler");
  const getIOModules = (type: string) => beckhoffProducts.filter(p => p.category === "digital_io" || p.category === "analog_io");

  const currentStepData = WIZARD_STEPS.find(step => step.id === currentStep);
  const progressPercentage = (currentStep / WIZARD_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Automation PLC Wizard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Step-by-step automation planning with Beckhoff products, I/O calculation, and comprehensive documentation
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep} of {WIZARD_STEPS.length}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {WIZARD_STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = currentProject && step.id < currentStep;
              
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                    isActive 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : isCompleted
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${
                    isActive 
                      ? "text-blue-600" 
                      : isCompleted 
                      ? "text-green-600" 
                      : "text-gray-400"
                  }`} />
                  <span className={`text-sm font-medium ${
                    isActive 
                      ? "text-blue-900 dark:text-blue-100" 
                      : isCompleted
                      ? "text-green-900 dark:text-green-100"
                      : "text-gray-600 dark:text-gray-400"
                  }`}>
                    {step.title}
                  </span>
                  <span className={`text-xs text-center ${
                    isActive 
                      ? "text-blue-700 dark:text-blue-200" 
                      : isCompleted
                      ? "text-green-700 dark:text-green-200"
                      : "text-gray-500"
                  }`}>
                    {step.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                {currentStepData && <currentStepData.icon className="w-8 h-8 text-blue-600" />}
                <div>
                  <CardTitle className="text-2xl">{currentStepData?.title}</CardTitle>
                  <CardDescription className="text-lg">{currentStepData?.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Step 1: Project Setup */}
              {currentStep === 1 && (
                <div>
                  {!currentProject ? (
                    <>
                      {automationProjects.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold mb-4">Existing Projects</h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {automationProjects.map((project) => (
                              <Card 
                                key={project.id} 
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => selectProject(project)}
                                data-testid={`project-card-${project.id}`}
                              >
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg">{project.projectName}</CardTitle>
                                  <div className="flex justify-between items-center">
                                    <Badge variant={project.projectType === "greenfield" ? "default" : "secondary"}>
                                      {project.projectType}
                                    </Badge>
                                    <Badge variant="outline">
                                      Step {project.wizardStep || 1}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                {project.projectDescription && (
                                  <CardContent className="pt-0">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      {project.projectDescription}
                                    </p>
                                  </CardContent>
                                )}
                              </Card>
                            ))}
                          </div>
                          <Separator className="my-6" />
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
                        <Form {...projectForm}>
                          <form onSubmit={projectForm.handleSubmit(onSubmitProject)} className="space-y-6">
                            <FormField
                              control={projectForm.control}
                              name="siteId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Site</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="site-select">
                                        <SelectValue placeholder="Select a site" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {sites.map((site) => (
                                        <SelectItem key={site.id} value={site.id}>
                                          {site.name} ({site.location})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={projectForm.control}
                              name="projectName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter project name" {...field} data-testid="project-name-input" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={projectForm.control}
                              name="projectDescription"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Describe your automation project"
                                      {...field}
                                      data-testid="project-description-input"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={projectForm.control}
                              name="projectType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="project-type-select">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="greenfield">Greenfield (New Installation)</SelectItem>
                                      <SelectItem value="brownfield">Brownfield (Existing System)</SelectItem>
                                      <SelectItem value="upgrade">Upgrade/Modernization</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end">
                              <Button 
                                type="submit" 
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={createProjectMutation.isPending}
                                data-testid="create-project-button"
                              >
                                {createProjectMutation.isPending ? (
                                  "Creating..."
                                ) : (
                                  <>
                                    Create Project & Continue
                                    <ChevronRight className="ml-2 w-4 h-4" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2">Project: {currentProject.projectName}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Ready to continue with automation planning
                      </p>
                      <Button onClick={nextStep} data-testid="continue-project-button">
                        Continue to Main Controller Selection
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Main Controller Selection */}
              {currentStep === 2 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Main PLC Controller</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Choose the primary Beckhoff controller for your automation project
                  </p>
                  
                  {isCatalogInitialized ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {getMainControllers().map((controller) => (
                        <Card 
                          key={controller.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          data-testid={`controller-card-${controller.partNumber}`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{controller.partNumber}</CardTitle>
                                <CardDescription>{controller.productName}</CardDescription>
                              </div>
                              <Badge variant="secondary">
                                ${controller.unitPrice?.toLocaleString()}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                              {controller.productDescription}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">
                                {controller.powerConsumption}W
                              </Badge>
                              <Badge variant="outline">
                                {controller.supplyVoltage}
                              </Badge>
                              <Badge variant="outline">
                                {controller.communicationProtocol}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-300">
                        {initializeCatalogMutation.isPending ? "Loading Beckhoff product catalog..." : "Initializing product catalog..."}
                      </p>
                      {!initializeCatalogMutation.isPending && (
                        <Button 
                          onClick={() => initializeCatalogMutation.mutate()} 
                          className="mt-4"
                          data-testid="init-catalog-button"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Initialize Catalog
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Placeholder for other steps */}
              {currentStep > 2 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    {currentStepData && <currentStepData.icon className="w-8 h-8 text-blue-600" />}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{currentStepData?.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    This step will be implemented next: {currentStepData?.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    Coming soon: Complete automation planning workflow
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={prevStep} 
                  disabled={currentStep === 1}
                  data-testid="prev-step-button"
                >
                  <ChevronLeft className="mr-2 w-4 h-4" />
                  Previous
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={currentStep === WIZARD_STEPS.length || (currentStep === 1 && !currentProject)}
                  data-testid="next-step-button"
                >
                  Next
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}