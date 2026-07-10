import { MobileLoginView } from "@/components/mobile/LoginView";
import { getCompany } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AppLoginPage() {
  const company = await getCompany();
  return <MobileLoginView appName={company?.appName ?? "Rewards"} />;
}
