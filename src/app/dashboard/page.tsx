"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTenantEmail } from "@/lib/client-tenant";
import {  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ArrowRight, BarChart2 } from "lucide-react";

type Job = {
  id: string;
  url: string;
  company: string | null;
  role: string | null;
  status: string;
  matchScore: number | null;
  updatedAt: string;
};

export default function DashboardPage() {
  const { tenantEmail, setTenantEmail } = useTenantEmail();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/jobs", {
          headers: { "x-user-email": tenantEmail },
        });
        const data = (await res.json()) as { jobs: Job[] };
        setJobs(data.jobs);
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantEmail]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const evaluated = jobs.filter((j) => j.status === "EVALUATED").length;
    const applied = jobs.filter((j) => j.status === "APPLIED").length;
    const offers = jobs.filter((j) => j.status === "OFFER").length;
    const scored = jobs.filter((j) => typeof j.matchScore === "number");
    const avgScore =
      scored.reduce((a, j) => a + (j.matchScore ?? 0), 0) / Math.max(1, scored.length);

    return { total, evaluated, applied, offers, avgScore: Math.round(avgScore) };
  }, [jobs]);

  const chartData = useMemo(() => {
    const buckets = [
      { name: "NEW", count: 0 },
      { name: "SCRAPING", count: 0 },
      { name: "EVALUATING", count: 0 },
      { name: "EVALUATED", count: 0 },
      { name: "APPLIED", count: 0 },
      { name: "INTERVIEW", count: 0 },
      { name: "OFFER", count: 0 },
      { name: "REJECTED", count: 0 },
      { name: "SKIP", count: 0 },
      { name: "ERROR", count: 0 },
    ];
    const map = new Map(buckets.map((b) => [b.name, b]));
    for (const j of jobs) {
      const bucket = map.get(j.status);
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }, [jobs]);

  return (
    <AppShell
      title="Dashboard"
      description="Track KPIs and the status funnel across your pipeline."
      right={
        <div className="flex items-center gap-3">
          <TenantSwitcher tenantEmail={tenantEmail} setTenantEmail={setTenantEmail} />
          <Link
            className="inline-flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-xl px-4 py-2 text-sm font-medium transition-all shadow-[0_0_15px_-3px_oklch(0.68_0.18_260)] hover:shadow-[0_0_20px_-3px_oklch(0.68_0.18_260)]"
            href="/pipeline"
          >
            Pipeline <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-3xl bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden relative shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardHeader>
                <CardTitle>
                  <div className="h-4 w-24 animate-pulse rounded-full bg-muted/50" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-10 w-16 animate-pulse rounded-xl bg-muted/50" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="rounded-3xl bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden relative shadow-lg hover:border-primary/30 transition-all group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-muted-foreground font-medium text-sm">Total Jobs</CardTitle>
              </CardHeader>
              <CardContent className="text-4xl font-extrabold text-foreground group-hover:text-glow transition-all">{stats.total}</CardContent>
            </Card>
            <Card className="rounded-3xl bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden relative shadow-lg hover:border-primary/30 transition-all group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-muted-foreground font-medium text-sm">Evaluated</CardTitle>
              </CardHeader>
              <CardContent className="text-4xl font-extrabold text-foreground group-hover:text-glow transition-all">{stats.evaluated}</CardContent>
            </Card>
            <Card className="rounded-3xl bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden relative shadow-lg hover:border-primary/30 transition-all group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-muted-foreground font-medium text-sm">Offers</CardTitle>
              </CardHeader>
              <CardContent className="text-4xl font-extrabold text-primary text-glow drop-shadow-sm">{stats.offers}</CardContent>
            </Card>
            <Card className="rounded-3xl bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden relative shadow-lg hover:border-primary/30 transition-all group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-muted-foreground font-medium text-sm">Avg Score</CardTitle>
              </CardHeader>
              <CardContent className="text-4xl font-extrabold text-foreground group-hover:text-glow transition-all">{stats.avgScore}</CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="mt-6 rounded-3xl bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden relative shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        <CardHeader className="flex-row items-center justify-between border-b border-border/50 bg-muted/10 pb-4 mb-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" /> Status Funnel
          </CardTitle>
          <Badge className="bg-primary/20 text-primary border-primary/30 font-medium">Last 200</Badge>
        </CardHeader>
        <CardContent className="h-80 min-h-[20rem] relative z-10">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[720px]">
              <BarChart width={900} height={300} data={chartData}>
                <XAxis dataKey="name" stroke="oklch(0.70 0.01 260)" tick={{fill: 'oklch(0.70 0.01 260)'}} tickLine={{stroke: 'oklch(0.25 0.02 260)'}} />
                <YAxis allowDecimals={false} stroke="oklch(0.70 0.01 260)" tick={{fill: 'oklch(0.70 0.01 260)'}} tickLine={{stroke: 'oklch(0.25 0.02 260)'}} />
                <Tooltip cursor={{fill: 'oklch(0.20 0.01 260)'}} contentStyle={{backgroundColor: 'oklch(0.12 0.01 260)', borderColor: 'oklch(0.25 0.02 260)', borderRadius: '1rem'}} itemStyle={{color: 'oklch(0.98 0 0)'}} />
                <Bar dataKey="count" fill="oklch(0.68 0.18 260)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}