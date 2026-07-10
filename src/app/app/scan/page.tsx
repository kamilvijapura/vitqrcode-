import { getSessionAppUser } from "@/lib/data";
import { Scanner } from "@/components/mobile/scanner";
import { MobilePage } from "@/components/mobile/MobileShell";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const user = await getSessionAppUser();
  if (!user) return <MobilePage title="Scan"><p className="px-5 text-sm text-muted">No user found.</p></MobilePage>;
  return (
    <div>
      <Scanner userId={user.id} />
    </div>
  );
}
