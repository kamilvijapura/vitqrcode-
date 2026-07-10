"use client";

import { useState } from "react";
import { Settings, Check, Building2, Palette, Globe, Save } from "lucide-react";
import type { Company } from "@/db/schema";
import { updateCompanySettings } from "@/app/actions/users";
import { useBrand } from "@/lib/providers";
import { PageHeader } from "@/components/admin/AdminShell";
import { Card, Button, Input, Field, SectionTitle } from "@/components/ui";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

export function SettingsView({ company }: { company: Company }) {
  const { setBrand } = useBrand();
  const [form, setForm] = useState({
    name: company.name,
    appName: company.appName,
    domain: company.domain ?? "",
    industry: company.industry ?? "",
    tagline: company.tagline ?? "",
    primaryColor: company.primaryColor,
    secondaryColor: company.secondaryColor,
    accentColor: company.accentColor,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const applyColors = () =>
    setBrand({ primary: form.primaryColor, secondary: form.secondaryColor, accent: form.accentColor });

  const save = async () => {
    if (!form.name.trim()) {
      toast({ tone: "warning", title: "Company name required" });
      return;
    }
    setSaving(true);
    await updateCompanySettings(form);
    applyColors();
    setSaving(false);
    setSaved(true);
    toast({ tone: "success", title: "Settings saved!", description: "Brand identity updated across the platform." });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader title="White-label Settings" description="Customize your brand identity — no code required" icon={<Settings className="h-5 w-5" />} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Company */}
          <Card className="p-6">
            <SectionTitle title="Company Profile" subtitle="Branding & contact details" action={<Building2 className="h-4 w-4 text-brand" />} />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Company Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="App Name"><Input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} /></Field>
              <Field label="Domain"><Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} /></Field>
              <Field label="Industry"><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="Tagline"><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Field></div>
            </div>
          </Card>

          {/* Colors */}
          <Card className="p-6">
            <SectionTitle title="Brand Colors" subtitle="Live theme preview" action={<Palette className="h-4 w-4 text-brand" />} />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {([
                { key: "primaryColor", label: "Primary" },
                { key: "secondaryColor", label: "Secondary" },
                { key: "accentColor", label: "Accent" },
              ] as const).map((c) => (
                <Field key={c.key} label={c.label}>
                  <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-surface-2 p-2">
                    <input
                      type="color"
                      value={form[c.key]}
                      onChange={(e) => {
                        setForm({ ...form, [c.key]: e.target.value });
                      }}
                      className="h-9 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                    />
                    <span className="font-mono text-xs text-muted">{form[c.key]}</span>
                  </div>
                </Field>
              ))}
            </div>
            <button onClick={applyColors} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline">
              <Globe className="h-3.5 w-3.5" /> Preview colors live
            </button>
          </Card>
        </div>

        {/* Preview card */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-brand-gradient p-6 text-white">
              <p className="text-xs uppercase tracking-wide opacity-80">Live Preview</p>
              <h3 className="mt-1 text-xl font-bold">{form.appName}</h3>
              <p className="mt-1 text-sm opacity-90">{form.tagline}</p>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Primary</span>
                <span className="h-6 w-6 rounded-full" style={{ background: form.primaryColor }} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted">Secondary</span>
                <span className="h-6 w-6 rounded-full" style={{ background: form.secondaryColor }} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted">Accent</span>
                <span className="h-6 w-6 rounded-full" style={{ background: form.accentColor }} />
              </div>
              <button className="mt-4 w-full rounded-xl bg-brand py-2.5 text-sm font-medium text-brand-foreground">
                Sample Button
              </button>
            </div>
          </Card>

          <Button onClick={save} disabled={saving} size="lg" className="w-full">
            {saved ? <><Check className="h-4 w-4" /> Saved!</> : saving ? "Saving…" : <><Save className="h-4 w-4" /> Save Changes</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
