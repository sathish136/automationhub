import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, FileText, Key } from "lucide-react";
import { Link } from "wouter";

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="p-4 h-auto flex flex-col items-center text-center"
            asChild
            data-testid="quick-action-add-site"
          >
            <Link href="/sites">
              <Plus className="text-primary text-lg mb-2" />
              <p className="text-sm font-medium text-gray-900">Add Site</p>
            </Link>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto flex flex-col items-center text-center"
            asChild
            data-testid="quick-action-run-backup"
          >
            <Link href="/backups">
              <Download className="text-primary text-lg mb-2" />
              <p className="text-sm font-medium text-gray-900">Run Backup</p>
            </Link>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto flex flex-col items-center text-center"
            asChild
            data-testid="quick-action-generate-report"
          >
            <Link href="/reports">
              <FileText className="text-primary text-lg mb-2" />
              <p className="text-sm font-medium text-gray-900">Generate Report</p>
            </Link>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto flex flex-col items-center text-center"
            asChild
            data-testid="quick-action-manage-credentials"
          >
            <Link href="/credentials">
              <Key className="text-primary text-lg mb-2" />
              <p className="text-sm font-medium text-gray-900">Manage Keys</p>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
