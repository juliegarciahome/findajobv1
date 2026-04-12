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

type Profile = {
  fullName: string | null;
  location: string | null;
  targetRoles: string[];
  narrativeHeadline: string | null;
  compTarget: string | null;
};

type Resume = { rawMarkdown: string };

export default function SettingsPage() {
  const { tenantEmail, setTenantEmail } = useTenantEmail();
  const [profile, setProfile] = useState<Profile>({
    fullName: null,
    location: null,
    targetRoles: [],
    narrativeHeadline: null,
    compTarget: null,
  });
  const [resume, setResume] = useState<Resume>({ rawMarkdown: "" });
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [pRes, rRes] = await Promise.all([
      apiFetch("/api/profile", { tenantEmail }),
      apiFetch("/api/resume", { tenantEmail }),
    ]);
    if (!pRes.ok) {
      throw new Error(`Profile load failed (${pRes.status})`);
    }
    if (!rRes.ok) {
      throw new Error(`Resume load failed (${rRes.status})`);
    }
    const [p, r] = await Promise.all([pRes.json(), rRes.json()]);
    setProfile(p as Profile);
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
    try {
      const [pRes, rRes] = await Promise.all([
        apiFetch("/api/profile", {
          tenantEmail,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...profile,
            targetRoles: profile.targetRoles,
          }),
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
        throw new Error(
          `Profile save failed (${pRes.status})${t ? `: ${t.slice(0, 200)}` : ""}`,
        );
      }
      if (!rRes.ok) {
        const t = await rRes.text();
        throw new Error(
          `Resume save failed (${rRes.status})${t ? `: ${t.slice(0, 200)}` : ""}`,
        );
      }
      const [p, r] = await Promise.all([pRes.json(), rRes.json()]);
      setProfile(p as Profile);
      setResume(r as Resume);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Settings"
      description="Profile and resume for this tenant. AI keys are configured on the server."
      backLink={{ href: "/dashboard", label: "Back to dashboard" }}
      right={<TenantSwitcher tenantEmail={tenantEmail} setTenantEmail={setTenantEmail} />}
    >
      <div className="space-y-6">
        <div className="flex flex-col items-end gap-2">
          {saveError ? (
            <p className="text-sm text-destructive max-w-prose text-right" role="alert">
              {saveError}
            </p>
          ) : null}
          <Button onClick={() => void save()} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Full name"
              value={profile.fullName ?? ""}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            />
            <Input
              placeholder="Location"
              value={profile.location ?? ""}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            />
            <Input
              className="md:col-span-2"
              placeholder="Target roles (comma separated)"
              value={profile.targetRoles.join(", ")}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  targetRoles: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
            <Input
              className="md:col-span-2"
              placeholder="Headline"
              value={profile.narrativeHeadline ?? ""}
              onChange={(e) => setProfile({ ...profile, narrativeHeadline: e.target.value })}
            />
            <Input
              className="md:col-span-2"
              placeholder="Comp target (optional)"
              value={profile.compTarget ?? ""}
              onChange={(e) => setProfile({ ...profile, compTarget: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Base Resume (Markdown)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={resume.rawMarkdown}
              onChange={(e) => setResume({ rawMarkdown: e.target.value })}
              className="min-h-64"
              placeholder="Paste your base resume markdown here"
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
