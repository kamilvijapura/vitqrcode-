import { getCampaigns } from "@/lib/data";
import { CampaignsView } from "@/components/admin/campaigns-view";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  return <CampaignsView campaigns={campaigns} />;
}
