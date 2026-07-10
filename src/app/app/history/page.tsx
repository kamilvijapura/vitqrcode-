import { History, ScanLine } from "lucide-react";
import { getSessionAppUser, getUserScans } from "@/lib/data";
import { MobilePage } from "@/components/mobile/MobileShell";
import { Card, Badge, Avatar, EmptyState } from "@/components/ui";
import { formatNumber, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getSessionAppUser();
  if (!user) return null;
  const scans = await getUserScans(user.id, 30);

  const success = scans.filter((s) => s.status === "success");
  const totalEarned = success.reduce((a, s) => a + s.points, 0);

  return (
    <MobilePage title="History">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Card className="p-3 text-center"><p className="text-xl font-bold text-content">{scans.length}</p><p className="text-[11px] text-muted">Scans</p></Card>
        <Card className="p-3 text-center"><p className="text-xl font-bold text-success">{success.length}</p><p className="text-[11px] text-muted">Valid</p></Card>
        <Card className="p-3 text-center"><p className="text-xl font-bold text-accent">{formatNumber(totalEarned)}</p><p className="text-[11px] text-muted">Points</p></Card>
      </div>

      <h2 className="mb-3 mt-4 text-base font-bold text-content">Scan History</h2>
      <div className="space-y-2">
        {scans.length === 0 ? (
          <Card><EmptyState icon={<History className="h-7 w-7" />} title="No scans yet" description="Scan a product QR to see history." /></Card>
        ) : (
          scans.map((s) => (
            <Card key={s.id} className="flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 overflow-hidden">
                {s.productImageUrl ? <img src={s.productImageUrl} alt={s.productName ?? ""} className="h-full w-full object-cover" /> : <span className="text-xl">📦</span>}
              </div>
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
    </MobilePage>
  );
}
