import { ensureSeeded } from "@/db/seed";
import { getCompany } from "@/lib/data";
import { MobileShell } from "@/components/mobile/MobileShell";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children, params }: { children: React.ReactNode; params?: Promise<unknown> }) {
  // Don't wrap the login page with the mobile shell
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") ?? "";
  const isLoginPage = pathname === "/app/login";

  // Wrap in try-catch so a DB error doesn't crash the entire page
  try {
    await ensureSeeded();
  } catch (e) {
    console.error("[AppLayout] ensureSeeded error:", e);
  }

  let company = null;
  try {
    company = await getCompany();
  } catch (e) {
    console.error("[AppLayout] getCompany error:", e);
  }

  if (isLoginPage) return <>{children}</>;

  return <MobileShell appName={company?.appName ?? "Rewards"}>{children}</MobileShell>;
}
