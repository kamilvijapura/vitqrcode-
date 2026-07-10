"use client";

import { useMemo, useId } from "react";
import QRCode from "qrcode";
import type { QrDesign } from "@/lib/qr-types";

/**
 * Enterprise QR renderer.
 * Renders a genuine QR matrix with selectable module shapes (square / rounded / dots),
 * full color control, quiet-zone margin, error-correction level, and an optional
 * embedded logo overlay. Output is a clean, scalable, downloadable SVG.
 */
export function QrRenderer({
  value,
  design,
  className,
  imageId,
}: {
  value: string;
  design: QrDesign;
  className?: string;
  /** stable id so the same logo image can be referenced when exporting */
  imageId?: string;
}) {
  const uid = useId().replace(/[:]/g, "");
  const refId = imageId ?? `qr-${uid}`;

  const { paths, matrixSize, modulePx, offset } = useMemo(() => {
    const qr = QRCode.create(value || " ", {
      errorCorrectionLevel: design.level,
    });
    const size = qr.modules.size;
    const data = qr.modules.data;
    const total = size + design.margin * 2;
    const mp = design.size / total;
    const off = design.margin * mp;

    // Collect dark module coordinates grouped per row for efficiency.
    const dots: { x: number; y: number }[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (data[r * size + c] & 1) {
          dots.push({ x: c * mp + off, y: r * mp + off });
        }
      }
    }

    // Build module path strings depending on shape
    let out: string[] = [];
    if (design.shape === "dots") {
      out = dots.map(
        (d) =>
          `<circle cx="${(d.x + mp / 2).toFixed(2)}" cy="${(d.y + mp / 2).toFixed(
            2,
          )}" r="${(mp * 0.46).toFixed(2)}" />`,
      );
    } else if (design.shape === "circle") {
      // Larger connected circles for a bold, modern look
      out = dots.map(
        (d) =>
          `<circle cx="${(d.x + mp / 2).toFixed(2)}" cy="${(d.y + mp / 2).toFixed(
            2,
          )}" r="${(mp * 0.5).toFixed(2)}" />`,
      );
    } else if (design.shape === "rounded") {
      const rad = mp * 0.32;
      out = dots.map(
        (d) =>
          `<rect x="${d.x.toFixed(2)}" y="${d.y.toFixed(2)}" width="${mp.toFixed(
            2,
          )}" height="${mp.toFixed(2)}" rx="${rad.toFixed(2)}" ry="${rad.toFixed(
            2,
          )}" />`,
      );
    } else {
      out = dots.map(
        (d) =>
          `<rect x="${d.x.toFixed(2)}" y="${d.y.toFixed(2)}" width="${mp.toFixed(
            2,
          )}" height="${mp.toFixed(2)}" />`,
      );
    }

    return { paths: out, matrixSize: size, modulePx: mp, offset: off };
  }, [value, design.shape, design.level, design.margin, design.size]);

  // Logo sizing (centered, ~22% — safe with error correction H/M)
  const logoFrac = design.logo ? 0.24 : 0;
  const logoBox = design.size * logoFrac;
  const logoX = (design.size - logoBox) / 2;

  return (
    <svg
      width={design.size}
      height={design.size}
      viewBox={`0 0 ${design.size} ${design.size}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      shapeRendering="geometricPrecision"
    >
      <rect
        width={design.size}
        height={design.size}
        fill={design.bgColor === "transparent" ? "none" : design.bgColor}
      />
      <g
        fill={design.fgColor}
        dangerouslySetInnerHTML={{ __html: paths.join("") }}
      />
      {design.logo && (
        <>
          {design.logoRound ? (
            <circle
              cx={design.size / 2}
              cy={design.size / 2}
              r={logoBox / 2 + 4}
              fill={design.bgColor === "transparent" ? "#ffffff" : design.bgColor}
            />
          ) : (
            <rect
              x={logoX - 4}
              y={logoX - 4}
              width={logoBox + 8}
              height={logoBox + 8}
              rx="8"
              fill={design.bgColor === "transparent" ? "#ffffff" : design.bgColor}
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <image
            href={design.logo}
            x={logoX}
            y={logoX}
            width={logoBox}
            height={logoBox}
            preserveAspectRatio="xMidYMid slice"
            clipPath={design.logoRound ? `circle(50% at 50% 50%)` : undefined}
          />
        </>
      )}
      <metadata>{`qrshaper:${refId}:modules=${matrixSize}`}</metadata>
    </svg>
  );
}

/** Utility: serialise a rendered SVG element to a downloadable string. */
export function svgToString(svg: SVGSVGElement | null): string {
  if (!svg) return "";
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}
