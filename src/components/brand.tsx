"use client";

import { Moon, Sun, Palette, Check } from "lucide-react";
import { useState } from "react";
import { useTheme, useBrand, type BrandColors } from "@/lib/providers";
import { cn } from "@/lib/utils";

/* ------------------------------ Logo ------------------------------- */

export function Logo({
  appName,
  size = "md",
  showName = true,
}: {
  appName?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}) {
  const dims = {
    sm: { box: "h-8 w-8", emoji: "text-base", text: "text-sm" },
    md: { box: "h-10 w-10", emoji: "text-xl", text: "text-base" },
    lg: { box: "h-14 w-14", emoji: "text-3xl", text: "text-xl" },
  }[size];
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md shadow-brand/30",
          dims.box,
        )}
      >
        <span className={dims.emoji}>🏷️</span>
      </div>
      {showName && (
        <div className="leading-tight">
          <div className={cn("font-bold tracking-tight text-content", dims.text)}>
            {appName ?? "Rewards"}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- ThemeToggle --------------------------- */

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-10 w-10 items-center justify-center rounded-xl text-muted ring-focus transition-colors hover:bg-surface-2 hover:text-content"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      {!compact && (
        <span className="ml-2 sr-only">Toggle theme</span>
      )}
    </button>
  );
}

/* ------------------------ Brand color editor ----------------------- */

const SWATCHES = [
  { primary: "#4f46e5", secondary: "#0ea5e9", accent: "#f59e0b", name: "Indigo" },
  { primary: "#0d9488", secondary: "#0891b2", accent: "#f97316", name: "Teal" },
  { primary: "#2563eb", secondary: "#0891b2", accent: "#22c55e", name: "Ocean" },
  { primary: "#db2777", secondary: "#7c3aed", accent: "#eab308", name: "Magenta" },
  { primary: "#ea580c", secondary: "#dc2626", accent: "#f59e0b", name: "Sunset" },
  { primary: "#059669", secondary: "#0d9488", accent: "#84cc16", name: "Forest" },
  { primary: "#7c3aed", secondary: "#ec4899", accent: "#f59e0b", name: "Violet" },
  { primary: "#1e293b", secondary: "#475569", accent: "#64748b", name: "Graphite" },
];

export function BrandSwitcher() {
  const { brand, setBrand } = useBrand();
  const [open, setOpen] = useState(false);
  const matches = (s: BrandColors) =>
    s.primary.toLowerCase() === brand.primary.toLowerCase();
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-muted ring-focus transition-colors hover:bg-surface-2 hover:text-content"
        aria-label="Brand colors"
      >
        <Palette className="h-5 w-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-border bg-surface p-3 shadow-pop">
            <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
              White-label theme
            </p>
            <div className="grid grid-cols-4 gap-2">
              {SWATCHES.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setBrand(s)}
                  title={s.name}
                  className={cn(
                    "relative flex h-10 items-center justify-center rounded-xl ring-2 ring-offset-2 ring-offset-surface transition-transform hover:scale-105",
                    matches(s) ? "ring-content" : "ring-transparent",
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${s.primary}, ${s.secondary})`,
                  }}
                >
                  {matches(s) && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <input
                type="color"
                value={brand.primary}
                onChange={(e) => setBrand({ ...brand, primary: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
              />
              <span className="text-xs text-muted">Primary color</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
