import { ensureSeeded } from "@/db/seed";
import { getCompany } from "@/lib/data";
import { MobileShell } from "@/components/mobile/MobileShell";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children, params }: { children: React.ReactNode; params?: unknown }) {
  // Don't wrap the login page with the mobile shell
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? "";
  const isLoginPage = pathname === "/app/login";

  await ensureSeeded();
  const company = await getCompany();

  if (isLoginPage) return <>{children}</>;

  return <MobileShell appName={company?.appName ?? "Rewards"}>{children}</MobileShell>;
}
