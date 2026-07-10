"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Gift,
  Megaphone,
  BarChart3,
  Palette,
  BookOpen,
  ArrowRight,
  Smartphone,
  LayoutDashboard,
  Sparkles,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import { Logo, ThemeToggle, BrandSwitcher } from "@/components/brand";

const FEATURES = [
  { icon: ShieldCheck, title: "Anti-Counterfeit", desc: "Authenticate every product & block fakes instantly.", color: "var(--color-success)" },
  { icon: Gift, title: "Loyalty Rewards", desc: "Credit points, manage wallets & redeem gifts.", color: "var(--color-accent)" },
  { icon: Megaphone, title: "Campaigns", desc: "Launch festivals, double-points & promos.", color: "var(--color-info)" },
  { icon: BarChart3, title: "Analytics", desc: "Track scans, engagement & business performance.", color: "var(--color-secondary)" },
  { icon: Palette, title: "White-label", desc: "Rebrand colors, logo & name — no code.", color: "var(--color-brand)" },
  { icon: BookOpen, title: "Catalogue", desc: "Publish datasheets, brochures & guides.", color: "#8b5cf6" },
];

const INDUSTRIES = [
  "Paint Manufacturers", "Lubricants", "Waterproofing", "Adhesives",
  "Construction Chemicals", "FMCG", "Industrial Products",
];

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export function Landing({ appName }: { appName: string }) {
  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo appName="RewardsHub" />
            <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-muted hover:text-content">Features</a>
            <a href="#industries" className="text-sm font-medium text-muted hover:text-content">Industries</a>
            <Link href="/admin/login" className="text-sm font-medium text-muted hover:text-content">Admin</Link>
          </div>
          <div className="flex items-center gap-1.5">
            <BrandSwitcher />
            <ThemeToggle />
            <Link href="/admin" className="ml-1 hidden rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 sm:inline-flex">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, var(--color-brand) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Enterprise White-label SaaS
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-content sm:text-5xl lg:text-6xl">
              Every product becomes a{" "}
              <span className="text-gradient">digital engagement point.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              The complete QR Loyalty & Rewards platform for manufacturers. Authenticate products, prevent counterfeits, reward customers and grow loyalty — all from one console.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/admin/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/30 transition-transform hover:scale-[1.02]">
                <LayoutDashboard className="h-5 w-5" /> Launch Admin Console
              </Link>
              <Link href="/app" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-6 text-sm font-semibold text-content hover:bg-surface-2">
                <Smartphone className="h-5 w-5" /> Open Mobile App
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
              {["Secure login", "Real-time analytics", "Bulk QR generation"].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> {t}</span>
              ))}
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
            <div className="relative mx-auto max-w-sm">
              {/* Admin card */}
              <div className="rounded-3xl border border-border bg-surface p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-24 rounded-full bg-surface-2" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white"><QrCode className="h-4 w-4" /></div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[["8.2k", "Scans"], ["1.4k", "Users"], ["96%", "Auth"]].map(([v, l]) => (
                    <div key={l} className="rounded-xl bg-surface-2 p-2.5 text-center">
                      <p className="text-base font-bold text-content">{v}</p>
                      <p className="text-[9px] text-muted">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex h-20 items-end gap-1.5 rounded-xl bg-surface-2 p-2">
                  {[40, 65, 50, 80, 60, 95, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-brand-gradient" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              {/* Floating phone */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-8 -right-4 w-36 rounded-2xl border border-border bg-surface p-3 shadow-2xl sm:-right-8"
              >
                <div className="rounded-xl bg-brand-gradient p-2.5 text-white">
                  <p className="text-[8px] opacity-80">WALLET</p>
                  <p className="text-lg font-bold leading-none">4,820</p>
                </div>
                <div className="mt-2 flex justify-center gap-1">
                  {["🏠", "💳", "📸", "🎁", "👤"].map((e) => <span key={e} className="text-xs">{e}</span>)}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6">
          {[["99.8%", "Auth Accuracy"], ["10k+", "QR Generated"], ["60 FPS", "Smooth UX"], ["8+", "Industries"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="text-2xl font-bold text-gradient sm:text-3xl">{v}</p>
              <p className="mt-1 text-xs text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">Everything you need to run a rewards program</h2>
          <p className="mt-3 text-muted">From QR generation to redemption — a complete enterprise toolkit.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} custom={i} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="rounded-2xl border border-border bg-surface p-6 shadow-card transition-shadow hover:shadow-pop">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: f.color }}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-content">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-content">Built for manufacturers</h2>
            <p className="mt-3 text-muted">White-label ready across diverse industries.</p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map((ind) => (
              <span key={ind} className="rounded-full border border-border bg-bg px-4 py-2 text-sm font-medium text-content">{ind}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-10 text-center text-white shadow-2xl sm:p-16">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to reward every purchase?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">Explore the full platform — admin console and consumer app, fully working with live demo data.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/admin/login" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-brand hover:bg-white/90">
                Launch Admin Console <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/app" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-6 text-sm font-semibold text-white hover:bg-white/10">
                Open Mobile App
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold tracking-tight text-content">{appName}</h3>
            <p className="mt-2 max-w-sm text-sm text-muted">
              The enterprise QR loyalty and rewards platform built for modern manufacturers and brands.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-content">Platform</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">
              <li><Link href="/admin/login" className="hover:text-brand transition-colors">Admin Console</Link></li>
              <li><Link href="/app" className="hover:text-brand transition-colors">Mobile App</Link></li>
              <li><Link href="#features" className="hover:text-brand transition-colors">Features</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-content">Legal</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">
              <li><Link href="#" className="hover:text-brand transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-brand transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-brand transition-colors">Contact Support</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-6xl mt-12 border-t border-border pt-8 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs text-subtle">
            &copy; {new Date().getFullYear()} {appName}. All rights reserved.
          </p>
          <p className="mt-2 text-xs text-subtle sm:mt-0">
            Powered by QR Rewards Enterprise Platform · Built with Next.js & Drizzle
          </p>
        </div>
      </footer>
    </div>
  );
}
