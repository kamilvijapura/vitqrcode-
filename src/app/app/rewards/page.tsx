import { getRewards, getSessionAppUser } from "@/lib/data";
import { RewardsAppView } from "@/components/mobile/rewards-view";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const [rewards, user] = await Promise.all([getRewards(), getSessionAppUser()]);
  return <RewardsAppView rewards={rewards} walletBalance={user?.walletBalance ?? 0} userId={user?.id ?? 0} />;
}
