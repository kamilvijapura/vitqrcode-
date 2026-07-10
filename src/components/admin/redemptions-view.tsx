"use client";

import { useState } from "react";
import { ShoppingBag, CheckCircle2, XCircle, Truck, PackageCheck, Star, MapPin } from "lucide-react";
import { updateRedemptionStatus } from "@/app/actions/redemptions";
import { PageHeader } from "@/components/admin/AdminShell";
import { Card, Button, Badge, Avatar } from "@/components/ui";
import { useToast } from "@/components/toast";
import { formatNumber, relativeTime, cn } from "@/lib/utils";

type Row = {
  id: number;
  status: "pending" | "approved" | "rejected" | "dispatched" | "delivered";
  rewardName: string;
  pointsCost: number;
  address: string | null;
  createdAt: Date | string;
  userName: string | null;
  membershipTier: string | null;
};

const STAGES = ["pending", "approved", "dispatched", "delivered", "rejected"] as const;

const STAGE_META: Record<string, { tone: any; label: string; icon: any }> = {
  pending: { tone: "warning", label: "Pending", icon: ShoppingBag },
  approved: { tone: "info", label: "Approved", icon: CheckCircle2 },
  dispatched: { tone: "brand", label: "Dispatched", icon: Truck },
  delivered: { tone: "success", label: "Delivered", icon: PackageCheck },
  rejected: { tone: "danger", label: "Rejected", icon: XCircle },
};

export function RedemptionsView({ redemptions }: { redemptions: Row[] }) {
  const [stage, setStage] = useState<string>("pending");
  const { toast } = useToast();

  const act = async (id: number, status: string, rewardName: string) => {
    await updateRedemptionStatus(id, status);
    const msg: Record<string, string> = {
      approved: "Redemption approved ✓",
      rejected: "Redemption rejected",
      dispatched: "Marked as dispatched 🚚",
      delivered: "Marked as delivered 📦",
    };
    toast({
      tone: status === "rejected" ? "warning" : "success",
      title: msg[status] ?? "Updated",
      description: rewardName,
    });
  };

  const counts = STAGES.reduce((acc, s) => ({ ...acc, [s]: redemptions.filter((r) => r.status === s).length }), {} as Record<string, number>);
  const filtered = stage === "all" ? redemptions : redemptions.filter((r) => r.status === stage);

  return (
    <div>
      <PageHeader title="Redemption Requests" description="Process customer reward redemptions" icon={<ShoppingBag className="h-5 w-5" />} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((s) => {
          const meta = STAGE_META[s];
          const Icon = meta.icon;
          return (
            <button key={s} onClick={() => setStage(s)} className={cn("flex flex-col gap-1 rounded-2xl border p-3 text-left transition-all", stage === s ? "border-brand bg-brand-soft" : "border-border bg-surface hover:bg-surface-2")}>
              <div className="flex items-center justify-between">
                <Icon className={cn("h-4 w-4", stage === s ? "text-brand" : "text-subtle")} />
                <span className="text-lg font-bold text-content">{counts[s]}</span>
              </div>
              <span className="text-xs text-muted">{meta.label}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="py-16 text-center text-sm text-muted">No {stage} redemptions.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((r) => {
            const meta = STAGE_META[r.status];
            const Icon = meta.icon;
            return (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.userName ?? "?"} size={44} />
                    <div>
                      <p className="font-semibold text-content">{r.userName ?? "Unknown"}</p>
                      <p className="text-xs capitalize text-muted">{r.membershipTier ?? "bronze"} member</p>
                    </div>
                  </div>
                  <Badge tone={meta.tone} dot>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-2 p-3">
                  <div>
                    <p className="text-xs text-muted">Requested reward</p>
                    <p className="font-medium text-content">{r.rewardName}</p>
                  </div>
                  <div className="text-right">
                    <p className="flex items-center gap-1 font-bold text-accent"><Star className="h-3.5 w-3.5 fill-current" />{formatNumber(r.pointsCost)}</p>
                    <p className="text-[10px] text-subtle">points</p>
                  </div>
                </div>

                {r.address && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {r.address}
                  </p>
                )}
                <p className="mt-1 text-xs text-subtle">Requested {relativeTime(r.createdAt)}</p>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => act(r.id, "approved", r.rewardName)}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => act(r.id, "rejected", r.rewardName)}><XCircle className="h-3.5 w-3.5" /> Reject</Button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <Button size="sm" onClick={() => act(r.id, "dispatched", r.rewardName)}><Truck className="h-3.5 w-3.5" /> Mark Dispatched</Button>
                  )}
                  {r.status === "dispatched" && (
                    <Button size="sm" onClick={() => act(r.id, "delivered", r.rewardName)}><PackageCheck className="h-3.5 w-3.5" /> Mark Delivered</Button>
                  )}
                  {(r.status === "delivered" || r.status === "rejected") && (
                    <span className="flex items-center gap-1 text-xs font-medium text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
