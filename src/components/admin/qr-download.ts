"use client";

import QRCode from "qrcode";
import jsPDF from "jspdf";
import JSZip from "jszip";
import type { CardDesign } from "@/lib/card-designer-types";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { toPng } from "html-to-image";
import { CardPreview } from "@/components/card-designer/card-preview";
import React from "react";

export const qrValue = (code: string) => `https://rewards.chromashield.co/s/${code}`;

export function getDesignAspectRatio(design: CardDesign): number {
  const cardW = 360;
  const aspect = design.width / design.height;
  const cardH = cardW / aspect;
  
  const fullW = cardW + (design.margin?.left || 0) + (design.margin?.right || 0);
  const fullH = cardH + (design.margin?.top || 0) + (design.margin?.bottom || 0);
  
  return fullW / fullH;
}

// ─── Page sizes in mm [W, H] ───────────────────────────────────────────────
const SHEET_SIZES: Record<string, [number, number]> = {
  A4: [210, 297],
  A5: [148, 210],
  A3: [297, 420],
  Letter: [216, 279],
  Legal: [216, 356],
};

// ─── Default grid layouts per count ───────────────────────────────────────
const SHEET_LAYOUTS: Record<number, { cols: number; rows: number }> = {
  12: { cols: 3, rows: 4 },
  20: { cols: 4, rows: 5 },
  24: { cols: 4, rows: 6 },
  30: { cols: 5, rows: 6 },
  40: { cols: 5, rows: 8 },
  50: { cols: 5, rows: 10 },
};

interface QrRenderOpts {
  fgColor: string;
  bgColor: string;
  level: "L" | "M" | "Q" | "H";
  margin: number;
}

/** Generate a real QR code as a PNG data URL at print resolution. */
export async function generateQrPng(value: string, opts: QrRenderOpts, width = 512): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: opts.level,
    margin: opts.margin,
    width,
    color: {
      dark: opts.fgColor,
      light: opts.bgColor === "transparent" ? "#FFFFFF" : opts.bgColor,
    },
  });
}

/** Generate a real QR code as an SVG string. */
export async function generateQrSvg(value: string, opts: QrRenderOpts): Promise<string> {
  return QRCode.toString(value, {
    type: "svg",
    errorCorrectionLevel: opts.level,
    margin: opts.margin,
    color: {
      dark: opts.fgColor,
      light: opts.bgColor === "transparent" ? "#FFFFFF" : opts.bgColor,
    },
  });
}

/** Extract render options from a CardDesign object. */
function extractOpts(design: CardDesign): QrRenderOpts {
  return {
    fgColor: design.qr?.color ?? "#0f172a",
    bgColor: design.qr?.bgColor === "transparent" ? "#ffffff" : (design.qr?.bgColor ?? "#ffffff"),
    level: design.qr?.errorLevel ?? "H",
    margin: design.qr?.margin ?? 2,
  };
}

/** Render a full CardPreview React component to a PNG using html-to-image. */
export async function generateCardPng(value: string, design: CardDesign, width = 512): Promise<string> {
  const div = document.createElement("div");
  div.style.position = "fixed";
  div.style.top = "-9999px";
  div.style.left = "-9999px";
  document.body.appendChild(div);

  const root = createRoot(div);
  flushSync(() => {
    root.render(React.createElement(CardPreview, { 
      design: { ...design, qrValue: value }, 
      previewWidth: width 
    }));
  });

  await new Promise(resolve => setTimeout(resolve, 50));

  let dataUrl = "";
  try {
    dataUrl = await toPng(div.firstElementChild as HTMLElement, {
      cacheBust: true,
      pixelRatio: 2,
    });
  } catch (e) {
    console.error("Failed to generate Card PNG", e);
  }

  root.unmount();
  div.remove();
  
  return dataUrl;
}

/**
 * Download a single QR code as PNG.
 * `code` is the raw QR code string (NOT the full URL - we apply qrValue internally).
 */
export async function downloadSinglePng(code: string, design: CardDesign, filename?: string) {
  const dataUrl = await generateCardPng(qrValue(code), design, 1024);
  triggerDownload(dataUrl, filename ?? `${code}.png`);
}

/**
 * Download a single QR code as SVG.
 * `code` is the raw QR code string (NOT the full URL).
 */
export async function downloadSingleSvg(code: string, design: CardDesign, filename?: string) {
  const opts = extractOpts(design);
  const svg = await generateQrSvg(qrValue(code), opts);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename ?? `${code}.svg`);
  URL.revokeObjectURL(url);
}

/**
 * Download all codes as a ZIP file with real PNG + SVG images.
 * `codes` are raw code strings (NOT full URLs).
 */
export async function downloadBatchZip(codes: string[], design: CardDesign, filenameOrProgress?: string | ((done: number, total: number) => void), onProgress?: (done: number, total: number) => void) {
  const progressCb = typeof filenameOrProgress === "function" ? filenameOrProgress : onProgress;
  const filename = typeof filenameOrProgress === "string" ? filenameOrProgress : `qr-batch-${Date.now()}.zip`;

  const opts = extractOpts(design);
  const zip = new JSZip();
  const pngFolder = zip.folder("png")!;
  const svgFolder = zip.folder("svg")!;

  const total = Math.min(codes.length, 500);
  for (let i = 0; i < total; i++) {
    try {
      const value = qrValue(codes[i]);
      const png = await generateCardPng(value, design, 512);
      const base64 = png.split(",")[1];
      if (base64) pngFolder.file(`${codes[i]}.png`, base64, { base64: true });

      const svg = await generateQrSvg(value, extractOpts(design));
      svgFolder.file(`${codes[i]}.svg`, svg);
    } catch {
      /* skip individual failures */
    }
    progressCb?.(i + 1, total);
  }

  // Add manifest
  zip.file("manifest.txt", codes.slice(0, total).map((c, i) => `${i + 1}. ${c} → ${qrValue(c)}`).join("\n"));

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

// ─── Sheet PDF ─────────────────────────────────────────────────────────────

export interface SheetOptions {
  /** Page size string e.g. "A4", "A5", "Letter" */
  size?: string;
  /** Alias for size */
  format?: string;
  /** QR codes per sheet (uses default grid layout) */
  perSheet?: number;
  /** Alias for perSheet */
  perPage?: number;
  /** Custom column count */
  cols?: number;
  /** Custom row count */
  rows?: number;
  /** Margin in mm (default 10) */
  marginMm?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  /** Gap between QR codes in mm (default 4) */
  gapMm?: number;
  customWidth?: number;
  customHeight?: number;
  labelW?: number;
  labelH?: number;
  autoGrid?: boolean;
  cmyk?: boolean;
  skipLabels?: number;
  cutMarks?: boolean;
}

/**
 * Download QR codes arranged on a printable label sheet as PDF.
 * `codes` are raw code strings.
 */
export async function downloadSheetPdf(
  codes: string[],
  design: CardDesign,
  options: SheetOptions,
  onProgress?: (done: number, total: number) => void,
) {

  const sizeKey = options.size ?? options.format?.toUpperCase() ?? "A4";
  const [pageW, pageH] = sizeKey === "CUSTOM" && options.customWidth && options.customHeight
    ? [options.customWidth, options.customHeight]
    : SHEET_SIZES[sizeKey] ?? SHEET_SIZES.A4;

  let cols: number, rows: number;
  const mt = options.marginTop ?? options.marginMm ?? 10;
  const mb = options.marginBottom ?? options.marginMm ?? 10;
  const ml = options.marginLeft ?? options.marginMm ?? 10;
  const mr = options.marginRight ?? options.marginMm ?? 10;
  const gap = options.gapMm ?? 4;
  const skip = options.skipLabels ?? 0;

  const labelW = options.labelW ?? 30;
  const labelH = options.labelH ?? 30;

  if (options.autoGrid) {
    cols = Math.max(1, Math.floor((pageW - ml - mr + gap) / (labelW + gap)));
    rows = Math.max(1, Math.floor((pageH - mt - mb + gap) / (labelH + gap)));
  } else if (options.cols && options.rows) {
    cols = options.cols;
    rows = options.rows;
  } else {
    const perSheet = options.perSheet ?? options.perPage ?? 12;
    const layout = SHEET_LAYOUTS[perSheet] ?? SHEET_LAYOUTS[12];
    cols = layout.cols;
    rows = layout.rows;
  }

  const perSheet = cols * rows;

  // Center the grid on the printable area defined by margins
  const gridW = cols * labelW + (cols - 1) * gap;
  const gridH = rows * labelH + (rows - 1) * gap;
  const startX = ml + ((pageW - ml - mr) - gridW) / 2;
  const startY = mt + ((pageH - mt - mb) - gridH) / 2;

  const orientation = pageW > pageH ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation: orientation, unit: "mm", format: [pageW, pageH] });

  if (options.cmyk) {
    pdf.setTextColor(0, 0, 0, 100);
    pdf.setFillColor(0, 0, 0, 100);
  }

  const total = Math.min(codes.length, perSheet * 100); // cap at 100 pages
  const pngCache: string[] = [];

  for (let i = 0; i < total; i++) {
    try {
      const png = await generateCardPng(qrValue(codes[i]), design, 384);
      pngCache.push(png);
    } catch {
      pngCache.push("");
    }
    onProgress?.(i + 1, total);
  }

  const ar = getDesignAspectRatio(design);
  
  let drawW = labelW;
  let drawH = labelH;
  if (labelW / labelH > ar) {
    // Constraint is height
    drawH = labelH;
    drawW = labelH * ar;
  } else {
    // Constraint is width
    drawW = labelW;
    drawH = labelW / ar;
  }

  for (let i = 0; i < pngCache.length; i++) {
    const logicalIdx = skip + i;
    const onPage = logicalIdx % perSheet;
    
    // If we're on the very first element of a page and it's not the first page...
    if (onPage === 0 && logicalIdx > 0 && i > 0) {
      pdf.addPage([pageW, pageH], orientation);
    }

    const c = onPage % cols;
    const r = Math.floor(onPage / cols);
    const x = startX + c * (labelW + gap);
    const y = startY + r * (labelH + gap);

    if (pngCache[i]) {
      const cx = x + (labelW - drawW) / 2;
      const cy = y + (labelH - drawH) / 2;
      pdf.addImage(pngCache[i], "PNG", cx, cy, drawW, drawH, undefined, "FAST");
    }

    // Draw Cut Marks around each label
    if (options.cutMarks) {
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.2);
      
      const tlX = x - 1;
      const tlY = y - 1;
      const trX = x + labelW + 1;
      const trY = y - 1;
      const blX = x - 1;
      const blY = y + labelH + 1;
      const brX = x + labelW + 1;
      const brY = y + labelH + 1;
      
      const m = 3; // mark length
      
      // Top-Left
      pdf.line(tlX, tlY, tlX, tlY + m);
      pdf.line(tlX, tlY, tlX + m, tlY);
      // Top-Right
      pdf.line(trX, trY, trX, trY + m);
      pdf.line(trX, trY, trX - m, trY);
      // Bottom-Left
      pdf.line(blX, blY, blX, blY - m);
      pdf.line(blX, blY, blX + m, blY);
      // Bottom-Right
      pdf.line(brX, brY, brX, brY - m);
      pdf.line(brX, brY, brX - m, brY);
    }
  }

  const label = options.cols ? `custom-${cols}x${rows}` : `${sizeKey}-${options.perSheet ?? options.perPage ?? 12}`;
  pdf.save(`qr-sheet-${label}.pdf`);
}

export interface RollOptions {
  rollWidth: number;
  stickerGap: number;
  labelW?: number;
  labelH?: number;
  cols?: number;
  cutMarks?: boolean;
  cmyk?: boolean;
}

/**
 * Download QR codes as a continuous roll sticker layout PDF.
 * `codes` are raw code strings.
 */
export async function downloadRollPdf(
  codes: string[],
  design: CardDesign,
  options: RollOptions,
  onProgress?: (done: number, total: number) => void,
) {
  const ar = getDesignAspectRatio(design);
  const labelW = options.labelW || options.rollWidth;
  const labelH = options.labelH || options.rollWidth;

  let drawW = labelW;
  let drawH = labelH;
  if (labelW / labelH > ar) {
    drawH = labelH;
    drawW = labelH * ar;
  } else {
    drawW = labelW;
    drawH = labelW / ar;
  }

  const cols = options.cols || 1;
  const cutMarks = options.cutMarks || false;
  const pageW = options.rollWidth + 20;
  
  // Calculate total visible rows per page so it doesn't get ridiculously long for pdf viewers
  const rowsPerPage = 15;
  const pageH = rowsPerPage * (labelH + options.stickerGap) + 20;
  const total = Math.min(codes.length, 500);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageW, pageH] });

  if (options.cmyk) {
    pdf.setTextColor(0, 0, 0, 100);
    pdf.setFillColor(0, 0, 0, 100);
  }

  let idx = 0;
  let pageNum = 0;
  while (idx < total) {
    if (pageNum > 0) pdf.addPage([pageW, pageH], "portrait");
    for (let r = 0; r < rowsPerPage && idx < total; r++) {
      for (let c = 0; c < cols && idx < total; c++) {
        try {
          const png = await generateCardPng(qrValue(codes[idx]), design, 384);
          
          // Center within the specific column width
          const colW = options.rollWidth / cols;
          
          // Offset for the column + center inside that column
          const x = 10 + (c * colW) + (colW - drawW) / 2;
          const y = 10 + r * (labelH + options.stickerGap) + (labelH - drawH) / 2;
          
          pdf.addImage(png, "PNG", x, y, drawW, drawH, undefined, "FAST");
          // Draw Cut Marks around each roll label
          if (cutMarks) {
            pdf.setDrawColor(100, 100, 100);
            pdf.setLineWidth(0.2);
            
            // Note: Cut marks should bound the LABEL, not the drawing
            const lx = 10 + (c * colW) + (colW - labelW) / 2 - 1;
            const rx = lx + labelW + 2;
            const ty = 10 + r * (labelH + options.stickerGap) - 1;
            const by = ty + labelH + 2;
            const m = 3;
            
            pdf.line(lx, ty, lx, ty + m);
            pdf.line(lx, ty, lx + m, ty);
            pdf.line(rx, ty, rx, ty + m);
            pdf.line(rx, ty, rx - m, ty);
            pdf.line(lx, by, lx, by - m);
            pdf.line(lx, by, lx + m, by);
            pdf.line(rx, by, rx, by - m);
            pdf.line(rx, by, rx - m, by);
          }
        } catch { /* skip */ }
        idx++;
        onProgress?.(idx, total);
      }
    }
    pageNum++;
  }

  pdf.save(`qr-roll-${options.rollWidth}mm.pdf`);
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

/**
 * Downloads a CSV manifest mapping the printed QR codes to their physical location.
 */
export function downloadManifestCsv(codes: string[], cols: number, rows: number) {
  let csvContent = "Page,Row,Column,Raw Code,Final URL\n";
  const perPage = cols * rows;

  codes.forEach((code, i) => {
    const page = Math.floor(i / perPage) + 1;
    const idxOnPage = i % perPage;
    const r = Math.floor(idxOnPage / cols) + 1;
    const c = (idxOnPage % cols) + 1;
    const url = qrValue(code);
    csvContent += `${page},${r},${c},${code},${url}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `qr-manifest-${Date.now()}.csv`);
  URL.revokeObjectURL(url);
}

/** Compute grid layout info for live UI preview. */
export function computeSheetLayout(options: SheetOptions, totalCodes: number) {
  const sizeKey = options.size ?? options.format?.toUpperCase() ?? "A4";
  const [pageW, pageH] = sizeKey === "CUSTOM" && options.customWidth && options.customHeight
    ? [options.customWidth, options.customHeight]
    : SHEET_SIZES[sizeKey] ?? SHEET_SIZES.A4;

  let cols: number, rows: number;
  const mt = options.marginTop ?? options.marginMm ?? 10;
  const mb = options.marginBottom ?? options.marginMm ?? 10;
  const ml = options.marginLeft ?? options.marginMm ?? 10;
  const mr = options.marginRight ?? options.marginMm ?? 10;
  const gap = options.gapMm ?? 4;
  const skip = options.skipLabels ?? 0;

  if (options.autoGrid) {
    const calcSize = options.labelW || 30;
    cols = Math.max(1, Math.floor((pageW - ml - mr + gap) / (calcSize + gap)));
    rows = Math.max(1, Math.floor((pageH - mt - mb + gap) / (calcSize + gap)));
  } else if (options.cols && options.rows) {
    cols = options.cols;
    rows = options.rows;
  } else {
    const perSheet = options.perSheet ?? options.perPage ?? 12;
    const layout = SHEET_LAYOUTS[perSheet] ?? SHEET_LAYOUTS[12];
    cols = layout.cols;
    rows = layout.rows;
  }

  const perSheet = cols * rows;
  const calculatedQrSize = Math.min(
    (pageW - ml - mr - gap * (cols - 1)) / cols,
    (pageH - mt - mb - gap * (rows - 1)) / rows,
  );
  const qrSize = options.labelW ?? calculatedQrSize;

  const totalPages = Math.ceil((totalCodes + skip) / perSheet) || 1;
  const aspectRatio = pageH / pageW;

  const gridW = cols * qrSize + (cols - 1) * gap;
  const gridH = rows * qrSize + (rows - 1) * gap;
  const startX = ml + ((pageW - ml - mr) - gridW) / 2;
  const startY = mt + ((pageH - mt - mb) - gridH) / 2;

  return { pageW, pageH, cols, rows, perSheet, gap, qrSize, totalPages, aspectRatio, mt, mb, ml, mr, skip, startX, startY };
}

export function computeSheetLayoutAspect(options: SheetOptions, totalCodes: number, design: CardDesign) {
  const layout = computeSheetLayout(options, totalCodes);
  const ar = getDesignAspectRatio(design);
  
  let drawW = layout.qrSize;
  let drawH = layout.qrSize;
  if (ar > 1) {
    drawH = layout.qrSize / ar;
  } else {
    drawW = layout.qrSize * ar;
  }

  return { ...layout, drawW, drawH, ar };
}
