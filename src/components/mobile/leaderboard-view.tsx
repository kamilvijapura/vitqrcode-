"use client";

import { Trophy, Medal, Star } from "lucide-react";
import type { AppUser } from "@/db/schema";
import { MobilePage } from "@/components/mobile/MobileShell";
import { Card, Avatar, Badge } from "@/components/ui";
import { formatNumber, cn } from "@/lib/utils";

export function LeaderboardView({ users, currentUserId }: { users: AppUser[], currentUserId?: number }) {
  return (
    <MobilePage title="Leaderboard" rightSlot={
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Trophy className="h-5 w-5" />
      </div>
    }>
      <div className="mb-4 text-center">
        <p className="text-sm text-muted">Global Ranking</p>
        <p className="text-xs text-subtle mt-1">Top point earners across all campaigns</p>
      </div>

      <div className="space-y-3">
        {users.map((u, i) => {
          const rank = i + 1;
          const isMe = u.id === currentUserId;
          let rankIcon = null;
          if (rank === 1) rankIcon = <Medal className="h-6 w-6 text-amber-400 drop-shadow-md" />;
          else if (rank === 2) rankIcon = <Medal className="h-6 w-6 text-slate-300 drop-shadow-md" />;
          else if (rank === 3) rankIcon = <Medal className="h-6 w-6 text-amber-700 drop-shadow-md" />;

          return (
            <Card
              key={u.id}
              className={cn(
                "flex items-center gap-4 p-4 transition-all",
                isMe ? "border-brand ring-1 ring-brand/20 bg-brand-soft" : ""
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center font-bold text-subtle">
                {rankIcon ?? <span className="text-lg">#{rank}</span>}
              </div>
              <Avatar name={u.name} size={44} className={isMe ? "ring-2 ring-brand ring-offset-2 ring-offset-bg" : ""} />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-content">
                  {u.name} {isMe && <span className="text-xs font-normal text-brand ml-1">(You)</span>}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge tone={
                    u.membershipTier === "gold" ? "accent" : 
                    u.membershipTier === "silver" ? "neutral" : 
                    "brand"
                  } className="capitalize text-[9px] px-1.5 py-0">
                    {u.membershipTier}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="flex items-center gap-1 text-sm font-bold text-content">
                  {formatNumber(u.totalPoints)} <Star className="h-3 w-3 fill-accent text-accent" />
                </span>
                <span className="text-[10px] text-muted">Pts</span>
              </div>
            </Card>
          );
        })}
      </div>
    </MobilePage>
  );
}
