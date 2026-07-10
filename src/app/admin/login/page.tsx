import { AdminLoginView } from "@/components/admin/login-view";
import { Logo } from "@/components/brand";
import { getCompany } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const company = await getCompany();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-4">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-3xl shadow-lg shadow-brand/30">🏷️</div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-content">{company?.appName ?? "Rewards Console"}</h1>
          <p className="text-sm text-muted">{company?.name ?? "Enterprise Admin Platform"}</p>
        </div>
      </div>
      <AdminLoginView />
    </div>
  );
}
