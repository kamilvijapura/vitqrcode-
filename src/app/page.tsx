import { ensureSeeded } from "@/db/seed";
import { getCompany } from "@/lib/data";
import { Landing } from "@/components/landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeeded();
  const company = await getCompany();
  return <Landing appName={company?.appName ?? "ChromaShield Rewards"} />;
}
