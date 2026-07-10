"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Package, Gift } from "lucide-react";
import { Avatar } from "@/components/ui";
import { cn, formatNumber } from "@/lib/utils";

export function AnimatedNumber({
  value,
  className,
  duration = 1100,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{formatNumber(display)}</span>;
}

export function PointsHero({
  points,
  earned,
  redeemed,
  tier,
  name,
}: {
  points: number;
  earned: number;
  redeemed: number;
  tier: string;
  name: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-brand-gradient p-5 text-white shadow-xl shadow-brand/30"
    >
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/70">Wallet Balance</p>
            <p className="mt-1 flex items-end gap-1 text-4xl font-bold">
              <AnimatedNumber value={points} />
              <span className="mb-1 text-sm font-medium text-white/70">pts</span>
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold capitalize backdrop-blur">
            👑 {tier}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <p className="text-[11px] text-white/70">Total Earned</p>
            <p className="text-lg font-bold">+{formatNumber(earned)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <p className="text-[11px] text-white/70">Redeemed</p>
            <p className="text-lg font-bold">-{formatNumber(redeemed)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function QuickAction({
  href,
  icon,
  label,
  tone,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  tone?: string;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm"
        style={{ background: tone ?? "var(--color-brand)" }}
      >
        {icon}
      </div>
      <span className="text-xs font-medium text-content">{label}</span>
    </Link>
  );
}

export function SectionHeader({
  title,
  href,
  actionLabel = "See all",
}: {
  title: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between">
      <h2 className="text-base font-bold tracking-tight text-content">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-xs font-medium text-brand">
          {actionLabel} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function ProductTile({
  imageUrl,
  name,
  points,
  href,
}: {
  imageUrl: string | null;
  name: string;
  points: number;
  href: string;
}) {
  return (
    <Link href={href} className="w-40 shrink-0">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex h-24 items-center justify-center bg-surface-2">
          <Avatar src={imageUrl} name={name} size={64} fallbackIcon={<Package className="h-6 w-6" />} className="rounded-xl shadow-sm" />
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-semibold text-content">{name}</p>
          <p className="mt-1 text-xs font-medium text-accent">⭐ {formatNumber(points)} pts</p>
        </div>
      </div>
    </Link>
  );
}

export function RewardTile({
  imageUrl,
  name,
  cost,
  stock,
  affordable,
  href,
}: {
  imageUrl: string | null;
  name: string;
  cost: number;
  stock: number;
  affordable: boolean;
  href: string;
}) {
  return (
    <Link href={href} className="w-36 shrink-0">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex h-20 items-center justify-center bg-brand-soft">
          <Avatar src={imageUrl} name={name} size={48} fallbackIcon={<Gift className="h-5 w-5" />} className="rounded-lg shadow-sm" />
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-semibold text-content">{name}</p>
          <p className={cn("mt-1 text-xs font-bold", affordable ? "text-brand" : "text-muted")}>
            {formatNumber(cost)} pts
          </p>
          <p className="text-[10px] text-subtle">{stock} in stock</p>
        </div>
      </div>
    </Link>
  );
}

export function CampaignChip({ imageUrl, name, mult }: { imageUrl: string | null; name: string; mult: string }) {
  return (
    <div className="relative w-64 shrink-0 overflow-hidden rounded-2xl bg-brand-gradient p-4 text-white">
      <div className="absolute right-2 top-2 opacity-80">
        <Avatar src={imageUrl} name={name} size={40} fallbackIcon={<Gift className="h-4 w-4" />} className="rounded-full shadow-sm" />
      </div>
      <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
        {mult}x POINTS
      </span>
      <p className="mt-6 text-sm font-bold leading-tight">{name}</p>
    </div>
  );
}

export { Avatar };
