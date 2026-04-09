"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useTenantEmail } from "@/lib/client-tenant";

type AppStatus = "NONE" | "APPLIED" | "INTERVIEWING" | "OFFER";

type Job = {
  id: string;
  url: string;
  company: string | null;
  role: string | null;
  status: string;
  appStatus?: AppStatus | null;
  matchScore: number | null;
  evaluation?: {
    blockASummary?: string | null;
    blockBMatch?: string | null;
    blockCStrategy?: string | null;
    blockDComp?: string | null;
    blockFInterviewPrep?: string | null;
    generatedPdfPath?: string | null;
  } | null;
};

const APP_STATUS: { value: AppStatus; label: string }[] = [
  { value: "NONE", label: "Not yet" },
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "OFFER", label: "Offer" },
];

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { tenantEmail, setTenantEmail } = useTenantEmail();
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const res = await apiFetch(`/api/jobs/${params.id}`, { tenantEmail });
    if (!res.ok) return;
    const data = (await res.json()) as { job: Job };
    setJob(data.job);
  }, [params.id, tenantEmail]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

  return (
    <AppShell
      title={job?.company ?? "Job"}
      description={job?.role ?? ""}
      right={<TenantSwitcher tenantEmail={tenantEmail} setTenantEmail={setTenantEmail} />}
    >
      {!job ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Link className={buttonVariants({ variant: "outline" })} href="/pipeline">
                Back to Pipeline
              </Link>
              <a
                className={buttonVariants({ variant: "ghost" })}
                href={job.url}
                target="_blank"
                rel="noreferrer"
              >
                Open source URL
              </a>
              {job.evaluation?.generatedPdfPath ? (
                <a
                  className={buttonVariants({ variant: "default" })}
                  href={job.evaluation.generatedPdfPath}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open PDF
                </a>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm text-muted-foreground">Application status</div>
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
                      className={active ? "" : "bg-background"}
                    >
                      {s.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Pipeline status:</span> {job.status}
                </div>
                <div>
                  <span className="font-medium">Match score:</span> {job.matchScore ?? "—"}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>A) Summary</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">
                {job.evaluation?.blockASummary ?? "—"}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>B) Match</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">
                {job.evaluation?.blockBMatch ?? "—"}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>C) Strategy</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">
                {job.evaluation?.blockCStrategy ?? "—"}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>D) Compensation</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">
                {job.evaluation?.blockDComp ?? "—"}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>F) Interview Prep</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">
                {job.evaluation?.blockFInterviewPrep ?? "—"}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}