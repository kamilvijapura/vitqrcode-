import { FileBarChart, ScanLine, Coins, Percent, Megaphone, FileDown } from "lucide-react";
import { getDashboardStats, getMonthlyScans, getProductCategorySplit, getTopProducts } from "@/lib/data";
import { PageHeader } from "@/components/admin/AdminShell";
import { Card, StatCard, SectionTitle, Badge } from "@/components/ui";
import { AreaTrend, DonutChart } from "@/components/charts";
import { ExportBar } from "@/components/admin/export-bar";
import { formatNumber, formatCompact } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [stats, monthly, catSplit, topProducts] = await Promise.all([
    getDashboardStats(),
    getMonthlyScans(),
    getProductCategorySplit(),
    getTopProducts(12),
  ]);

  const redemptionRate = stats.pending + stats.approved > 0
    ? Math.round((stats.approved / (stats.pending + stats.approved + stats.rejected)) * 100)
    : 0;

  const csvData = topProducts.map((p, i) => ({
    Rank: i + 1,
    Product: p.name,
    Category: p.category,
    Scans: Number(p.scans),
    Points: Number(p.points),
  }));

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Business performance insights & exports" icon={<FileBarChart className="h-5 w-5" />} actions={<ExportBar data={csvData} filename="product-performance" />} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Scans" value={formatNumber(stats.totalScans)} icon={<ScanLine className="h-5 w-5" />} accent="var(--color-brand)" />
        <StatCard label="Points Issued" value={formatCompact(stats.pointsIssued)} icon={<Coins className="h-5 w-5" />} accent="var(--color-accent)" />
        <StatCard label="Redemption Rate" value={`${redemptionRate}%`} icon={<Percent className="h-5 w-5" />} accent="#16a34a" />
        <StatCard label="Active Campaigns" value={stats.activeCampaigns} icon={<Megaphone className="h-5 w-5" />} accent="var(--color-secondary)" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle title="Scan Trend" subtitle="Last 7 months" />
          <div className="mt-4">
            <AreaTrend data={monthly} keys={[{ key: "success", name: "Successful" }, { key: "duplicate", name: "Duplicate" }]} />
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="Product Categories" subtitle="Distribution" />
          <div className="mt-2">
            <DonutChart data={catSplit.map((c) => ({ label: c.category, value: Number(c.n) }))} />
          </div>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden p-5">
        <SectionTitle title="Product Performance Report" subtitle="Scans & points by product" action={<Badge tone="brand"><FileDown className="mr-1 h-3 w-3" /> Exportable</Badge>} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-subtle">
                <th className="py-2 font-medium">#</th>
                <th className="py-2 font-medium">Product</th>
                <th className="py-2 font-medium">Category</th>
                <th className="py-2 text-right font-medium">Scans</th>
                <th className="py-2 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {csvData.map((r) => (
                <tr key={r.Product} className="border-b border-border/50">
                  <td className="py-2.5 text-subtle">{r.Rank}</td>
                  <td className="py-2.5 font-medium text-content">{r.Product}</td>
                  <td className="py-2.5 text-muted">{r.Category}</td>
                  <td className="py-2.5 text-right text-content">{formatNumber(r.Scans)}</td>
                  <td className="py-2.5 text-right font-semibold text-content">{formatNumber(r.Points)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
