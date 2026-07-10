"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Star, Search, CheckCircle2, Lock } from "lucide-react";
import type { Reward } from "@/db/schema";
import { MobilePage } from "@/components/mobile/MobileShell";
import { Card, Button, Badge, Input, Avatar, ProgressBar } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { redeemReward } from "@/app/actions/scan";
import { formatNumber } from "@/lib/utils";

export function RewardsAppView({ rewards, walletBalance, userId }: { rewards: Reward[]; walletBalance: number; userId: number }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Reward | null>(null);

  const filtered = rewards.filter((r) => !query || r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <MobilePage title="Rewards Store">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <Input placeholder="Search rewards…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-brand-soft p-3 text-sm">
        <Star className="h-4 w-4 fill-accent text-accent" />
        <span className="text-content">You have <b className="text-brand">{formatNumber(walletBalance)}</b> points to spend</span>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-16 text-center text-sm text-muted">No rewards match your search.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((r) => {
            const affordable = walletBalance >= r.requiredPoints && r.status !== "out_of_stock";
            return (
              <Card key={r.id} className="overflow-hidden">
                <div className="relative flex h-24 items-center justify-center bg-brand-soft text-4xl">
                  <Avatar src={r.imageUrl} name={r.name} size={56} className="rounded-2xl bg-white/50 dark:bg-white/10" />
                  {r.status === "out_of_stock" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">Out of stock</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-content">{r.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-accent">
                    <Star className="h-3 w-3 fill-current" /> {formatNumber(r.requiredPoints)}
                  </p>
                  <Button
                    size="sm"
                    variant={affordable ? "primary" : "outline"}
                    className="mt-2 w-full"
                    disabled={!affordable}
                    onClick={() => setSelected(r)}
                  >
                    {affordable ? "Redeem" : <><Lock className="h-3 w-3" /> Locked</>}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RedeemModal reward={selected} userId={userId} onClose={() => setSelected(null)} balance={walletBalance} />
    </MobilePage>
  );
}

function RedeemModal({ reward, userId, onClose, balance }: { reward: Reward | null; userId: number; onClose: () => void; balance: number }) {
  const [state, setState] = useState<"confirm" | "processing" | "done">("confirm");
  const { toast } = useToast();

  const redeem = async () => {
    if (!reward) return;
    setState("processing");
    const res = await redeemReward(userId, reward.id);
    if (!res.ok) {
      const reason = res.reason ?? "unknown";
      const messages: Record<string, string> = {
        insufficient: `You need ${formatNumber("deficit" in res ? (res.deficit ?? 0) : 0)} more points.`,
        out_of_stock: "This reward is out of stock.",
        blocked: "Your account is blocked.",
        not_found: "Reward not found.",
        unknown: "Something went wrong.",
      };
      toast({ tone: "error", title: "Redemption failed", description: messages[reason] ?? "Something went wrong." });
      setState("confirm");
      onClose();
      return;
    }
    toast({ tone: "success", title: "Redemption placed! 🎉", description: `${reward.name} is pending approval.` });
    setState("done");
  };

  const close = () => { onClose(); setTimeout(() => setState("confirm"), 300); };

  return (
    <Modal open={!!reward} onClose={close} title={state === "done" ? "Redemption Placed!" : "Redeem Reward"} size="sm">
      <AnimatePresence mode="wait">
        {reward && state !== "done" && (
          <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex flex-col items-center text-center">
              <Avatar src={reward.imageUrl} name={reward.name} size={72} className="rounded-2xl bg-brand-soft" />
              <h3 className="mt-3 text-lg font-semibold text-content">{reward.name}</h3>
              <p className="mt-1 text-sm text-muted">{reward.description}</p>
              <div className="mt-4 w-full rounded-2xl bg-surface-2 p-4">
                <div className="flex justify-between text-sm"><span className="text-muted">Cost</span><span className="font-semibold text-accent">{formatNumber(reward.requiredPoints)} pts</span></div>
                <div className="mt-2 flex justify-between text-sm"><span className="text-muted">Balance after</span><span className="font-semibold text-content">{formatNumber(balance - reward.requiredPoints)} pts</span></div>
                <div className="mt-3"><ProgressBar value={((balance - reward.requiredPoints) / Math.max(1, balance)) * 100} /></div>
              </div>
            </div>
            <Button onClick={redeem} className="mt-5 w-full" disabled={state === "processing"} size="lg">
              {state === "processing" ? "Processing…" : <>Confirm Redemption</>}
            </Button>
          </motion.div>
        )}
        {state === "done" && (
          <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-4 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </motion.div>
            <h3 className="mt-4 text-lg font-semibold text-content">Request Submitted! 🎉</h3>
            <p className="mt-1 px-4 text-sm text-muted">Your <b>{reward?.name}</b> redemption is now pending approval. We&apos;ll notify you when it ships.</p>
            <Badge tone="warning" className="mt-3">Pending Approval</Badge>
            <Button onClick={close} className="mt-5 w-full" size="lg">Done</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
