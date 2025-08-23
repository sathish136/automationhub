import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Settings, Lock, Mail } from "lucide-react";

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
  const [isVisible, setIsVisible] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
    <div className="min-h-screen flex bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Left side - Branding */}
      <div className={`hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="mx-auto h-20 w-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 border border-white/20 transform transition-all duration-700 hover:scale-110 hover:bg-white/20" style={{ animationDelay: '0.2s' }}>
            <Settings className="h-10 w-10 text-white animate-spin" style={{ animation: 'spin 8s linear infinite' }} />
          </div>
          <h1 className={`text-4xl font-bold mb-4 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ animationDelay: '0.4s' }}>AutomationHub</h1>
          <p className={`text-xl text-blue-100 mb-8 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ animationDelay: '0.6s' }}>Industrial Automation Management Platform</p>
          <div className="space-y-4 text-left">
            {[
              "Real-time Site Monitoring",
              "PLC Management & Backup", 
              "User Access Control",
              "SQL Data Visualization"
            ].map((feature, index) => (
              <div 
                key={feature}
                className={`flex items-center space-x-3 transition-all duration-700 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
                style={{ animationDelay: `${0.8 + index * 0.1}s` }}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-blue-100">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className={`max-w-md w-full transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
          <div className={`lg:hidden text-center mb-8 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="mx-auto h-16 w-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 border border-white/20 hover:scale-110 transition-transform duration-300">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">AutomationHub</h2>
            <p className="text-blue-200">Industrial Automation Platform</p>
          </div>

          <Card className={`backdrop-blur-sm bg-white/95 shadow-2xl border-0 transition-all duration-1000 hover:shadow-3xl hover:bg-white/98 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <CardHeader className="text-center pb-2">
              <CardTitle className={`text-2xl font-bold text-gray-800 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`} style={{ animationDelay: '0.5s' }}>Welcome Back</CardTitle>
              <p className={`text-gray-600 text-sm transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`} style={{ animationDelay: '0.6s' }}>Sign in to your account</p>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className={`transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ animationDelay: '0.7s' }}>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${emailFocused || formData.email ? 'text-blue-500' : 'text-gray-400'}`} />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange('email')}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder="Enter your email"
                      className={`h-12 pl-10 border-gray-300 transition-all duration-300 hover:border-blue-400 ${emailFocused ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg' : ''}`}
                      data-testid="input-email"
                      disabled={isLoading}
                    />
                    <Label 
                      htmlFor="email" 
                      className={`absolute left-10 transition-all duration-300 pointer-events-none ${
                        emailFocused || formData.email 
                          ? '-top-2 left-3 text-xs text-blue-600 bg-white px-1' 
                          : 'top-1/2 transform -translate-y-1/2 text-gray-500'
                      }`}
                    >
                      {emailFocused || formData.email ? 'Email Address' : ''}
                    </Label>
                  </div>
                </div>

                <div className={`transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ animationDelay: '0.8s' }}>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${passwordFocused || formData.password ? 'text-blue-500' : 'text-gray-400'}`} />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange('password')}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="Enter your password"
                      className={`h-12 pl-10 border-gray-300 transition-all duration-300 hover:border-blue-400 ${passwordFocused ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg' : ''}`}
                      data-testid="input-password"
                      disabled={isLoading}
                    />
                    <Label 
                      htmlFor="password" 
                      className={`absolute left-10 transition-all duration-300 pointer-events-none ${
                        passwordFocused || formData.password 
                          ? '-top-2 left-3 text-xs text-blue-600 bg-white px-1' 
                          : 'top-1/2 transform -translate-y-1/2 text-gray-500'
                      }`}
                    >
                      {passwordFocused || formData.password ? 'Password' : ''}
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className={`w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-500 transform hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                  disabled={isLoading}
                  data-testid="button-login"
                  style={{ animationDelay: '0.9s' }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
              
              <div className={`text-center mt-6 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ animationDelay: '1.0s' }}>
                <p className="text-xs text-gray-500">
                  Contact your administrator for login credentials
                </p>
              </div>

              {/* WTT International Footer */}
              <div className={`text-center mt-8 pt-4 border-t border-gray-200 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ animationDelay: '1.1s' }}>
                <p className="text-xs text-gray-400 font-medium">
                  Developed by <span className="text-blue-600 font-semibold">WTT International</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}