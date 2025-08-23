import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Users, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  isActive: boolean;
  createdAt: string;
  roles?: Role[];
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
}

interface UserFormData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: ''
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleManager, setShowRoleManager] = useState(false);

  // Fetch users with auth token and their roles
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const users = await response.json();
      
      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        users.map(async (user: User) => {
          try {
            const rolesResponse = await fetch(`/api/users/${user.id}/roles`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (rolesResponse.ok) {
              const userRoles = await rolesResponse.json();
              return { ...user, roles: userRoles };
            }
            return { ...user, roles: [] };
          } catch (error) {
            console.warn(`Failed to fetch roles for user ${user.id}:`, error);
            return { ...user, roles: [] };
          }
        })
      );
      
      return usersWithRoles;
    },
  });

  // Fetch roles
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const token = localStorage.getItem('authToken');
      
      // Create user first
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.message || 'Failed to create user');
      }
      
      const newUser = await userResponse.json();
      
      // Assign role if selected
      if (userData.roleId && userData.roleId !== '') {
        const roleResponse = await fetch('/api/user-roles', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: newUser.id,
            roleId: userData.roleId,
          }),
        });
        
        if (!roleResponse.ok) {
          console.warn('Failed to assign role, but user was created successfully');
        }
      }
      
      return newUser;
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowCreateUser(false);
      setFormData({ email: '', password: '', firstName: '', lastName: '', roleId: '' });
    },
    onError: (error: any) => {
      console.error("Create user error:", error);
      let errorMessage = "Failed to create user. Please try again.";
      
      if (error.message) {
        errorMessage = error.message.replace(/^\d+:\s*/, '');
      }
      
      toast({
        title: "Error Creating User",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      console.error("Delete user error:", error);
      let errorMessage = "Failed to delete user. Please try again.";
      
      if (error.message) {
        errorMessage = error.message.replace(/^\d+:\s*/, '');
      }
      
      toast({
        title: "Error Deleting User",
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
        description: "Email and password are required.",
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
    
    // Password validation
    if (formData.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    // Clean up data
    const userData = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      firstName: formData.firstName?.trim() || undefined,
      lastName: formData.lastName?.trim() || undefined,
      roleId: formData.roleId || undefined,
    };
    
    createUserMutation.mutate(userData);
  };

  const handleChange = (field: keyof UserFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleManageRoles = (user: User) => {
    setSelectedUser(user);
    setShowRoleManager(true);
  };

  // Role assignment mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user-roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, roleId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Assigned",
        description: "Role has been assigned successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Assigning Role",
        description: error.message || "Failed to assign role.",
        variant: "destructive",
      });
    },
  });

  // Role removal mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/user-roles/${userId}/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Removed",
        description: "Role has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Removing Role",
        description: error.message || "Failed to remove role.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="text-primary" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">Manage system users and their access</p>
        </div>
        
        <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="user@company.com"
                  data-testid="input-user-email"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  placeholder="Enter password"
                  data-testid="input-user-password"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  placeholder="John"
                  data-testid="input-user-firstname"
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  placeholder="Doe"
                  data-testid="input-user-lastname"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.roleId} onValueChange={(value) => setFormData(prev => ({ ...prev, roleId: value }))}>
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue placeholder="Select a role (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateUser(false)}
                  data-testid="button-cancel-user"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  data-testid="button-save-user"
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found. Create your first user to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`user-card-${user.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      {user.isActive ? (
                        <UserCheck className="w-5 h-5 text-green-600" />
                      ) : (
                        <UserX className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium" data-testid={`text-user-name-${user.id}`}>
                        {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                      </div>
                      <div className="text-sm text-gray-600" data-testid={`text-user-email-${user.id}`}>
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {user.roles && user.roles.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-xs text-gray-500">Roles:</span>
                          {user.roles.map((role) => (
                            <Badge key={role.id} variant="outline" className="text-xs">
                              {role.displayName}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageRoles(user)}
                      data-testid={`button-manage-roles-${user.id}`}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Roles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.fullName || user.email)}
                      disabled={deleteUserMutation.isPending}
                      data-testid={`button-delete-user-${user.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="p-4 border rounded-lg"
                data-testid={`role-card-${role.id}`}
              >
                <div className="font-medium" data-testid={`text-role-name-${role.id}`}>
                  {role.displayName}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {role.description || `${role.name} role`}
                </div>
                <Badge variant="outline" className="mt-2">
                  {role.name}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Management Dialog */}
      <Dialog open={showRoleManager} onOpenChange={setShowRoleManager}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Manage Roles for {selectedUser?.fullName || selectedUser?.email}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Current Roles</h4>
                {selectedUser.roles && selectedUser.roles.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.roles.map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{role.displayName}</span>
                          <span className="text-sm text-gray-500 ml-2">({role.name})</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRoleMutation.mutate({ userId: selectedUser.id, roleId: role.id })}
                          disabled={removeRoleMutation.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No roles assigned</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Assign New Role</h4>
                <div className="flex gap-2">
                  <Select onValueChange={(roleId) => {
                    if (roleId) {
                      assignRoleMutation.mutate({ userId: selectedUser.id, roleId });
                    }
                  }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a role to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter(role => !selectedUser.roles?.some(userRole => userRole.id === role.id))
                        .map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.displayName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRoleManager(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}