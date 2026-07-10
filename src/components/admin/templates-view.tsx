"use client";

import { useState } from "react";
import { Plus, Palette, Layers, CheckCircle2, Trash2 } from "lucide-react";
import { Button, Card, Badge, EmptyState, SectionTitle } from "@/components/ui";
import { CardPreview } from "@/components/card-designer/card-preview";
import { CardDesigner } from "@/components/card-designer/card-designer";
import { DEFAULT_DESIGN } from "@/lib/card-designer-types";
import { deleteQrTemplate, setDefaultTemplate } from "@/app/actions/qr";
import { useToast } from "@/components/toast";
import { useRouter } from "next/navigation";

export function TemplatesView({ templates }: { templates: any[] }) {
  const [editingTemplateId, setEditingTemplateId] = useState<number | "new" | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this template forever?")) return;
    try {
      await deleteQrTemplate(id);
      toast({ tone: "success", title: "Template deleted" });
      router.refresh();
    } catch(e) {
      toast({ tone: "error", title: "Failed to delete" });
    }
  };
  
  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultTemplate(id);
      toast({ tone: "success", title: "Default template set" });
      router.refresh();
    } catch(e) {
      toast({ tone: "error", title: "Failed to set default" });
    }
  };

  if (editingTemplateId) {
    const editTpl = editingTemplateId !== "new" ? templates.find(t => t.id === editingTemplateId) : undefined;
    const designTemplates = editTpl ? [editTpl] : [];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-content">{editingTemplateId === "new" ? "Create Template" : "Edit Template"}</h2>
            <p className="text-sm text-subtle">Design the visual layout, background, and branding for your QR codes.</p>
          </div>
          <Button variant="outline" onClick={() => setEditingTemplateId(null)}>Back to Templates</Button>
        </div>
        <CardDesigner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle title="Saved Templates" />
        <Button onClick={() => setEditingTemplateId("new")}>
          <Plus className="mr-2 h-4 w-4" /> Create New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-8 w-8" />}
          title="No Templates Yet"
          description="Create a QR design template first, then generate codes from it."
          action={<Button onClick={() => setEditingTemplateId("new")}>Create Template</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map(t => (
            <div key={t.id} className="group flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 transition-all hover:border-brand/50 hover:shadow-md relative">
              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => handleDelete(t.id)} className="p-1.5 bg-surface rounded-md shadow border border-border text-muted hover:text-error hover:bg-error/10"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              {t.isDefault && (
                  <div className="absolute top-2 left-2 z-10">
                    <CheckCircle2 className="w-4 h-4 text-brand bg-white rounded-full shadow-sm" />
                  </div>
              )}
              
              <button onClick={() => setEditingTemplateId(t.id)} className="w-full aspect-square bg-surface-2 border border-border/50 rounded-lg flex items-center justify-center overflow-hidden hover:border-brand/30 transition-colors">
                  <div className="scale-75 origin-center pointer-events-none">
                    <CardPreview design={{...DEFAULT_DESIGN, ...(t.config as any)}} previewWidth={120} />
                  </div>
              </button>
              
              <div className="w-full mt-2">
                <span className="text-sm font-bold text-content truncate block w-full">{t.name}</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] uppercase font-bold text-muted tracking-wide">{t.category || "Custom"}</span>
                  {!t.isDefault && (
                    <button onClick={() => handleSetDefault(t.id)} className="text-[10px] font-medium text-brand hover:underline">Set Default</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
