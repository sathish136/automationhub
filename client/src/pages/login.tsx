import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Settings } from "lucide-react";

interface LoginData {
  email: string;
  password: string;
}

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email.trim() || !formData.password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(formData.email.trim().toLowerCase(), formData.password);
      
      toast({
        title: "Login Successful",
        description: "Welcome to AutomationHub!",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Invalid credentials. Please try again.";
      
      if (error.message) {
        errorMessage = error.message.replace(/^\d+:\s*/, '');
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof LoginData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="mx-auto h-20 w-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 border border-white/20">
            <Settings className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">AutomationHub</h1>
          <p className="text-xl text-blue-100 mb-8">Industrial Automation Management Platform</p>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-blue-100">Real-time Site Monitoring</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-blue-100">PLC Management & Backup</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-blue-100">User Access Control</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-blue-100">SQL Data Visualization</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 border border-white/20">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">AutomationHub</h2>
            <p className="text-blue-200">Industrial Automation Platform</p>
          </div>

          <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-gray-800">Welcome Back</CardTitle>
              <p className="text-gray-600 text-sm">Sign in to your account</p>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    placeholder="Enter your email"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    data-testid="input-email"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange('password')}
                    placeholder="Enter your password"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    data-testid="input-password"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 font-medium mb-1">Demo Credentials:</p>
                <p className="text-xs text-blue-600">admin@automationhub.com / admin123</p>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-xs text-gray-500">
                  Contact your administrator for login credentials
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}