"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Gift, Star, AlertTriangle } from "lucide-react";
import type { Reward } from "@/db/schema";
import { createReward, deleteReward } from "@/app/actions/rewards";
import { PageHeader } from "@/components/admin/AdminShell";
import { Card, Button, Badge, Avatar, Input, Field, Select, Textarea, EmptyState, ProgressBar } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { formatNumber, cn } from "@/lib/utils";

const EMOJIS = ["🎧", "⌚", "👕", "🪛", "🍶", "💡", "🎒", "🔌", "☕", "🎁", "📱", "🎫", "🛍️", "🏆"];
const CATS = ["Electronics", "Tools", "Apparel", "Lifestyle", "Home", "Vouchers"];

export function RewardsView({ rewards }: { rewards: Reward[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<Reward | null>(null);
  const { toast } = useToast();

  const categories = ["all", ...Array.from(new Set(rewards.map((r) => r.category)))];
  const filtered = rewards.filter((r) => {
    const q = query.toLowerCase();
    return (!q || r.name.toLowerCase().includes(q)) && (cat === "all" || r.category === cat);
  });

  return (
    <div>
      <PageHeader
        title="Reward Catalogue"
        description={`${rewards.length} gifts available for redemption`}
        icon={<Gift className="h-5 w-5" />}
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Gift</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input placeholder="Search rewards…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full px-3.5 py-2 text-xs font-medium capitalize transition-colors", cat === c ? "bg-brand text-brand-foreground" : "bg-surface-2 text-muted hover:text-content")}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Gift className="h-7 w-7" />} title="No rewards found" description="Add gifts for customers to redeem." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Gift</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => {
            const lowStock = r.stock > 0 && r.stock < 20;
            return (
              <Card key={r.id} className="group overflow-hidden p-5 transition-shadow hover:shadow-pop">
                <div className="flex items-start justify-between">
                  <Avatar src={r.imageUrl} name={r.name} size={56} className="rounded-2xl text-3xl" />
                  <button onClick={() => setDel(r)} className="opacity-0 transition-opacity group-hover:opacity-100 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="mt-3 font-semibold text-content">{r.name}</h3>
                <p className="text-xs text-muted">{r.category}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-bold text-content">{formatNumber(r.requiredPoints)}</span>
                  <span className="text-xs text-muted">points</span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted">Stock</span>
                    <span className={cn("font-medium", lowStock ? "text-warning" : "text-content")}>{r.stock} left</span>
                  </div>
                  <ProgressBar value={(r.stock / 120) * 100} tone={lowStock ? "warning" : "brand"} />
                </div>
                <div className="mt-3">
                  {r.status === "out_of_stock" ? (
                    <Badge tone="danger" dot>Out of stock</Badge>
                  ) : lowStock ? (
                    <Badge tone="warning" dot><AlertTriangle className="h-3 w-3" /> Low stock</Badge>
                  ) : (
                    <Badge tone="success" dot>Available</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RewardFormModal open={open} onClose={() => setOpen(false)} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={() => { if (del) { deleteReward(del.id); toast({ tone: "success", title: "Reward deleted", description: del.name }); } }} title="Delete reward?" message={`"${del?.name}" will be removed from the catalogue.`} confirmLabel="Delete" danger />
    </div>
  );
}

function RewardFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", category: CATS[0], description: "", requiredPoints: 1000, stock: 50, emoji: "🎁" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const submit = async () => {
    if (!form.name) {
      toast({ tone: "warning", title: "Name required", description: "Please enter a gift name." });
      return;
    }
    setSaving(true);
    const res = await createReward(form);
    setSaving(false);
    if (!res.ok) {
      toast({ tone: "error", title: "Failed to create reward", description: res.error ?? "Please try again." });
      return;
    }
    toast({ tone: "success", title: "Gift added! 🎁", description: `${form.name} is now redeemable.` });
    setForm({ name: "", category: CATS[0], description: "", requiredPoints: 1000, stock: 50, emoji: "🎁" });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Add Reward Gift" description="Create a redeemable gift item" size="lg">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Gift Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bluetooth Earbuds" /></Field>
        <Field label="Category"><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Required Points"><Input type="number" value={form.requiredPoints} onChange={(e) => setForm({ ...form, requiredPoints: Number(e.target.value) })} /></Field>
        <Field label="Stock Quantity"><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></Field>
        <div className="sm:col-span-2"><Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description…" /></Field></div>
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-content">Icon</span>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setForm({ ...form, emoji: e })} className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all", form.emoji === e ? "bg-brand-soft ring-2 ring-brand" : "bg-surface-2 hover:bg-border")}>{e}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Create Gift"}</Button>
      </div>
    </Modal>
  );
}
