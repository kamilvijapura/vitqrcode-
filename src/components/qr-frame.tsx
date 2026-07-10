"use client";

import type {
  QrDesign,
  FrameShape,
  FrameSide,
  FrameText,
  FrameLogo,
  BorderStyle,
} from "@/lib/qr-types";
import { QrRenderer } from "@/components/qr-renderer";

/** Scalloped "seal/sunburst" clip-path used by the badge frame. */
function badgeClip(points = 16, outerR = 50, innerR = 45): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(50 + r * Math.cos(angle)).toFixed(2)}% ${(50 + r * Math.sin(angle)).toFixed(2)}%`);
  }
  return `polygon(${pts.join(",")})`;
}

/** Hexagon clip-path. */
function hexagonClip(): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(50 + 50 * Math.cos(angle)).toFixed(2)}% ${(50 + 50 * Math.sin(angle)).toFixed(2)}%`);
  }
  return `polygon(${pts.join(",")})`;
}

const BORDER_CSS: Record<BorderStyle, string> = {
  solid: "solid",
  dashed: "dashed",
  dotted: "dotted",
};

const SHAPE_CLIP: Partial<Record<FrameShape, string>> = {
  circle: "circle(50% at 50% 50%)",
  badge: badgeClip(),
  hexagon: hexagonClip(),
};

const WEIGHT_CSS: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 };
const ALIGN_JUSTIFY = { left: "flex-start", center: "center", right: "flex-end" } as const;

/**
 * Enterprise QR preview: Frame (6 shapes, 3 border styles, shadow) + QR + logo/text.
 * Updates instantly on any change.
 */
export function QrPreview({
  value,
  design,
  previewSize,
  className,
}: {
  value: string;
  design: QrDesign;
  previewSize: number;
  className?: string;
}) {
  const { frame } = design;
  const transparent = design.bgColor === "transparent";
  const qrHolderBg = transparent ? "transparent" : design.bgColor;
  const border = frame.thickness > 0 ? `${frame.thickness}px ${BORDER_CSS[frame.borderStyle]} ${frame.color}` : "none";
  const boxShadow = frame.shadow ? `0 8px 28px -8px ${frame.shadowColor}88` : "none";
  const clip = SHAPE_CLIP[frame.shape];
  const radius = frame.shape === "square" ? 4 : frame.shape === "rounded" ? frame.cornerRadius : frame.shape === "circle" ? "50%" : frame.cornerRadius;

  const inner = <QrRenderer value={value} design={{ ...design, size: previewSize }} />;

  // No frame — apply containerRadius for shape clipping
  if (!frame.enabled || frame.shape === "none") {
    const cr = (design.containerRadius ?? 0);
    return (
      <div className={className} style={{
        display: "inline-flex",
        background: qrHolderBg,
        borderRadius: cr >= 50 ? "50%" : `${cr}%`,
        overflow: cr > 0 && !transparent ? "hidden" : transparent ? "visible" : "hidden",
        padding: design.padding > 0 ? design.padding : undefined,
      }}>
        {inner}
      </div>
    );
  }

  // Badge
  if (frame.shape === "badge") {
    return (
      <div className={className} style={{ display: "inline-block", padding: frame.spacing + frame.thickness, background: frame.color, clipPath: badgeClip(), boxShadow }}>
        <div style={{ padding: frame.spacing, background: qrHolderBg, borderRadius: "50%", display: "inline-flex" }}>{inner}</div>
      </div>
    );
  }

  // Hexagon
  if (frame.shape === "hexagon") {
    return (
      <div className={className} style={{ display: "inline-block", padding: frame.spacing, background: frame.color, clipPath: hexagonClip(), border, boxShadow }}>
        <div style={{ padding: frame.spacing * 0.5, background: qrHolderBg, clipPath: hexagonClip(), display: "inline-flex" }}>{inner}</div>
      </div>
    );
  }

  // Standard framed layout with side text/logo
  const hasText = frame.text.enabled && frame.text.content.trim().length > 0;
  const hasLogo = frame.logo.enabled && frame.logo.src;

  const top = collectSide("top", frame.text, frame.logo, hasText, !!hasLogo);
  const bottom = collectSide("bottom", frame.text, frame.logo, hasText, !!hasLogo);
  const left = collectSide("left", frame.text, frame.logo, hasText, !!hasLogo);
  const right = collectSide("right", frame.text, frame.logo, hasText, !!hasLogo);

  return (
    <div className={className} style={{ display: "inline-flex", flexDirection: "column", background: frame.color, padding: frame.spacing, borderRadius: radius, border, boxShadow, clipPath: clip }}>
      {top.items.length > 0 && <SideBar side="top" items={top.items} frame={frame} />}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        {left.items.length > 0 && <SideBar side="left" items={left.items} frame={frame} />}
        <div style={{ border, background: qrHolderBg, borderRadius: typeof radius === "number" ? Math.max(0, radius - frame.thickness) : radius, display: "inline-flex", overflow: radius === "50%" ? "hidden" : "visible" }}>
          {inner}
        </div>
        {right.items.length > 0 && <SideBar side="right" items={right.items} frame={frame} />}
      </div>
      {bottom.items.length > 0 && <SideBar side="bottom" items={bottom.items} frame={frame} />}
    </div>
  );
}

function collectSide(side: FrameSide, text: FrameText, logo: FrameLogo, hasText: boolean, hasLogo: boolean) {
  const items: ("text" | "logo")[] = [];
  if (hasLogo && logo.position === side) items.push("logo");
  if (hasText && text.position === side) items.push("text");
  return { items };
}

function SideBar({ side, items, frame }: { side: FrameSide; items: ("text" | "logo")[]; frame: QrDesign["frame"] }) {
  const horizontal = side === "top" || side === "bottom";
  const align = ALIGN_JUSTIFY[frame.text.align];
  return (
    <div style={{ display: "flex", flexDirection: horizontal ? "row" : "column", alignItems: "center", justifyContent: horizontal ? align : "center", gap: 8, padding: 4 }}>
      {items.map((kind, i) => kind === "logo" ? <LogoMark key={`l${i}`} logo={frame.logo} /> : <TextMark key={`t${i}`} text={frame.text} side={side} />)}
    </div>
  );
}

function LogoMark({ logo }: { logo: FrameLogo }) {
  if (!logo.src) return null;
  return (
    <div style={{ padding: logo.padding, display: "inline-flex" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.src} alt="frame logo" style={{ height: logo.size, width: logo.size, objectFit: "contain", borderRadius: logo.round ? "50%" : 6 }} />
    </div>
  );
}

function TextMark({ text, side }: { text: FrameText; side: FrameSide }) {
  const vertical = side === "left" || side === "right";
  const style: React.CSSProperties = { color: text.color, fontSize: text.fontSize, fontWeight: WEIGHT_CSS[text.weight], lineHeight: 1.2, whiteSpace: "nowrap", textAlign: vertical ? "center" : text.align, letterSpacing: 0.2 };
  if (vertical) { style.writingMode = "vertical-rl"; if (side === "left") style.transform = "rotate(180deg)"; }
  return <span style={style}>{text.content}</span>;
}
