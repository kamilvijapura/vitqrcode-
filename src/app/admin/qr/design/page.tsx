import { getQrTemplates } from "@/lib/data";
import { PageHeader } from "@/components/admin/AdminShell";
import { Palette } from "lucide-react";
import { QrDesignHub } from "@/components/admin/qr-design-hub";

export const dynamic = "force-dynamic";

export default async function QrDesignPage({ searchParams }: { searchParams: { id?: string } }) {
  const templates = await getQrTemplates();
  const editId = searchParams.id ? Number(searchParams.id) : null;
  
  return (
    <div>
      <PageHeader
        title="QR Design & Templates"
        description="Create print-ready branded QR layouts and manage your saved templates"
        icon={<Palette className="h-5 w-5" />}
      />
      <QrDesignHub templates={templates as any} initialEditId={editId} />
    </div>
  );
}
