import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon } from "lucide-react";
import { getSessionAppUser, getUserTransactions } from "@/lib/data";
import { MobilePage } from "@/components/mobile/MobileShell";
import { Card, Badge, EmptyState } from "@/components/ui";
import { formatNumber, relativeTime } from "@/lib/utils";
import { ScanAlert } from "@/components/mobile/ScanAlert";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const user = await getSessionAppUser();
  if (!user) return null;
  const transactions = await getUserTransactions(user.id, 40);

  return (
    <MobilePage title="My Wallet" rightSlot={<span className="text-xs font-medium text-muted">Balance</span>}>
      <Suspense fallback={null}>
        <ScanAlert />
      </Suspense>
      <Card className="overflow-hidden bg-brand-gradient p-5 text-white shadow-xl shadow-brand/30">
        <p className="text-xs uppercase tracking-wide text-white/70">Available Points</p>
        <p className="mt-1 text-4xl font-bold">{formatNumber(user.walletBalance)}</p>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-2xl bg-white/10 p-3 backdrop-blur">
            <p className="text-[11px] text-white/70">Total Earned</p>
            <p className="text-lg font-bold">{formatNumber(user.totalPoints)}</p>
          </div>
          <div className="flex-1 rounded-2xl bg-white/10 p-3 backdrop-blur">
            <p className="text-[11px] text-white/70">Redeemed</p>
            <p className="text-lg font-bold">{formatNumber(user.totalPoints - user.walletBalance)}</p>
          </div>
        </div>
      </Card>

      <h2 className="mb-3 mt-6 text-base font-bold text-content">Transactions</h2>
      <div className="space-y-2">
        {transactions.length === 0 ? (
          <Card><EmptyState icon={<WalletIcon className="h-7 w-7" />} title="No transactions yet" description="Scan products to start earning." /></Card>
        ) : (
          transactions.map((t) => {
            const earn = t.type === "earn";
            return (
              <Card key={t.id} className="flex items-center gap-3 p-3.5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${earn ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
                  {earn ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content">{t.description}</p>
                  <p className="text-xs text-muted">{relativeTime(t.createdAt)}</p>
                </div>
                <span className={`text-sm font-bold ${earn ? "text-success" : "text-danger"}`}>
                  {earn ? "+" : ""}{formatNumber(t.points)}
                </span>
              </Card>
            );
          })
        )}
      </div>
    </MobilePage>
  );
}
