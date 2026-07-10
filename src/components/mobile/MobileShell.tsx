"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Home, ScanLine, Wallet, Gift, User, Bell, ChevronLeft, Trophy, Package } from "lucide-react";
import { Logo, ThemeToggle } from "@/components/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/products", label: "Products", icon: Package },
  { href: "/app/scan", label: "Scan", icon: ScanLine, center: true },
  { href: "/app/rewards", label: "Rewards", icon: Gift },
  { href: "/app/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/app/profile", label: "Profile", icon: User },
];

export function MobileShell({
  appName,
  children,
}: {
  appName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen justify-center bg-bg lg:py-6">
      <div className="relative flex w-full max-w-[440px] flex-col overflow-hidden bg-bg lg:h-[880px] lg:rounded-[2.75rem] lg:border-[10px] lg:border-slate-900 lg:shadow-2xl dark:lg:border-slate-800">
        {/* status bar (desktop frame only) */}
        <div className="hidden items-center justify-between px-6 py-2 text-[11px] font-semibold text-content lg:flex">
          <span>9:41</span>
          <div className="absolute left-1/2 top-1.5 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900 dark:bg-slate-800" />
          <span className="flex items-center gap-1">
            <span>●●●</span>
            <span>100%</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>

        {/* bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="sticky bottom-0 z-30 border-t border-border glass px-2 pb-3 pt-2">
      <div className="flex items-end justify-around">
        {NAV.map((item) => {
          const active =
            item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          const Icon = item.icon;
          if (item.center) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-14 w-14 -translate-y-3 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-brand/40 transition-transform active:scale-95",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="-mt-2 text-[10px] font-medium text-brand">{item.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 transition-colors",
                active ? "text-brand" : "text-subtle hover:text-content",
              )}
            >
              <Icon className="h-[22px] w-[22px]" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function MobileHeader({
  appName,
  showBack,
  rightSlot,
}: {
  appName?: string;
  showBack?: boolean;
  rightSlot?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 glass">
      <div className="flex items-center gap-3">
        {showBack ? (
          <Link href="/app" className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <Logo appName={appName} size="sm" />
        )}
      </div>
      <div className="flex items-center gap-1">
        {rightSlot ?? (
          <Link href="/app/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
          </Link>
        )}
      </div>
    </header>
  );
}

export function MobilePage({
  title,
  children,
  rightSlot,
}: {
  title?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
}) {
  return (
    <div>
      <MobileHeader rightSlot={rightSlot} />
      <div className="px-5 pb-8 pt-2">
        {title && <h1 className="mb-4 text-xl font-bold tracking-tight text-content">{title}</h1>}
        {children}
      </div>
    </div>
  );
}
