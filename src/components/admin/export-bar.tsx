"use client";

import { FileText, FileSpreadsheet, FileType } from "lucide-react";

function toCSV(data: Record<string, any>[]): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
  return [headers.join(","), ...rows].join("\n");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportBar({ data, filename }: { data: Record<string, any>[]; filename: string }) {
  const csv = toCSV(data);
  const exportCSV = () => download(`${filename}.csv`, csv, "text/csv");
  const exportExcel = () => download(`${filename}.xls`, csv, "application/vnd.ms-excel");
  const exportPDF = () => {
    const rows = data.map((r) => `<tr>${Object.values(r).map((v) => `<td style="border:1px solid #ddd;padding:6px">${v}</td>`).join("")}</tr>`).join("");
    const html = `<html><head><title>${filename}</title></head><body style="font-family:sans-serif"><h2>QR Rewards Report</h2><table style="border-collapse:collapse">${rows}</table></body></html>`;
    download(`${filename}.html`, html, "text/html");
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="flex gap-2">
      <button onClick={exportPDF} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-content">
        <FileType className="h-3.5 w-3.5" /> PDF
      </button>
      <button onClick={exportExcel} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-content">
        <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
      </button>
      <button onClick={exportCSV} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-medium text-brand-foreground transition-opacity hover:opacity-90">
        <FileText className="h-3.5 w-3.5" /> CSV
      </button>
    </div>
  );
}
