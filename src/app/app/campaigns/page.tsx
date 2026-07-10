import { Calendar, Zap } from "lucide-react";
import { getCampaigns } from "@/lib/data";
import { MobilePage } from "@/components/mobile/MobileShell";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  return (
    <MobilePage title="Campaigns">
      <p className="mb-4 text-sm text-muted">Boost your points with limited-time offers</p>
      <div className="space-y-4">
        {campaigns.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <div className="relative h-28 bg-brand-gradient">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
              <span className="absolute right-4 top-3 text-5xl">{c.banner}</span>
              <div className="absolute bottom-3 left-4">
                <span className="rounded-lg bg-white/20 px-2 py-1 text-xs font-bold text-white backdrop-blur">{Number(c.pointsMultiplier)}x POINTS</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-content">{c.name}</h3>
                <Badge tone="brand">{c.type}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{c.description}</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(c.startDate)} — {formatDate(c.endDate)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </MobilePage>
  );
}
