import { Gift, Coins, Megaphone, Info, Bell } from "lucide-react";
import { getSessionAppUser, getUserNotifications } from "@/lib/data";
import { MobilePage } from "@/components/mobile/MobileShell";
import { Card, Badge, EmptyState } from "@/components/ui";
import { relativeTime, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { tone: any; icon: any; bg: string }> = {
  reward: { tone: "brand", icon: Gift, bg: "bg-brand-soft text-brand" },
  points: { tone: "warning", icon: Coins, bg: "bg-warning-soft text-warning" },
  campaign: { tone: "info", icon: Megaphone, bg: "bg-info-soft text-info" },
  system: { tone: "neutral", icon: Info, bg: "bg-surface-2 text-muted" },
};

export default async function NotificationsPage() {
  const user = await getSessionAppUser();
  const notifications = user ? await getUserNotifications(user.id) : [];

  return (
    <MobilePage title="Notifications">
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card><EmptyState icon={<Bell className="h-7 w-7" />} title="No notifications" description="You're all caught up!" /></Card>
        ) : (
          notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system;
            const Icon = meta.icon;
            return (
              <Card key={n.id} className={cn("flex gap-3 p-3.5", !n.read && "ring-1 ring-brand/30")}>
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.bg)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-content">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{n.body}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone={meta.tone}>{n.type}</Badge>
                    <span className="text-[11px] text-subtle">{relativeTime(n.createdAt)}</span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </MobilePage>
  );
}
