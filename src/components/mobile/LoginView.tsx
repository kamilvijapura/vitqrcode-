"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, ArrowRight, ArrowLeft, Loader2, AlertCircle,
  ShieldCheck, Eye, EyeOff, KeyRound, Sparkles
} from "lucide-react";
import { Button, Input, Field } from "@/components/ui";
import { useToast } from "@/components/toast";
import { userLoginStep1, userLoginStep2 } from "@/app/actions/auth-consumer";

type Step = "phone" | "pin";

export function MobileLoginView({ appName }: { appName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  const from = searchParams.get("from") ?? "/app";

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await userLoginStep1(phone);
      if (res.ok) {
        setUserName(res.name ?? "");
        setStep("pin");
        setTimeout(() => pinRef.current?.focus(), 100);
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await userLoginStep2(phone, pin);
      if (res.ok) {
        toast({ tone: "success", title: `Welcome back, ${userName}! 👋`, description: "Logged in successfully." });
        router.push(from);
        router.refresh();
      } else {
        setError(res.error ?? "Login failed.");
        setPin("");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 py-10">
      {/* Hero brand mark */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 14 }}
        className="mb-8 flex flex-col items-center gap-3 text-center"
      >
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-gradient text-4xl shadow-xl shadow-brand/30">
            🏷️
          </div>
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content">{appName}</h1>
          <p className="text-sm text-muted">Scan. Earn. Redeem. Repeat.</p>
        </div>
      </motion.div>

      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {/* Step 1: Phone */}
          {step === "phone" && (
            <motion.form
              key="phone-step"
              onSubmit={handlePhoneSubmit}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="rounded-3xl border border-border bg-surface p-6 shadow-pop"
            >
              <div className="mb-5">
                <h2 className="text-lg font-bold text-content">Enter your phone number</h2>
                <p className="mt-1 text-sm text-muted">We&apos;ll look up your loyalty account.</p>
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

              <Field label="Mobile Number">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                  <Input
                    id="user-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(null); }}
                    className="pl-9"
                    placeholder="+91 98000 00000"
                    required
                    autoComplete="tel"
                  />
                </div>
              </Field>

              <Button type="submit" size="lg" className="mt-5 w-full" disabled={isPending}>
                {isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Looking up…</>
                  : <>Continue <ArrowRight className="h-4 w-4" /></>
                }
              </Button>

              {/* Demo hint */}
              <div className="mt-4 rounded-xl bg-brand-soft p-3 text-xs text-brand">
                <p className="font-semibold mb-1 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Demo accounts:</p>
                <p>📱 <span className="font-mono">+91 9800000001</span> → PIN: 123456</p>
                <p>📱 <span className="font-mono">+91 9800000002</span> → PIN: 123456</p>
              </div>
            </motion.form>
          )}

          {/* Step 2: PIN */}
          {step === "pin" && (
            <motion.form
              key="pin-step"
              onSubmit={handlePinSubmit}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="rounded-3xl border border-border bg-surface p-6 shadow-pop"
            >
              <button
                type="button"
                onClick={() => { setStep("phone"); setError(null); setPin(""); }}
                className="mb-4 flex items-center gap-1 text-xs font-medium text-muted hover:text-content"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Change number
              </button>

              <div className="mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand mb-3">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-content">Hi, {userName}! 👋</h2>
                <p className="mt-1 text-sm text-muted">Enter your 6-digit security PIN to continue.</p>
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

              <Field label="6-Digit PIN">
                <div className="relative">
                  <Input
                    ref={pinRef}
                    id="user-pin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
                    className="pr-9 text-center tracking-[0.4em] text-lg font-bold"
                    placeholder="••••••"
                    required
                    autoComplete="one-time-code"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-content"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Button type="submit" size="lg" className="mt-5 w-full" disabled={isPending || pin.length < 6}>
                {isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                  : <>Sign In <ArrowRight className="h-4 w-4" /></>
                }
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
