"use client";

import { forwardRef } from "react";
import type { CardDesign, CardShape } from "@/lib/card-designer-types";
import { QrRenderer } from "@/components/qr-renderer";

/** Scalloped badge clip-path. */
function badgeClip(points = 24, outerR = 50, innerR = 44): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(50 + r * Math.cos(angle)).toFixed(1)}% ${(50 + r * Math.sin(angle)).toFixed(1)}%`);
  }
  return `polygon(${pts.join(",")})`;
}

function hexagonClip(): string {
  return "polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)";
}

function getClipPath(shape: CardShape, customPath: string): string | undefined {
  switch (shape) {
    case "hexagon": return hexagonClip();
    case "badge": return badgeClip();
    case "custom": return `path('${customPath}')`;
    default: return undefined;
  }
}

function getBorderRadius(shape: CardShape, cornerRadius: number): string {
  switch (shape) {
    case "square": return "0";
    case "rounded": return `${cornerRadius}px`;
    case "circle": return "50%";
    default: return "0";
  }
}

function getBackground(d: CardDesign): string {
  if (d.bgImage) return d.bgColor;
  if (d.useGradient) return `linear-gradient(${d.gradientAngle}deg, ${d.gradientFrom}, ${d.gradientTo})`;
  return d.bgColor;
}

const POS_STYLE: Record<string, React.CSSProperties> = {
  top: { gridColumn: "2", gridRow: "1", justifySelf: "center", alignSelf: "start" },
  bottom: { gridColumn: "2", gridRow: "3", justifySelf: "center", alignSelf: "end" },
  left: { gridColumn: "1", gridRow: "2", justifySelf: "start", alignSelf: "center" },
  right: { gridColumn: "3", gridRow: "2", justifySelf: "end", alignSelf: "center" },
  center: { gridColumn: "2", gridRow: "2", justifySelf: "center", alignSelf: "center" },
};

interface PlacedElement {
  key: string;
  position: string;
  node: React.ReactNode;
}

/**
 * Print-ready QR card preview. Composes background shape + gradient/image +
 * QR + text overlay + logo into a single exportable DOM node.
 */
export const CardPreview = forwardRef<
  HTMLDivElement,
  { design: CardDesign; previewWidth?: number }
>(function CardPreview({ design, previewWidth = 360 }, ref) {
  const aspect = design.width / design.height;
  const w = previewWidth;
  const h = previewWidth / aspect;
  const { padding, qr } = design;

  const contentMin = Math.min(w - padding.left - padding.right, h - padding.top - padding.bottom);
  const qrPx = Math.round(contentMin * qr.size);

  const clip = getClipPath(design.shape, design.customSvgPath);
  const radius = getBorderRadius(design.shape, design.cornerRadius);

  const elements: PlacedElement[] = [];

  // QR
  elements.push({
    key: "qr",
    position: "center",
    node: (
      <div style={{
        padding: 4,
        background: qr.bgColor === "transparent" ? "transparent" : qr.bgColor,
        borderRadius: 6,
        display: "inline-flex",
      }}>
        <QrRenderer
          value={design.qrValue || " "}
          design={{
            size: qrPx,
            sizePreset: "medium",
            shape: qr.moduleShape,
            fgColor: qr.color,
            bgColor: qr.bgColor === "transparent" ? "#ffffff" : qr.bgColor,
            margin: qr.margin,
            padding: 0,
            containerRadius: 0,
            level: qr.errorLevel,
            logo: null,
            logoRound: true,
            frame: {
              enabled: false, shape: "none", borderStyle: "solid", thickness: 0, cornerRadius: 0,
              color: "#000", spacing: 0, shadow: false, shadowColor: "#000",
              text: { enabled: false, content: "", fontSize: 12, weight: "normal", color: "#fff", align: "center", position: "bottom" },
              logo: { enabled: false, src: null, size: 32, padding: 6, position: "top", round: false },
            },
          }}
        />
      </div>
    ),
  });



  // Group by zone
  const zones = ["top", "bottom", "left", "right", "center"];
  const grouped = zones.map((pos) => ({
    pos,
    items: elements.filter((e) => e.position === pos),
  })).filter((g) => g.items.length > 0);

  // Margin wrapper
  const marginStyle: React.CSSProperties = {
    display: "inline-block",
    paddingTop: design.margin.top,
    paddingBottom: design.margin.bottom,
    paddingLeft: design.margin.left,
    paddingRight: design.margin.right,
  };

  // Card container
  const cardStyle: React.CSSProperties = {
    width: w,
    height: h,
    background: getBackground(design),
    borderRadius: clip ? "0" : radius,
    clipPath: clip,
    paddingTop: padding.top,
    paddingBottom: padding.bottom,
    paddingLeft: padding.left,
    paddingRight: padding.right,
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gridTemplateRows: "auto 1fr auto",
    boxShadow: design.shadow ? "0 12px 40px -8px rgba(0,0,0,0.3)" : "none",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  };

  return (
    <div ref={ref} style={marginStyle}>
      <div style={cardStyle}>
        {/* Background image overlay */}
        {design.bgImage && (
          <div style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${design.bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: design.bgImageOpacity,
            pointerEvents: "none",
          }} />
        )}
        {/* Background gradient overlay (over image) */}
        {design.bgImage && design.useGradient && (
          <div style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background: `linear-gradient(${design.gradientAngle}deg, ${design.gradientFrom}, ${design.gradientTo})`,
            opacity: design.bgImageOpacity,
            pointerEvents: "none",
          }} />
        )}
        {/* Content elements */}
        {grouped.map((g) => (
          <div key={g.pos} style={{ ...POS_STYLE[g.pos], zIndex: 1, display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
            {g.items.map((item) => (
              <div key={item.key}>{item.node}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});
