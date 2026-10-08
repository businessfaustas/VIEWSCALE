"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardTabs({
  overview,
  recent,
  insights,
}: {
  overview: ReactNode;
  recent: ReactNode;
  insights: ReactNode;
}) {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Dashboard sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="recent">Recent Analyses</TabsTrigger>
        <TabsTrigger value="insights">Insights</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">{overview}</TabsContent>
      <TabsContent value="recent">{recent}</TabsContent>
      <TabsContent value="insights">{insights}</TabsContent>
    </Tabs>
  );
}
