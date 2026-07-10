import { getAppUsers } from "@/lib/data";
import { UsersView } from "@/components/admin/users-view";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await getAppUsers();
  return <UsersView users={users} />;
}
