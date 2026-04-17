"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { useTenantEmail } from "@/lib/client-tenant";

type TopJob = {
  id: string;
  company: string | null;
  role: string | null;
  matchScore: number | null;
  appStatus: string;
  archetypeDetected: string | null;
  legitimacyTier: string | null;
};

type AnalyticsData = {
  summary: {
    total: number;
    evaluated: number;
    applied: number;
    rejected: number;
    interviewing: number;
    offers: number;
    avgScore: number;
    conversionRate: number;
  };
  archetypeCounts: Record<string, number>;
  legitimacyCounts: Record<string, number>;
  topKeywords: Array<{ keyword: string; count: number }>;
  avgDimensions: Record<string, number>;
  statusBreakdown: Record<string, number>;
  topJobs: TopJob[];
  recentActivity: { ingested: number; applied: number };
};

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <Card className="rounded-xl">
      <CardContent className="pt-4 pb-3 text-center">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm font-medium mt-1">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const DIM_LABELS: Record<string, string> = {
  northStar: "North Star Fit",
  cvMatch: "CV Match",
  level: "Seniority Level",
  comp: "Compensation",
  growth: "Growth Path",
  remote: "Remote Policy",
  reputation: "Reputation",
  techStack: "Tech Stack",
  speed: "Hiring Speed",
  culture: "Culture Fit",
};

const STATUS_COLORS: Record<string, string> = {
  NONE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  APPLIED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  RESPONDED: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200",
  INTERVIEWING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
  OFFER: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  DISCARDED: "bg-gray-100 text-gray-500",
  SKIP: "bg-gray-100 text-gray-500",
};

export default function PatternsPage() {
  const { tenantEmail } = useTenantEmail();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/analytics/patterns", { tenantEmail });
    if (res.ok) setData(await res.json() as AnalyticsData);
    setLoading(false);
  }, [tenantEmail]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <AppShell title="Pattern Analysis" description="Loading…" backLink={{ href: "/dashboard", label: "Back to dashboard" }}>
        <div className="text-sm text-muted-foreground">Loading analytics…</div>
      </AppShell>
    );
  }

  if (!data) return null;

  const { summary, archetypeCounts, legitimacyCounts, topKeywords, avgDimensions, statusBreakdown, topJobs } = data;

  return (
    <AppShell
      title="Pattern Analysis"
      description="Insights from your job search pipeline."
      backLink={{ href: "/dashboard", label: "Back to dashboard" }}
    >
      <div className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Jobs" value={summary.total} />
          <StatCard label="Evaluated" value={summary.evaluated} />
          <StatCard label="Avg Score" value={`${summary.avgScore}/100`} />
          <StatCard label="Conversion" value={`${summary.conversionRate}%`} sub="Applied → Interview" />
        </div>

        {/* Funnel */}
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Application Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(statusBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => {
                  const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium w-28 justify-center ${STATUS_COLORS[status] ?? "bg-muted text-foreground"}`}>
                        {status}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Archetype breakdown */}
          {Object.keys(archetypeCounts).length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Role Archetypes Detected</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1]).map(([arch, count]) => (
                  <div key={arch} className="flex items-center justify-between">
                    <Badge variant="secondary">{arch}</Badge>
                    <span className="text-sm">{count} jobs</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Legitimacy breakdown */}
          {Object.keys(legitimacyCounts).length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Posting Legitimacy</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(legitimacyCounts).map(([tier, count]) => {
                  const color =
                    tier === "High Confidence" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                    tier === "Proceed with Caution" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800";
                  return (
                    <div key={tier} className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{tier}</span>
                      <span className="text-sm">{count} jobs</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Score dimensions average */}
        {Object.keys(avgDimensions).length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Average Score Dimensions (all evaluated jobs)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(avgDimensions).map(([dim, avg]) => {
                  const pct = Math.round(((avg - 1) / 4) * 100);
                  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-400" : "bg-red-400";
                  return (
                    <div key={dim} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{DIM_LABELS[dim] ?? dim}</span>
                        <span className="text-muted-foreground">{avg}/5</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top ATS keywords */}
        {topKeywords.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Top ATS Keywords (across all jobs)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {topKeywords.map(({ keyword, count }) => (
                  <Badge key={keyword} variant="outline" className="text-xs gap-1">
                    {keyword}
                    <span className="opacity-60">×{count}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top jobs */}
        {topJobs.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Top Scored Jobs</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topJobs.map((job) => (
                  <div key={job.id} className="flex items-center gap-3 text-sm">
                    <a href={`/job/${job.id}`} className="font-medium text-primary hover:underline flex-1 truncate">
                      {job.company} — {job.role}
                    </a>
                    <span className="font-bold w-10 text-right">{job.matchScore}</span>
                    {job.archetypeDetected && <Badge variant="secondary" className="text-xs">{job.archetypeDetected}</Badge>}
                    {job.legitimacyTier && (
                      <span className={`hidden sm:inline text-xs px-1.5 py-0.5 rounded ${
                        job.legitimacyTier === "High Confidence" ? "bg-green-100 text-green-700" :
                        job.legitimacyTier === "Proceed with Caution" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>{job.legitimacyTier}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
