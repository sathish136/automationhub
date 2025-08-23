import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings } from "lucide-react";

interface LoginData {
  email: string;
  password: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: ''
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest('/api/auth/login', 'POST', data);
      return await response.json();
    },
    onSuccess: (data) => {
      const displayName = data.user.fullName || data.user.firstName || data.user.email;
      toast({
        title: "Login Successful",
        description: `Welcome back, ${displayName}!`,
      });
      // Store auth token or user info if needed
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userRoles', JSON.stringify(data.roles));
      setLocation('/');
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      let errorMessage = "Invalid credentials. Please try again.";
      
      // Parse error message from API response
      if (error.message) {
        // Remove status code prefix if present (e.g., "401: Invalid email or password")
        errorMessage = error.message.replace(/^\d+:\s*/, '');
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
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
    
    // Trim whitespace from email
    const loginData = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };
    
    loginMutation.mutate(loginData);
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
                disabled={loginMutation.isPending}
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
                disabled={loginMutation.isPending}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
            
            {loginMutation.error && (
              <div className="text-center mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  Having trouble logging in? Check your credentials or contact your administrator.
                </p>
              </div>
            )}
            
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