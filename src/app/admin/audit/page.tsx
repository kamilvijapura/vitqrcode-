import { getAuditLogs } from "@/lib/data";
import { AuditView } from "@/components/admin/audit-view";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await getAuditLogs();
  return <AuditView logs={logs} />;
}
