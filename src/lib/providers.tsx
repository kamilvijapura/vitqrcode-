"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

/* ---------------- Theme (light / dark / system) ---------------- */

type ThemeMode = "light" | "dark";

const ThemeContext = createContext<{
  theme: ThemeMode;
  toggle: () => void;
  setTheme: (t: ThemeMode) => void;
}>({ theme: "light", toggle: () => { }, setTheme: () => { } });

export function useTheme() {
  return useContext(ThemeContext);
}

/* ---------------- Brand (white-label colors) ---------------- */

export type BrandColors = {
  primary: string;
  secondary: string;
  accent: string;
};

const DEFAULT_BRAND: BrandColors = {
  primary: "#4f46e5",
  secondary: "#0ea5e9",
  accent: "#f59e0b",
};

const BRAND_PRESETS: Record<string, BrandColors> = {
  chromashield: DEFAULT_BRAND,
  lubripro: { primary: "#0d9488", secondary: "#0891b2", accent: "#f97316" },
  aquaseal: { primary: "#2563eb", secondary: "#0891b2", accent: "#22c55e" },
  stickwell: { primary: "#db2777", secondary: "#7c3aed", accent: "#eab308" },
};

const BrandContext = createContext<{
  brand: BrandColors;
  setBrand: (b: BrandColors) => void;
  applyPreset: (name: string) => void;
}>({ brand: DEFAULT_BRAND, setBrand: () => { }, applyPreset: () => { } });

export function useBrand() {
  return useContext(BrandContext);
}

function applyTheme(t: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function applyColors(b: BrandColors) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--color-brand", b.primary);
  root.style.setProperty("--color-secondary", b.secondary);
  root.style.setProperty("--color-accent", b.accent);
  // derived soft tint
  root.style.setProperty(
    "--color-brand-soft",
    hexToRgba(b.primary, 0.12),
  );
  root.style.setProperty("--color-brand-strong", shade(b.primary, -12));
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function shade(hex: string, percent: number) {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0xff) + percent;
  let b = (num & 0xff) + percent;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [brand, setBrandState] = useState<BrandColors>(DEFAULT_BRAND);

  // hydrate from storage
  useEffect(() => {
    const stored = localStorage.getItem("qr-theme") as ThemeMode | null;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setThemeState(initial);
    applyTheme(initial);

    const storedBrand = localStorage.getItem("qr-brand");
    if (storedBrand) {
      try {
        const parsed = JSON.parse(storedBrand) as BrandColors;
        setBrandState(parsed);
        applyColors(parsed);
      } catch {
        /* noop */
      }
    }
  }, []);

  // applyTheme is now moved outside to avoid dependency array issues

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem("qr-theme", t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const setBrand = useCallback((b: BrandColors) => {
    setBrandState(b);
    applyColors(b);
    localStorage.setItem("qr-brand", JSON.stringify(b));
  }, []);

  const applyPreset = useCallback(
    (name: string) => {
      const b = BRAND_PRESETS[name] ?? DEFAULT_BRAND;
      setBrand(b);
    },
    [setBrand],
  );

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      <BrandContext.Provider value={{ brand, setBrand, applyPreset }}>
        {children}
      </BrandContext.Provider>
    </ThemeContext.Provider>
  );
}

/* Inline script to prevent FOUC — injected in <head> */
export const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('qr-theme');
    if(!t){ t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light'; }
    if(t==='dark') document.documentElement.classList.add('dark');
    var b = localStorage.getItem('qr-brand');
    if(b){
      var c = JSON.parse(b);
      var r=document.documentElement.style;
      r.setProperty('--color-brand', c.primary);
      r.setProperty('--color-secondary', c.secondary);
      r.setProperty('--color-accent', c.accent);
      var h=c.primary.replace('#','');
      var rr=parseInt(h.slice(0,2),16),gg=parseInt(h.slice(2,4),16),bb=parseInt(h.slice(4,6),16);
      r.setProperty('--color-brand-soft','rgba('+rr+','+gg+','+bb+',0.12)');
    }
  } catch(e){}
})();
`;
