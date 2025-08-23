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
  const [showEditUser, setShowEditUser] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<UserFormData>>({});

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
        const roleResponse = await fetch(`/api/users/${newUser.id}/roles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    });
    setShowEditUser(true);
  };

  // Role assignment mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleId }),
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
      let errorMessage = "Failed to assign role.";
      
      if (error.message) {
        if (error.message.includes("already has this role")) {
          errorMessage = "This user already has that role assigned.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error Assigning Role",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Role removal mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/users/${userId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove role');
      }
      
      return true;
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

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: Partial<UserFormData> }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowEditUser(false);
      setEditFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating User",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-primary" />
            User Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">Manage system users and their access</p>
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
          <CardTitle className="text-lg">Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found. Create your first user to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-xs font-medium text-gray-500">User</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">Roles</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">Quick Assign</th>
                    <th className="text-right p-2 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50" data-testid={`user-row-${user.id}`}>
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            {user.isActive ? (
                              <UserCheck className="w-3 h-3 text-green-600" />
                            ) : (
                              <UserX className="w-3 h-3 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-medium" data-testid={`text-user-name-${user.id}`}>
                              {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                            </div>
                            <div className="text-xs text-gray-500" data-testid={`text-user-email-${user.id}`}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? user.roles.map((role) => (
                            <Badge key={role.id} variant="outline" className="text-xs">
                              {role.displayName}
                            </Badge>
                          )) : (
                            <span className="text-xs text-gray-400">No roles</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <Select onValueChange={(roleId) => {
                          if (roleId && roleId !== 'none') {
                            assignRoleMutation.mutate({ userId: user.id, roleId });
                          }
                        }}>
                          <SelectTrigger className="w-24 h-6 text-xs">
                            <SelectValue placeholder="+" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select Role</SelectItem>
                            {roles
                              .filter(role => !user.roles?.some(userRole => userRole.id === role.id))
                              .map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.displayName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="h-6 px-2 text-xs"
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageRoles(user)}
                            className="h-6 px-2 text-xs"
                            data-testid={`button-manage-roles-${user.id}`}
                          >
                            Manage
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.fullName || user.email)}
                            disabled={deleteUserMutation.isPending}
                            className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                <h4 className="text-sm font-medium mb-2">Available Roles</h4>
                <div className="grid grid-cols-1 gap-2">
                  {roles
                    .filter(role => !selectedUser.roles?.some(userRole => userRole.id === role.id))
                    .map((role) => (
                      <Button
                        key={role.id}
                        variant="outline"
                        size="sm"
                        onClick={() => assignRoleMutation.mutate({ userId: selectedUser.id, roleId: role.id })}
                        disabled={assignRoleMutation.isPending}
                        className="justify-start text-xs"
                      >
                        + {role.displayName}
                      </Button>
                    ))}
                  {roles.filter(role => !selectedUser.roles?.some(userRole => userRole.id === role.id)).length === 0 && (
                    <p className="text-xs text-gray-500">All roles assigned</p>
                  )}
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

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedUser) {
                updateUserMutation.mutate({
                  userId: selectedUser.id,
                  userData: editFormData
                });
              }
            }} className="space-y-4">
              <div>
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@company.com"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={editFormData.firstName || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={editFormData.lastName || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditUser(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? "Updating..." : "Update User"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}