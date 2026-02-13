"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface HealthData {
  status: string;
  timestamp: string;
  metrics: {
    databaseConnections: number;
    tableSize: number;
    recentErrors: number;
    avgResponseTime: number;
    errorRate: number;
  };
  checks: {
    database: string;
    replicationLag: string;
    diskSpace: string;
  };
}

interface MetricsData {
  timeRange: string;
  summary: {
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    avgResponseTime: number;
  };
  distribution: {
    byStatusCode: Record<number, number>;
    byEndpoint: Record<string, { count: number; avgTime: number }>;
    errorsBySeverity: Record<string, number>;
  };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pass: "bg-green-100 text-green-800",
    warn: "bg-yellow-100 text-yellow-800",
    fail: "bg-red-100 text-red-800",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-semibold ${colors[status] || colors.warn}`}>
      {status.toUpperCase()}
    </span>
  );
}

function StatCard({
  label,
  value,
  unit,
  trend,
}: {
  label: string;
  value: number;
  unit?: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-2xl font-bold text-gray-900">
          {value.toLocaleString()}
          {unit && <span className="text-sm font-normal">{unit}</span>}
        </p>
        {trend && (
          <div className={trend === "up" ? "text-red-600" : "text-green-600"}>
            {trend === "up" ? "↑" : "↓"}
          </div>
        )}
      </div>
    </div>
  );
}

export function MonitoringDashboard() {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/health");
      if (!res.ok) throw new Error("Failed to fetch health");
      return (await res.json()) as HealthData;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["metrics", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/metrics?range=${timeRange}`);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return (await res.json()) as MetricsData;
    },
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  if (healthLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="mt-1 text-sm text-gray-600">
            Last updated: {new Date(health?.timestamp || Date.now()).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {(["1h", "24h", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded px-3 py-2 text-sm font-medium ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* System Health */}
      {health && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Database</p>
              <StatusBadge status={health.checks.database} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Replication Lag</p>
              <StatusBadge status={health.checks.replicationLag} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Disk Space</p>
              <StatusBadge status={health.checks.diskSpace} />
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Requests"
            value={metrics.summary.totalRequests}
            trend={metrics.summary.totalRequests > 100 ? "up" : "down"}
          />
          <StatCard
            label="Error Rate"
            value={metrics.summary.errorRate}
            unit="%"
            trend={metrics.summary.errorRate > 5 ? "up" : "down"}
          />
          <StatCard
            label="Avg Response Time"
            value={metrics.summary.avgResponseTime}
            unit="ms"
            trend={metrics.summary.avgResponseTime > 500 ? "up" : "down"}
          />
          <StatCard label="Total Errors" value={metrics.summary.totalErrors} />
        </div>
      )}

      {/* Status Code Distribution */}
      {metrics && Object.keys(metrics.distribution.byStatusCode).length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Status Code Distribution</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Object.entries(metrics.distribution.byStatusCode).map(([code, count]) => (
              <div key={code} className="text-center">
                <p className="text-2xl font-bold text-gray-900">{code}</p>
                <p className="text-sm text-gray-600">{count} requests</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Endpoints */}
      {metrics && Object.keys(metrics.distribution.byEndpoint).length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Top Endpoints</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left font-semibold text-gray-900">Endpoint</th>
                  <th className="py-2 text-right font-semibold text-gray-900">Requests</th>
                  <th className="py-2 text-right font-semibold text-gray-900">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics.distribution.byEndpoint)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 5)
                  .map(([endpoint, stats]) => (
                    <tr key={endpoint} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">{endpoint}</td>
                      <td className="py-3 text-right text-gray-600">{stats.count}</td>
                      <td className="py-3 text-right text-gray-600">{stats.avgTime}ms</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error Severity Distribution */}
      {metrics && Object.keys(metrics.distribution.errorsBySeverity).length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Errors by Severity</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(metrics.distribution.errorsBySeverity)
              .sort((a, b) => b[1] - a[1])
              .map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{severity}</span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
