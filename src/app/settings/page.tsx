"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useTenantEmail } from "@/lib/client-tenant";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProofPoint = { name: string; url?: string; heroMetric?: string };

type Profile = {
  fullName: string | null;
  location: string | null;
  targetRoles: string[];
  narrativeHeadline: string | null;
  compTarget: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  exitStory: string | null;
  superpowers: string[];
  proofPoints: ProofPoint[];
  compensationMin: string | null;
  visaStatus: string | null;
};

type Resume = { rawMarkdown: string };

const VISA_OPTIONS = ["No visa required", "EU/EEA citizen", "Work permit needed", "Sponsorship required", "Open to relocation"];

export default function SettingsPage() {
  const { tenantEmail, setTenantEmail } = useTenantEmail();
  const [profile, setProfile] = useState<Profile>({
    fullName: null,
    location: null,
    targetRoles: [],
    narrativeHeadline: null,
    compTarget: null,
    linkedinUrl: null,
    portfolioUrl: null,
    githubUrl: null,
    exitStory: null,
    superpowers: [],
    proofPoints: [],
    compensationMin: null,
    visaStatus: null,
  });
  const [resume, setResume] = useState<Resume>({ rawMarkdown: "" });
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // For proof point editing
  const [newProofName, setNewProofName] = useState("");
  const [newProofMetric, setNewProofMetric] = useState("");
  const [newProofUrl, setNewProofUrl] = useState("");

  const loadData = useCallback(async () => {
    const [pRes, rRes] = await Promise.all([
      apiFetch("/api/profile", { tenantEmail }),
      apiFetch("/api/resume", { tenantEmail }),
    ]);
    if (!pRes.ok) throw new Error(`Profile load failed (${pRes.status})`);
    if (!rRes.ok) throw new Error(`Resume load failed (${rRes.status})`);
    const [p, r] = await Promise.all([pRes.json(), rRes.json()]);
    setProfile({
      fullName: p.fullName ?? null,
      location: p.location ?? null,
      targetRoles: p.targetRoles ?? [],
      narrativeHeadline: p.narrativeHeadline ?? null,
      compTarget: p.compTarget ?? null,
      linkedinUrl: p.linkedinUrl ?? null,
      portfolioUrl: p.portfolioUrl ?? null,
      githubUrl: p.githubUrl ?? null,
      exitStory: p.exitStory ?? null,
      superpowers: p.superpowers ?? [],
      proofPoints: (p.proofPoints as ProofPoint[]) ?? [],
      compensationMin: p.compensationMin ?? null,
      visaStatus: p.visaStatus ?? null,
    });
    setResume(r as Resume);
  }, [tenantEmail]);

  useEffect(() => {
    setSaveError(null);
    void loadData().catch((e: unknown) => {
      setSaveError(e instanceof Error ? e.message : "Failed to load settings");
    });
  }, [loadData]);

  async function save() {
    setBusy(true);
    setSaveError(null);
    setSaved(false);
    try {
      const [pRes, rRes] = await Promise.all([
        apiFetch("/api/profile", {
          tenantEmail,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(profile),
        }),
        apiFetch("/api/resume", {
          tenantEmail,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(resume),
        }),
      ]);
      if (!pRes.ok) {
        const t = await pRes.text();
        throw new Error(`Profile save failed (${pRes.status})${t ? `: ${t.slice(0, 200)}` : ""}`);
      }
      if (!rRes.ok) {
        const t = await rRes.text();
        throw new Error(`Resume save failed (${rRes.status})${t ? `: ${t.slice(0, 200)}` : ""}`);
      }
      // Reload from server to confirm what was actually saved
      await loadData();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function addProofPoint() {
    if (!newProofName.trim()) return;
    setProfile({
      ...profile,
      proofPoints: [
        ...profile.proofPoints,
        { name: newProofName.trim(), heroMetric: newProofMetric.trim() || undefined, url: newProofUrl.trim() || undefined },
      ],
    });
    setNewProofName("");
    setNewProofMetric("");
    setNewProofUrl("");
  }

  function removeProofPoint(i: number) {
    setProfile({ ...profile, proofPoints: profile.proofPoints.filter((_, idx) => idx !== i) });
  }

  return (
    <AppShell
      title="Settings"
      description="Profile, resume, and career preferences for AI evaluation."
      backLink={{ href: "/dashboard", label: "Back to dashboard" }}
      right={<TenantSwitcher tenantEmail={tenantEmail} setTenantEmail={setTenantEmail} />}
    >
      <div className="space-y-4">
        <div className="flex flex-col items-end gap-2">
          {saveError && (
            <p className="text-sm text-destructive max-w-prose text-right" role="alert">{saveError}</p>
          )}
          {saved && (
            <p className="text-sm text-green-600 dark:text-green-400">Saved successfully</p>
          )}
          <Button onClick={() => void save()} disabled={busy}>
            {busy ? "Saving…" : "Save All"}
          </Button>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="links">Links & Presence</TabsTrigger>
            <TabsTrigger value="career">Career Story</TabsTrigger>
            <TabsTrigger value="proof">Proof Points</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Core Profile</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Full name"
                  value={profile.fullName ?? ""}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                />
                <Input
                  placeholder="Location (e.g. Madrid, Spain)"
                  value={profile.location ?? ""}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                />
                <Input
                  className="md:col-span-2"
                  placeholder="Target roles (comma separated, e.g. Solutions Architect, AI PM)"
                  value={profile.targetRoles.join(", ")}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      targetRoles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
                <Textarea
                  className="md:col-span-2 min-h-20"
                  placeholder="Narrative headline — your 2-sentence career story for AI prompts"
                  value={profile.narrativeHeadline ?? ""}
                  onChange={(e) => setProfile({ ...profile, narrativeHeadline: e.target.value })}
                />
                <Input
                  placeholder="Comp target (e.g. €120k–€150k + equity)"
                  value={profile.compTarget ?? ""}
                  onChange={(e) => setProfile({ ...profile, compTarget: e.target.value })}
                />
                <Input
                  placeholder="Minimum compensation (e.g. €100k)"
                  value={profile.compensationMin ?? ""}
                  onChange={(e) => setProfile({ ...profile, compensationMin: e.target.value })}
                />
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Visa / Work Authorization</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={profile.visaStatus ?? ""}
                    onChange={(e) => setProfile({ ...profile, visaStatus: e.target.value || null })}
                  >
                    <option value="">Select visa status…</option>
                    {VISA_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Superpowers (comma separated)</label>
                  <Input
                    placeholder="e.g. LLM integration, Voice AI, enterprise sales, rapid prototyping"
                    value={profile.superpowers.join(", ")}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        superpowers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Online Presence</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <Input
                  placeholder="LinkedIn URL (https://linkedin.com/in/...)"
                  value={profile.linkedinUrl ?? ""}
                  onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                />
                <Input
                  placeholder="Portfolio / personal site URL"
                  value={profile.portfolioUrl ?? ""}
                  onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                />
                <Input
                  placeholder="GitHub URL (https://github.com/...)"
                  value={profile.githubUrl ?? ""}
                  onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="career">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Career Story</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Exit Story</label>
                  <Textarea
                    className="min-h-28"
                    placeholder="Why you left / are leaving your last role. Used by AI to craft honest interview answers."
                    value={profile.exitStory ?? ""}
                    onChange={(e) => setProfile({ ...profile, exitStory: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Archetype Keywords (for AI detection)</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    These help AI correctly classify your profile.
                  </p>
                  <Input
                    placeholder="e.g. SA, FDE, Agentic"
                    value={profile.superpowers.join(", ")}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        superpowers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proof">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Proof Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Quantified achievements used by AI when drafting your personalized CV and answers.
                  Format: achievement name + hero metric + optional URL.
                </p>
                <div className="space-y-2">
                  {profile.proofPoints.map((pp, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{pp.name}</p>
                        {pp.heroMetric && <p className="text-xs text-muted-foreground">{pp.heroMetric}</p>}
                        {pp.url && <p className="text-xs text-primary truncate">{pp.url}</p>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeProofPoint(i)}>✕</Button>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <Input
                    placeholder="Achievement name"
                    value={newProofName}
                    onChange={(e) => setNewProofName(e.target.value)}
                  />
                  <Input
                    placeholder="Hero metric (e.g. +40% conversion)"
                    value={newProofMetric}
                    onChange={(e) => setNewProofMetric(e.target.value)}
                  />
                  <Input
                    placeholder="URL (optional)"
                    value={newProofUrl}
                    onChange={(e) => setNewProofUrl(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={addProofPoint} disabled={!newProofName.trim()}>
                  Add Proof Point
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Base Resume (Markdown)</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  value={resume.rawMarkdown}
                  onChange={(e) => setResume({ rawMarkdown: e.target.value })}
                  className="min-h-96 font-mono text-sm"
                  placeholder="Paste your base resume in Markdown format here. This is the foundation for all AI personalization."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </AppShell>
  );
}
