"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useTenantEmail } from "@/lib/client-tenant";

type Story = {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection: string;
  tags: string[];
  jobId: string | null;
  job?: { company: string | null; role: string | null } | null;
  createdAt: string;
};

const EMPTY_STORY = {
  id: "",
  title: "",
  situation: "",
  task: "",
  action: "",
  result: "",
  reflection: "",
  tags: [] as string[],
  jobId: null as string | null,
};

export default function StoryBankPage() {
  const { tenantEmail, setTenantEmail } = useTenantEmail();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_STORY);
  const [tagInput, setTagInput] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch("/api/story-bank", { tenantEmail });
    if (res.ok) {
      const data = await res.json() as { stories: Story[] };
      setStories(data.stories);
    }
    setLoading(false);
  }, [tenantEmail]);

  useEffect(() => { void load(); }, [load]);

  function startNew() {
    setForm(EMPTY_STORY);
    setTagInput("");
    setEditingId("new");
  }

  function startEdit(story: Story) {
    setForm({ ...story });
    setTagInput(story.tags.join(", "));
    setEditingId(story.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_STORY);
    setTagInput("");
  }

  async function save() {
    if (!form.title.trim()) return;
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    await apiFetch("/api/story-bank", {
      tenantEmail,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, tags, id: editingId === "new" ? undefined : editingId }),
    });
    cancelEdit();
    void load();
  }

  async function deleteStory(id: string) {
    await apiFetch("/api/story-bank", {
      tenantEmail,
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    void load();
  }

  return (
    <AppShell
      title="Story Bank"
      description="STAR+R stories for interviews. Build your library once, reference forever."
      backLink={{ href: "/dashboard", label: "Back to dashboard" }}
      right={<TenantSwitcher tenantEmail={tenantEmail} setTenantEmail={setTenantEmail} />}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{stories.length} stories</p>
          <Button onClick={startNew} disabled={editingId !== null}>New Story</Button>
        </div>

        {editingId !== null && (
          <Card className="rounded-2xl border-primary/30">
            <CardHeader>
              <CardTitle>{editingId === "new" ? "New Story" : "Edit Story"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Story title (e.g. 'Launched AI chatbot that cut support tickets 40%')"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              {[
                { key: "situation" as const, label: "S — Situation", hint: "Context: who, what, when, where, why" },
                { key: "task" as const, label: "T — Task", hint: "What was your specific responsibility?" },
                { key: "action" as const, label: "A — Action", hint: "What did YOU specifically do? (use 'I', not 'we')" },
                { key: "result" as const, label: "R — Result", hint: "Quantified outcome. Revenue, time saved, % improvement…" },
                { key: "reflection" as const, label: "R — Reflection", hint: "What did you learn? What would you do differently?" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium mb-1 block">{f.label}</label>
                  <p className="text-xs text-muted-foreground mb-1">{f.hint}</p>
                  <Textarea
                    className="min-h-16"
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.hint}
                  />
                </div>
              ))}

              <div>
                <label className="text-xs font-medium mb-1 block">Tags (comma separated)</label>
                <Input
                  placeholder="leadership, technical, growth, conflict, delivery…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Linked Job ID (optional)</label>
                <Input
                  placeholder="Job ID from pipeline"
                  value={form.jobId ?? ""}
                  onChange={(e) => setForm({ ...form, jobId: e.target.value || null })}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => void save()} disabled={!form.title.trim()}>Save Story</Button>
                <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && <div className="text-sm text-muted-foreground">Loading stories…</div>}

        {!loading && stories.length === 0 && editingId === null && (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="text-lg mb-2">No stories yet.</p>
              <p className="text-sm mb-6">
                Build your STAR+R story bank. The AI evaluator will use these to map your stories to job requirements and identify gaps.
              </p>
              <Button onClick={startNew}>Create First Story</Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {stories.map((story) => {
            const expanded = expandedId === story.id;
            return (
              <Card key={story.id} className="rounded-xl">
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedId(expanded ? null : story.id)}
                    >
                      <p className="font-medium text-sm">{story.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {story.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                        {story.job?.company && (
                          <Badge variant="outline" className="text-xs">{story.job.company}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(story)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => void deleteStory(story.id)}>Delete</Button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-4 space-y-3 border-t pt-3">
                      {[
                        { label: "Situation", text: story.situation },
                        { label: "Task", text: story.task },
                        { label: "Action", text: story.action },
                        { label: "Result", text: story.result },
                        { label: "Reflection", text: story.reflection },
                      ].map((s) => s.text ? (
                        <div key={s.label}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                          <p className="text-sm mt-0.5 whitespace-pre-wrap">{s.text}</p>
                        </div>
                      ) : null)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
