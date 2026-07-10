import { getRewards } from "@/lib/data";
import { RewardsView } from "@/components/admin/rewards-view";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const rewards = await getRewards();
  return <RewardsView rewards={rewards} />;
}
