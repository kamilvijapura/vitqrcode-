import { getCatalogues } from "@/lib/data";
import { PageHeader } from "@/components/admin/AdminShell";
import { Card, Badge, Button } from "@/components/ui";
import { DownloadButton } from "@/components/admin/catalogue-actions";
import { formatNumber } from "@/lib/utils";
import { BookOpen, FileText, Download, Calendar, HardDrive, Upload } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_TONE: Record<string, any> = {
  pdf: "danger",
  brochure: "brand",
  datasheet: "info",
  marketing: "accent",
};

export default async function CataloguePage() {
  const catalogues = await getCatalogues();
  const totalDownloads = catalogues.reduce((a, c) => a + c.downloads, 0);

  return (
    <div>
      <PageHeader
        title="Catalogue Management"
        description={`${catalogues.length} documents • ${formatNumber(totalDownloads)} total downloads`}
        icon={<BookOpen className="h-5 w-5" />}
        actions={
          <Button size="sm">
            <Upload className="mr-2 h-4 w-4" /> Upload Catalogue
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalogues.map((c) => (
          <Card key={c.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-2xl">
                {c.fileUrl?.includes("doc") ? <FileText className="h-5 w-5 text-brand" /> : "📄"}
              </div>
              <Badge tone={TYPE_TONE[c.docType]}>{c.docType}</Badge>
            </div>
            <h3 className="mt-3 font-semibold text-content">{c.title}</h3>
            <p className="text-xs text-muted">{c.category}</p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
              <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> {(c.sizeKb / 1024).toFixed(1)} MB</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(c.createdAt)}</span>
              <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {formatNumber(c.downloads)}</span>
            </div>

            <div className="mt-auto pt-4">
              <span className="mb-2 block text-[10px] uppercase tracking-wide text-subtle">Version {c.version}</span>
              <DownloadButton id={c.id} title={c.title} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
