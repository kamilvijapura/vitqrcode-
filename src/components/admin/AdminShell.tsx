"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  QrCode,
  BookOpen,
  Gift,
  Megaphone,
  Users,
  ShoppingBag,
  FileBarChart,
  Bell,
  Settings,
  Menu,
  X,
  ExternalLink,
  RotateCcw,
  LogOut,
  History,
  ShieldAlert,
  Palette,
} from "lucide-react";
import { Logo, ThemeToggle, BrandSwitcher } from "@/components/brand";
import { cn } from "@/lib/utils";
import { resetDemoData } from "@/app/actions/reset";
import { adminLogout } from "@/app/actions/auth-admin";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/qr", label: "QR Generator", icon: QrCode },
  { href: "/admin/qr/design", label: "QR Design", icon: Palette },
  { href: "/admin/qr/history", label: "QR History", icon: History },
  { href: "/admin/catalogue", label: "Catalogue", icon: BookOpen },
  { href: "/admin/rewards", label: "Rewards", icon: Gift },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/redemptions", label: "Redemptions", icon: ShoppingBag },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/audit", label: "Audit Logs", icon: ShieldAlert },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  // pick the most specific (longest) matching nav item so nested routes
  // like /admin/qr/history don't also mark the parent as active.
  const activeHref = NAV
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = activeHref === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-brand text-brand-foreground shadow-sm shadow-brand/30"
                : "text-muted hover:bg-surface-2 hover:text-content",
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", active ? "" : "text-subtle group-hover:text-content")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  appName,
  companyName,
  adminName,
  adminEmail,
  children,
}: {
  appName: string;
  companyName: string;
  adminName?: string;
  adminEmail?: string;
  children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo appName={appName} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks />
        </div>
        <div className="space-y-1 border-t border-border p-3">
          <Link
            href="/app"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-content"
          >
            <ExternalLink className="h-[18px] w-[18px]" />
            View Mobile App
          </Link>
          <form action={adminLogout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="flex h-16 items-center justify-between px-5">
                <Logo appName={appName} />
                <button onClick={() => setDrawer(false)} className="text-muted hover:text-content">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <NavLinks onNavigate={() => setDrawer(false)} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border glass px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawer(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-content lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-subtle">{companyName}</p>
              <p className="text-sm font-semibold text-content">Admin Console</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <BrandSwitcher />
            <ThemeToggle />
            <div className="ml-2 flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-xs font-bold text-white">
                {(adminName ?? "AD").slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-semibold text-content">{adminName ?? "Admin"}</p>
                <p className="text-[10px] text-subtle">{adminEmail ?? ""}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  icon,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ResetButton() {
  const [pending, setPending] = useState(false);
  return (
    <form
      action={async () => {
        setPending(true);
        await resetDemoData();
        setPending(false);
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-content disabled:opacity-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {pending ? "Resetting…" : "Reset demo"}
      </button>
    </form>
  );
}
