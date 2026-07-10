"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CardDesigner } from "@/components/card-designer/card-designer";
import { Card, Button, Badge, EmptyState, Input } from "@/components/ui";
import { Plus, CheckCircle2, Trash2, Layers, ArrowLeft } from "lucide-react";
import { CardPreview } from "@/components/card-designer/card-preview";
import { deleteQrTemplate, setDefaultTemplate } from "@/app/actions/qr";
import { useToast } from "@/components/toast";
import { DEFAULT_DESIGN, type CardDesign } from "@/lib/card-designer-types";

export function QrDesignHub({ templates, initialEditId }: { templates: any[]; initialEditId?: number | null }) {
  const [view, setView] = useState<"grid" | "designer">(initialEditId ? "designer" : "grid");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const handleSetDefault = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await setDefaultTemplate(id);
      toast({ tone: "success", title: "Default template updated" });
      router.refresh();
    } catch (err: any) {
      toast({ tone: "error", title: "Failed to set default", description: err.message });
    }
  };

  const handleDeleteTemplate = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteQrTemplate(id);
      toast({ tone: "success", title: "Template deleted" });
      router.refresh();
    } catch (err: any) {
      toast({ tone: "error", title: "Failed to delete", description: err.message });
    }
  };

  if (view === "designer") {
    return (
      <div className="space-y-4">
        <div className="flex justify-start">
          <Button variant="outline" onClick={() => setView("grid")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Templates
          </Button>
        </div>
        <CardDesigner />
      </div>
    );
  }

  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || (t.category && t.category.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Input 
          placeholder="Search templates..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="max-w-xs"
        />
        <Button onClick={() => setView("designer")}><Plus className="h-4 w-4 mr-2" /> New Template</Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Layers className="h-8 w-8" />}
            title="No Templates Yet"
            description="Create a QR design template first to reuse across batches."
            action={<Button onClick={() => setView("designer")}>Create Template</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((t) => {
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
                className="group text-left rounded-xl border-2 bg-surface p-3 transition-all hover:border-brand/60 hover:shadow-md border-border relative"
              >
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {!t.isDefault && (
                    <button className="p-1.5 bg-surface rounded shadow-sm border border-border text-muted hover:text-brand" title="Set as Default" onClick={(e) => handleSetDefault(t.id, e)}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button className="p-1.5 bg-surface rounded shadow-sm border border-border text-muted hover:text-danger" title="Delete" onClick={(e) => handleDeleteTemplate(t.id, e)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex h-28 items-center justify-center rounded-lg bg-surface-2 overflow-hidden">
                  <div className="transition-transform group-hover:scale-105 pointer-events-none">
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
