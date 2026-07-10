import { getCompany } from "@/lib/data";
import { SettingsView } from "@/components/admin/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const company = await getCompany();
  if (!company) return null;
  return <SettingsView company={company} />;
}
