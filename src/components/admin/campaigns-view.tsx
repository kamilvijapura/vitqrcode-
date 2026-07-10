"use client";

import { useState } from "react";
import { Plus, Megaphone, Calendar, Zap, Sparkles } from "lucide-react";
import type { Campaign } from "@/db/schema";
import { createCampaign } from "@/app/actions/campaigns";
import { PageHeader } from "@/components/admin/AdminShell";
import { Card, Button, Badge, Input, Field, Select, Textarea, EmptyState } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { formatDate, cn } from "@/lib/utils";

const TYPES = ["Festival", "Double Points", "Product Promotion", "Launch", "Seasonal"];

export function CampaignsView({ campaigns }: { campaigns: Campaign[] }) {
  const [open, setOpen] = useState(false);
  const active = campaigns.filter((c) => c.status === "active").length;

  return (
    <div>
      <PageHeader
        title="Campaign Management"
        description={`${active} active campaigns driving engagement`}
        icon={<Megaphone className="h-5 w-5" />}
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Campaign</Button>}
      />

      {campaigns.length === 0 ? (
        <Card><EmptyState icon={<Megaphone className="h-7 w-7" />} title="No campaigns yet" description="Launch your first campaign to boost engagement." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Campaign</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => {
            const mult = Number(c.pointsMultiplier);
            const start = new Date(c.startDate);
            const end = new Date(c.endDate);
            const now = new Date();
            const total = end.getTime() - start.getTime();
            const elapsed = now.getTime() - start.getTime();
            const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
            const ongoing = now >= start && now <= end;
            return (
              <Card key={c.id} className="overflow-hidden">
                <div className="relative h-28 overflow-hidden bg-brand-gradient">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
                  <span className="absolute right-4 top-4 text-5xl opacity-90 animate-floaty">{c.banner}</span>
                  <div className="absolute bottom-3 left-4">
                    <Badge className="capitalize" tone={ongoing ? "success" : "neutral"} dot>{ongoing ? "Active" : c.status}</Badge>
                  </div>
                  <div className="absolute right-4 bottom-3 rounded-xl bg-white/20 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                    {mult}x points
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-content">{c.name}</h3>
                  <p className="mt-1 text-sm text-muted">{c.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-subtle">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(c.startDate)} — {formatDate(c.endDate)}
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted">Campaign progress</span>
                      <span className="font-medium text-content">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs">
                    <Zap className="h-3.5 w-3.5 text-accent" />
                    <span className="text-muted">{c.type}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CampaignFormModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function CampaignFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ name: "", type: TYPES[0], description: "", pointsMultiplier: 2, startDate: today, endDate: future });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const submit = async () => {
    if (!form.name) {
      toast({ tone: "warning", title: "Name required", description: "Please enter a campaign name." });
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast({ tone: "warning", title: "Invalid dates", description: "End date must be after start date." });
      return;
    }
    setSaving(true);
    const res = await createCampaign(form);
    setSaving(false);
    if (!res.ok) {
      toast({ tone: "error", title: "Failed to launch campaign", description: res.error ?? "Please try again." });
      return;
    }
    toast({ tone: "success", title: "Campaign launched! 🚀", description: `${form.name} is now live.` });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Create Campaign" description="Launch a points multiplier campaign" size="lg">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Campaign Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Diwali Double Points" /></Field>
        <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Points Multiplier"><Input type="number" step="0.5" min="1" value={form.pointsMultiplier} onChange={(e) => setForm({ ...form, pointsMultiplier: Number(e.target.value) })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="End Date"><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
        </div>
        <div className="sm:col-span-2"><Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the campaign offer…" /></Field></div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-soft p-3 text-sm text-brand">
        <Sparkles className="h-4 w-4" /> Customers will earn {form.pointsMultiplier}× points during this campaign.
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Launching…" : "Launch Campaign"}</Button>
      </div>
    </Modal>
  );
}
