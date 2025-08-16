import Header from "@/components/layout/header";

export default function Sites() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Site Monitoring" 
        subtitle="Manage and monitor all automation sites" 
      />
      
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Site Management</h3>
          <p className="text-gray-600">
            Site management functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
