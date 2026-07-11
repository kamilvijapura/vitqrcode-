import { ensureSeeded } from "@/db/seed";
import { getCompany } from "@/lib/data";
import { getAdminSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Wrap in try-catch so a DB error doesn't crash the entire admin panel
  try {
    await ensureSeeded();
  } catch (e) {
    console.error("[AdminLayout] ensureSeeded error:", e);
  }

  let company = null;
  let session = null;
  try {
    [company, session] = await Promise.all([
      getCompany(),
      getAdminSession(),
    ]);
  } catch (e) {
    console.error("[AdminLayout] data fetch error:", e);
  }

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
