import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Users, Shield, Settings2, UserPlus, Trash2, Edit } from "lucide-react";

export default function Settings() {
  const [users] = useState([
    { id: 1, name: "Admin User", email: "admin@company.com", role: "Administrator", status: "Active", permissions: ["ALL"] },
    { id: 2, name: "Plant Manager", email: "manager@company.com", role: "Manager", status: "Active", permissions: ["VIEW_PROJECTS", "MANAGE_SITES", "VIEW_REPORTS"] },
    { id: 3, name: "Operator", email: "operator@company.com", role: "Operator", status: "Active", permissions: ["VIEW_PROJECTS", "VIEW_SITES"] },
    { id: 4, name: "Maintenance Tech", email: "tech@company.com", role: "Technician", status: "Inactive", permissions: ["VIEW_PROJECTS", "MANAGE_EQUIPMENT"] }
  ]);

  const [permissions] = useState([
    { id: "VIEW_PROJECTS", name: "View Projects", description: "Can view project details and configurations" },
    { id: "MANAGE_PROJECTS", name: "Manage Projects", description: "Can create, edit, and delete projects" },
    { id: "VIEW_SITES", name: "View Sites", description: "Can view site monitoring information" },
    { id: "MANAGE_SITES", name: "Manage Sites", description: "Can add, edit, and delete sites" },
    { id: "VIEW_REPORTS", name: "View Reports", description: "Can access and view system reports" },
    { id: "MANAGE_REPORTS", name: "Manage Reports", description: "Can create and manage report configurations" },
    { id: "MANAGE_EQUIPMENT", name: "Manage Equipment", description: "Can configure and manage equipment settings" },
    { id: "MANAGE_USERS", name: "Manage Users", description: "Can add, edit, and delete user accounts" },
    { id: "SYSTEM_ADMIN", name: "System Administration", description: "Full system administration privileges" },
    { id: "ALL", name: "All Permissions", description: "Complete access to all system features" }
  ]);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Settings" 
        subtitle="System configuration and user management" 
      />
      
      <div className="p-6 space-y-6">
        {/* User Management Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users size={18} />
                User Management
              </CardTitle>
              <Button size="sm" data-testid="button-add-user">
                <UserPlus size={16} className="mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs font-medium text-gray-700">Name</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-700">Email</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-700">Role</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-700">Status</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50" data-testid={`user-row-${user.id}`}>
                      <td className="py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge 
                          variant={user.status === 'Active' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" data-testid={`edit-user-${user.id}`}>
                            <Edit size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" data-testid={`delete-user-${user.id}`}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Permission Modules Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield size={18} />
              Permission Modules
            </CardTitle>
            <p className="text-xs text-gray-600">Configure system permissions and access levels</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissions.map((permission) => (
                <div 
                  key={permission.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50"
                  data-testid={`permission-${permission.id.toLowerCase()}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {permission.name}
                    </h4>
                    <Switch 
                      defaultChecked={permission.id === 'VIEW_PROJECTS' || permission.id === 'VIEW_SITES'} 
                      data-testid={`switch-${permission.id.toLowerCase()}`}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {permission.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 size={18} />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-gray-700">System Name</Label>
                <Input 
                  defaultValue="AutomationHub" 
                  className="mt-1 text-sm" 
                  data-testid="input-system-name"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Default Project Template</Label>
                <Input 
                  defaultValue="Water Treatment Plant" 
                  className="mt-1 text-sm" 
                  data-testid="input-default-template"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm font-medium text-gray-900">Enable Auto-Backup</Label>
                  <p className="text-xs text-gray-600">Automatically backup project configurations</p>
                </div>
                <Switch defaultChecked data-testid="switch-auto-backup" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm font-medium text-gray-900">Email Notifications</Label>
                  <p className="text-xs text-gray-600">Send email alerts for system events</p>
                </div>
                <Switch defaultChecked data-testid="switch-email-notifications" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" data-testid="button-reset-settings">
            Reset to Default
          </Button>
          <Button data-testid="button-save-settings">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}