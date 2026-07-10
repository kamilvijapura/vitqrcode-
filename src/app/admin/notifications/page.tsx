import { getNotifications } from "@/lib/data";
import { NotificationsView } from "@/components/admin/notifications-view";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  return <NotificationsView notifications={notifications} />;
}
