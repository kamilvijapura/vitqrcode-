import { getQrBatches, getQrCodes, getQrStatusCounts } from "@/lib/data";
import { getBatchCodes } from "@/app/actions/qr";
import { QrHistory } from "@/components/admin/qr-history";
import { QrCode, CheckCircle2, Clock, Ban, History } from "lucide-react";
import { PageHeader } from "@/components/admin/AdminShell";
import { StatCard } from "@/components/ui";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QrHistoryPage() {
  const [batches, codes, counts] = await Promise.all([
    getQrBatches(),
    getQrCodes(200),
    getQrStatusCounts(),
  ]);

  const total = counts.unused + counts.used + counts.expired + counts.invalid;

  const stats = [
    { label: "Total Generated", value: formatNumber(total), icon: <QrCode className="h-5 w-5" />, accent: "var(--color-brand)" },
    { label: "Used", value: formatNumber(counts.used), icon: <CheckCircle2 className="h-5 w-5" />, accent: "var(--color-success)", delta: `${Math.round((counts.used / (total || 1)) * 100)}%` },
    { label: "Batches", value: formatNumber(batches.length), icon: <Clock className="h-5 w-5" />, accent: "var(--color-secondary)" },
    { label: "Expired", value: formatNumber(counts.expired), icon: <Ban className="h-5 w-5" />, accent: "var(--color-danger)" },
  ];

  return (
    <div>
      <PageHeader
        title="QR History & Overview"
        description="Track your generated codes and batch lifecycles"
        icon={<History className="h-5 w-5" />}
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} accent={s.accent} delta={s.delta} />
        ))}
      </div>

      <QrHistory
        batches={batches as never}
        codes={codes as never}
        // Pass the server action DIRECTLY — it is a stable, serialisable reference.
        // Wrapping it in a closure breaks server-action serialisation on the client.
        batchCodesLoader={getBatchCodes}
      />
    </div>
  );
}
