import { getLeaderboard, getSessionAppUser } from "@/lib/data";
import { LeaderboardView } from "@/components/mobile/leaderboard-view";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const users = await getLeaderboard();
  const currentUser = await getSessionAppUser();
  return <LeaderboardView users={users} currentUserId={currentUser?.id} />;
}
