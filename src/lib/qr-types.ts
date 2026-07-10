/** Shared QR design configuration — enterprise editor types. */

export type QrShape = "square" | "rounded" | "dots" | "circle";
export type QrSize = "small" | "medium" | "large" | "custom";
export type ErrorLevel = "L" | "M" | "H";

export type FrameShape = "none" | "square" | "rounded" | "circle" | "hexagon" | "badge";
export type BorderStyle = "solid" | "dashed" | "dotted";
export type FrameSide = "top" | "bottom" | "left" | "right";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextAlign = "left" | "center" | "right";

/** Customizable text rendered onto the frame border. */
export interface FrameText {
  enabled: boolean;
  content: string;
  fontSize: number;
  weight: TextWeight;
  color: string;
  align: TextAlign;
  position: FrameSide;
}

/** Customizable logo rendered onto the frame border (separate from QR logo). */
export interface FrameLogo {
  enabled: boolean;
  src: string | null;
  size: number;
  padding: number;
  position: FrameSide;
  round: boolean;
}

export interface QrFrame {
  enabled: boolean;
  shape: FrameShape;
  borderStyle: BorderStyle;
  thickness: number;
  cornerRadius: number;
  color: string;
  spacing: number;
  shadow: boolean;
  shadowColor: string;
  text: FrameText;
  logo: FrameLogo;
}

/** Toggles for what the preview should display. */
export interface PreviewToggles {
  showLogo: boolean;
  showFrame: boolean;
  showProductName: boolean;
  showRewardPoints: boolean;
}

export interface QrDesign {
  size: number;
  sizePreset: QrSize;
  shape: QrShape;
  fgColor: string;
  bgColor: string; // "#ffffff" or "transparent"
  margin: number; // quiet zone (outer blank space)
  padding: number; // inner padding around QR content area
  containerRadius: number; // 0–50 (corner radius % for the QR container clip)
  level: ErrorLevel;
  logo: string | null;
  logoRound: boolean;
  frame: QrFrame;
}

export const DEFAULT_FRAME: QrFrame = {
  enabled: false,
  shape: "rounded",
  borderStyle: "solid",
  thickness: 6,
  cornerRadius: 16,
  color: "#4f46e5",
  spacing: 22,
  shadow: true,
  shadowColor: "#4f46e5",
  text: {
    enabled: false,
    content: "Scan to Verify",
    fontSize: 14,
    weight: "semibold",
    color: "#ffffff",
    align: "center",
    position: "bottom",
  },
  logo: {
    enabled: false,
    src: null,
    size: 32,
    padding: 6,
    position: "top",
    round: false,
  },
};

export const DEFAULT_DESIGN: QrDesign = {
  size: 256,
  sizePreset: "medium",
  shape: "square",
  fgColor: "#0f172a",
  bgColor: "#ffffff",
  margin: 2,
  padding: 0,
  containerRadius: 0,
  level: "H",
  logo: null,
  logoRound: true,
  frame: { ...DEFAULT_FRAME, text: { ...DEFAULT_FRAME.text }, logo: { ...DEFAULT_FRAME.logo } },
};

export const DEFAULT_TOGGLES: PreviewToggles = {
  showLogo: true,
  showFrame: true,
  showProductName: true,
  showRewardPoints: true,
};

export const SIZE_PRESETS: Record<QrSize, { label: string; sub: string; px: number }> = {
  small: { label: "Small", sub: "128px", px: 128 },
  medium: { label: "Medium", sub: "256px", px: 256 },
  large: { label: "Large", sub: "512px", px: 512 },
  custom: { label: "Custom", sub: "Manual", px: 256 },
};

export const SHAPE_OPTIONS: { value: QrShape; label: string; icon: string }[] = [
  { value: "square", label: "Square", icon: "◻" },
  { value: "rounded", label: "Rounded", icon: "▢" },
  { value: "dots", label: "Dots", icon: "●" },
  { value: "circle", label: "Circle", icon: "◯" },
];

export const ERROR_LEVELS: { value: ErrorLevel; label: string; desc: string }[] = [
  { value: "L", label: "Low", desc: "7% recovery · smallest" },
  { value: "M", label: "Medium", desc: "15% recovery · balanced" },
  { value: "H", label: "High", desc: "30% recovery · logo-safe" },
];

export const FRAME_SHAPES: { value: FrameShape; label: string; icon: string }[] = [
  { value: "none", label: "None", icon: "⬚" },
  { value: "square", label: "Square", icon: "◻" },
  { value: "rounded", label: "Rounded", icon: "▢" },
  { value: "circle", label: "Circle", icon: "○" },
  { value: "hexagon", label: "Hexagon", icon: "⬡" },
  { value: "badge", label: "Badge", icon: "✪" },
];

export const BORDER_STYLES: { value: BorderStyle; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

export const FRAME_SIDES: { value: FrameSide; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

export const TEXT_WEIGHTS: { value: TextWeight; label: string; css: number }[] = [
  { value: "normal", label: "Regular", css: 400 },
  { value: "medium", label: "Medium", css: 500 },
  { value: "semibold", label: "Semibold", css: 600 },
  { value: "bold", label: "Bold", css: 700 },
];

export const TEXT_ALIGNS: { value: TextAlign; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

/** Expanded professional background swatches for enterprise branding. */
export const FG_SWATCHES = ["#0f172a", "#4f46e5", "#dc2626", "#059669", "#ea580c", "#7c3aed", "#0891b2", "#db2777"];

export const BG_SWATCHES = [
  "#ffffff", "transparent",
  "#0f172a", "#1e293b", "#334155",
  "#eef2ff", "#fef3c7", "#dbeafe", "#dcfce7", "#fce7f3", "#ecfeff", "#fff7ed",
];

export const FRAME_COLOR_SWATCHES = ["#4f46e5", "#0ea5e9", "#f59e0b", "#16a34a", "#dc2626", "#7c3aed", "#0f172a", "#ffffff"];

export interface DesignPreset {
  id: string;
  name: string;
  emoji: string;
  design: Partial<QrDesign>;
}

export const DESIGN_PRESETS: DesignPreset[] = [
  { id: "classic", name: "Classic", emoji: "🎯", design: { fgColor: "#0f172a", bgColor: "#ffffff", shape: "square", containerRadius: 0 } },
  { id: "indigo", name: "Indigo", emoji: "🔵", design: { fgColor: "#4f46e5", bgColor: "#ffffff", shape: "rounded", containerRadius: 12 } },
  { id: "forest", name: "Forest", emoji: "🌲", design: { fgColor: "#059669", bgColor: "#ecfdf5", shape: "dots", containerRadius: 16 } },
  { id: "sunset", name: "Sunset", emoji: "🌅", design: { fgColor: "#ea580c", bgColor: "#fff7ed", shape: "rounded", containerRadius: 20 } },
  { id: "magenta", name: "Magenta", emoji: "🌸", design: { fgColor: "#db2777", bgColor: "#fdf2f8", shape: "square", containerRadius: 8 } },
  { id: "ocean", name: "Ocean", emoji: "🌊", design: { fgColor: "#0891b2", bgColor: "#ecfeff", shape: "circle", containerRadius: 50 } },
];
