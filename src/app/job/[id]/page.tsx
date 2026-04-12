"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { useTenantEmail } from "@/lib/client-tenant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AppStatus = "NONE" | "APPLIED" | "RESPONDED" | "INTERVIEWING" | "OFFER" | "REJECTED" | "DISCARDED" | "SKIP";

type ScoreDimensions = {
  northStar: number;
  cvMatch: number;
  level: number;
  comp: number;
  growth: number;
  remote: number;
  reputation: number;
  techStack: number;
  speed: number;
  culture: number;
};

type Job = {
  id: string;
  url: string;
  company: string | null;
  role: string | null;
  status: string;
  appStatus?: AppStatus | null;
  matchScore: number | null;
  archetypeDetected: string | null;
  evaluation?: {
    blockASummary?: string | null;
    blockBMatch?: string | null;
    blockCStrategy?: string | null;
    blockDComp?: string | null;
    blockEPersonalization?: string | null;
    blockFInterviewPrep?: string | null;
    blockGLegitimacy?: string | null;
    legitimacyTier?: string | null;
    sectionHDraftAnswers?: string | null;
    extractedKeywords?: string[];
    archetype?: string | null;
    scoreDimensions?: ScoreDimensions | null;
    overallScore?: number | null;
    generatedPdfPath?: string | null;
  } | null;
};

const APP_STATUS: { value: AppStatus; label: string; color: string }[] = [
  { value: "NONE", label: "Not yet", color: "secondary" },
  { value: "APPLIED", label: "Applied", color: "blue" },
  { value: "RESPONDED", label: "Responded", color: "cyan" },
  { value: "INTERVIEWING", label: "Interviewing", color: "yellow" },
  { value: "OFFER", label: "Offer", color: "green" },
  { value: "REJECTED", label: "Rejected", color: "red" },
  { value: "DISCARDED", label: "Discarded", color: "gray" },
  { value: "SKIP", label: "Skip", color: "gray" },
];

const SCORE_DIM_LABELS: Record<keyof ScoreDimensions, { label: string; weight: string }> = {
  northStar: { label: "North Star Fit", weight: "25%" },
  cvMatch: { label: "CV Match", weight: "15%" },
  level: { label: "Seniority Level", weight: "15%" },
  comp: { label: "Compensation", weight: "10%" },
  growth: { label: "Growth Path", weight: "10%" },
  remote: { label: "Remote Policy", weight: "5%" },
  reputation: { label: "Reputation", weight: "5%" },
  techStack: { label: "Tech Stack", weight: "5%" },
  speed: { label: "Hiring Speed", weight: "5%" },
  culture: { label: "Culture Fit", weight: "5%" },
};

function ScoreBar({ value }: { value: number }) {
  const pct = Math.round(((value - 1) / 4) * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs w-6 text-right">{value}/5</span>
    </div>
  );
}

function LegitimacyBadge({ tier }: { tier?: string | null }) {
  if (!tier) return null;
  const color =
    tier === "High Confidence" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
    tier === "Proceed with Caution" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {tier}
    </span>
  );
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { tenantEmail, setTenantEmail } = useTenantEmail();
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [prepLoading, setPrepLoading] = useState(false);

  const refresh = useCallback(async () => {
    const res = await apiFetch(`/api/jobs/${params.id}`, { tenantEmail });
    if (!res.ok) return;
    const data = (await res.json()) as { job: Job };
    setJob(data.job);
  }, [params.id, tenantEmail]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function setAppStatus(next: AppStatus) {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/jobs/${params.id}`, {
        tenantEmail,
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appStatus: next }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { job: Job };
      setJob(data.job);
    } finally {
      setBusy(false);
    }
  }

  async function generateInterviewPrep() {
    setPrepLoading(true);
    try {
      await apiFetch("/api/interview-prep", {
        tenantEmail,
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId: params.id }),
      });
      window.location.href = `/interview-prep/${params.id}`;
    } finally {
      setPrepLoading(false);
    }
  }

  const scoreColor = (job?.matchScore ?? 0) >= 70 ? "text-green-600" : (job?.matchScore ?? 0) >= 45 ? "text-yellow-500" : "text-red-500";

  return (
    <AppShell
      title={job?.company ?? "Job"}
      description={job?.role ?? ""}
      backLink={{ href: "/pipeline", label: "Back to Pipeline" }}
      right={<TenantSwitcher tenantEmail={tenantEmail} setTenantEmail={setTenantEmail} />}
    >
      {!job ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Actions bar */}
          <div className="flex flex-wrap gap-2 items-center">
            <a className={buttonVariants({ variant: "ghost", size: "sm" })} href={job.url} target="_blank" rel="noreferrer">
              Open Job URL ↗
            </a>
            {job.evaluation?.generatedPdfPath && (
              <a className={buttonVariants({ variant: "outline", size: "sm" })} href={job.evaluation.generatedPdfPath} target="_blank" rel="noreferrer">
                Download Evaluation PDF
              </a>
            )}
            <Button size="sm" variant="outline" onClick={() => void generateInterviewPrep()} disabled={prepLoading}>
              {prepLoading ? "Generating…" : "Interview Prep"}
            </Button>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/follow-ups?jobId=${job.id}`}>
              Follow Up
            </Link>
          </div>

          {/* Header card */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Match Score</span>
                  <span className={`text-2xl font-bold ${scoreColor}`}>{job.matchScore ?? "—"}</span>
                </div>
                {job.evaluation?.legitimacyTier && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Legitimacy</span>
                    <LegitimacyBadge tier={job.evaluation.legitimacyTier} />
                  </div>
                )}
                {job.archetypeDetected && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Archetype</span>
                    <Badge variant="secondary">{job.archetypeDetected}</Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Pipeline</span>
                  <span className="text-muted-foreground">{job.status}</span>
                </div>
              </CardContent>
            </Card>

            {/* ATS Keywords */}
            {(job.evaluation?.extractedKeywords?.length ?? 0) > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>ATS Keywords ({job.evaluation!.extractedKeywords!.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {job.evaluation!.extractedKeywords!.map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Application status */}
          <Card>
            <CardHeader><CardTitle>Application Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {APP_STATUS.map((s) => {
                  const active = (job.appStatus ?? "NONE") === s.value;
                  return (
                    <Button
                      key={s.value}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      disabled={busy}
                      onClick={() => void setAppStatus(s.value)}
                    >
                      {s.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 10-dim score matrix */}
          {job.evaluation?.scoreDimensions && (
            <Card>
              <CardHeader><CardTitle>10-Dimension Score Matrix</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(SCORE_DIM_LABELS) as Array<keyof ScoreDimensions>).map((dim) => {
                    const val = job.evaluation!.scoreDimensions![dim];
                    const meta = SCORE_DIM_LABELS[dim];
                    return (
                      <div key={dim} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{meta.label}</span>
                          <span className="text-muted-foreground">{meta.weight}</span>
                        </div>
                        <ScoreBar value={val} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evaluation blocks */}
          <Tabs defaultValue="summary">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="summary">A) Summary</TabsTrigger>
              <TabsTrigger value="match">B) Match</TabsTrigger>
              <TabsTrigger value="strategy">C) Strategy</TabsTrigger>
              <TabsTrigger value="comp">D) Comp</TabsTrigger>
              <TabsTrigger value="personalization">E) CV Plan</TabsTrigger>
              <TabsTrigger value="interview">F) Interview</TabsTrigger>
              <TabsTrigger value="legitimacy">G) Legitimacy</TabsTrigger>
              {job.evaluation?.sectionHDraftAnswers && <TabsTrigger value="drafts">H) Drafts</TabsTrigger>}
            </TabsList>

            {[
              { key: "summary", title: "A) Job Summary", body: job.evaluation?.blockASummary },
              { key: "match", title: "B) Requirements Match", body: job.evaluation?.blockBMatch },
              { key: "strategy", title: "C) Level Strategy", body: job.evaluation?.blockCStrategy },
              { key: "comp", title: "D) Compensation", body: job.evaluation?.blockDComp },
              { key: "personalization", title: "E) CV Personalization Plan", body: job.evaluation?.blockEPersonalization },
              { key: "interview", title: "F) STAR Interview Prep", body: job.evaluation?.blockFInterviewPrep },
              { key: "legitimacy", title: "G) Posting Legitimacy", body: job.evaluation?.blockGLegitimacy },
              { key: "drafts", title: "H) Draft Application Answers", body: job.evaluation?.sectionHDraftAnswers },
            ].map((tab) => (
              <TabsContent key={tab.key} value={tab.key}>
                <Card>
                  <CardHeader><CardTitle>{tab.title}</CardTitle></CardHeader>
                  <CardContent className="whitespace-pre-wrap text-sm leading-relaxed">
                    {tab.body ?? "—"}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </AppShell>
  );
}
