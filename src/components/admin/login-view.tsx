"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { Button, Input, Field } from "@/components/ui";
import { useToast } from "@/components/toast";
import { ThemeToggle } from "@/components/brand";
import { adminLogin } from "@/app/actions/auth-admin";

export function AdminLoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("admin@chromashield.co");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = searchParams.get("from") ?? "/admin";

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await adminLogin(email, password);
      if (res.ok) {
        toast({ tone: "success", title: "Welcome back!", description: "Signed in successfully." });
        router.push(from);
        router.refresh();
      } else {
        setError(res.error ?? "Login failed.");
        toast({ tone: "error", title: "Login failed", description: res.error ?? "Check your credentials." });
      }
    });
  };

  return (
    <>
      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <motion.form
          onSubmit={login}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border bg-surface p-7 shadow-pop"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-content">Sign in to your account</h2>
            <p className="text-sm text-muted">Enter your admin credentials to continue</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center gap-2 rounded-xl border border-error/20 bg-error-soft px-3 py-2.5 text-sm text-error"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <Field label="Email Address">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="pl-9"
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                />
              </div>
            </Field>
            <Field label="Password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <Input
                  id="admin-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="px-9"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-content"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={isPending}>
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
              : <>Sign In <ArrowRight className="h-4 w-4" /></>
            }
          </Button>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-soft p-3 text-xs text-brand">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Default: <b>admin@chromashield.co</b> / <b>Admin@2025!</b></span>
          </div>
        </motion.form>
      </div>
    </>
  );
}
