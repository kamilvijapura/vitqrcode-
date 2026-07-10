import Link from "next/link";
import { ScanLine, Gift, History, BookOpen, Sparkles, Star, TrendingUp } from "lucide-react";
import { getSessionAppUser, getCampaigns, getProducts, getRewards, getUserScans } from "@/lib/data";
import { MobileHeader } from "@/components/mobile/MobileShell";
import { PointsHero, QuickAction, SectionHeader, ProductTile, RewardTile, CampaignChip } from "@/components/mobile/widgets";
import { Card, Avatar, Badge } from "@/components/ui";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MobileHome() {
  const user = await getSessionAppUser();
  if (!user) return null;
  const [campaigns, products, rewards, scans] = await Promise.all([
    getCampaigns(),
    getProducts(),
    getRewards(),
    getUserScans(user.id, 5),
  ]);

  const redeemed = user.totalPoints - user.walletBalance;

  return (
    <div>
      <MobileHeader appName={undefined} />
      <div className="px-5 pb-8 pt-1">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Welcome back 👋</p>
            <h1 className="text-xl font-bold tracking-tight text-content">{user.name.split(" ")[0]}</h1>
          </div>
          <Link href="/app/profile">
            <Avatar name={user.name} size={44} />
          </Link>
        </div>

        <PointsHero points={user.walletBalance} earned={user.totalPoints} redeemed={redeemed} tier={user.membershipTier} name={user.name} />

        {/* Scan CTA */}
        <Link href="/app/scan" className="mt-4 flex items-center justify-between rounded-2xl border border-brand/30 bg-brand-soft p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-content">Scan to Earn Points</p>
              <p className="text-xs text-muted">Authenticate & get rewarded</p>
            </div>
          </div>
          <span className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground">Scan</span>
        </Link>

        {/* Quick actions */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          <QuickAction href="/app/scan" icon={<ScanLine className="h-5 w-5" />} label="Scan" />
          <QuickAction href="/app/rewards" icon={<Gift className="h-5 w-5" />} label="Rewards" tone="var(--color-accent)" />
          <QuickAction href="/app/history" icon={<History className="h-5 w-5" />} label="History" tone="var(--color-secondary)" />
          <QuickAction href="/app/catalogue" icon={<BookOpen className="h-5 w-5" />} label="Catalogue" tone="#16a34a" />
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success"><TrendingUp className="h-5 w-5" /></div>
            <div><p className="text-xl font-bold text-content">{user.lifetimeScans}</p><p className="text-xs text-muted">Lifetime Scans</p></div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-soft text-warning"><Star className="h-5 w-5" /></div>
            <div><p className="text-xl font-bold text-content">{user.lifetimeScans > 0 ? Math.max(1, Math.floor(user.lifetimeScans / 7)) : 0}</p><p className="text-xs text-muted">Avg / Week</p></div>
          </Card>
        </div>

        {/* Campaigns */}
        <SectionHeader title="Active Campaigns" href="/app/campaigns" />
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
          {campaigns.slice(0, 4).map((c) => (
            <Link key={c.id} href="/app/campaigns"><CampaignChip imageUrl={c.banner} name={c.name} mult={String(c.pointsMultiplier)} /></Link>
          ))}
        </div>

        {/* Featured products */}
        <SectionHeader title="Featured Products" href="/app/products" />
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
          {products.slice(0, 6).map((p) => (
            <ProductTile key={p.id} imageUrl={p.imageUrl} name={p.name} points={p.rewardPoints} href={`/app/products/${p.id}`} />
          ))}
        </div>

        {/* Rewards */}
        <SectionHeader title="Redeem Rewards" href="/app/rewards" actionLabel="Browse" />
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
          {rewards.slice(0, 5).map((r) => (
            <RewardTile key={r.id} imageUrl={r.imageUrl} name={r.name} cost={r.requiredPoints} stock={r.stock} affordable={user.walletBalance >= r.requiredPoints} href="/app/rewards" />
          ))}
        </div>

        {/* Recent scans */}
        <SectionHeader title="Recent Scans" href="/app/history" />
        <div className="space-y-2">
          {scans.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted">No scans yet. Tap scan to start earning! 🔍</Card>
          ) : (
            scans.map((s) => (
              <Card key={s.id} className="flex items-center gap-3 p-3">
                <Avatar src={s.productImageUrl} name={s.productName ?? "Product"} size={40} className="rounded-xl bg-surface-2" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content">{s.productName ?? "Product"}</p>
                  <p className="text-xs text-muted">{relativeTime(s.createdAt)}</p>
                </div>
                {s.status === "success" ? (
                  <Badge tone="success">+{s.points}</Badge>
                ) : (
                  <Badge tone="neutral">{s.status}</Badge>
                )}
              </Card>
            ))
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 rounded-2xl bg-brand-soft p-3 text-xs text-brand">
          <Sparkles className="h-3.5 w-3.5" /> Keep scanning to reach Platinum tier!
        </div>
      </div>
    </div>
  );
}
