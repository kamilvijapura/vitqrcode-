import { getCatalogues } from "@/lib/data";
import { MobilePage } from "@/components/mobile/MobileShell";
import { Card, Badge } from "@/components/ui";
import { DownloadButton } from "@/components/admin/catalogue-actions";
import { formatNumber } from "@/lib/utils";
import { HardDrive, Download, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_TONE: Record<string, any> = {
  pdf: "danger",
  brochure: "brand",
  datasheet: "info",
  marketing: "accent",
};

export default async function CataloguePage() {
  const catalogues = await getCatalogues();
  return (
    <MobilePage title="Catalogue">
      <p className="mb-4 text-sm text-muted">Brochures, datasheets & marketing material</p>
      <div className="space-y-3">
        {catalogues.map((c) => (
          <Card key={c.id} className="flex items-center gap-3 p-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-content">{c.title}</p>
                <Badge tone={TYPE_TONE[c.docType]}>{c.docType}</Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-subtle">
                <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> {(c.sizeKb / 1024).toFixed(1)}MB</span>
                <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {formatNumber(c.downloads)}</span>
                <span>v{c.version}</span>
              </div>
            </div>
            <DownloadButton id={c.id} title={c.title} />
          </Card>
        ))}
      </div>
    </MobilePage>
  );
}
