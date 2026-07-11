import { ensureSeeded } from "@/db/seed";
import { getCompany } from "@/lib/data";
import { Landing } from "@/components/landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Wrap in try-catch so a DB error doesn't crash the landing page
  try {
    await ensureSeeded();
  } catch (e) {
    console.error("[HomePage] ensureSeeded error:", e);
  }

  let company = null;
  try {
    company = await getCompany();
  } catch (e) {
    console.error("[HomePage] getCompany error:", e);
  }

  return <Landing appName={company?.appName ?? "ChromaShield Rewards"} />;
}
