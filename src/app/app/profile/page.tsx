import Link from "next/link";
import { Award, ScanLine, Star, ChevronRight, Settings, HelpCircle, Shield, LogOut, Moon, Crown } from "lucide-react";
import { getSessionAppUser } from "@/lib/data";
import { userLogout } from "@/app/actions/auth-consumer";
import { MobilePage } from "@/components/mobile/MobileShell";
import { Card, Avatar, Badge } from "@/components/ui";
import { ThemeToggle } from "@/components/brand";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionAppUser();
  if (!user) return null;

  const achievements = [
    { icon: "🎯", label: "First Scan", unlocked: true },
    { icon: "🔥", label: "10 Scans", unlocked: user.lifetimeScans >= 10 },
    { icon: "💯", label: "1000 Points", unlocked: user.totalPoints >= 1000 },
    { icon: "👑", label: "Gold Tier", unlocked: ["gold", "platinum"].includes(user.membershipTier) },
    { icon: "🎁", label: "First Redeem", unlocked: true },
    { icon: "🚀", label: "Power User", unlocked: user.lifetimeScans >= 50 },
  ];

  const menu = [
    { icon: Settings, label: "Account Settings" },
    { icon: Shield, label: "Privacy & Security" },
    { icon: HelpCircle, label: "Help & Support" },
  ];

  return (
    <MobilePage title="Profile">
      {/* Profile header */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-brand-gradient" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar name={user.name} size={80} className="border-4 border-surface text-2xl" />
            <Badge tone="brand" className="mb-2 capitalize"><Crown className="h-3 w-3" /> {user.membershipTier}</Badge>
          </div>
          <h2 className="mt-3 text-lg font-bold text-content">{user.name}</h2>
          <p className="text-sm text-muted">{user.email ?? user.phone}</p>
        </div>
      </Card>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <Star className="mx-auto h-4 w-4 text-accent" />
          <p className="mt-1 text-lg font-bold text-content">{formatNumber(user.totalPoints)}</p>
          <p className="text-[10px] text-muted">Total Points</p>
        </Card>
        <Card className="p-3 text-center">
          <ScanLine className="mx-auto h-4 w-4 text-brand" />
          <p className="mt-1 text-lg font-bold text-content">{user.lifetimeScans}</p>
          <p className="text-[10px] text-muted">Scans</p>
        </Card>
        <Card className="p-3 text-center">
          <Award className="mx-auto h-4 w-4 text-success" />
          <p className="mt-1 text-lg font-bold text-content">{achievements.filter((a) => a.unlocked).length}</p>
          <p className="text-[10px] text-muted">Badges</p>
        </Card>
      </div>

      {/* Achievements */}
      <h2 className="mb-3 mt-6 text-base font-bold text-content">Achievements</h2>
      <div className="grid grid-cols-3 gap-3">
        {achievements.map((a) => (
          <Card key={a.label} className={`flex flex-col items-center gap-1 p-3 text-center ${a.unlocked ? "" : "opacity-40 grayscale"}`}>
            <span className="text-2xl">{a.icon}</span>
            <span className="text-[10px] font-medium text-content">{a.label}</span>
          </Card>
        ))}
      </div>

      {/* Menu */}
      <div className="mt-6 space-y-2">
        <Card className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Moon className="h-5 w-5 text-brand" />
            <span className="text-sm font-medium text-content">Dark Mode</span>
          </div>
          <ThemeToggle />
        </Card>
        {menu.map((m) => (
          <Card key={m.label} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <m.icon className="h-5 w-5 text-muted" />
              <span className="text-sm font-medium text-content">{m.label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-subtle" />
          </Card>
        ))}
        <form action={userLogout}>
          <button type="submit" className="w-full">
            <Card className="flex items-center justify-between p-4 transition-colors hover:bg-danger-soft">
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5 text-danger" />
                <span className="text-sm font-medium text-danger">Sign Out</span>
              </div>
            </Card>
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-subtle">ChromaShield Rewards · v1.0.0</p>
    </MobilePage>
  );
}
