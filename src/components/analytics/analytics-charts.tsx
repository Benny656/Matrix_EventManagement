"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

interface AnalyticsChartsProps {
  data: {
    eventsByCategory: { category: string; _count: { id: number } }[];
    eventsByStatus: { status: string; _count: { id: number } }[];
    topEvents: { id: string; title: string; currentRegistrations: number; maxParticipants: number }[];
    registrationTrends: { registeredAt: Date }[];
  };
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const categoryData = data.eventsByCategory.map((item) => ({
    name: item.category.charAt(0) + item.category.slice(1).toLowerCase(),
    value: item._count.id,
  }));

  const statusData = data.eventsByStatus.map((item) => ({
    name: item.status.charAt(0) + item.status.slice(1).toLowerCase(),
    value: item._count.id,
  }));

  const topEventsData = data.topEvents.map((e) => ({
    name: e.title.length > 20 ? e.title.slice(0, 20) + "…" : e.title,
    registrations: e.currentRegistrations,
    capacity: e.maxParticipants,
  }));

  // Monthly trend grouping
  const monthlyTrend: Record<string, number> = {};
  data.registrationTrends.forEach((r) => {
    const key = new Date(r.registeredAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthlyTrend[key] = (monthlyTrend[key] ?? 0) + 1;
  });
  const trendData = Object.entries(monthlyTrend).map(([month, count]) => ({ month, count }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Events by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Events by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Events by Registrations */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Top Events by Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {topEventsData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No event data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topEventsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="registrations" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="capacity" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Registration Trend */}
      {trendData.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Registration Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
