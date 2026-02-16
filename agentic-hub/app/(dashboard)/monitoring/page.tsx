export const metadata = {
  title: "Monitoring | Agentic Hub",
  description: "System health and performance monitoring dashboard",
};

export default function MonitoringPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "16px" }}>
          System Monitoring
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "32px" }}>
          System health and performance metrics
        </p>
        <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#9ca3af" }}>Monitoring dashboard - LangGraph agents system operational</p>
        </div>
      </div>
    </div>
  );
}
