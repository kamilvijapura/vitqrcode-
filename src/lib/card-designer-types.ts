/** QR Background Designer — print-ready card layout types. */

export type CardShape = "square" | "rounded" | "circle" | "hexagon" | "badge" | "custom";
export type ElementPos = "top" | "bottom" | "left" | "right" | "center";
export type QrModuleShape = "square" | "rounded" | "dots";
export type ErrorLevel = "L" | "M" | "H";

export interface BoxSpacing {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface TextOverlay {
  enabled: boolean;
  content: string;
  position: ElementPos;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  align: "left" | "center" | "right";
}

export interface LogoPlacement {
  enabled: boolean;
  src: string | null;
  position: ElementPos;
  size: number;
  rotation: number;
}

export interface QrConfig {
  size: number; // 0.2 – 0.8 fraction of short edge
  color: string;
  bgColor: string;
  moduleShape: QrModuleShape;
  errorLevel: ErrorLevel;
  margin: number;
}

export interface CardDesign {
  // Shape
  shape: CardShape;
  cornerRadius: number;
  customSvgPath: string;

  // Size
  width: number; // mm
  height: number; // mm
  lockAspect: boolean;

  // Spacing
  padding: BoxSpacing;
  paddingLinked: boolean;
  margin: BoxSpacing;

  // Background
  bgColor: string;
  useGradient: boolean;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  bgImage: string | null;
  bgImageOpacity: number;
  shadow: boolean;

  // Elements
  text: TextOverlay;
  logo: LogoPlacement;
  qr: QrConfig;

  // QR value
  qrValue: string;
}

export const FONT_FAMILIES = [
  "Inter, sans-serif",
  "Georgia, serif",
  "Arial, sans-serif",
  "'Courier New', monospace",
  "'Trebuchet MS', sans-serif",
  "'Palatino Linotype', serif",
  "Verdana, sans-serif",
];

export const CARD_SHAPES: { value: CardShape; label: string; icon: string }[] = [
  { value: "square", label: "Square", icon: "◻" },
  { value: "rounded", label: "Rounded", icon: "▢" },
  { value: "circle", label: "Circle", icon: "○" },
  { value: "hexagon", label: "Hexagon", icon: "⬡" },
  { value: "badge", label: "Badge", icon: "✪" },
  { value: "custom", label: "Custom", icon: "✦" },
];

export const POSITIONS: { value: ElementPos; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "center", label: "Center" },
];

export const COLOR_SWATCHES = [
  "#ffffff", "#0f172a", "#1e293b", "#334155", "#4f46e5", "#0ea5e9",
  "#059669", "#dc2626", "#ea580c", "#f59e0b", "#7c3aed", "#db2777",
];

export const CARD_PRESETS: { id: string; name: string; emoji: string; config: Partial<CardDesign> }[] = [
  { id: "clean", name: "Clean Minimal", emoji: "✨", config: { shape: "rounded", cornerRadius: 8, width: 40, height: 40, bgColor: "#ffffff", padding: { top: 8, bottom: 8, left: 8, right: 8 }, qr: { size: 1.0, color: "#000000", bgColor: "transparent", moduleShape: "square", errorLevel: "M", margin: 0 } } },
  { id: "dark", name: "Dark Edge", emoji: "🌙", config: { shape: "rounded", cornerRadius: 12, width: 50, height: 50, bgColor: "#0f172a", qr: { size: 0.8, color: "#ffffff", bgColor: "transparent", moduleShape: "dots", errorLevel: "H", margin: 1 } } },
  { id: "gradient", name: "Vibrant Gradient", emoji: "🌈", config: { shape: "square", width: 45, height: 45, useGradient: true, gradientFrom: "#ec4899", gradientTo: "#8b5cf6", gradientAngle: 45, qr: { size: 0.75, color: "#ffffff", bgColor: "transparent", moduleShape: "rounded", errorLevel: "M", margin: 2 } } },
  { id: "circle", name: "Modern Circle", emoji: "🔵", config: { shape: "circle", width: 45, height: 45, bgColor: "#f8fafc", shadow: true, qr: { size: 0.7, color: "#334155", bgColor: "transparent", moduleShape: "rounded", errorLevel: "H", margin: 0 } } },
];

export const DEFAULT_DESIGN: CardDesign = {
  shape: "rounded",
  cornerRadius: 16,
  customSvgPath: "M 20,20 L 80,20 L 80,80 L 20,80 Z",
  width: 60,
  height: 40,
  lockAspect: false,
  padding: { top: 12, bottom: 12, left: 12, right: 12 },
  paddingLinked: true,
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
  bgColor: "#eef2ff",
  useGradient: false,
  gradientFrom: "#4f46e5",
  gradientTo: "#0ea5e9",
  gradientAngle: 135,
  bgImage: null,
  bgImageOpacity: 0.3,
  shadow: true,
  text: {
    enabled: false,
    content: "",
    position: "right",
    fontFamily: FONT_FAMILIES[0],
    fontSize: 14,
    color: "#4f46e5",
    bold: true,
    align: "left",
  },
  logo: {
    enabled: false,
    src: null,
    position: "top",
    size: 28,
    rotation: 0,
  },
  qr: {
    size: 1.0,
    color: "#0f172a",
    bgColor: "#ffffff",
    moduleShape: "rounded",
    errorLevel: "M",
    margin: 2,
  },
  qrValue: "https://rewards.chromashield.co/s/DEMO",
};
