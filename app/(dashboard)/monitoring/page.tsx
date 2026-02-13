import { MonitoringDashboard } from "@/components/dashboard/monitoring-dashboard";

export const metadata = {
  title: "Monitoring | Agentic Hub",
  description: "System health and performance monitoring dashboard",
};

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <MonitoringDashboard />
      </div>
    </div>
  );
}
