"use client";

import { useState } from "react";
import { Bell, Send, Gift, Coins, Megaphone, Info, CheckCircle2 } from "lucide-react";
import type { Notification } from "@/db/schema";
import { sendNotification } from "@/app/actions/notifications";
import { PageHeader } from "@/components/admin/AdminShell";
import { Card, Button, Badge, Input, Field, Select, Textarea } from "@/components/ui";
import { Modal } from "@/components/modal";
import { relativeTime, cn } from "@/lib/utils";

const TYPE_META: Record<string, { tone: any; icon: any }> = {
  reward: { tone: "brand", icon: Gift },
  points: { tone: "warning", icon: Coins },
  campaign: { tone: "info", icon: Megaphone },
  system: { tone: "neutral", icon: Info },
};

export function NotificationsView({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`${notifications.length} messages sent to your customers`}
        icon={<Bell className="h-5 w-5" />}
        actions={<Button onClick={() => setOpen(true)}><Send className="h-4 w-4" /> Compose</Button>}
      />

      <div className="space-y-3">
        {notifications.map((n) => {
          const meta = TYPE_META[n.type] ?? TYPE_META.system;
          const Icon = meta.icon;
          return (
            <Card key={n.id} className={cn("flex items-start gap-4 p-4", !n.read && "ring-1 ring-brand/30")}>
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", `bg-brand-soft text-brand`)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-content">{n.title}</p>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                </div>
                <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-subtle">
                  <Badge tone={meta.tone}>{n.type}</Badge>
                  <span>{relativeTime(n.createdAt)}</span>
                  <span>{n.userId === null ? "Broadcast · All users" : "Direct"}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <ComposerModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function ComposerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ title: "", body: "", type: "campaign" });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async () => {
    if (!form.title) return;
    setSaving(true);
    await sendNotification(form);
    setSaving(false);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ title: "", body: "", type: "campaign" });
      onClose();
    }, 1200);
  };
  return (
    <Modal open={open} onClose={onClose} title="Compose Notification" description="Send a broadcast push notification to all users">
      <div className="space-y-4">
        <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 🎆 Diwali Double Points!" /></Field>
        <Field label="Message"><Textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your message…" /></Field>
        <Field label="Type">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="campaign">Campaign</option>
            <option value="reward">Reward</option>
            <option value="points">Points</option>
            <option value="system">System</option>
          </Select>
        </Field>
        <div className="rounded-xl bg-brand-soft p-3 text-xs text-brand">
          📢 This will be delivered as a push notification to all active users.
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving || sent}>
          {sent ? <><CheckCircle2 className="h-4 w-4" /> Sent!</> : saving ? "Sending…" : <><Send className="h-4 w-4" /> Send Broadcast</>}
        </Button>
      </div>
    </Modal>
  );
}
