import { ensureSeeded } from "@/db/seed";
import { getCompany } from "@/lib/data";
import { getAdminSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureSeeded();
  const [company, session] = await Promise.all([
    getCompany(),
    getAdminSession(),
  ]);
  return (
    <AdminShell
      appName={company?.appName ?? "Rewards"}
      companyName={company?.name ?? "Company"}
      adminName={session?.name}
      adminEmail={session?.email}
    >
      {children}
    </AdminShell>
  );
}
