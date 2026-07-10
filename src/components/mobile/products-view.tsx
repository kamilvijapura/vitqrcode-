"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Star, Package, Tag, Filter } from "lucide-react";
import type { Product } from "@/db/schema";
import { MobilePage } from "@/components/mobile/MobileShell";
import { Card, Input, Avatar, Badge } from "@/components/ui";
import { formatNumber, cn } from "@/lib/utils";

export function ProductsAppView({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchC = cat === "all" || p.category === cat;
    const matchStatus = p.status === "active";
    return matchQ && matchC && matchStatus;
  });

  return (
    <MobilePage title="Product Catalogue">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
        <Input 
          placeholder="Search products, SKUs…" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          className="pl-9 bg-surface border-border shadow-sm" 
        />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all",
              cat === c 
                ? "bg-brand text-brand-foreground shadow-sm" 
                : "bg-surface text-muted border border-border"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="py-16 flex flex-col items-center text-center">
          <Filter className="h-8 w-8 text-muted mb-2" />
          <p className="text-sm font-semibold text-content">No products found</p>
          <p className="text-xs text-subtle mt-1">Try adjusting your filters</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-6">
          {filtered.map((p) => (
            <Link key={p.id} href={`/app/products/${p.id}`}>
              <Card className="overflow-hidden flex flex-col h-full active:scale-[0.98] transition-transform shadow-sm">
                <div className="flex h-32 items-center justify-center bg-surface-2 p-2">
                  <Avatar 
                    src={p.imageUrl} 
                    name={p.name} 
                    size={80} 
                    fallbackIcon={<Package className="h-8 w-8 text-muted" />} 
                    className="rounded-xl shadow-sm" 
                  />
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-[10px] text-muted font-mono uppercase truncate mb-1">{p.sku}</p>
                  <p className="text-sm font-bold text-content leading-tight line-clamp-2 flex-1">{p.name}</p>
                  
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                    <Badge tone="neutral" className="text-[9px] px-1.5 py-0 capitalize">{p.category}</Badge>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
                      <Star className="h-3 w-3 fill-current" />
                      {formatNumber(p.rewardPoints)}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </MobilePage>
  );
}
