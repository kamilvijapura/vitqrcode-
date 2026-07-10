import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, IndianRupee, ShieldCheck, ScanLine, ChevronLeft, Tag, Box } from "lucide-react";
import { getProductById, getProductsByCategory, getSessionAppUser } from "@/lib/data";
import { MobileHeader } from "@/components/mobile/MobileShell";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) notFound();
  const [related, user] = await Promise.all([
    getProductsByCategory(product.category, product.id, 4),
    getSessionAppUser(),
  ]);

  return (
    <div>
      <MobileHeader showBack rightSlot={<Link href="/app/scan" className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground"><ScanLine className="h-5 w-5" /></Link>} />

      {/* Hero */}
      <div className="relative flex h-64 items-center justify-center bg-surface-2">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, var(--border) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <Avatar src={product.imageUrl} name={product.name} size={140} fallbackIcon={<Box className="h-16 w-16 text-muted" />} className="rounded-2xl border-4 border-surface shadow-xl z-10 bg-surface" />
        <div className="absolute left-4 top-4 z-10">
          <Badge tone={product.status === "active" ? "success" : "neutral"} dot className="shadow-sm backdrop-blur bg-surface/80">{product.status}</Badge>
        </div>
      </div>

      <div className="px-5 pb-8 pt-5">
        <div className="flex items-center gap-2">
          <Badge tone="brand">{product.category}</Badge>
          <span className="flex items-center gap-1 text-xs text-subtle"><Tag className="h-3 w-3" /> {product.sku}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-content">{product.name}</h1>
        <p className="mt-1 text-sm text-muted">{product.description}</p>

        {/* Price + reward */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted">Price</p>
            <p className="mt-1 flex items-center text-2xl font-bold text-content"><IndianRupee className="h-4 w-4" />{Number(product.price).toLocaleString("en-IN")}</p>
          </Card>
          <Card className="bg-brand-soft p-4" >
            <p className="text-xs text-muted">Reward Points</p>
            <p className="mt-1 flex items-center gap-1 text-2xl font-bold text-brand"><Star className="h-4 w-4 fill-accent text-accent" />{formatNumber(product.rewardPoints)}</p>
          </Card>
        </div>

        {/* Authentication badge */}
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-success/30 bg-success-soft p-4">
          <ShieldCheck className="h-8 w-8 shrink-0 text-success" />
          <div>
            <p className="text-sm font-semibold text-content">Anti-Counterfeit Protected</p>
            <p className="text-xs text-muted">Scan the QR on this product to verify authenticity & earn points.</p>
          </div>
        </div>

        {/* Specs */}
        {product.specs && (
          <div className="mt-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-content"><Box className="h-4 w-4 text-brand" /> Specifications</h2>
            <Card className="divide-y divide-border">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-muted">{k}</span>
                  <span className="font-medium text-content">{v}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* CTA */}
        <Link href="/app/scan" className="mt-5 block">
          <Button size="lg" className="w-full"><ScanLine className="h-5 w-5" /> Scan to Earn {formatNumber(product.rewardPoints)} Points</Button>
        </Link>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-base font-bold text-content">More in {product.category}</h2>
            <div className="grid grid-cols-2 gap-3">
              {related.map((r) => (
                <Link key={r.id} href={`/app/products/${r.id}`}>
                  <Card className="cursor-pointer p-3 transition-all hover:shadow-pop active:scale-[0.98]">
                    <div className="flex h-20 items-center justify-center rounded-xl bg-surface-2 text-4xl">{r.imageUrl}</div>
                    <p className="mt-2 truncate text-sm font-semibold text-content">{r.name}</p>
                    <p className="text-xs font-bold text-accent">⭐ {formatNumber(r.rewardPoints)} pts</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
