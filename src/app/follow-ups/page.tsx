"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useTenantEmail } from "@/lib/client-tenant";

type FollowUp = {
  id: string;
  jobId: string;
  channel: "Email" | "LinkedIn";
  contactName: string | null;
  notes: string | null;
  draftText: string | null;
  followupNum: number;
  sent: boolean;
  sentAt: string | null;
  createdAt: string;
  job?: { company: string | null; role: string | null; appStatus: string };
};

type NewFollowUp = {
  jobId: string;
  channel: "Email" | "LinkedIn";
  contactName: string;
  notes: string;
  draftText: string;
  followupNum: number;
};

const DRAFT_TEMPLATES = {
  1: `Subject: Following up on my application — [Role] at [Company]

Hi [Name],

I recently applied for the [Role] position at [Company] and wanted to reach out to express my continued interest.

I've been particularly excited about [specific reason], and I believe my experience with [relevant experience] makes me a strong fit.

Would you be available for a brief call this week? Happy to work around your schedule.

Best regards,
[Your name]`,
  2: `Subject: Quick follow-up — [Role] at [Company]

Hi [Name],

I wanted to follow up on my application submitted [X] weeks ago for the [Role] role.

I've since [new development/update] which I think is directly relevant to what you're building.

Still very interested — is there a next step I can help facilitate?

Best,
[Your name]`,
  3: `Subject: Final follow-up — [Role] at [Company]

Hi [Name],

I understand you're likely very busy with many applications. This will be my final follow-up for the [Role] position.

I remain genuinely excited about [Company]'s work on [specific product/initiative], and would love to contribute.

If the timing isn't right now, I'd be happy to stay in touch for future opportunities.

Thank you for your consideration.
[Your name]`,
};

export default function FollowUpsPage() {
  const { tenantEmail } = useTenantEmail();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewFollowUp>({
    jobId: "",
    channel: "Email",
    contactName: "",
    notes: "",
    draftText: "",
    followupNum: 1,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/follow-ups", { tenantEmail });
      if (res.ok) {
        const data = await res.json() as { followUps: FollowUp[] };
        setFollowUps(data.followUps);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantEmail]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!form.jobId) return;
    await apiFetch("/api/follow-ups", {
      tenantEmail,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ jobId: "", channel: "Email", contactName: "", notes: "", draftText: "", followupNum: 1 });
    void load();
  }

  async function markSent(id: string) {
    await apiFetch("/api/follow-ups", {
      tenantEmail,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, sent: true, sentAt: new Date().toISOString() }),
    });
    void load();
  }

  async function deleteFollowUp(id: string) {
    await apiFetch("/api/follow-ups", {
      tenantEmail,
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    void load();
  }

  const pending = followUps.filter((f) => !f.sent);
  const sent = followUps.filter((f) => f.sent);

  return (
    <AppShell
      title="Follow-ups"
      description="Track and draft follow-up messages for your applications."
      backLink={{ href: "/dashboard", label: "Back to dashboard" }}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span>{pending.length} pending</span>
            <span>·</span>
            <span>{sent.length} sent</span>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "New Follow-up"}
          </Button>
        </div>

        {showForm && (
          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Create Follow-up</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Job ID (from pipeline URL)"
                value={form.jobId}
                onChange={(e) => setForm({ ...form, jobId: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Channel</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value as "Email" | "LinkedIn" })}
                  >
                    <option>Email</option>
                    <option>LinkedIn</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Follow-up #</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.followupNum}
                    onChange={(e) => setForm({ ...form, followupNum: Number(e.target.value) })}
                  >
                    <option value={1}>1st</option>
                    <option value={2}>2nd</option>
                    <option value={3}>3rd (final)</option>
                  </select>
                </div>
              </div>
              <Input
                placeholder="Contact name (optional)"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              />
              <Input
                placeholder="Notes (e.g. context, timing)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <div>
                <div className="flex gap-2 mb-1">
                  <label className="text-xs font-medium">Draft Message</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-5"
                    onClick={() => setForm({ ...form, draftText: DRAFT_TEMPLATES[form.followupNum as 1 | 2 | 3] ?? "" })}
                  >
                    Use template #{form.followupNum}
                  </Button>
                </div>
                <Textarea
                  className="min-h-40 font-mono text-xs"
                  value={form.draftText}
                  onChange={(e) => setForm({ ...form, draftText: e.target.value })}
                  placeholder="Draft your follow-up message here…"
                />
              </div>
              <Button onClick={() => void save()} disabled={!form.jobId}>Save Follow-up</Button>
            </CardContent>
          </Card>
        )}

        {pending.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Pending ({pending.length})</h2>
            <div className="space-y-3">
              {pending.map((fu) => (
                <Card key={fu.id} className="rounded-xl">
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {fu.job?.company && <span className="font-medium text-sm">{fu.job.company}</span>}
                        {fu.job?.role && <span className="text-sm text-muted-foreground">— {fu.job.role}</span>}
                        <Badge variant="outline">{fu.channel}</Badge>
                        <Badge variant="secondary">Follow-up #{fu.followupNum}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => void markSent(fu.id)}>Mark Sent</Button>
                        <Button size="sm" variant="ghost" onClick={() => void deleteFollowUp(fu.id)}>Delete</Button>
                      </div>
                    </div>
                    {fu.contactName && <p className="text-xs text-muted-foreground">To: {fu.contactName}</p>}
                    {fu.notes && <p className="text-xs text-muted-foreground">{fu.notes}</p>}
                    {fu.draftText && (
                      <details>
                        <summary className="text-xs text-primary cursor-pointer">View draft</summary>
                        <pre className="text-xs mt-2 whitespace-pre-wrap bg-muted/30 rounded p-2">{fu.draftText}</pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {sent.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Sent ({sent.length})</h2>
            <div className="space-y-2">
              {sent.map((fu) => (
                <Card key={fu.id} className="rounded-xl opacity-60">
                  <CardContent className="py-2 flex items-center gap-2 text-sm flex-wrap">
                    {fu.job?.company && <span className="font-medium">{fu.job.company}</span>}
                    <Badge variant="outline">{fu.channel}</Badge>
                    <Badge variant="secondary">#{fu.followupNum}</Badge>
                    {fu.sentAt && <span className="text-xs text-muted-foreground">Sent {new Date(fu.sentAt).toLocaleDateString()}</span>}
                    <Button size="sm" variant="ghost" className="ml-auto text-xs" onClick={() => void deleteFollowUp(fu.id)}>Delete</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!loading && followUps.length === 0 && !showForm && (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="mb-2">No follow-ups yet.</p>
              <p className="text-sm">Create follow-ups for jobs where you&apos;ve applied to stay top-of-mind with recruiters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
