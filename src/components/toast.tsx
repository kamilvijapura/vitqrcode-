"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastTone = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
};

const ToastContext = createContext<{
  toast: (t: { tone?: ToastTone; title: string; description?: string }) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TONE_META: Record<
  ToastTone,
  { icon: ReactNode; color: string; bg: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "var(--color-success)",
    bg: "var(--color-success-soft)",
  },
  error: {
    icon: <XCircle className="h-5 w-5" />,
    color: "var(--color-danger)",
    bg: "var(--color-danger-soft)",
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    color: "var(--color-info)",
    bg: "var(--color-info-soft)",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "var(--color-warning)",
    bg: "var(--color-warning-soft)",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({
      tone = "info",
      title,
      description,
    }: {
      tone?: ToastTone;
      title: string;
      description?: string;
    }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, tone, title, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    [],
  );

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end">
        <AnimatePresence>
          {toasts.map((t) => {
            const meta = TONE_META[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ type: "spring", damping: 24, stiffness: 320 }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-pop"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-muted">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-subtle transition-colors hover:text-content"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
