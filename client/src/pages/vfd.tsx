import Header from "@/components/layout/header";

export default function VFD() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="VFD Parameters" 
        subtitle="Variable frequency drive configuration and monitoring" 
      />
      
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">VFD Parameter Management</h3>
          <p className="text-gray-600">
            VFD parameter management functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
