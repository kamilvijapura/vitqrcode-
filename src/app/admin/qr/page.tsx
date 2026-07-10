import { getProducts, getQrTemplates, getCampaigns } from "@/lib/data";
import { QrGenerator } from "@/components/admin/qr-generator";
import { PageHeader } from "@/components/admin/AdminShell";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QrGeneratePage() {
  const [products, templates, campaigns] = await Promise.all([getProducts(), getQrTemplates(), getCampaigns()]);
  return (
    <div>
      <PageHeader
        title="QR Code Generator"
        description="Select a template, generate unique codes & download print-ready layouts"
        icon={<Sparkles className="h-5 w-5" />}
      />
      <QrGenerator products={products} templates={templates} campaigns={campaigns} />
    </div>
  );
}
