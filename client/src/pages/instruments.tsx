import Header from "@/components/layout/header";

export default function Instruments() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Instruments" 
        subtitle="Manage and monitor all automation instruments" 
      />
      
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-base font-medium text-gray-900 mb-2">Instrument Management</h3>
          <p className="text-sm text-gray-600">
            Instrument management functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}