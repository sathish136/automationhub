import Header from "@/components/layout/header";

export default function Network() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Network Equipment" 
        subtitle="Manage routers, modems and network infrastructure" 
      />
      
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Network Equipment</h3>
          <p className="text-gray-600">
            Network equipment management functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
