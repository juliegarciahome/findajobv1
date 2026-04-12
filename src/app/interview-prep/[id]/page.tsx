"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useTenantEmail } from "@/lib/client-tenant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Prep = {
  id?: string;
  jobId: string;
  company?: string;
  role?: string;
  processOverview?: string | null;
  likelyQuestions?: string | null;
  storyGapMap?: string | null;
  techChecklist?: string | null;
  companySignals?: string | null;
  researchedAt?: string;
};

export default function InterviewPrepPage({ params }: { params: { id: string } }) {
  const { tenantEmail, setTenantEmail } = useTenantEmail();
  const [prep, setPrep] = useState<Prep | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/interview-prep?jobId=${params.id}`, { tenantEmail });
      if (res.ok) setPrep(await res.json() as Prep);
    } finally {
      setLoading(false);
    }
  }, [params.id, tenantEmail]);

  useEffect(() => { void load(); }, [load]);

  async function generate(regenerate = false) {
    setGenerating(true);
    try {
      const res = await apiFetch("/api/interview-prep", {
        tenantEmail,
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId: params.id, regenerate }),
      });
      if (res.ok) setPrep(await res.json() as Prep);
    } finally {
      setGenerating(false);
    }
  }

  const hasContent = prep?.processOverview || prep?.likelyQuestions;

  return (
    <AppShell
      title={prep?.company ? `${prep.company} — Interview Prep` : "Interview Prep"}
      description={prep?.role ?? ""}
      backLink={{ href: `/job/${params.id}`, label: "Back to Job" }}
      right={<TenantSwitcher tenantEmail={tenantEmail} setTenantEmail={setTenantEmail} />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {prep?.researchedAt
              ? `Generated ${new Date(prep.researchedAt).toLocaleDateString()}`
              : "Not yet generated"}
          </div>
          <div className="flex gap-2">
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/job/${params.id}`}>
              View Evaluation
            </Link>
            {!hasContent ? (
              <Button onClick={() => void generate(false)} disabled={generating}>
                {generating ? "Generating…" : "Generate Interview Prep"}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => void generate(true)} disabled={generating}>
                {generating ? "Regenerating…" : "Regenerate"}
              </Button>
            )}
          </div>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

        {!loading && !hasContent && (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-lg mb-2">No interview prep generated yet.</p>
              <p className="text-sm mb-6">Click "Generate Interview Prep" to create a tailored guide with likely questions, STAR story gaps, and company research.</p>
              <Button onClick={() => void generate(false)} disabled={generating}>
                {generating ? "Generating (30-60 seconds)…" : "Generate Now"}
              </Button>
            </CardContent>
          </Card>
        )}

        {hasContent && (
          <Tabs defaultValue="process">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="process">Process</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="stories">Story Gaps</TabsTrigger>
              <TabsTrigger value="tech">Tech Checklist</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
            </TabsList>

            {[
              {
                key: "process",
                title: "Interview Process Overview",
                body: prep?.processOverview,
                hint: "Typical stages, timeline, and what each round tests.",
              },
              {
                key: "questions",
                title: "Likely Questions (15-20)",
                body: prep?.likelyQuestions,
                hint: "Organized by category: behavioral, technical, situational, culture.",
              },
              {
                key: "stories",
                title: "STAR Story Gap Map",
                body: prep?.storyGapMap,
                hint: "JD requirements vs available stories. Missing stories highlighted.",
              },
              {
                key: "tech",
                title: "Technical Checklist",
                body: prep?.techChecklist,
                hint: "Topics/tools from JD + prep priority ratings.",
              },
              {
                key: "company",
                title: "Company Research Signals",
                body: prep?.companySignals,
                hint: "Mission, recent news, culture signals, talking points.",
              },
            ].map((tab) => (
              <TabsContent key={tab.key} value={tab.key}>
                <Card>
                  <CardHeader>
                    <CardTitle>{tab.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{tab.hint}</p>
                  </CardHeader>
                  <CardContent className="whitespace-pre-wrap text-sm leading-relaxed">
                    {tab.body ?? "—"}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
