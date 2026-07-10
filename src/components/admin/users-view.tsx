"use client";

import { useState } from "react";
import { Search, Users, Ban, CircleCheck, Crown, Star } from "lucide-react";
import type { AppUser } from "@/db/schema";
import { toggleUserBlock } from "@/app/actions/users";
import { PageHeader } from "@/components/admin/AdminShell";
import { Card, Badge, Avatar, Input, EmptyState, Button } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { formatCompact, formatNumber, relativeTime, cn } from "@/lib/utils";

const TIER_META: Record<string, { tone: any; color: string }> = {
  bronze: { tone: "neutral", color: "#a16207" },
  silver: { tone: "info", color: "#64748b" },
  gold: { tone: "warning", color: "#d97706" },
  platinum: { tone: "brand", color: "#7c3aed" },
};

export function UsersView({ users }: { users: AppUser[] }) {
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState("all");
  const [target, setTarget] = useState<AppUser | null>(null);
  const { toast } = useToast();

  const tiers = ["all", "bronze", "silver", "gold", "platinum"];
  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (!q || u.name.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q)) && (tier === "all" || u.membershipTier === tier);
  });

  return (
    <div>
      <PageHeader title="User Management" description={`${users.length} customers in your loyalty program`} icon={<Users className="h-5 w-5" />} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input placeholder="Search users…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tiers.map((t) => (
            <button key={t} onClick={() => setTier(t)} className={cn("shrink-0 rounded-full px-3.5 py-2 text-xs font-medium capitalize transition-colors", tier === t ? "bg-brand text-brand-foreground" : "bg-surface-2 text-muted hover:text-content")}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Users className="h-7 w-7" />} title="No users found" description="Try adjusting your search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-subtle">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Tier</th>
                  <th className="px-5 py-3 font-medium">Points</th>
                  <th className="px-5 py-3 font-medium">Scans</th>
                  <th className="px-5 py-3 font-medium">Wallet</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const tm = TIER_META[u.membershipTier];
                  return (
                    <tr key={u.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-2/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size={38} />
                          <div>
                            <p className="font-medium text-content">{u.name}</p>
                            <p className="text-xs text-muted">{u.email ?? u.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={tm.tone} className="capitalize">
                          {u.membershipTier === "platinum" && <Crown className="h-3 w-3" />}
                          {u.membershipTier}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-semibold text-content">{formatCompact(u.totalPoints)}</td>
                      <td className="px-5 py-3 text-muted">{u.lifetimeScans}</td>
                      <td className="px-5 py-3 text-muted">{formatNumber(u.walletBalance)}</td>
                      <td className="px-5 py-3 text-xs text-muted">{relativeTime(u.joinedAt)}</td>
                      <td className="px-5 py-3">
                        <Badge tone={u.status === "active" ? "success" : "danger"} dot>{u.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant={u.status === "active" ? "outline" : "primary"} onClick={() => setTarget(u)}>
                          {u.status === "active" ? <><Ban className="h-3.5 w-3.5" /> Block</> : <><CircleCheck className="h-3.5 w-3.5" /> Unblock</>}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={() => {
          if (target) {
            const blocking = target.status === "active";
            toggleUserBlock(target.id, blocking);
            toast({
              tone: blocking ? "warning" : "success",
              title: blocking ? "User blocked" : "User unblocked",
              description: `${target.name} ${blocking ? "lost" : "regained"} app access.`,
            });
          }
        }}
        title={target?.status === "active" ? "Block user?" : "Unblock user?"}
        message={target?.status === "active" ? `${target?.name} will lose access to the app.` : `${target?.name} will regain app access.`}
        confirmLabel={target?.status === "active" ? "Block" : "Unblock"}
        danger={target?.status === "active"}
      />
    </div>
  );
}
