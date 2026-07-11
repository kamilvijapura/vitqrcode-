"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Search,
  Clock,
  CheckCircle2,
  Ban,
  XCircle,
  Boxes,
  List,
  Trash2,
  Layers,
  Calendar,
  ChevronRight,
  AlertTriangle,
  Download,
} from "lucide-react";
import { deleteQrBatch, getBatchCodesForDownload } from "@/app/actions/qr";
import { downloadBatchZip } from "@/components/admin/qr-download";
import { PageHeader } from "@/components/admin/AdminShell";
import { Card, Button, Badge, Avatar, Input, EmptyState } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { formatDate, formatNumber, relativeTime, maskCode, cn } from "@/lib/utils";
import type { CardDesign } from "@/lib/card-designer-types";

const qrValue = (code: string) => `https://rewards.chromashield.co/s/${code}`;

const STATUS_META: Record<string, { tone: any; icon: any; label: string }> = {
  unused: { tone: "info", icon: Clock, label: "Unused" },
  used: { tone: "success", icon: CheckCircle2, label: "Used" },
  expired: { tone: "warning", icon: Ban, label: "Expired" },
  invalid: { tone: "danger", icon: XCircle, label: "Invalid" },
};

type Batch = {
  id: number;
  name: string;
  description: string | null;
  count: number;
  source: string;
  designConfig: unknown;
  createdAt: Date | string;
  productName: string | null;
  productEmoji: string | null;
  productRewardPoints?: number | null;
  usedCount: number;
};

type IndividualCode = {
  id: number;
  code: string;
  status: "unused" | "used" | "expired" | "invalid";
  batch: string | null;
  batchId: number | null;
  pointsAwarded: number;
  scannedAt: Date | string | null;
  productName: string | null;
  productEmoji: string | null;
};

export function QrHistory({
  batches,
  codes,
  batchCodesLoader,
}: {
  batches: Batch[];
  codes: IndividualCode[];
  /** async loader: (batchId) => IndividualCode[] — server-provided per-batch codes */
  batchCodesLoader: (batchId: number) => Promise<IndividualCode[]>;
}) {
  const [view, setView] = useState<"batches" | "individual">("batches");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [del, setDel] = useState<Batch | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const { toast } = useToast();

  const handleDownload = async (b: Batch) => {
    setDownloadingId(b.id);
    try {
      const res = await getBatchCodesForDownload(b.id);
      const codes = res.codes;
      const rawCodes = codes.map((c) => c.code);
      const cfg = (b.designConfig ?? {}) as CardDesign;
      await downloadBatchZip(rawCodes, cfg, `batch-${b.name.replace(/\s+/g, "-")}.zip`);
      toast({ tone: "success", title: "Download started" });
    } catch (e) {
      toast({ tone: "error", title: "Download failed", description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredCodes = useMemo(() => {
    const q = query.toLowerCase();
    return codes.filter((c) => {
      const matchQ = !q || c.code.toLowerCase().includes(q) || (c.productName ?? "").toLowerCase().includes(q);
      const matchS = statusFilter === "all" || c.status === statusFilter;
      return matchQ && matchS;
    });
  }, [codes, query, statusFilter]);

  const filteredBatches = useMemo(() => {
    const q = query.toLowerCase();
    return batches.filter(
      (b) => !q || b.name.toLowerCase().includes(q) || (b.productName ?? "").toLowerCase().includes(q),
    );
  }, [batches, query]);

  const codeTabs = [
    { key: "all", label: "All" },
    { key: "unused", label: "Unused" },
    { key: "used", label: "Used" },
    { key: "expired", label: "Expired" },
  ];

  return (
    <div>
      {/* View toggle */}
      <div className="mb-4 inline-flex rounded-xl border border-border bg-surface p-1">
        <button
          onClick={() => setView("batches")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            view === "batches" ? "bg-brand text-brand-foreground" : "text-muted hover:text-content",
          )}
        >
          <Boxes className="h-4 w-4" /> Batch History
          <span className={cn("rounded-full px-1.5 text-[10px]", view === "batches" ? "bg-white/20" : "bg-surface-2")}>
            {batches.length}
          </span>
        </button>
        <button
          onClick={() => setView("individual")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            view === "individual" ? "bg-brand text-brand-foreground" : "text-muted hover:text-content",
          )}
        >
          <List className="h-4 w-4" /> Individual Codes
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <Input
          placeholder={view === "batches" ? "Search batches…" : "Search by code or product…"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* ============ BATCH VIEW ============ */}
      {view === "batches" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBatches.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <EmptyState icon={<Boxes className="h-7 w-7" />} title="No batches found" description="Generate QR codes to create your first batch." />
            </Card>
          ) : (
            filteredBatches.map((b, i) => {
              const rate = b.count > 0 ? Math.round((b.usedCount / b.count) * 100) : 0;
              const cfg = (b.designConfig ?? {}) as Partial<CardDesign>;
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="group flex h-full flex-col p-5 transition-shadow hover:shadow-pop">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white p-1.5 shadow-sm">
                          <QRCodeSVG
                            value={qrValue(b.name.slice(0, 8))}
                            size={44}
                            fgColor={cfg.qr?.color ?? "#0f172a"}
                            bgColor={cfg.qr?.bgColor === "transparent" ? "#ffffff" : (cfg.qr?.bgColor ?? "#ffffff")}
                            level="M"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-content">{b.name}</p>
                          <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium text-content">{b.productName}</span>
                            {b.productRewardPoints != null && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <span className="font-bold text-brand">{b.productRewardPoints} pts</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDel(b)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {b.description && <p className="mt-3 line-clamp-2 text-xs text-muted">{b.description}</p>}

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <Badge tone={b.source === "csv" ? "info" : b.source === "excel" ? "accent" : "neutral"}>
                        {b.source}
                      </Badge>
                      {cfg.shape && <Badge tone="neutral">{cfg.shape}</Badge>}
                      <span className="flex items-center gap-1 text-subtle">
                        <Calendar className="h-3 w-3" /> {formatDate(b.createdAt)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-surface-2 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">{formatNumber(b.count)} codes</span>
                        <span className="font-semibold text-content">{rate}% scanned</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
                        <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${rate}%` }} />
                      </div>
                      <div className="mt-2 flex justify-between text-[11px] text-subtle">
                        <span>{formatNumber(b.usedCount)} used</span>
                        <span>{formatNumber(b.count - b.usedCount)} unused</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={downloadingId === b.id}
                        onClick={() => handleDownload(b)}
                      >
                        {downloadingId === b.id ? "..." : <><Download className="h-3.5 w-3.5 mr-1" /> Download</>}
                      </Button>
                      <Button
                        variant="soft"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedBatch(b)}
                      >
                        View Codes <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ============ INDIVIDUAL VIEW ============ */}
      {view === "individual" && (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
            {codeTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition-colors",
                  statusFilter === t.key ? "bg-brand text-brand-foreground" : "bg-surface-2 text-muted hover:text-content",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Card className="overflow-hidden">
            {filteredCodes.length === 0 ? (
              <EmptyState icon={<List className="h-7 w-7" />} title="No codes found" description="Adjust filters or generate new codes." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-subtle">
                      <th className="px-5 py-3 font-medium">Code</th>
                      <th className="px-5 py-3 font-medium">Product</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Points</th>
                      <th className="px-5 py-3 font-medium">Scanned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCodes.slice(0, 100).map((c) => {
                      const meta = STATUS_META[c.status] ?? STATUS_META.unused;
                      const Icon = meta.icon;
                      return (
                        <tr key={c.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-2/60">
                          <td className="px-5 py-3 font-mono text-xs text-content">{maskCode(c.code)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar src={c.productEmoji} name={c.productName ?? ""} size={28} />
                              <span className="text-content">{c.productName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <Badge tone={meta.tone} dot><Icon className="h-3 w-3" /> {meta.label}</Badge>
                          </td>
                          <td className="px-5 py-3 font-semibold text-content">{c.status === "used" ? `+${c.pointsAwarded}` : "—"}</td>
                          <td className="px-5 py-3 text-xs text-muted">{c.scannedAt ? relativeTime(c.scannedAt) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <BatchDetailModal
        batch={selectedBatch}
        onClose={() => setSelectedBatch(null)}
        loader={batchCodesLoader}
      />
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => {
          if (del) {
            deleteQrBatch(del.id);
            toast({ tone: "success", title: "Batch deleted", description: `${del.name} and its codes removed.` });
          }
        }}
        title="Delete batch?"
        message={`This permanently deletes "${del?.name}" and all ${del?.count} codes in it.`}
        confirmLabel="Delete batch"
        danger
      />
    </div>
  );
}

/* =========================== Batch detail modal =========================== */

function BatchDetailModal({
  batch,
  onClose,
  loader,
}: {
  batch: Batch | null;
  onClose: () => void;
  loader: (batchId: number) => Promise<IndividualCode[]>;
}) {
  const [codes, setCodes] = useState<IndividualCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(false);
      try {
        const res = await loader(id);
        setCodes(res ?? []);
      } catch {
        setError(true);
        setCodes([]);
      } finally {
        setLoading(false);
      }
    },
    [loader],
  );

  useEffect(() => {
    if (batch) load(batch.id);
  }, [batch, load]);

  return (
    <Modal
      open={!!batch}
      onClose={onClose}
      title={batch?.name ?? "Batch"}
      description={batch ? `${formatNumber(batch.count)} codes · ${batch.productName ?? "—"}` : undefined}
      size="lg"
    >
      {loading ? (
        <div className="py-12 text-center text-sm text-muted">Loading codes…</div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <AlertTriangle className="h-8 w-8 text-warning" />
          <p className="text-sm font-medium text-content">Couldn&apos;t load codes</p>
          <Button size="sm" variant="outline" onClick={() => batch && load(batch.id)}>
            Retry
          </Button>
        </div>
      ) : codes.length === 0 ? (
        <EmptyState icon={<List className="h-7 w-7" />} title="No codes in this batch" />
      ) : (
        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {codes.map((c) => {
            const meta = STATUS_META[c.status] ?? STATUS_META.unused;
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
                <div className="rounded-lg bg-white p-1">
                  <QRCodeSVG value={qrValue(c.code)} size={36} fgColor="#0f172a" level="M" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-content">{c.code}</p>
                  <p className="text-[11px] text-subtle">{c.scannedAt ? `Scanned ${relativeTime(c.scannedAt)}` : "Never scanned"}</p>
                </div>
                <Badge tone={meta.tone} dot>{meta.label}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
