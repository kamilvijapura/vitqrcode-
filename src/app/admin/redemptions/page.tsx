import { getRedemptions } from "@/lib/data";
import { RedemptionsView } from "@/components/admin/redemptions-view";

export const dynamic = "force-dynamic";

export default async function RedemptionsPage() {
  const redemptions = await getRedemptions();
  return <RedemptionsView redemptions={redemptions} />;
}
