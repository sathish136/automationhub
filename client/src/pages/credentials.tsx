import Header from "@/components/layout/header";

export default function Credentials() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="IPC Credentials" 
        subtitle="Secure management of industrial PC credentials" 
      />
      
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Credential Management</h3>
          <p className="text-gray-600">
            IPC credential management functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
