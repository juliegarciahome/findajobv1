"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useTenantEmail } from "@/lib/client-tenant";
import { ArrowRight, FileText, Loader2, Search, Sparkles, BrainCircuit } from "lucide-react";

const AUTO_INGEST_URLS = [
  "https://job-boards.greenhouse.io/figma/jobs/5711571004?gh_jid=5711571004",
  "https://jobs.ashbyhq.com/notion/ff6129b1-5ed5-414d-ac0c-579e86e141d9",
  "https://jobs.lever.co/marketer-hire/b7680247-12b8-43e9-90fb-27f0efa4d4ac",
  "https://job-boards.greenhouse.io/figma/jobs/5830640004?gh_jid=5830640004",
  "https://jobs.lever.co/protolabs/7eeb766b-541a-4a36-ac42-583ea99c136",
];

type AppStatus = "NONE" | "APPLIED" | "RESPONDED" | "INTERVIEWING" | "OFFER" | "REJECTED" | "DISCARDED" | "SKIP";

type Job = {
  id: string;
  url: string;
  company: string | null;
  role: string | null;
  status: string;
  appStatus?: AppStatus | null;
  matchScore: number | null;
  archetypeDetected?: string | null;
  updatedAt: string;
  evaluation?: { generatedPdfPath?: string | null; legitimacyTier?: string | null } | null;
};

function appStatusLabel(s: AppStatus | null | undefined) {
  switch (s ?? "NONE") {
    case "APPLIED": return "Applied";
    case "RESPONDED": return "Responded";
    case "INTERVIEWING": return "Interviewing";
    case "OFFER": return "Offer";
    case "REJECTED": return "Rejected";
    case "DISCARDED": return "Discarded";
    case "SKIP": return "Skip";
    default: return "Not yet";
  }
}

function appStatusColor(s: AppStatus | null | undefined) {
  switch (s ?? "NONE") {
    case "APPLIED": return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200";
    case "RESPONDED": return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200";
    case "INTERVIEWING": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200";
    case "OFFER": return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200";
    case "REJECTED": return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200";
    case "DISCARDED":
    case "SKIP": return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function PipelinePage() {
  const { tenantEmail } = useTenantEmail();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [urlsText, setUrlsText] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoIngestDoneRef = useRef(false);

  async function retryStuck() {
    setError(null);
    const stuckUrls = jobs
      .filter((j) => j.status === "SCRAPING" || j.status === "ERROR")
      .map((j) => j.url);
    if (stuckUrls.length === 0) return;
    setBusy(true);
    try {
      await apiFetch("/api/jobs/ingest", {
        tenantEmail,
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls: stuckUrls }),
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setEvaluating(false);
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    setEvaluating(true);
    pollRef.current = setInterval(async () => {
      const res = await apiFetch("/api/jobs", { tenantEmail });
      if (!res.ok) return;
      const data = (await res.json()) as { jobs: Job[] };
      setJobs(data.jobs);
      const stillPending = data.jobs.some((j) => j.status === "NEW" || j.status === "SCRAPING" || j.status === "EVALUATING");
      if (!stillPending) stopPolling();
    }, 3000);
  }, [tenantEmail, stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  async function refresh() {
    setError(null);
    const res = await apiFetch("/api/jobs", { tenantEmail });
    if (!res.ok) return;
    const data = (await res.json()) as { jobs: Job[] };
    setJobs(data.jobs);
    const hasPending = data.jobs.some((j) => j.status === "NEW" || j.status === "SCRAPING" || j.status === "EVALUATING");
    if (hasPending) startPolling();
    else stopPolling();
    return data.jobs;
  }

  async function autoIngest() {
    if (autoIngestDoneRef.current) return;
    autoIngestDoneRef.current = true;
    setShowInterstitial(true);
    try {
      await apiFetch("/api/jobs/ingest", {
        tenantEmail,
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls: AUTO_INGEST_URLS }),
      });
      await refresh();
      startPolling();
    } catch {
      // silently ignore — user can ingest manually
    } finally {
      setTimeout(() => setShowInterstitial(false), 2200);
    }
  }

  useEffect(() => {
    void (async () => {
      const initialJobs = await refresh();
      if (!initialJobs || initialJobs.length === 0) {
        void autoIngest();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantEmail]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      [j.company ?? "", j.role ?? "", j.url, j.status, j.appStatus ?? ""].some((v) =>
        v.toLowerCase().includes(q)
      )
    );
  }, [jobs, filter]);

  async function ingest() {
    setError(null);

    const urls = urlsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (urls.length === 0) return;

    if (urls.some((u) => u.includes("..."))) {
      setError('Replace "..." with the full job URL (copy/paste the complete address).');
      return;
    }

    setBusy(true);
    try {
      const res = await apiFetch("/api/jobs/ingest", {
        tenantEmail,
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(`Ingest failed (${res.status}). ${text}`);
        return;
      }

      setUrlsText("");
      await refresh();
      startPolling();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Pipeline"
      description="Ingest job URLs, evaluate fit, and track application progress."
    >
      {/* Auto-ingest interstitial overlay */}
      {showInterstitial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 text-center px-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative rounded-full bg-primary/10 border border-primary/30 p-5">
                <BrainCircuit className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                AI is pulling all jobs <span className="text-primary text-glow">for you</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Fetching, scraping, and evaluating your matched roles in the background…
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              This only takes a moment
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 relative z-10">
        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg shadow-destructive/10 backdrop-blur-xl">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1 rounded-3xl bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Ingest
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="bg-background/50 border border-border/50 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                <Textarea
                  value={urlsText}
                  onChange={(e) => setUrlsText(e.target.value)}
                  placeholder="One job URL per line (Ashby, Greenhouse, Lever…)"
                  className="min-h-36 border-0 focus-visible:ring-0 bg-transparent resize-none p-4"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => void ingest()}
                  disabled={busy}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_-3px_oklch(0.68_0.18_260)] hover:shadow-[0_0_20px_-3px_oklch(0.68_0.18_260)] transition-all rounded-xl"
                >
                  {busy ? "Working..." : "Ingest URLs"}
                </Button>
                <Button variant="outline" onClick={() => void refresh()} disabled={busy} className="rounded-xl border-border/50 bg-background/50">
                  Refresh
                </Button>
              </div>
              {jobs.some((j) => j.status === "SCRAPING" || j.status === "ERROR") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void retryStuck()}
                  disabled={busy}
                  className="w-full rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10 bg-background/50"
                >
                  Retry stuck jobs ({jobs.filter((j) => j.status === "SCRAPING" || j.status === "ERROR").length})
                </Button>
              )}
              {evaluating ? (
                <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Evaluating jobs… refreshing automatically
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Tip: Jobs appear in the table immediately. Evaluation continues in the background.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 rounded-3xl bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Jobs</CardTitle>
                <div className="w-full sm:w-72 bg-background/50 border border-border/50 rounded-2xl flex items-center px-3 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                  <Search className="w-4 h-4 text-muted-foreground mr-2" />
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search company, role…"
                    className="w-full bg-transparent border-0 outline-none text-sm py-2 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-border/50 bg-background/30 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="font-medium text-foreground">Company</TableHead>
                      <TableHead className="font-medium text-foreground">Role</TableHead>
                      <TableHead className="font-medium text-foreground">Pipeline</TableHead>
                      <TableHead className="font-medium text-foreground">Applied</TableHead>
                      <TableHead className="text-right font-medium text-foreground">Score</TableHead>
                      <TableHead className="font-medium text-foreground">PDF</TableHead>
                      <TableHead className="text-right font-medium text-foreground"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow className="hover:bg-transparent border-0">
                        <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-3">
                            <Sparkles className="w-8 h-8 opacity-20" />
                            <p className="font-medium">No jobs yet</p>
                            <p className="text-xs max-w-xs">Paste a job URL from LinkedIn, Greenhouse, Ashby, or Lever into the box on the left and click <strong>Ingest URLs</strong> to get started.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((j) => (
                        <TableRow key={j.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                          <TableCell className="font-semibold text-foreground">{j.company ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{j.role ?? "—"}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={j.status === "ERROR" ? "destructive" : "secondary"}
                              className={j.status === "EVALUATED" ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-muted-foreground"}
                            >
                              {j.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${appStatusColor(j.appStatus)}`}>
                              {appStatusLabel(j.appStatus)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={j.matchScore && j.matchScore > 70 ? "text-primary text-glow" : "text-muted-foreground"}>
                              {j.matchScore ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {j.evaluation?.generatedPdfPath ? (
                              <a
                                className="inline-flex items-center gap-1 text-primary hover:underline hover:text-glow transition-all"
                                href={j.evaluation.generatedPdfPath}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <FileText className="w-3 h-3" /> PDF
                              </a>
                            ) : (
                              <span className="text-muted-foreground opacity-50">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                              href={`/job/${j.id}`}
                            >
                              View <ArrowRight className="w-3 h-3" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}