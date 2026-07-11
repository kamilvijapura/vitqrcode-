"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {  
  Sparkles, Loader2, Layers, FileImage, Package,
  CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, Printer, Plus,
  Grid3x3, Scroll, Info, Minus, Settings, Trash, Edit3, X, Save, Maximize, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Lock, Unlock, Download , Trash2, Edit2, Ruler, Eye, MousePointer } from "lucide-react";
import type { Product, Campaign } from "@/db/schema";
import { generateBulkQrCodes, generateSingleQrCode, getBatchCodesForDownload, deleteQrTemplate, setDefaultTemplate } from "@/app/actions/qr";
import { Card, Button, Input, Field, Select, Badge, EmptyState } from "@/components/ui";
import { AccordionSection } from "@/components/accordion";
import { CardPreview } from "@/components/card-designer/card-preview";
import { useToast } from "@/components/toast";
import { DEFAULT_DESIGN, type CardDesign } from "@/lib/card-designer-types";
import {
  downloadSinglePng, downloadSingleSvg, downloadBatchZip,
  downloadSheetPdf, downloadRollPdf, computeSheetLayout, computeSheetLayoutAspect, getDesignAspectRatio, downloadManifestCsv,
  type SheetOptions,
} from "@/components/admin/qr-download";
import { cn, formatNumber } from "@/lib/utils";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface TemplateRow {
  id: number;
  name: string;
  category: string | null;
  config: unknown;
  thumbnail: string | null;
  isDefault: boolean | null;
  createdAt: Date;
}

interface GeneratedCode {
  id: number;
  code: string;
  status: string;
}

const STEPS = ["Configure Reward", "Select Template", "Generate QR", "Print & Download"];

// â”€â”€â”€ Sheet preset definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SheetPresetDef {
  label: string;
  size: string;
  perSheet: number;
  cols: number;
  rows: number;
}

const SHEET_PRESETS: SheetPresetDef[] = [
  { label: "A4 â€” 12 per sheet (3Ã—4)", size: "A4", perSheet: 12, cols: 3, rows: 4 },
  { label: "A4 â€” 24 per sheet (4Ã—6)", size: "A4", perSheet: 24, cols: 4, rows: 6 },
  { label: "A4 â€” 30 per sheet (5Ã—6)", size: "A4", perSheet: 30, cols: 5, rows: 6 },
  { label: "A4 â€” 40 per sheet (5Ã—8)", size: "A4", perSheet: 40, cols: 5, rows: 8 },
  { label: "A5 â€” 12 per sheet (3Ã—4)", size: "A5", perSheet: 12, cols: 3, rows: 4 },
  { label: "A5 â€” 20 per sheet (4Ã—5)", size: "A5", perSheet: 20, cols: 4, rows: 5 },
  { label: "US Letter â€” 24 per sheet (4Ã—6)", size: "Letter", perSheet: 24, cols: 4, rows: 6 },
  { label: "A3 â€” 50 per sheet (5Ã—10)", size: "A3", perSheet: 50, cols: 5, rows: 10 },
];

interface IndustryPreset {
  label: string;
  mode: "sheet" | "roll";
  sheetPresetIdx?: number;
  rollWidth?: number;
  rollGap?: number;
  rollQrSize?: number;
  rollCols?: number;
  rollCutMarks?: boolean;
}

const INDUSTRY_PRESETS: IndustryPreset[] = [
  { label: "ðŸŽ¨ Paint Bucket Lid Sticker", mode: "roll", rollWidth: 80, rollGap: 10, rollQrSize: 50 },
  { label: "ðŸŽ¨ Paint Can Side Label (A4)", mode: "sheet", sheetPresetIdx: 1 },
  { label: "ðŸ›¢ Lubricant Bottle Label", mode: "roll", rollWidth: 60, rollGap: 5, rollQrSize: 35 },
  { label: "ðŸ›¢ Lubricant Drum Label", mode: "roll", rollWidth: 100, rollGap: 8, rollQrSize: 70 },
  { label: "ðŸ“¦ Carton Sticker (A5)", mode: "sheet", sheetPresetIdx: 4 },
  { label: "ðŸ“¦ Product Warranty (A4 Large)", mode: "sheet", sheetPresetIdx: 0 },
  { label: "ðŸ· Roll Label Standard", mode: "roll", rollWidth: 76, rollGap: 3, rollQrSize: 40 },
  { label: "ðŸ’³ Scratch Card (A4 Dense)", mode: "sheet", sheetPresetIdx: 3 },
];

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function QrGenerator({
  products,
  templates,
  campaigns,
}: {
  products: Product[];
  templates: TemplateRow[];
  campaigns: Campaign[];
}) {
  const { toast } = useToast();

  // â€” Workflow state â€”
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"single" | "bulk" | "import">("bulk");
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  // â€” Configuration state â€”
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    templates.find((t) => t.isDefault)?.id ?? templates[0]?.id ?? null,
  );
  const [productId, setProductId] = useState<number>(products[0]?.id ?? 0);
  const [campaignId, setCampaignId] = useState<number | "none">("none");
  const [rewardType, setRewardType] = useState("points");
  const [batchName, setBatchName] = useState("");
  const [count, setCount] = useState(100);
  const [expiryDate, setExpiryDate] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");

  // â€” Result state â€”
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [batchSnapshot, setBatchSnapshot] = useState<CardDesign | null>(null);

  // â€” Derived values â€”
  const product = products.find((p) => p.id === productId);
  const campaign = campaigns?.find((c) => c.id === campaignId);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // *** KEY FIX: Build design WITHOUT stripping frame/padding/containerRadius ***
  // The generator should preserve ALL template settings faithfully.
  const design: CardDesign = useMemo(() => {
    const tConfig = (selectedTemplate?.config ?? {}) as Partial<CardDesign>;
    return {
      ...DEFAULT_DESIGN,
      ...tConfig,
      padding: { ...DEFAULT_DESIGN.padding, ...(tConfig.padding ?? {}) },
      margin: { ...DEFAULT_DESIGN.margin, ...(tConfig.margin ?? {}) },
      text: { ...DEFAULT_DESIGN.text, ...(tConfig.text ?? {}) },
      logo: { ...DEFAULT_DESIGN.logo, ...(tConfig.logo ?? {}) },
      qr: { ...DEFAULT_DESIGN.qr, ...(tConfig.qr ?? {}) },
    };
  }, [selectedTemplate]);

  // â€” Auto-generate batch name â€”
  useEffect(() => {
    if (mode === "bulk" && product) {
      // If batch name is empty or looks like an auto-generated one, update it.
      const dateStr = new Date().toISOString().split("T")[0];
      const autoPattern = new RegExp(`^.*? Batch - \\d{4}-\\d{2}-\\d{2}$`);
      if (!batchName || autoPattern.test(batchName)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBatchName(`${product.name} Batch - ${dateStr}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, mode]);

  const previewCode = product
    ? `CS-${String(product.sku).slice(-6)}-DEMO`
    : "CS-DEMO";

  // â€” Step navigation â€”
  const handleNextStep = useCallback(() => {
    if (step === 1 && !selectedTemplateId) {
      return toast({ tone: "warning", title: "Please select a template first" });
    }
    if (step === 0) {
      if (!productId) return toast({ tone: "warning", title: "Select a product" });
      if (mode === "bulk" && !batchName.trim()) return toast({ tone: "warning", title: "Batch name is required" });
      if (mode === "bulk" && count < 1) return toast({ tone: "warning", title: "Quantity must be at least 1" });
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }, [step, selectedTemplateId, productId, mode, batchName, count, toast]);


  // â€” QR generation â€”
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenProgress(10);

    const progressInterval = setInterval(() => {
      setGenProgress((p) => Math.min(90, p + 12));
    }, 350);

    try {
      if (mode === "single") {
        const res = await generateSingleQrCode({
          productId,
          templateId: selectedTemplateId ?? undefined,
          campaignId: campaignId === "none" ? undefined : campaignId,
          rewardType,
          expiryDate: expiryDate || undefined,
          internalNote,
        });
        clearInterval(progressInterval);
        setGenProgress(100);

        if (!res.ok) {
          toast({ tone: "error", title: "Generation failed", description: res.error ?? "Unknown error" });
          setStep(1);
          return;
        }
        toast({ tone: "success", title: "QR Code generated!", description: res.code });
        const { codes, batch } = await getBatchCodesForDownload(res.batchId!);
        setGeneratedCodes(codes as GeneratedCode[]);
        setBatchSnapshot(batch?.designConfig ? { ...DEFAULT_DESIGN, ...(batch.designConfig as any) } : null);
      } else {
        const res = await generateBulkQrCodes({
          productId,
          templateId: selectedTemplateId ?? undefined,
          count,
          batchName,
          source: "template",
          designConfig: (selectedTemplate?.config ?? {}) as Record<string, unknown>,
          campaignId: campaignId === "none" ? undefined : campaignId,
          rewardType,
          expiryDate: expiryDate || undefined,
          internalNote,
        });
        clearInterval(progressInterval);
        setGenProgress(100);

        if (!res.ok) {
          toast({ tone: "error", title: "Generation failed", description: res.error ?? "Unknown error" });
          setStep(1);
          return;
        }
        toast({ tone: "success", title: `${res.count} codes generated!`, description: "Ready for print & download" });
        const resBatch = await getBatchCodesForDownload(res.batchId!);
        setGeneratedCodes(resBatch.codes as GeneratedCode[]);
        setBatchSnapshot(resBatch.batch?.designConfig ? { ...DEFAULT_DESIGN, ...(resBatch.batch.designConfig as any) } : null);
      }
      setTimeout(() => setStep(3), 400);
    } catch (e) {
      clearInterval(progressInterval);
      toast({ tone: "error", title: "Generation failed", description: e instanceof Error ? e.message : "Please try again" });
      setStep(1);
    } finally {
      setGenerating(false);
      setTimeout(() => setGenProgress(0), 800);
    }
  }, [mode, productId, selectedTemplateId, campaignId, rewardType, expiryDate, internalNote, count, batchName, selectedTemplate, toast]);

  const reset = useCallback(() => {
    setStep(0);
    setGeneratedCodes([]);
    setBatchName("");
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">

      {/* â”€â”€â”€ Main Workflow Column â”€â”€â”€ */}
      <div className="flex-1 w-full min-w-0 flex flex-col gap-5">

        {/* Mode Tab Switcher */}
        {step < 2 && (
          <div className="flex rounded-lg border border-border bg-surface-2 p-1 w-fit">
            {(["single", "bulk"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-4 py-1.5 text-sm font-semibold rounded-md capitalize transition-all",
                  mode === m
                    ? "bg-surface shadow text-content"
                    : "text-muted hover:text-content",
                )}
              >
                {m === "single" ? "Single QR" : "Bulk Batch"}
              </button>
            ))}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center gap-0 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          {STEPS.map((label, idx) => (
            <div
              key={idx}
              className={cn(
                "flex-1 flex items-center gap-3 px-4 py-3 border-r last:border-r-0 border-border transition-colors",
                step === idx ? "bg-brand/5" : "",
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors",
                  step > idx
                    ? "bg-brand border-brand text-white"
                    : step === idx
                      ? "border-brand text-brand bg-brand/10"
                      : "border-border text-muted bg-surface-2",
                )}
              >
                {step > idx ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span className={cn("text-xs font-semibold hidden sm:block leading-tight", step === idx ? "text-brand" : step > idx ? "text-content" : "text-muted")}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* â”€â”€â”€ Step Content â”€â”€â”€ */}
        <AnimatePresence mode="wait">

          {/* STEP 1: Select Template */}
          {step === 1 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-content">Select Saved Template</h2>
                    <p className="text-sm text-subtle mt-0.5">All design settings, shapes, colors, and frames are preserved exactly.</p>
                  </div>
                  <Link href="/admin/qr/design">
                    <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> New Template</Button>
                  </Link>
                </div>

                <div className="mb-6">
                  <Input 
                    placeholder="Search templates..." 
                    value={templateSearch} 
                    onChange={(e) => setTemplateSearch(e.target.value)} 
                    className="max-w-xs"
                  />
                </div>

                {templates.length === 0 ? (
                  <EmptyState
                    icon={<Layers className="h-8 w-8" />}
                    title="No Templates Yet"
                    description="Create a QR design template first, then generate codes from it."
                    action={<Link href="/admin/qr/design"><Button>Create Template</Button></Link>}
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {templates.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()) || (t.category && t.category.toLowerCase().includes(templateSearch.toLowerCase()))).map((t) => {
                      const isSel = selectedTemplateId === t.id;
                      // Build design with full fidelity â€” no overrides
                      const tConfig = (t.config ?? {}) as Partial<CardDesign>;
                      const tDesign: CardDesign = {
                        ...DEFAULT_DESIGN,
                        ...tConfig,
                        padding: { ...DEFAULT_DESIGN.padding, ...(tConfig.padding ?? {}) },
                        margin: { ...DEFAULT_DESIGN.margin, ...(tConfig.margin ?? {}) },
                        text: { ...DEFAULT_DESIGN.text, ...(tConfig.text ?? {}) },
                        logo: { ...DEFAULT_DESIGN.logo, ...(tConfig.logo ?? {}) },
                        qr: { ...DEFAULT_DESIGN.qr, ...(tConfig.qr ?? {}) },
                      };
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTemplateId(t.id)}
                          className={cn(
                            "group text-left rounded-xl border-2 bg-surface p-3 transition-all hover:border-brand/60 hover:shadow-md cursor-pointer relative",
                            isSel ? "border-brand ring-2 ring-brand/20 shadow-md" : "border-border",
                          )}
                        >

                          <div className="flex h-28 items-center justify-center rounded-lg bg-surface-2 overflow-hidden">
                            <div className="transition-transform group-hover:scale-105">
                              <CardPreview design={{...tDesign, qrValue: "CS-PREVIEW-SAMPLE"}} previewWidth={90} />
                            </div>
                          </div>
                          <div className="mt-3 flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-content truncate">{t.name}</p>
                              <p className="text-xs text-subtle capitalize truncate mt-0.5">{t.category || "General"}</p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              {t.isDefault && <Badge tone="success" className="text-[9px] py-0 px-1.5">Default</Badge>}
                              {isSel && <CheckCircle2 className="h-4 w-4 text-brand" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleNextStep} disabled={!selectedTemplateId} className="px-8">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 0: Configure Reward */}
          {step === 0 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
              <Card className="p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-content">Configure Reward Rules</h2>
                  <p className="text-sm text-subtle mt-0.5">Bind this batch to a product, campaign, and reward structure.</p>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left column: Reward Strategy */}
                    <div className="space-y-4 bg-surface-2 p-5 rounded-xl border border-border">
                      <h3 className="font-bold text-content text-sm mb-4 border-b border-border/50 pb-2 uppercase tracking-wider text-muted">Reward Strategy</h3>
                      
                      <Field label="Target Product" required>
                        <div className="flex items-center gap-3">
                          <Select className="flex-1" value={productId} onChange={(e) => setProductId(Number(e.target.value))}>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name} â€” {p.sku}</option>
                            ))}
                          </Select>
                          {product && (
                            <Badge tone="success" className="shrink-0 flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5" />
                              {product.rewardPoints || 0} pts
                            </Badge>
                          )}
                        </div>
                      </Field>

                      <Field label="Active Campaign">
                        <Select value={campaignId} onChange={(e) => setCampaignId(e.target.value === "none" ? "none" : Number(e.target.value))}>
                          <option value="none">â€” No Campaign â€”</option>
                          {campaigns?.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </Select>
                      </Field>

                      <Field label="Reward Type">
                        <Select value={rewardType} onChange={(e) => setRewardType(e.target.value)}>
                          <option value="points">Points (inherit from product)</option>
                          <option value="fixed">Fixed Reward / Coupon</option>
                          <option value="tracking">No Reward â€” Tracking Only</option>
                        </Select>
                      </Field>

                      {rewardType === "points" && product && (
                        <div className="flex items-center gap-3 rounded-lg border border-brand/20 bg-brand/5 p-3 mt-4">
                          <Sparkles className="h-4 w-4 text-brand shrink-0" />
                          <p className="text-sm">
                            <span className="font-bold text-brand">{product.rewardPoints} pts</span>
                            <span className="text-subtle"> per scan from product config</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right column: Batch Details */}
                    <div className="space-y-4 bg-surface-2 p-5 rounded-xl border border-border">
                      <h3 className="font-bold text-content text-sm mb-4 border-b border-border/50 pb-2 uppercase tracking-wider text-muted">Batch Details</h3>
                      
                      {mode === "bulk" && (
                        <>
                          <Field label="Batch Name" required>
                            <Input
                              value={batchName}
                              onChange={(e) => setBatchName(e.target.value)}
                              placeholder="e.g. Q3-2025 Paint Promo"
                            />
                          </Field>
                          <Field label="Quantity" required>
                            <Input
                              type="number"
                              min={1}
                              max={5000}
                              value={count}
                              onChange={(e) => setCount(Math.min(5000, Math.max(1, Number(e.target.value))))}
                            />
                            {product && rewardType === "points" && (
                              <div className="mt-2 text-xs flex justify-between bg-brand/5 p-2 rounded-md border border-brand/20">
                                <span className="text-subtle">Total Batch Liability:</span>
                                <span className="font-bold text-brand">{formatNumber(count * (product.rewardPoints || 0))} pts</span>
                              </div>
                            )}
                          </Field>
                        </>
                      )}
                      {mode === "single" && (
                        <Field label="Quantity">
                          <Input value="1" disabled />
                          <p className="text-xs text-subtle mt-1">Single QR mode generates exactly 1 unique code.</p>
                        </Field>
                      )}

                      <Field label="Expiry Date (Optional)">
                        <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                      </Field>

                      <Field label="Internal Note (Audit Trail)">
                        <Input value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Visible to admins only" />
                      </Field>
                    </div>
                  </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleNextStep} className="px-8">
                    Review & Generate <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: Generate */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <Card className="p-12 flex flex-col items-center text-center">
                {!generating && genProgress === 0 ? (
                  <>
                    <div className="h-20 w-20 rounded-full border-8 border-surface bg-surface-2 shadow-lg flex items-center justify-center mb-6">
                      <Sparkles className="h-9 w-9 text-brand" />
                    </div>
                    <h2 className="text-2xl font-bold text-content mb-2">Ready to Generate</h2>
                    <p className="text-muted max-w-lg mb-3">
                      Generating{" "}
                      <strong className="text-content">{mode === "bulk" ? formatNumber(count) : "1"}</strong>{" "}
                      cryptographically unique{count > 1 ? " codes" : " code"} bound to{" "}
                      <strong className="text-content">{product?.name}</strong> using template{" "}
                      <strong className="text-content">{selectedTemplate?.name}</strong>.
                    </p>
                    <div className="flex items-start gap-2 text-xs text-subtle bg-surface-2 rounded-lg border border-border px-4 py-2.5 max-w-sm mb-8">
                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-brand" />
                      Codes are non-repetitive and protected by unique DB constraints. Rewards are only awarded on server-side redemption â€” not on scan.
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)}>Cancel</Button>
                      <Button size="lg" onClick={handleGenerate} className="px-10">
                        Generate {mode === "bulk" ? "Batch" : "Code"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-14 w-14 text-brand animate-spin mb-5" />
                    <h2 className="text-xl font-bold text-content mb-1">
                      {genProgress < 100 ? "Generating Secure Codesâ€¦" : "Finalizing Batchâ€¦"}
                    </h2>
                    <p className="text-sm text-subtle mb-5">Creating cryptographically unique, database-protected QR codes</p>
                    <div className="w-full max-w-sm bg-surface-2 rounded-full h-2.5 overflow-hidden border border-border">
                      <div className="bg-brand h-full transition-all duration-300 rounded-full" style={{ width: `${genProgress}%` }} />
                    </div>
                    <p className="text-xs text-muted mt-2">{genProgress}%</p>
                  </>
                )}
              </Card>
            </motion.div>
          )}

          {/* STEP 3: Print & Download */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-xl font-bold text-success flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6" />
                      {generatedCodes.length} Codes Ready
                    </h2>
                    <p className="text-sm text-subtle mt-0.5">Configure your print layout and download print-ready files.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={reset}>Start New Batch</Button>
                </div>

                <DownloadCenter codes={generatedCodes} design={batchSnapshot ?? design} product={products.find(p => p.id === Number(productId))} />
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* â”€â”€â”€ Right Summary Panel â”€â”€â”€ */}
      <div className="w-full lg:w-72 xl:w-80 shrink-0 sticky top-24 space-y-4">
        <Card className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4 pb-2 border-b border-border/60">Configuration Summary</h3>

          {/* Live QR preview â€” uses FULL design from template */}
          <div className="flex justify-center mb-5">
            <div className="p-3 bg-surface-2 rounded-xl border border-border/50 shadow-inner inline-flex items-center justify-center">
              <CardPreview design={{...design, qrValue: previewCode}} previewWidth={130} />
            </div>
          </div>

          {selectedTemplate && (
            <p className="text-[10px] text-center text-subtle mb-4 font-medium uppercase tracking-wider">
              Template: {selectedTemplate.name}
            </p>
          )}

          <div className="space-y-3 text-sm">
            <SummaryRow label="Product" value={product?.name ?? "Not selected"} />
            <SummaryRow label="SKU" value={product?.sku ?? "â€”"} />
            {mode === "bulk" && <SummaryRow label="Batch" value={batchName || "Auto-named"} />}
            <SummaryRow label="Quantity" value={mode === "single" ? "1" : formatNumber(count)} highlight />
            <SummaryRow label="Campaign" value={campaign?.name ?? "None"} />
            <SummaryRow label="Reward" value={rewardType === "points" ? `${product?.rewardPoints ?? 0} pts` : rewardType === "fixed" ? "Fixed Coupon" : "Tracking Only"} highlight />
            {expiryDate && <SummaryRow label="Expires" value={expiryDate} />}
          </div>

          <div className="mt-5 pt-4 border-t border-border/50">
            <div className="flex items-start gap-2 text-xs text-subtle">
              <ShieldCheck className="h-4 w-4 shrink-0 text-success mt-0.5" />
              <span>Rewards are only awarded on successful server-side redemption â€” not on QR scan alone.</span>
            </div>
          </div>
        </Card>
        {step === 3 && <div id="export-portal-target" className="space-y-4" />}

      </div>

    </div>
  );
}

// â”€â”€â”€ Summary Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted shrink-0">{label}</span>
      <span className={cn("font-semibold text-right truncate max-w-[55%]", highlight ? "text-brand" : "text-content")}>
        {value}
      </span>
    </div>
  );
}

// â”€â”€â”€ Download Center â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function DownloadCenter({ codes = [], design, product }: { codes?: GeneratedCode[]; design: CardDesign; product?: any }) {
  const safeCodes = Array.isArray(codes) ? codes : [];
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [dlProgress, setDlProgress] = useState(0);
  
  const [portalNode, setPortalNode] = useState<Element | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortalNode(document.getElementById('export-portal-target'));
  }, []);
  
  // â”€â”€ Tabs â”€â”€
  const [activeTab, setActiveTab] = useState<"sheet" | "roll" | "presets" | "industry">("sheet");

  // â”€â”€ Sheet State â”€â”€
  const [sheetSize, setSheetSize] = useState<string>("A4");
  const [sheetOrientation, setSheetOrientation] = useState<"portrait"|"landscape">("portrait");
  const [customSheetW, setCustomSheetW] = useState(21.0); // cm
  const [customSheetH, setCustomSheetH] = useState(29.7); // cm
  
  const [labelW, setLabelW] = useState(design.width || 30);
  const [labelH, setLabelH] = useState(design.height || 30);
  const [lockAspect, setLockAspect] = useState(true);

  const [gapH, setGapH] = useState(4);
  const [gapV, setGapV] = useState(4);
  const [sheetMargin, setSheetMargin] = useState(10);
  
  const [gridMode, setGridMode] = useState<"auto"|"manual">("auto");
  const [manualRows, setManualRows] = useState(6);
  const [manualCols, setManualCols] = useState(5);

  // â”€â”€ Roll State â”€â”€
  const [rollWidth, setRollWidth] = useState(76);
  const [rollLabelW, setRollLabelW] = useState(design.width || 40);
  const [rollLabelH, setRollLabelH] = useState(design.height || 40);

  useEffect(() => {
    if (design?.width) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLabelW(design.width);
      setRollLabelW(design.width);
    }
    if (design?.height) {
      setLabelH(design.height);
      setRollLabelH(design.height);
    }
  }, [design?.width, design?.height]);
  const [rollGapH, setRollGapH] = useState(3);
  const [rollGapV, setRollGapV] = useState(3);
  const [rollCols, setRollCols] = useState(1);
  const [rollOffset, setRollOffset] = useState(0);

  // â”€â”€ Preview State â”€â”€
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fitToScreen, setFitToScreen] = useState(true);
  const [showGridLines, setShowGridLines] = useState(false);
  const [showCutMarks, setShowCutMarks] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(false);

  // â”€â”€ Presets State â”€â”€
  const [savedPresets, setSavedPresets] = useState<any[]>([]);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("qr_print_presets");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setSavedPresets(JSON.parse(stored));
    } catch {}
  }, []);

  const savePresetsToStorage = (presets: any[]) => {
    setSavedPresets(presets);
    localStorage.setItem("qr_print_presets", JSON.stringify(presets));
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return toast({ tone: "error", title: "Please enter a preset name." });
    
    const newPreset = {
      label: newPresetName.trim(),
      mode: activeTab,
      size: sheetSize,
      orientation: sheetOrientation,
      customSheetW,
      customSheetH,
      labelW: activeTab === "sheet" ? labelW : rollLabelW,
      labelH: activeTab === "sheet" ? labelH : rollLabelH,
      gapH: activeTab === "sheet" ? gapH : rollGapH,
      gapV: activeTab === "sheet" ? gapV : rollGapV,
      sheetMargin,
      gridMode,
      manualRows,
      manualCols,
      rollWidth,
      rollCols,
    };
    
    const existingIdx = savedPresets.findIndex(p => p.label.toLowerCase() === newPresetName.trim().toLowerCase());
    const updated = [...savedPresets];
    if (existingIdx >= 0) {
      updated[existingIdx] = newPreset;
      toast({ tone: "success", title: "Preset Overwritten" });
    } else {
      updated.push(newPreset);
      toast({ tone: "success", title: "Preset Saved" });
    }
    
    savePresetsToStorage(updated);
    setIsSavingPreset(false);
    setNewPresetName("");
  };

  const handleDeletePreset = (label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    savePresetsToStorage(savedPresets.filter(p => p.label !== label));
    toast({ tone: "info", title: "Preset Deleted" });
  };

  // â”€â”€ Derived Sheet Computations â”€â”€
  const PAPER_SIZES: Record<string, {w: number, h: number}> = {
    "A3": { w: 297, h: 420 },
    "A4": { w: 210, h: 297 },
    "A5": { w: 148, h: 210 },
    "Letter": { w: 215.9, h: 279.4 },
    "Legal": { w: 215.9, h: 355.6 },
  };

  const currentPaper = sheetSize === "Custom" 
    ? { w: customSheetW * 10, h: customSheetH * 10 } 
    : PAPER_SIZES[sheetSize] || PAPER_SIZES["A4"];
    
  const paperW = sheetOrientation === "portrait" ? currentPaper.w : currentPaper.h;
  const paperH = sheetOrientation === "portrait" ? currentPaper.h : currentPaper.w;
  
  const sheetLayout = useMemo(() => {
    const availW = paperW - (sheetMargin * 2);
    const availH = paperH - (sheetMargin * 2);
    
    let cols = manualCols;
    let rows = manualRows;
    
    if (gridMode === "auto") {
      cols = Math.floor((availW + gapH) / (labelW + gapH));
      rows = Math.floor((availH + gapV) / (labelH + gapV));
      if (cols < 1) cols = 1;
      if (rows < 1) rows = 1;
    }
    
    const perSheet = cols * rows;
    const totalPages = Math.ceil(codes.length / perSheet) || 1;
    
    return {
      cols, rows, perSheet, totalPages, paperW, paperH
    };
  }, [paperW, paperH, sheetMargin, gapH, gapV, labelW, labelH, gridMode, manualCols, manualRows, codes.length]);

  const rollLayout = useMemo(() => {
    const rowsNeeded = Math.ceil(codes.length / rollCols) || 1;
    const rollLen = (rollLabelH + rollGapV) * rowsNeeded;
    return {
      rows: rowsNeeded,
      rollLen,
      totalPages: 1
    };
  }, [codes.length, rollCols, rollLabelH, rollGapV]);
  
  // ── Presets Handlers ──
  const applyPreset = (p: any) => {
    setActiveTab(p.mode);
    setSheetSize(p.size);
    setSheetOrientation(p.orientation);
    setCustomSheetW(p.customSheetW);
    setCustomSheetH(p.customSheetH);
    if (p.mode === "sheet") {
      setLabelW(p.labelW);
      setLabelH(p.labelH);
      setGapH(p.gapH);
      setGapV(p.gapV);
    } else {
      setRollLabelW(p.labelW);
      setRollLabelH(p.labelH);
      setRollGapH(p.gapH);
      setRollGapV(p.gapV);
    }
    setSheetMargin(p.sheetMargin);
    setGridMode(p.gridMode);
    setManualRows(p.manualRows);
    setManualCols(p.manualCols);
    setRollWidth(p.rollWidth);
    setRollCols(p.rollCols);
    toast({ tone: "success", title: "Preset Applied" });
  };

  const applyIndustryPreset = (preset: any) => {
    setActiveTab("sheet");
    setSheetSize("A4");
    setLabelW(preset.w);
    setLabelH(preset.h);
    setGapH(preset.gapX ?? 4);
    setGapV(preset.gapY ?? 4);
    toast({ tone: "success", title: "Applied " + preset.name + " Layout" });
  };

  // ── Export Handlers ──
  const doDownloadSheet = async () => {
    try {
      setDownloading("sheet");
      setDlProgress(0);
      await downloadSheetPdf(
        codes.map(c => c.code),
        design,
        {
          size: sheetSize,
          customWidth: customSheetW * 10,
          customHeight: customSheetH * 10,
          marginMm: sheetMargin,
          cols: sheetLayout.cols,
          rows: sheetLayout.rows,
          gapMm: gapH,
          cutMarks: showCutMarks
        },
        (done, total) => setDlProgress(Math.round((done/total)*100))
      );
      toast({ tone: "success", title: "PDF downloaded successfully" });
    } catch (e: any) {
      toast({ tone: "error", title: "Download failed", description: e.message });
    } finally {
      setDownloading(null);
    }
  };

  const doDownloadRoll = async () => {
    try {
      setDownloading("roll");
      setDlProgress(0);
      await downloadRollPdf(
        codes.map(c => c.code),
        design,
        {
          rollWidth,
          labelW: rollLabelW,
          labelH: rollLabelH,
          stickerGap: rollGapV,
          cols: rollCols
        },
        (done, total) => setDlProgress(Math.round((done/total)*100))
      );
      toast({ tone: "success", title: "PDF downloaded successfully" });
    } catch (e: any) {
      toast({ tone: "error", title: "Download failed", description: e.message });
    } finally {
      setDownloading(null);
    }
  };

  const doDownloadZip = async () => {
    try {
      setDownloading("zip");
      setDlProgress(0);
      await downloadBatchZip(
        codes.map(c => c.code),
        design,
        (done, total) => setDlProgress(Math.round((done/total)*100))
      );
      toast({ tone: "success", title: "ZIP downloaded successfully" });
    } catch (e: any) {
      toast({ tone: "error", title: "Download failed", description: e.message });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-col md:flex-row border-b border-border bg-surface">
        <button onClick={() => setActiveTab("sheet")} className={cn("flex-1 py-3 text-sm font-semibold transition-colors", activeTab === "sheet" ? "text-brand border-b-2 border-brand" : "text-muted hover:text-content")}>Label Sheets</button>
        <button onClick={() => setActiveTab("roll")} className={cn("flex-1 py-3 text-sm font-semibold transition-colors", activeTab === "roll" ? "text-brand border-b-2 border-brand" : "text-muted hover:text-content")}>Roll Stickers</button>
        <button onClick={() => setActiveTab("presets")} className={cn("flex-1 py-3 text-sm font-semibold transition-colors", activeTab === "presets" ? "text-brand border-b-2 border-brand" : "text-muted hover:text-content")}>Saved Presets</button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        {/* LEFT: Settings Panel */}
        <div className="lg:col-span-2 border-r border-border p-5 space-y-6 max-h-[600px] overflow-y-auto">
          {activeTab === "sheet" && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-content mb-2 block">Sheet Size</label>
                <Select value={sheetSize} onChange={(e) => setSheetSize(e.target.value)} className="w-full">
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="A3">A3 (297 × 420 mm)</option>
                  <option value="A5">A5 (148 × 210 mm)</option>
                  <option value="Letter">US Letter</option>
                  <option value="Legal">US Legal</option>
                  <option value="Custom">Custom Size</option>
                </Select>
              </div>

              {sheetSize === "Custom" && (
                <div className="flex gap-3">
                  <Field label="Width (cm)"><Input type="number" value={customSheetW} onChange={(e) => setCustomSheetW(Number(e.target.value))} /></Field>
                  <Field label="Height (cm)"><Input type="number" value={customSheetH} onChange={(e) => setCustomSheetH(Number(e.target.value))} /></Field>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2">
                <span className="text-sm font-medium">Orientation</span>
                <div className="flex gap-2">
                  <Button variant={sheetOrientation === "portrait" ? "primary" : "outline"} size="sm" onClick={() => setSheetOrientation("portrait")}>Portrait</Button>
                  <Button variant={sheetOrientation === "landscape" ? "primary" : "outline"} size="sm" onClick={() => setSheetOrientation("landscape")}>Landscape</Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-content mb-2 flex items-center justify-between">
                  <span>Label Dimensions (mm)</span>
                  <button onClick={() => setLockAspect(!lockAspect)} className="text-[10px] text-brand">
                    {lockAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                  </button>
                </label>
                <div className="flex gap-3">
                  <Input type="number" value={labelW} onChange={(e) => {
                    const w = Number(e.target.value);
                    setLabelW(w);
                    if (lockAspect && design?.width && design?.height) setLabelH(w * (design.height / design.width));
                  }} />
                  <span className="text-muted self-center">×</span>
                  <Input type="number" value={labelH} onChange={(e) => {
                    const h = Number(e.target.value);
                    setLabelH(h);
                    if (lockAspect && design?.width && design?.height) setLabelW(h * (design.width / design.height));
                  }} />
                </div>
              </div>

              <Field label="Spacing (mm)">
                <div className="flex gap-3">
                  <Input type="number" value={gapH} onChange={(e) => setGapH(Number(e.target.value))} placeholder="Horizontal" />
                  <Input type="number" value={gapV} onChange={(e) => setGapV(Number(e.target.value))} placeholder="Vertical" />
                </div>
              </Field>

              <Field label="Page Margin (mm)">
                <Input type="number" value={sheetMargin} onChange={(e) => setSheetMargin(Number(e.target.value))} />
              </Field>

              <div className="p-4 rounded-xl bg-brand-soft border border-brand/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-brand text-sm">Calculated Layout</span>
                  <Badge tone="brand">{sheetLayout.perSheet} per sheet</Badge>
                </div>
                <div className="text-xs text-brand/70 space-y-1">
                  <p>{sheetLayout.cols} columns × {sheetLayout.rows} rows</p>
                  <p>{sheetLayout.totalPages} pages total for {safeCodes.length} items</p>
                </div>
              </div>

            </div>
          )}

          {activeTab === "roll" && (
            <div className="space-y-5">
              <Field label="Roll Width (mm)">
                <Input type="number" value={rollWidth} onChange={(e) => setRollWidth(Number(e.target.value))} />
              </Field>

              <div>
                <label className="text-xs font-semibold text-content mb-2 flex items-center justify-between">
                  <span>Label Dimensions (mm)</span>
                  <button onClick={() => setLockAspect(!lockAspect)} className="text-[10px] text-brand">
                    {lockAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                  </button>
                </label>
                <div className="flex gap-3">
                  <Input type="number" value={rollLabelW} onChange={(e) => {
                    const w = Number(e.target.value);
                    setRollLabelW(w);
                    if (lockAspect && design?.width && design?.height) setRollLabelH(w * (design.height / design.width));
                  }} />
                  <span className="text-muted self-center">×</span>
                  <Input type="number" value={rollLabelH} onChange={(e) => {
                    const h = Number(e.target.value);
                    setRollLabelH(h);
                    if (lockAspect && design?.width && design?.height) setRollLabelW(h * (design.width / design.height));
                  }} />
                </div>
              </div>

              <Field label="Vertical Gap (mm)">
                <Input type="number" value={rollGapV} onChange={(e) => setRollGapV(Number(e.target.value))} />
              </Field>
              
              <Field label="Columns (For wide rolls)">
                <Input type="number" value={rollCols} onChange={(e) => setRollCols(Number(e.target.value))} min={1} />
              </Field>

              <div className="p-4 rounded-xl bg-brand-soft border border-brand/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-brand text-sm">Roll Estimate</span>
                </div>
                <div className="text-xs text-brand/70 space-y-1">
                  <p>{rollLayout.rows} total rows needed</p>
                  <p>Estimated Length: {formatNumber(rollLayout.rollLen / 1000)} meters</p>
                </div>
              </div>

            </div>
          )}

          {activeTab === "presets" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-3">Your Presets</h4>
                {savedPresets.length === 0 ? (
                  <p className="text-xs text-muted">No saved presets yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {savedPresets.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand cursor-pointer transition-colors" onClick={() => applyPreset(p)}>
                        <div>
                          <p className="text-sm font-semibold text-content">{p.label}</p>
                          <p className="text-xs text-muted">{p.mode === 'sheet' ? `${p.size} - ${p.labelW}x${p.labelH}mm` : `Roll ${p.rollWidth}mm - ${p.labelW}x${p.labelH}mm`}</p>
                        </div>
                        <button className="p-1.5 text-muted hover:text-danger rounded" onClick={(e) => handleDeletePreset(p.label, e as any)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT: Visual Preview */}
        <div className="lg:col-span-3 bg-surface-2 p-5 flex flex-col items-center justify-center min-h-[500px] overflow-hidden relative">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.2, z - 0.2))}>-</Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.2))}>+</Button>
            <Button variant={fitToScreen ? "primary" : "outline"} size="sm" onClick={() => setFitToScreen(!fitToScreen)}>Fit</Button>
          </div>

          <div className="w-full h-full flex items-center justify-center overflow-auto p-8 custom-scrollbar relative">
            {activeTab === "sheet" ? (
              <DownloadPreview 
                mode="sheet"
                zoom={zoom}
                fitToScreen={fitToScreen}
                sheetSize={sheetSize}
                sheetOrientation={sheetOrientation}
                customSheetW={customSheetW}
                customSheetH={customSheetH}
                sheetMargin={sheetMargin}
                labelW={labelW}
                labelH={labelH}
                gapH={gapH}
                gapV={gapV}
                gridMode={gridMode}
                manualCols={manualCols}
                manualRows={manualRows}
                showCutMarks={showCutMarks}
                showSafeArea={showSafeArea}
                design={design}
                previewCode={safeCodes[0]?.code || "CS-SAMPLE"}
              />
            ) : activeTab === "roll" ? (
              <DownloadPreview 
                mode="roll"
                zoom={zoom}
                fitToScreen={fitToScreen}
                rollWidth={rollWidth}
                labelW={rollLabelW}
                labelH={rollLabelH}
                rollGapV={rollGapV}
                rollCols={rollCols}
                showCutMarks={showCutMarks}
                showSafeArea={showSafeArea}
                design={design}
                previewCode={safeCodes[0]?.code || "CS-SAMPLE"}
              />
            ) : (
               <div className="text-center text-muted">Select a layout mode to preview</div>
            )}
          </div>
        </div>
      </div>

      {portalNode && createPortal(
        <Card className="p-5 mt-4 bg-surface shadow-sm">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-content mb-2">Save Current Config</h4>
              <div className="flex gap-2">
                <Input placeholder="Preset Name..." value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} />
                <Button onClick={handleSavePreset} disabled={isSavingPreset}>Save</Button>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex flex-col gap-2">
              <Button size="lg" className="w-full" onClick={activeTab === 'roll' ? doDownloadRoll : doDownloadSheet} disabled={!!downloading}>
                {downloading === "sheet" || downloading === "roll" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {dlProgress}%</> : <><Download className="w-4 h-4 mr-2" /> Download PDF</>}
              </Button>
              <Button variant="outline" className="w-full" onClick={doDownloadZip} disabled={!!downloading}>
                {downloading === "zip" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {dlProgress}%</> : <><Package className="w-4 h-4 mr-2" /> Export ZIP (PNG/SVG)</>}
              </Button>
            </div>

            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cutMarks" checked={showCutMarks} onChange={(e) => setShowCutMarks(e.target.checked)} className="rounded border-border text-brand" />
                <label htmlFor="cutMarks" className="text-xs text-muted cursor-pointer">Include Cut Marks</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="safeArea" checked={showSafeArea} onChange={(e) => setShowSafeArea(e.target.checked)} className="rounded border-border text-brand" />
                <label htmlFor="safeArea" className="text-xs text-muted cursor-pointer">Show Safe Area</label>
              </div>
            </div>
          </div>
        </Card>,
        portalNode
      )}
    </Card>
  );
}

// ─── Download Preview (Visual Grid Generator) ──────────────────────────────

function DownloadPreview(props: any) {
  const { 
    mode, zoom, fitToScreen,
    sheetSize, sheetOrientation, customSheetW, customSheetH,
    sheetMargin, labelW, labelH, gapH, gapV, gridMode, manualCols, manualRows,
    rollWidth, rollGapV, rollCols,
    showCutMarks, showSafeArea,
    design, previewCode
  } = props;

  const PAPER_SIZES: any = {
    "A3": { w: 297, h: 420 },
    "A4": { w: 210, h: 297 },
    "A5": { w: 148, h: 210 },
    "Letter": { w: 215.9, h: 279.4 },
    "Legal": { w: 215.9, h: 355.6 },
  };

  const currentPaper = sheetSize === "Custom" 
    ? { w: customSheetW * 10, h: customSheetH * 10 } 
    : PAPER_SIZES[sheetSize] || PAPER_SIZES["A4"];
    
  let paperW = sheetOrientation === "portrait" ? currentPaper.w : currentPaper.h;
  let paperH = sheetOrientation === "portrait" ? currentPaper.h : currentPaper.w;
  
  let cols = 1, rows = 1;
  let startX = 0, startY = 0;
  let gridW = 0, gridH = 0;
  
  if (mode === "sheet") {
    const availW = paperW - (sheetMargin * 2);
    const availH = paperH - (sheetMargin * 2);
    
    if (gridMode === "auto") {
      cols = Math.max(1, Math.floor((availW + gapH) / (labelW + gapH)));
      rows = Math.max(1, Math.floor((availH + gapV) / (labelH + gapV)));
    } else {
      cols = manualCols;
      rows = manualRows;
    }
    
    gridW = cols * labelW + (cols - 1) * gapH;
    gridH = rows * labelH + (rows - 1) * gapV;
    startX = sheetMargin + (availW - gridW) / 2;
    startY = sheetMargin + (availH - gridH) / 2;
  } else {
    paperW = rollWidth;
    cols = rollCols || 1;
    rows = 5; // Preview 5 rows for roll
    paperH = rows * (labelH + rollGapV) + 20; // 10mm padding top/bottom
    startX = 10;
    startY = 10;
    gridW = paperW - 20;
    gridH = rows * (labelH + rollGapV);
  }

  // Scale calculations for rendering
  // Base visual scale: 1mm = 3.7795px (96 DPI) -> Let's use 3px = 1mm for simple preview
  const mmToPx = 3;
  
  const widthPx = paperW * mmToPx;
  const heightPx = paperH * mmToPx;
  
  const containerStyle: React.CSSProperties = {
    width: widthPx,
    height: heightPx,
    backgroundColor: 'white',
    position: 'absolute',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    transform: `scale(${fitToScreen ? 1 : zoom})`,
    transformOrigin: 'center center',
    transition: 'transform 0.2s ease-out'
  };

  // Generate grid items
  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let x = 0, y = 0;
      if (mode === "sheet") {
        x = startX + c * (labelW + gapH);
        y = startY + r * (labelH + gapV);
      } else {
        const colW = (paperW - 20) / cols;
        x = startX + (c * colW) + (colW - labelW) / 2;
        y = startY + r * (labelH + rollGapV);
      }
      
      items.push(
        <div key={`${r}-${c}`} style={{
          position: 'absolute',
          left: x * mmToPx,
          top: y * mmToPx,
          width: labelW * mmToPx,
          height: labelH * mmToPx,
          border: '1px dashed #cbd5e1',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {design ? (
              <CardPreview design={{...design, qrValue: previewCode || "CS-SAMPLE"}} previewWidth={labelW * mmToPx} />
            ) : (
              <div style={{ width: '60%', height: '60%', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
            )}
          </div>
          {showSafeArea && (
            <div style={{
              position: 'absolute',
              top: '5%', left: '5%', right: '5%', bottom: '5%',
              border: '1px solid #fecdd3',
              borderRadius: '2px',
              pointerEvents: 'none'
            }} />
          )}
          {showCutMarks && (
            <>
              <div style={{ position: 'absolute', top: -10, left: -1, width: 1, height: 8, backgroundColor: 'black' }} />
              <div style={{ position: 'absolute', top: -1, left: -10, width: 8, height: 1, backgroundColor: 'black' }} />
              
              <div style={{ position: 'absolute', top: -10, right: -1, width: 1, height: 8, backgroundColor: 'black' }} />
              <div style={{ position: 'absolute', top: -1, right: -10, width: 8, height: 1, backgroundColor: 'black' }} />
              
              <div style={{ position: 'absolute', bottom: -10, left: -1, width: 1, height: 8, backgroundColor: 'black' }} />
              <div style={{ position: 'absolute', bottom: -1, left: -10, width: 8, height: 1, backgroundColor: 'black' }} />
              
              <div style={{ position: 'absolute', bottom: -10, right: -1, width: 1, height: 8, backgroundColor: 'black' }} />
              <div style={{ position: 'absolute', bottom: -1, right: -10, width: 8, height: 1, backgroundColor: 'black' }} />
            </>
          )}
        </div>
      );
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={fitToScreen ? {
        ...containerStyle,
        transform: `scale(min(1, min(100% / ${widthPx}, 100% / ${heightPx}) * 0.9))`,
      } : containerStyle}>
        {items}
      </div>
    </div>
  );
}
