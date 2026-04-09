"use client";

import { useEffect, useState } from "react";
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

type Settings = { googleApiKey: string | null; claudeApiKey: string | null };

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
  const [keys, setKeys] = useState<Settings>({ googleApiKey: null, claudeApiKey: null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const [p, r, s] = await Promise.all([
        apiFetch("/api/profile", { tenantEmail }).then((x) => x.json()),
        apiFetch("/api/resume", { tenantEmail }).then((x) => x.json()),
        apiFetch("/api/settings", { tenantEmail }).then((x) => x.json()),
      ]);
      setProfile(p as Profile);
      setResume(r as Resume);
      setKeys(s as Settings);
    })();
  }, [tenantEmail]);

  async function save() {
    setBusy(true);
    try {
      await Promise.all([
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
        apiFetch("/api/settings", {
          tenantEmail,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(keys),
        }),
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Settings"
      description="Profile, resume, and API keys for this tenant."
      right={<TenantSwitcher tenantEmail={tenantEmail} setTenantEmail={setTenantEmail} />}
    >
      <div className="space-y-6">
        <div className="flex justify-end">
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

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>API Keys (per tenant)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Google AI Studio key"
              value={keys.googleApiKey ?? ""}
              onChange={(e) => setKeys({ ...keys, googleApiKey: e.target.value })}
            />
            <Input
              placeholder="Anthropic API key"
              value={keys.claudeApiKey ?? ""}
              onChange={(e) => setKeys({ ...keys, claudeApiKey: e.target.value })}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}