"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { TenantSwitcher } from "@/components/tenant-switcher";
import { ArrowRight, FileText, Search, Sparkles, Loader2 } from "lucide-react";

const AUTO_INGEST_URLS = [
  "https://job-boards.greenhouse.io/figma/jobs/5711571004?gh_jid=5711571004",
  "https://jobs.ashbyhq.com/notion/ff6129b1-5ed5-414d-ac0c-579e86e141d9",
  "https://jobs.lever.co/marketer-hire/b7680247-12b8-43e9-90fb-27f0efa4d4ac",
  "https://jobs.ashbyhq.com/Linear/82778dbf-711e-4d23-9d49-4a60db76737a",
  "https://jobs.ashbyhq.com/Linear/3adaa1f5-2cf1-480d-8daf-92345ec08395",
  "https://jobs.ashbyhq.com/Linear/c21af93e-210f-4969-8eaa-90fb16a5b720",
  "https://job-boards.greenhouse.io/figma/jobs/5830640004?gh_jid=5830640004",
  "https://jobs.lever.co/protolabs/7eeb766b-541a-4a36-ac42-583ea99c136c",
];

type AppStatus = "NONE" | "APPLIED" | "INTERVIEWING" | "OFFER";

type Job = {
  id: string;
  url: string;
  company: string | null;
  role: string | null;
  status: string;
  appStatus?: AppStatus | null;
  matchScore: number | null;
  updatedAt: string;
  evaluation?: { generatedPdfPath?: string | null } | null;
};

function appStatusLabel(s: AppStatus | null | undefined) {
  switch (s ?? "NONE") {
    case "APPLIED":
      return "Applied";
    case "INTERVIEWING":
      return "Interviewing";
    case "OFFER":
      return "Offer";
    default:
      return "Not yet";
  }
}

export default function PipelinePage() {
  const { tenantEmail, setTenantEmail } = useTenantEmail();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [urlsText, setUrlsText] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Interstitial states
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [progress, setProgress] = useState(0);

  const autoIngestRef = useRef<Record<string, boolean>>({});

  async function refresh() {
    setError(null);
    const res = await apiFetch("/api/jobs", { tenantEmail });
    if (!res.ok) return;
    const data = (await res.json()) as { jobs: Job[] };
    setJobs(data.jobs);

    // Auto-ingest logic
    if (tenantEmail && !autoIngestRef.current[tenantEmail]) {
      autoIngestRef.current[tenantEmail] = true;
      
      // ALWAYS show the interstitial for 5 seconds when the user opens the URL
      setShowInterstitial(true);
      const startTime = Date.now();
      const duration = 5000;
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(100, (elapsed / duration) * 100);
        setProgress(p);
        if (p >= 100) {
          clearInterval(interval);
          setShowInterstitial(false);
        }
      }, 50);

      const existing = new Set(data.jobs.map((j) => j.url));
      const missing = AUTO_INGEST_URLS.filter((u) => !existing.has(u));

      if (missing.length > 0) {
        setBusy(true);
        try {
          await apiFetch("/api/jobs/ingest", {
            tenantEmail,
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ urls: missing }),
          });
          const res2 = await apiFetch("/api/jobs", { tenantEmail });
          if (res2.ok) {
            setJobs(((await res2.json()) as { jobs: Job[] }).jobs);
          }
        } catch (e) {
          console.error("Auto ingest failed", e);
        } finally {
          setBusy(false);
        }
      }
    }
  }

  useEffect(() => {
    void refresh();
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
      right={<TenantSwitcher tenantEmail={tenantEmail} setTenantEmail={setTenantEmail} />}
    >
      {/* Interstitial Overlay */}
      {showInterstitial && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-2xl">
          <div className="flex flex-col items-center max-w-md w-full p-8 text-center bg-card/40 border border-border/50 rounded-3xl shadow-2xl glow-shadow animate-in fade-in zoom-in duration-500">
            <div className="relative flex items-center justify-center w-20 h-20 mb-6 bg-primary/10 rounded-2xl border border-primary/30 shadow-[0_0_30px_-5px_oklch(0.68_0.18_260)]">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              <Loader2 className="absolute w-24 h-24 text-primary/40 animate-spin" strokeWidth={1} />
            </div>
            
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-3 text-glow">
              AI is pulling all jobs for you...
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              We are automatically ingesting selected job URLs. Evaluating fit in the background.
            </p>

            <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-primary transition-all ease-linear shadow-[0_0_10px_oklch(0.68_0.18_260)]"
                style={{ width: `${progress}%`, transitionDuration: '50ms' }}
              />
            </div>
            <div className="mt-3 text-xs font-medium text-primary">
              {Math.round(progress)}%
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
                  disabled={busy || showInterstitial}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_-3px_oklch(0.68_0.18_260)] hover:shadow-[0_0_20px_-3px_oklch(0.68_0.18_260)] transition-all rounded-xl"
                >
                  {busy ? "Working..." : "Ingest URLs"}
                </Button>
                <Button variant="outline" onClick={() => void refresh()} disabled={busy || showInterstitial} className="rounded-xl border-border/50 bg-background/50">
                  Refresh
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Tip: Jobs appear in the table immediately. Evaluation continues in the background.
              </div>
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
                            <Search className="w-8 h-8 opacity-20" />
                            <p>No jobs found. Try adjusting your search or ingest a new URL.</p>
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
                            <Badge 
                              variant={(j.appStatus ?? "NONE") === "NONE" ? "outline" : "secondary"}
                              className={(j.appStatus ?? "NONE") !== "NONE" ? "bg-green-500/20 text-green-500 border-green-500/30" : "border-border/50 text-muted-foreground"}
                            >
                              {appStatusLabel(j.appStatus)}
                            </Badge>
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