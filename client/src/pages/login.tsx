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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Settings className="text-white" size={24} />
            </div>
          </div>
          <CardTitle className="text-xl">AutomationHub</CardTitle>
          <p className="text-sm text-gray-600">Sign in to access your dashboard</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="Enter your email"
                className="mt-1"
                data-testid="input-email"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                placeholder="Enter your password"
                className="mt-1"
                data-testid="input-password"
                disabled={isLoading}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="text-center mt-4">
              <p className="text-xs text-gray-600">
                Contact your administrator for login credentials
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}