import {
  Package,
  QrCode,
  Users,
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Zap,
  Activity,
  Trophy,
} from "lucide-react";
import { getCompany, getDashboardStats, getMonthlyScans, getTopProducts, getProductCategorySplit, getTopUsers, getRecentActivity, getQrStatusCounts, getCampaigns } from "@/lib/data";
import { PageHeader, ResetButton } from "@/components/admin/AdminShell";
import { Card, StatCard, SectionTitle, Badge, Avatar, ProgressBar } from "@/components/ui";
import { AreaTrend, DonutChart, BarsChart } from "@/components/charts";
import { formatCompact, formatNumber, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, monthly, topProducts, catSplit, topUsers, activity, qrCounts, campaigns, company] =
    await Promise.all([
      getDashboardStats(),
      getMonthlyScans(),
      getTopProducts(5),
      getProductCategorySplit(),
      getTopUsers(6),
      getRecentActivity(7),
      getQrStatusCounts(),
      getCampaigns(),
      getCompany(),
    ]);

  const totalQr = Object.values(qrCounts).reduce((a, b) => a + b, 0) || 1;
  const scanRate = Math.round((stats.pointsIssued > 0 ? (qrCounts.used / totalQr) * 100 : 0));

  return (
    <div>
      <PageHeader
        title={`Welcome back, Admin 👋`}
        description="Here's what's happening across your reward program today."
        actions={<ResetButton />}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Products Active" value={stats.products} icon={<Package className="h-5 w-5" />} delta="+2 this week" accent="var(--color-brand)" />
        <StatCard label="QR Codes Generated" value={formatNumber(stats.qrGenerated)} icon={<QrCode className="h-5 w-5" />} delta={`${scanRate}% used`} accent="var(--color-secondary)" />
        <StatCard label="Active Users" value={formatNumber(stats.activeUsers)} icon={<Users className="h-5 w-5" />} delta="+18% MoM" accent="#16a34a" />
        <StatCard label="Points Issued" value={formatCompact(stats.pointsIssued)} icon={<Coins className="h-5 w-5" />} delta="↑ trending" accent="var(--color-accent)" />
      </div>

      {/* Charts row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle title="Monthly Scan Analytics" subtitle="Successful, duplicate & invalid scans over time" action={<Badge tone="brand" dot>Live</Badge>} />
          <div className="mt-4">
            <AreaTrend
              data={monthly}
              keys={[
                { key: "success", name: "Successful" },
                { key: "duplicate", name: "Duplicate" },
                { key: "invalid", name: "Invalid" },
              ]}
            />
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="QR Status" subtitle="Distribution of all codes" />
          <div className="mt-2">
            <DonutChart
              data={[
                { label: "Used", value: qrCounts.used },
                { label: "Unused", value: qrCounts.unused },
                { label: "Expired", value: qrCounts.expired },
              ]}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { l: "Used", v: qrCounts.used, c: "var(--color-brand)" },
              { l: "Unused", v: qrCounts.unused, c: "var(--color-secondary)" },
              { l: "Expired", v: qrCounts.expired, c: "var(--color-accent)" },
            ].map((x) => (
              <div key={x.l}>
                <div className="text-lg font-bold text-content">{formatNumber(x.v)}</div>
                <div className="flex items-center justify-center gap-1 text-xs text-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: x.c }} />
                  {x.l}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Redemption pipeline */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-soft text-warning"><Clock className="h-5 w-5" /></div>
          <div><div className="text-xl font-bold text-content">{stats.pending}</div><div className="text-xs text-muted">Pending</div></div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success"><CheckCircle2 className="h-5 w-5" /></div>
          <div><div className="text-xl font-bold text-content">{stats.approved}</div><div className="text-xs text-muted">Approved</div></div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-soft text-danger"><XCircle className="h-5 w-5" /></div>
          <div><div className="text-xl font-bold text-content">{stats.rejected}</div><div className="text-xs text-muted">Rejected</div></div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><TrendingUp className="h-5 w-5" /></div>
          <div><div className="text-xl font-bold text-content">{stats.totalScans}</div><div className="text-xs text-muted">Total Scans</div></div>
        </Card>
      </div>

      {/* Top products + activity */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle title="Top Products" subtitle="By number of scans" />
          <div className="mt-4">
            <BarsChart data={topProducts.map((p) => ({ label: String(p.name).split(" ")[0], value: Number(p.scans) }))} name="Scans" />
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="Recent Activity" subtitle="Latest scans" />
          <div className="mt-4 flex flex-col gap-3">
            {activity.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <Avatar name={a.userName ?? "?"} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content">{a.userName}</p>
                  <p className="truncate text-xs text-muted">{a.productName}</p>
                </div>
                {a.status === "success" ? (
                  <Badge tone="success">+{a.points}</Badge>
                ) : (
                  <Badge tone={a.status === "duplicate" ? "warning" : "danger"}>{a.status}</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top users + campaigns */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <SectionTitle title="Top Users" subtitle="Most valuable customers" action={<Trophy className="h-4 w-4 text-accent" />} />
          <div className="mt-4 flex flex-col gap-3">
            {topUsers.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3">
                <span className="w-4 text-sm font-bold text-subtle">{i + 1}</span>
                <Avatar name={u.name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content">{u.name}</p>
                  <p className="text-xs text-muted capitalize">{u.membershipTier} · {u.lifetimeScans} scans</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-content">{formatCompact(u.totalPoints)}</div>
                  <div className="text-[10px] text-subtle">points</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionTitle title="Campaign Performance" subtitle="Active multiplier campaigns" action={<Zap className="h-4 w-4 text-accent" />} />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {campaigns.slice(0, 4).map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-surface-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl">{c.banner}</span>
                  <Badge tone="brand">{Number(c.pointsMultiplier)}x</Badge>
                </div>
                <p className="mt-2 text-sm font-semibold text-content">{c.name}</p>
                <p className="mt-0.5 text-xs text-muted">{c.type}</p>
                <div className="mt-3">
                  <ProgressBar value={Math.min(100, Number(c.pointsMultiplier) * 33)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-subtle">
        {company?.name} · {company?.industry} · Powered by QR Rewards Enterprise Platform
      </p>
    </div>
  );
}
