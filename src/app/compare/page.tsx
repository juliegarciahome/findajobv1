"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useTenantEmail } from "@/lib/client-tenant";

type Job = {
  id: string;
  company: string | null;
  role: string | null;
  matchScore: number | null;
  appStatus: string;
  archetypeDetected: string | null;
  evaluation?: {
    legitimacyTier?: string | null;
    overallScore?: number | null;
    scoreDimensions?: Record<string, number> | null;
    extractedKeywords?: string[];
    blockDComp?: string | null;
    blockCStrategy?: string | null;
  } | null;
};

const DIM_LABELS: Record<string, string> = {
  northStar: "North Star",
  cvMatch: "CV Match",
  level: "Level",
  comp: "Comp",
  growth: "Growth",
  remote: "Remote",
  reputation: "Reputation",
  techStack: "Tech Stack",
  speed: "Speed",
  culture: "Culture",
};

const ALL_DIMS = Object.keys(DIM_LABELS);

function ScoreCell({ val }: { val?: number }) {
  if (val === undefined || val === null) return <td className="px-3 py-2 text-center text-muted-foreground text-sm">—</td>;
  const pct = Math.round(((val - 1) / 4) * 100);
  const bg = pct >= 70 ? "bg-green-100 dark:bg-green-900" : pct >= 40 ? "bg-yellow-50 dark:bg-yellow-900/30" : "bg-red-50 dark:bg-red-900/30";
  const text = pct >= 70 ? "text-green-700 dark:text-green-300" : pct >= 40 ? "text-yellow-700 dark:text-yellow-300" : "text-red-600 dark:text-red-400";
  return (
    <td className={`px-3 py-2 text-center text-sm font-medium ${bg} ${text}`}>
      {val.toFixed(1)}
    </td>
  );
}

export default function ComparePage() {
  const { tenantEmail } = useTenantEmail();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/jobs", { tenantEmail });
    if (res.ok) {
      const data = await res.json() as { jobs: Job[] };
      const evaluated = data.jobs.filter((j) => j.evaluation?.scoreDimensions);
      setAllJobs(evaluated);
      // Auto-select top 3 by score
      const top3 = [...evaluated]
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
        .slice(0, 3)
        .map((j) => j.id);
      setSelected(top3);
    }
    setLoading(false);
  }, [tenantEmail]);

  useEffect(() => { void load(); }, [load]);

  function toggleSelect(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((i) => i !== id) : s.length < 5 ? [...s, id] : s
    );
  }

  const compareJobs = allJobs.filter((j) => selected.includes(j.id));

  const scoreColor = (score: number | null) =>
    (score ?? 0) >= 70 ? "text-green-600 dark:text-green-400" :
    (score ?? 0) >= 45 ? "text-yellow-500" : "text-red-500";

  if (loading) {
    return (
      <AppShell title="Compare Offers" description="Loading…" backLink={{ href: "/dashboard", label: "Back" }}>
        <div className="text-sm text-muted-foreground">Loading jobs…</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Compare Offers"
      description="Side-by-side 10-dimension comparison of up to 5 evaluated jobs."
      backLink={{ href: "/dashboard", label: "Back to dashboard" }}
    >
      <div className="space-y-6">
        {/* Job picker */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Select Jobs to Compare (max 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allJobs.map((job) => {
                const sel = selected.includes(job.id);
                return (
                  <div
                    key={job.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${sel ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/40"}`}
                    onClick={() => toggleSelect(job.id)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${sel ? "bg-primary border-primary" : "border-input"}`}>
                      {sel && <span className="text-primary-foreground text-xs">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{job.company}</span>
                      <span className="text-muted-foreground text-sm"> — {job.role}</span>
                    </div>
                    <span className={`text-sm font-bold ${scoreColor(job.matchScore)}`}>{job.matchScore ?? "—"}</span>
                    {job.archetypeDetected && <Badge variant="secondary" className="text-xs hidden sm:flex">{job.archetypeDetected}</Badge>}
                  </div>
                );
              })}
              {allJobs.length === 0 && (
                <p className="text-sm text-muted-foreground">No evaluated jobs found. Run ingestion on the pipeline page first.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comparison table */}
        {compareJobs.length >= 2 && (
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader><CardTitle>Comparison Matrix</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-3 text-left font-medium w-32">Dimension</th>
                      {compareJobs.map((j) => (
                        <th key={j.id} className="px-3 py-3 text-center font-medium min-w-32">
                          <a href={`/job/${j.id}`} className="hover:underline text-primary">
                            {j.company}
                          </a>
                          <div className="text-xs font-normal text-muted-foreground truncate max-w-28">{j.role}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Overall score */}
                    <tr className="border-b bg-primary/5">
                      <td className="px-3 py-3 font-semibold">Overall (0-100)</td>
                      {compareJobs.map((j) => (
                        <td key={j.id} className={`px-3 py-3 text-center text-lg font-bold ${scoreColor(j.matchScore)}`}>
                          {j.matchScore ?? "—"}
                        </td>
                      ))}
                    </tr>

                    {/* 10 dimensions */}
                    {ALL_DIMS.map((dim, i) => (
                      <tr key={dim} className={`border-b ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-3 py-2 font-medium">{DIM_LABELS[dim]}</td>
                        {compareJobs.map((j) => (
                          <ScoreCell key={j.id} val={j.evaluation?.scoreDimensions?.[dim]} />
                        ))}
                      </tr>
                    ))}

                    {/* Legitimacy */}
                    <tr className="border-b">
                      <td className="px-3 py-2 font-medium">Legitimacy</td>
                      {compareJobs.map((j) => {
                        const tier = j.evaluation?.legitimacyTier;
                        return (
                          <td key={j.id} className="px-3 py-2 text-center">
                            {tier ? (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                tier === "High Confidence" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" :
                                tier === "Proceed with Caution" ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                              }`}>{tier}</span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );
                      })}
                    </tr>

                    {/* App status */}
                    <tr>
                      <td className="px-3 py-2 font-medium">App Status</td>
                      {compareJobs.map((j) => (
                        <td key={j.id} className="px-3 py-2 text-center">
                          <Badge variant="outline" className="text-xs">{j.appStatus}</Badge>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {compareJobs.length === 1 && (
          <p className="text-sm text-muted-foreground text-center">Select at least 2 jobs to compare.</p>
        )}
      </div>
    </AppShell>
  );
}
