import Header from "@/components/layout/header";

export default function ProjectDetails() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Project Details" 
        subtitle="View and manage project information and configurations" 
      />
      
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-base font-medium text-gray-900 mb-2">Project Configuration</h3>
          <p className="text-sm text-gray-600">
            Project details and configuration management will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}