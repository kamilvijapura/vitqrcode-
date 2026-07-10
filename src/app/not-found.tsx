import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Logo } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6 text-center">
      <Logo appName="Rewards" size="lg" />
      <div className="mt-10 text-8xl font-black text-gradient">404</div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-content">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground hover:opacity-90"
        >
          <Home className="h-4 w-4" /> Go Home
        </Link>
        <Link
          href="/app"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong px-5 text-sm font-semibold text-content hover:bg-surface-2"
        >
          <Search className="h-4 w-4" /> Open App
        </Link>
      </div>
    </div>
  );
}
