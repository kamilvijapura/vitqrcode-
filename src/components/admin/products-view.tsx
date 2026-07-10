"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, Search, Trash2, Power, Package, Star, ImagePlus, Box, Tag, Layers, CheckCircle2 } from "lucide-react";
import type { Product } from "@/db/schema";
import { createProduct, deleteProduct, toggleProductStatus } from "@/app/actions/products";
import { PageHeader } from "@/components/admin/AdminShell";
import { Card, Button, Badge, Avatar, Input, Field, Select, Textarea, EmptyState } from "@/components/ui";
import { Modal, ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";

export function ProductsView({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<Product | null>(null);
  const { toast } = useToast();

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchC = cat === "all" || p.category === cat;
    return matchQ && matchC;
  });

  return (
    <div>
      <PageHeader
        title="Product Master"
        description={`Manage ${products.length} products in your manufacturing catalogue.`}
        icon={<Box className="h-5 w-5" />}
        actions={
          <Button onClick={() => setOpen(true)} className="bg-brand hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        }
      />

      {/* Toolbar */}
      <Card className="mb-4 p-2 flex flex-col gap-3 sm:flex-row sm:items-center bg-surface-1 shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input
            placeholder="Search by name, SKU, or batch…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-transparent border-0 focus:ring-0 shadow-none"
          />
        </div>
        <div className="h-6 w-px bg-border hidden sm:block"></div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                cat === c ? "bg-brand/10 text-brand ring-1 ring-brand/30" : "text-muted hover:bg-surface-2 hover:text-content",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border border-border/50 shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Box className="h-10 w-10 text-muted" />}
            title="No products found"
            description="Try adjusting your search or add a new product to your master data."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Product</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-surface-2/40">
                <tr className="border-b border-border/60 text-left text-xs font-semibold tracking-wider text-subtle uppercase">
                  <th className="px-5 py-4">Product Details</th>
                  <th className="px-5 py-4">Identifiers</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Financials</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface-2/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar src={p.imageUrl} name={p.name} size={48} className="rounded-md border border-border shadow-sm" fallbackIcon={<Package className="h-5 w-5 text-muted" />} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-content text-base">{p.name}</p>
                          <p className="truncate text-xs text-muted max-w-[220px] mt-0.5">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-subtle" />
                          <span className="font-mono text-xs font-medium text-content bg-surface-2 px-1.5 py-0.5 rounded">{p.sku}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-3 w-3 text-subtle" />
                          <span className="font-mono text-[10px] text-muted bg-surface-2 px-1.5 py-0.5 rounded uppercase">{p.batch}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone="neutral" className="border-border/50 bg-surface-1">{p.category}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold text-content">{formatCurrency(p.price)}</p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          <Star className="h-3 w-3 fill-current" />
                          {formatNumber(p.rewardPoints)} pts
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={p.status === "active" ? "success" : "neutral"} className="gap-1.5 px-2 py-1">
                        {p.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                        {p.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={async () => { await toggleProductStatus(p.id, p.status !== "active"); toast({ tone: "info", title: `Product ${p.status === "active" ? "deactivated" : "activated"}`, description: p.name }); }}
                          title={p.status === "active" ? "Deactivate" : "Activate"}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded border transition-colors",
                            p.status === "active" ? "border-border text-muted hover:bg-warning-soft hover:text-warning hover:border-warning/30" : "border-border text-muted hover:bg-success-soft hover:text-success hover:border-success/30"
                          )}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDel(p)}
                          title="Delete"
                          className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted transition-colors hover:bg-danger-soft hover:text-danger hover:border-danger/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ProductFormModal open={open} onClose={() => setOpen(false)} categories={categories.filter((c) => c !== "all")} />
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={async () => { 
          if (del) { 
            const res = await deleteProduct(del.id); 
            if (res && res.ok) {
              toast({ tone: "success", title: "Product deleted", description: del.name }); 
            } else {
              toast({ tone: "error", title: "Cannot delete product", description: res?.error || "Unknown error" });
            }
          } 
        }}
        title="Delete product?"
        message={`This will permanently remove "${del?.name}" (${del?.sku}) from your master data.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function ProductFormModal({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: string[];
}) {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    batch: "",
    category: categories[0] ?? "Interior",
    description: "",
    rewardPoints: 50,
    price: 0,
    image: null as string | null,
  });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onPhotoUpload = (file: File) => {
    if (file.size > 1_000_000) {
      toast({ tone: "warning", title: "Image too large", description: "Please use an image under 1MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.name || !form.sku) {
      toast({ tone: "warning", title: "Missing details", description: "Please enter a name and SKU." });
      return;
    }
    setSaving(true);
    const res = await createProduct(form);
    setSaving(false);
    if (!res.ok) {
      toast({ tone: "error", title: "Failed to create product", description: res.error ?? "Please try again." });
      return;
    }
    toast({ tone: "success", title: "Product created!", description: `${form.name} added to your catalogue.` });
    setForm({ name: "", sku: "", batch: "", category: categories[0] ?? "Interior", description: "", rewardPoints: 50, price: 0, image: null });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Product Master" description="Create a new manufactured product entry with ERP identifiers." size="lg">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Product Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. AuraMax Interior Emulsion" /></Field>
        <Field label="SKU" required><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="CS-XXX-1L" className="font-mono" /></Field>
        
        <Field label="Category">
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Manufacturing Batch"><Input value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="B-2025XX" className="font-mono" /></Field>
        
        <Field label="Wholesale Price (₹)"><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
        <Field label="Loyalty Points"><Input type="number" value={form.rewardPoints} onChange={(e) => setForm({ ...form, rewardPoints: Number(e.target.value) })} /></Field>
        
        <div className="sm:col-span-2">
          <Field label="Description / Specs"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief product description or key specifications…" /></Field>
        </div>

        {/* Product Photo Upload */}
        <div className="sm:col-span-2">
          <span className="block text-sm font-semibold text-content mb-2">Product Image</span>
          <div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhotoUpload(f); }} />
            {form.image ? (
              <div className="flex items-center gap-5 p-4 rounded-xl border border-border bg-surface-2/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image} alt="preview" className="h-24 w-24 rounded-lg border border-border object-cover shadow-sm bg-white" />
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>Change Image</Button>
                  <Button size="sm" variant="ghost" className="text-danger hover:text-danger hover:bg-danger-soft" onClick={() => setForm({ ...form, image: null })}><Trash2 className="h-3.5 w-3.5" /> Remove</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-surface-2/30 py-10 text-muted transition-all hover:border-brand/50 hover:bg-brand-soft/20 hover:text-brand">
                <ImagePlus className="h-10 w-10 opacity-70" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-semibold text-content">Click to upload product image</span>
                  <span className="text-xs text-subtle">PNG, JPG or WEBP (max 1MB)</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3 border-t border-border pt-4">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving} className="bg-brand">{saving ? "Saving…" : "Create Product"}</Button>
      </div>
    </Modal>
  );
}
