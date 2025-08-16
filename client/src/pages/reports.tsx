import Header from "@/components/layout/header";

export default function Reports() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Reports" 
        subtitle="Uptime reports and analytics" 
      />
      
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
          <p className="text-gray-600">
            Reports and analytics functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
