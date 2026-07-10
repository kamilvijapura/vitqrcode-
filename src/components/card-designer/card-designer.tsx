"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, ImagePlus, Trash2, Maximize, ZoomIn, ZoomOut, Save,
  LayoutGrid, QrCode, Type, Link2, Link2Off, RotateCcw, Lock, Unlock,
  Settings2, Sparkles, Download,
} from "lucide-react";
import { CardPreview } from "@/components/card-designer/card-preview";
import { saveQrTemplate } from "@/app/actions/qr";
import { Card, Button, Badge, Input, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import {
  DEFAULT_DESIGN, CARD_SHAPES, CARD_PRESETS, POSITIONS, COLOR_SWATCHES, FONT_FAMILIES,
  type CardDesign, type CardShape, type ElementPos, type QrModuleShape, type ErrorLevel,
} from "@/lib/card-designer-types";
import { cn } from "@/lib/utils";

type Tool = "templates" | "background" | "spacing" | "qr" | "text" | "logo";
const DEFAULT_KEY = "qr-card-design";

export function CardDesigner() {
  const [tool, setTool] = useState<Tool>("templates");
  const [design, setDesign] = useState<CardDesign>(structuredClone(DEFAULT_DESIGN));
  const [zoom, setZoom] = useState(1);
  const [tplName, setTplName] = useState("");
  const [saving, setSaving] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const set = (patch: Partial<CardDesign>) => setDesign((d) => ({ ...d, ...patch }));

  const resetDesign = () => { setDesign(structuredClone(DEFAULT_DESIGN)); toast({ tone: "info", title: "Design reset" }); };

  const applyPreset = (preset: typeof CARD_PRESETS[0]) => {
    setDesign((d) => ({ ...structuredClone(DEFAULT_DESIGN), ...preset.config, qr: { ...d.qr, ...preset.config.qr }, text: { ...d.text, ...preset.config.text } }));
    toast({ tone: "success", title: `${preset.name} applied` });
  };

  const handleSave = async () => {
    if (!tplName.trim()) return toast({ tone: "warning", title: "Name required" });
    setSaving(true);
    try {
      const res = await saveQrTemplate({ name: tplName, category: "Custom", config: design as unknown as Record<string, unknown> });
      if (res && !res.ok) { toast({ tone: "error", title: "Save failed", description: res.error ?? "Unknown error" }); return; }
      toast({ tone: "success", title: "Template saved!", description: tplName });
      setTplName("");
    } catch (e) { toast({ tone: "error", title: "Save failed", description: e instanceof Error ? e.message : "Unknown error" }); }
    setSaving(false);
  };

  const downloadPNG = async () => {
    toast({ tone: "info", title: "Generating PNG…" });
    try {
      const { toPng } = await import("html-to-image");
      const node = previewRef.current?.querySelector(".card-export-target") as HTMLElement;
      const target = node || previewRef.current;
      if (!target) return;
      const dataUrl = await toPng(target, { pixelRatio: 3, cacheBust: true, backgroundColor: undefined });
      const a = document.createElement("a"); a.href = dataUrl; a.download = "qr-card.png"; a.click();
      toast({ tone: "success", title: "Downloaded 300 DPI PNG" });
    } catch { toast({ tone: "error", title: "Export failed" }); }
  };

  const TOOLS: { id: Tool; label: string; icon: any }[] = [
    { id: "templates", label: "Templates", icon: LayoutGrid },
    { id: "background", label: "Background", icon: Palette },
    { id: "spacing", label: "Spacing", icon: Maximize },
    { id: "qr", label: "QR Code", icon: QrCode },
    { id: "text", label: "Text", icon: Type },
    { id: "logo", label: "Logo", icon: ImagePlus },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* LEFT: tools */}
      <div className="lg:col-span-2">
        <Card className="sticky top-20 p-2">
          <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col no-scrollbar">
            {TOOLS.map((t) => (
              <button key={t.id} onClick={() => setTool(t.id)}
                className={cn("flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all", tool === t.id ? "bg-brand text-brand-foreground shadow-sm shadow-brand/30" : "text-muted hover:bg-surface-2 hover:text-content")}>
                <t.icon className="h-[18px] w-[18px]" /><span className="hidden lg:block">{t.label}</span>
              </button>
            ))}
            <button onClick={resetDesign} className="mt-1 flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-all hover:bg-danger-soft hover:text-danger">
              <RotateCcw className="h-[18px] w-[18px]" /><span className="hidden lg:block">Reset</span>
            </button>
          </nav>
        </Card>
      </div>

      {/* CENTER: canvas + panel */}
      <div className="lg:col-span-6">
        <Card className="flex flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Badge tone="neutral" className="capitalize">{tool === "qr" ? "QR Code" : tool}</Badge>
              <span className="text-xs text-muted">{design.width}×{design.height}mm</span>
            </div>
            <div className="flex items-center gap-1">
              <IconBtn onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}><ZoomOut className="h-4 w-4" /></IconBtn>
              <span className="w-10 text-center text-xs text-muted">{Math.round(zoom * 100)}%</span>
              <IconBtn onClick={() => setZoom((z) => Math.min(2, z + 0.1))}><ZoomIn className="h-4 w-4" /></IconBtn>
              <IconBtn onClick={() => setZoom(1)}><Maximize className="h-4 w-4" /></IconBtn>
            </div>
          </div>

          <div className="flex min-h-[380px] items-center justify-center bg-surface-2 p-8" style={{ backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--color-content) 4%, transparent) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
            <div style={{ transform: `scale(${zoom})`, transition: "transform 0.2s" }} className="card-export-target">
              <CardPreview design={design} previewWidth={340} ref={previewRef} />
            </div>
          </div>

          <div className="border-t border-border p-5">
            <AnimatePresence mode="wait">
              <motion.div key={tool} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {tool === "templates" && <TemplatesPanel applyPreset={applyPreset} />}
                {tool === "background" && <BackgroundPanel design={design} set={set} />}
                {tool === "spacing" && <SpacingPanel design={design} set={set} />}
                {tool === "qr" && <QrPanel design={design} set={set} />}
                {tool === "text" && <TextPanel design={design} set={set} />}
                {tool === "logo" && <LogoPanel design={design} set={set} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {/* RIGHT: preview + export */}
      <div className="lg:col-span-4">
        <div className="sticky top-20 space-y-4">
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-content"><QrCode className="h-4 w-4 text-brand" /> Live Preview</h3>
            <div className="flex min-h-[220px] items-center justify-center rounded-xl bg-surface-2 p-6">
              <CardPreview design={design} previewWidth={180} />
            </div>
            <p className="mt-2 text-center text-xs text-subtle">300 DPI · Print-ready</p>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-content">Export</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={downloadPNG}><Download className="h-3.5 w-3.5" /> PNG 300dpi</Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}><Sparkles className="h-3.5 w-3.5" /> Print</Button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold text-content">Save Template</h3>
            <div className="flex gap-2">
              <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Name" className="h-9 text-xs" />
              <Button size="sm" onClick={handleSave} disabled={saving}><Save className="h-4 w-4" /></Button>
            </div>
          </Card>

          <Link href="/admin/qr/generate">
            <Button size="lg" className="w-full shadow-lg shadow-brand/25">Generate QR Codes</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================== Panels ============================== */

function TemplatesPanel({ applyPreset }: { applyPreset: (p: typeof CARD_PRESETS[0]) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {CARD_PRESETS.map((p) => (
        <button key={p.id} onClick={() => applyPreset(p)} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface-2 p-3 transition-all hover:border-brand hover:bg-brand-soft">
          <span className="text-2xl">{p.emoji}</span>
          <span className="text-[10px] font-medium text-content">{p.name}</span>
        </button>
      ))}
    </div>
  );
}

function BackgroundPanel({ design, set }: { design: CardDesign; set: (p: Partial<CardDesign>) => void }) {
  return (
    <div className="space-y-4">
      {/* Shape */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Background Shape</p>
        <div className="grid grid-cols-6 gap-1.5">
          {CARD_SHAPES.map((s) => (
            <button key={s.value} onClick={() => set({ shape: s.value as CardShape })} className={cn("flex flex-col items-center gap-0.5 rounded-lg border py-2 text-[10px] transition-all", design.shape === s.value ? "border-brand bg-brand-soft text-brand" : "border-border text-muted hover:text-content")}>
              <span className="text-lg">{s.icon}</span><span className="hidden sm:block">{s.label}</span>
            </button>
          ))}
        </div>
        {design.shape === "rounded" && <CSlider label="Corner Radius" value={design.cornerRadius} min={0} max={40} onChange={(v) => set({ cornerRadius: v })} />}
        {design.shape === "custom" && <Input value={design.customSvgPath} onChange={(e) => set({ customSvgPath: e.target.value })} placeholder="SVG path data e.g. M20,20 L80,20..." className="mt-2 h-8 text-xs font-mono" />}
      </div>

      {/* Size */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Background Size (mm)</p>
        <div className="flex items-center gap-2">
          <div className="flex-1"><label className="text-[10px] text-subtle">Width</label><Input type="number" min={10} max={200} value={design.width} onChange={(e) => { const w = Math.min(200, Math.max(10, Number(e.target.value))); set({ width: w, height: design.lockAspect ? Math.round(w / (design.width / design.height)) : design.height }); }} className="h-8 text-xs" /></div>
          <button onClick={() => set({ lockAspect: !design.lockAspect })} className={cn("mt-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", design.lockAspect ? "border-brand bg-brand-soft text-brand" : "border-border text-muted")}>{design.lockAspect ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}</button>
          <div className="flex-1"><label className="text-[10px] text-subtle">Height</label><Input type="number" min={10} max={200} value={design.height} onChange={(e) => { const h = Math.min(200, Math.max(10, Number(e.target.value))); set({ height: h, width: design.lockAspect ? Math.round(h * (design.width / design.height)) : design.width }); }} className="h-8 text-xs" /></div>
        </div>
      </div>

      {/* Color / Gradient */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Background Color</p>
          <Toggle on={design.useGradient} onClick={() => set({ useGradient: !design.useGradient })} label="Gradient" />
        </div>
        {design.useGradient ? (
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] text-subtle">From</label><ColorInput value={design.gradientFrom} onChange={(v) => set({ gradientFrom: v })} /></div>
            <div><label className="text-[10px] text-subtle">To</label><ColorInput value={design.gradientTo} onChange={(v) => set({ gradientTo: v })} /></div>
            <div><label className="text-[10px] text-subtle">Angle</label><div className="flex items-center gap-1"><input type="number" min={0} max={360} value={design.gradientAngle} onChange={(e) => set({ gradientAngle: Number(e.target.value) })} className="h-8 w-full rounded-lg border border-border bg-surface-2 px-2 text-xs text-content" /><span className="text-[10px] text-subtle">°</span></div></div>
          </div>
        ) : (
          <ColorInput value={design.bgColor} onChange={(v) => set({ bgColor: v })} swatches={COLOR_SWATCHES} />
        )}
      </div>

      {/* Image */}
      <BackgroundImagePanel design={design} set={set} />

      {/* Shadow */}
      <label className="flex items-center gap-2"><input type="checkbox" checked={design.shadow} onChange={(e) => set({ shadow: e.target.checked })} className="h-4 w-4 accent-[var(--color-brand)]" /><span className="text-xs text-muted">Drop shadow</span></label>
    </div>
  );
}

function BackgroundImagePanel({ design, set }: { design: CardDesign; set: (p: Partial<CardDesign>) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted">Background Image</p>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => set({ bgImage: r.result as string }); r.readAsDataURL(f); } }} />
      {design.bgImage ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={design.bgImage} alt="bg" className="h-8 w-12 rounded object-cover" />
          <span className="flex-1 text-xs text-muted">Opacity {Math.round(design.bgImageOpacity * 100)}%</span>
          <button onClick={() => set({ bgImage: null })} className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-danger-soft hover:text-danger"><Trash2 className="h-3 w-3" /></button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-2 py-2 text-xs text-muted hover:border-brand hover:text-brand"><ImagePlus className="h-3.5 w-3.5" /> Upload</button>
      )}
      {design.bgImage && <CSlider label="Opacity" value={Math.round(design.bgImageOpacity * 100)} min={0} max={100} suffix="%" onChange={(v) => set({ bgImageOpacity: v / 100 })} />}
    </div>
  );
}

function SpacingPanel({ design, set }: { design: CardDesign; set: (p: Partial<CardDesign>) => void }) {
  const setPad = (key: keyof CardDesign["padding"], val: number) => {
    if (design.paddingLinked) set({ padding: { top: val, bottom: val, left: val, right: val } });
    else set({ padding: { ...design.padding, [key]: val } });
  };
  return (
    <div className="space-y-5">
      {/* Padding */}
      <div>
        <div className="mb-2 flex items-center justify-between"><p className="text-xs font-medium text-muted">Padding</p>
          <button onClick={() => set({ paddingLinked: !design.paddingLinked })} className="flex items-center gap-1 text-[10px] text-muted hover:text-brand">{design.paddingLinked ? <><Link2 className="h-3 w-3" /> Linked</> : <><Link2Off className="h-3 w-3" /> Unlinked</>}</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side}><label className="text-[9px] capitalize text-subtle">{side}</label><input type="number" min={0} max={40} value={design.padding[side]} onChange={(e) => setPad(side, Number(e.target.value))} className="h-7 w-full rounded border border-border bg-surface-2 px-1 text-center text-xs text-content" /></div>
          ))}
        </div>
      </div>
      {/* Margin */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Margin</p>
        <div className="grid grid-cols-4 gap-2">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side}><label className="text-[9px] capitalize text-subtle">{side}</label><input type="number" min={0} max={40} value={design.margin[side]} onChange={(e) => set({ margin: { ...design.margin, [side]: Number(e.target.value) } })} className="h-7 w-full rounded border border-border bg-surface-2 px-1 text-center text-xs text-content" /></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QrPanel({ design, set }: { design: CardDesign; set: (p: Partial<CardDesign>) => void }) {
  const qr = design.qr;
  const setQr = (p: Partial<CardDesign["qr"]>) => set({ qr: { ...qr, ...p } });
  return (
    <div className="space-y-4">
      <CSlider label="QR Size" value={Math.round(qr.size * 100)} min={20} max={80} suffix="%" onChange={(v) => setQr({ size: v / 100 })} />
      <div className="grid grid-cols-2 gap-4">
        <div><p className="mb-1 text-xs text-muted">QR Color</p><ColorInput value={qr.color} onChange={(v) => setQr({ color: v })} swatches={COLOR_SWATCHES} /></div>
        <div><p className="mb-1 text-xs text-muted">QR BG</p><ColorInput value={qr.bgColor} onChange={(v) => setQr({ bgColor: v })} allowTransparent /></div>
      </div>
      <div>
        <p className="mb-1.5 text-xs text-muted">Module Shape</p>
        <div className="grid grid-cols-3 gap-2">
          {(["square", "rounded", "dots"] as const).map((sh) => (
            <button key={sh} onClick={() => setQr({ moduleShape: sh as QrModuleShape })} className={cn("rounded-lg border py-2 text-[11px] font-medium capitalize", qr.moduleShape === sh ? "border-brand bg-brand-soft text-brand" : "border-border text-muted")}>{sh}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs text-muted">Error Correction</p>
        <div className="grid grid-cols-3 gap-2">
          {(["L", "M", "H"] as const).map((lv) => (
            <button key={lv} onClick={() => setQr({ errorLevel: lv as ErrorLevel })} className={cn("rounded-lg border py-2 text-xs font-bold", qr.errorLevel === lv ? "border-brand bg-brand-soft text-brand" : "border-border text-muted")}>{lv}</button>
          ))}
        </div>
      </div>
      <div><label className="text-[10px] text-subtle">QR Value</label><Input value={design.qrValue} onChange={(e) => set({ qrValue: e.target.value })} className="h-8 text-xs" /></div>
    </div>
  );
}

function TextPanel({ design, set }: { design: CardDesign; set: (p: Partial<CardDesign>) => void }) {
  const t = design.text;
  const setT = (p: Partial<CardDesign["text"]>) => set({ text: { ...t, ...p } });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><p className="text-xs font-medium text-content">Text Overlay</p><Toggle on={t.enabled} onClick={() => setT({ enabled: !t.enabled })} /></div>
      {t.enabled && (
        <div className="space-y-3">
          <Input value={t.content} onChange={(e) => setT({ content: e.target.value })} placeholder="Scan to Win" className="h-8 text-xs" />
          <div>
            <p className="mb-1.5 text-xs text-muted">Position</p>
            <div className="grid grid-cols-5 gap-1">
              {POSITIONS.map((p) => <button key={p.value} onClick={() => setT({ position: p.value as ElementPos })} className={cn("rounded border py-1.5 text-[10px] font-medium transition-all", t.position === p.value ? "border-brand bg-brand-soft text-brand" : "border-border text-muted")}>{p.label}</button>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-subtle">Font</label><Select value={t.fontFamily} onChange={(e) => setT({ fontFamily: e.target.value })} className="h-8 text-xs">{FONT_FAMILIES.map((f) => <option key={f} value={f}>{f.split(",")[0].replace(/['"]/g, "")}</option>)}</Select></div>
            <div><label className="text-[10px] text-subtle">Size</label><input type="number" min={6} max={36} value={t.fontSize} onChange={(e) => setT({ fontSize: Number(e.target.value) })} className="h-8 w-full rounded border border-border bg-surface-2 px-2 text-xs text-content" /></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1"><label className="text-[10px] text-subtle">Color</label><ColorInput value={t.color} onChange={(v) => setT({ color: v })} swatches={COLOR_SWATCHES} /></div>
            <button onClick={() => setT({ bold: !t.bold })} className={cn("mt-4 rounded border px-3 py-2 text-xs font-bold transition-all", t.bold ? "border-brand bg-brand-soft text-brand" : "border-border text-muted")}>B</button>
          </div>
          <div>
            <p className="mb-1 text-[10px] text-subtle">Alignment</p>
            <div className="grid grid-cols-3 gap-1">
              {(["left", "center", "right"] as const).map((a) => <button key={a} onClick={() => setT({ align: a })} className={cn("rounded border py-1.5 text-[10px] capitalize transition-all", t.align === a ? "border-brand bg-brand-soft text-brand" : "border-border text-muted")}>{a}</button>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LogoPanel({ design, set }: { design: CardDesign; set: (p: Partial<CardDesign>) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const l = design.logo;
  const setL = (p: Partial<CardDesign["logo"]>) => set({ logo: { ...l, ...p } });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><p className="text-xs font-medium text-content">Logo Placement</p><Toggle on={l.enabled} onClick={() => setL({ enabled: !l.enabled })} /></div>
      {l.enabled && (
        <div className="space-y-3">
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setL({ src: r.result as string }); r.readAsDataURL(f); } }} />
          {l.src ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.src} alt="logo" className="h-10 w-10 rounded object-cover" />
              <button onClick={() => ref.current?.click()} className="text-[11px] text-brand hover:underline">Change</button>
              <button onClick={() => setL({ src: null })} className="ml-auto text-muted hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => ref.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-2 py-3 text-xs text-muted hover:border-brand hover:text-brand"><ImagePlus className="h-4 w-4" /> Upload Logo</button>
          )}
          <div>
            <p className="mb-1.5 text-xs text-muted">Position</p>
            <div className="grid grid-cols-5 gap-1">
              {POSITIONS.map((p) => <button key={p.value} onClick={() => setL({ position: p.value as ElementPos })} className={cn("rounded border py-1.5 text-[10px] font-medium transition-all", l.position === p.value ? "border-brand bg-brand-soft text-brand" : "border-border text-muted")}>{p.label}</button>)}
            </div>
          </div>
          <CSlider label="Size" value={l.size} min={16} max={96} onChange={(v) => setL({ size: v })} />
          <CSlider label="Rotation" value={l.rotation} min={-180} max={180} suffix="°" onChange={(v) => setL({ rotation: v })} />
        </div>
      )}
    </div>
  );
}

/* ============================== Helpers ============================== */

function ColorInput({ value, onChange, swatches, allowTransparent }: { value: string; onChange: (v: string) => void; swatches?: string[]; allowTransparent?: boolean }) {
  const trans = value === "transparent";
  return (
    <div>
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 p-1">
        <input type="color" value={trans ? "#ffffff" : value} onChange={(e) => onChange(e.target.value)} disabled={trans} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="h-6 w-full bg-transparent font-mono text-[10px] outline-none" />
        {allowTransparent && <button onClick={() => onChange(trans ? "#ffffff" : "transparent")} className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", trans ? "bg-brand text-brand-foreground" : "text-muted")}>T</button>}
      </div>
      {swatches && <div className="mt-1.5 flex flex-wrap gap-1">{swatches.filter((s) => s !== "transparent").map((c) => <button key={c} onClick={() => onChange(c)} className={cn("h-4 w-4 rounded-sm border", value === c && "ring-1 ring-brand")} style={{ background: c, borderColor: "rgba(0,0,0,0.1)" }} />)}</div>}
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label?: string }) {
  return <button onClick={onClick} className="flex items-center gap-1.5"><span className={cn("relative h-4 w-8 rounded-full transition-colors", on ? "bg-brand" : "bg-border-strong")}><span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform", on ? "translate-x-4" : "translate-x-0.5")} /></span>{label && <span className="text-[10px] font-medium text-muted">{label}</span>}</button>;
}

function IconBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-content">{children}</button>;
}

function CSlider({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between"><p className="text-[10px] font-medium text-muted uppercase">{label}</p><span className="text-[10px] font-bold">{value}{suffix ?? "px"}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--color-brand)]" />
    </div>
  );
}
