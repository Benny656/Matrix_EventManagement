import { PageHeader } from "@/components/layout/page-header";
import { getAnalyticsData } from "@/actions/volunteer.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div>
      <PageHeader title="Analytics" description="Event performance and registration trends" />
      <AnalyticsCharts data={data} />
    </div>
  );
}
