"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { useTenantEmail } from "@/lib/client-tenant";
import { PORTALS } from "@/data/portals";

type JobResult = {
  title: string;
  company: string;
  url: string;
  location: string;
  source: string;
  postedAt?: string;
};

type PortalInfo = {
  company: string;
  careersUrl: string;
  notes?: string;
  category: string;
};

type ScanResult = {
  scannedAt: string;
  jobs: JobResult[];
  total: number;
  portalList: PortalInfo[];
  categories: string[];
};

const CATEGORIES = [...new Set(PORTALS.map((p) => p.category))];

export default function ScanPage() {
  const { tenantEmail, setTenantEmail } = useTenantEmail();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ingestingUrls, setIngestingUrls] = useState<Set<string>>(new Set());
  const [ingestedUrls, setIngestedUrls] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"jobs" | "portals">("jobs");

  async function scan() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/jobs/scan", {
        tenantEmail,
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categories: selectedCategories }),
      });
      if (res.ok) {
        setResult(await res.json() as ScanResult);
      }
    } finally {
      setLoading(false);
    }
  }

  async function ingestJob(url: string) {
    setIngestingUrls((s) => new Set(s).add(url));
    try {
      await apiFetch("/api/jobs/ingest", {
        tenantEmail,
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls: [url] }),
      });
      setIngestedUrls((s) => new Set(s).add(url));
    } finally {
      setIngestingUrls((s) => { const n = new Set(s); n.delete(url); return n; });
    }
  }

  async function ingestAll() {
    if (!result) return;
    const urls = result.jobs.map((j) => j.url).filter((u) => !ingestedUrls.has(u));
    setLoading(true);
    try {
      await apiFetch("/api/jobs/ingest", {
        tenantEmail,
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      setIngestedUrls((s) => new Set([...s, ...urls]));
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((s) =>
      s.includes(cat) ? s.filter((c) => c !== cat) : [...s, cat]
    );
  }

  const sourceLabel = (s: string) =>
    s === "greenhouse_api" ? "Greenhouse API" : s === "playwright" ? "Playwright" : "Web Search";

  return (
    <AppShell
      title="Portal Scanner"
      description="Scan 35+ company career portals for matching roles and add them to your pipeline."
      backLink={{ href: "/dashboard", label: "Back to dashboard" }}
      right={<TenantSwitcher tenantEmail={tenantEmail} setTenantEmail={setTenantEmail} />}
    >
      <div className="space-y-6">
        {/* Category filter */}
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>Filter by Category</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategories.includes(cat) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
              {selectedCategories.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setSelectedCategories([])}>
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {selectedCategories.length === 0
                ? "Scanning all categories (Greenhouse API portals only for live scan)"
                : `Scanning: ${selectedCategories.join(", ")}`}
            </p>
            <Button onClick={() => void scan()} disabled={loading}>
              {loading ? "Scanning…" : "Scan Portals"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Scanned {new Date(result.scannedAt).toLocaleString()} · {result.total} matching jobs found
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant={view === "jobs" ? "default" : "outline"} onClick={() => setView("jobs")}>
                  Jobs ({result.jobs.length})
                </Button>
                <Button size="sm" variant={view === "portals" ? "default" : "outline"} onClick={() => setView("portals")}>
                  All Portals ({result.portalList.length})
                </Button>
                {result.jobs.length > 0 && view === "jobs" && (
                  <Button size="sm" onClick={() => void ingestAll()} disabled={loading}>
                    Add All to Pipeline
                  </Button>
                )}
              </div>
            </div>

            {view === "jobs" && (
              <div className="space-y-3">
                {result.jobs.map((job) => {
                  const ingested = ingestedUrls.has(job.url);
                  const ingesting = ingestingUrls.has(job.url);
                  return (
                    <Card key={job.url} className="rounded-xl">
                      <CardContent className="py-3 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{job.title}</span>
                            <Badge variant="secondary" className="text-xs">{job.company}</Badge>
                            <Badge variant="outline" className="text-xs">{job.location}</Badge>
                            <span className="text-xs text-muted-foreground">{sourceLabel(job.source)}</span>
                          </div>
                          <a href={job.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate block mt-1">
                            {job.url}
                          </a>
                        </div>
                        <Button
                          size="sm"
                          variant={ingested ? "secondary" : "outline"}
                          disabled={ingesting || ingested}
                          onClick={() => void ingestJob(job.url)}
                        >
                          {ingested ? "Added ✓" : ingesting ? "Adding…" : "Add to Pipeline"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {view === "portals" && (
              <div className="space-y-3">
                {result.portalList.map((portal) => (
                  <Card key={portal.company} className="rounded-xl">
                    <CardContent className="py-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{portal.company}</span>
                          <Badge variant="outline" className="text-xs">{portal.category}</Badge>
                        </div>
                        {portal.notes && <p className="text-xs text-muted-foreground mt-0.5">{portal.notes}</p>}
                        <a href={portal.careersUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline block mt-1">
                          {portal.careersUrl}
                        </a>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">Manual scan</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Portal stats */}
        <Card className="rounded-2xl border-dashed">
          <CardHeader><CardTitle className="text-sm">Coverage</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{PORTALS.length}</p>
                <p className="text-xs text-muted-foreground">Total portals</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{PORTALS.filter((p) => p.scanMethod === "greenhouse_api").length}</p>
                <p className="text-xs text-muted-foreground">Greenhouse API (live)</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{PORTALS.filter((p) => p.scanMethod === "websearch").length}</p>
                <p className="text-xs text-muted-foreground">Web search</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{CATEGORIES.length}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
