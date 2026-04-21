"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/ui/page-header";
import { getTemplates, deleteTemplate } from "@/app/actions/templates";
import type { QuotationTemplate } from "@/app/db/schema";
import { useRouter } from "next/navigation";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getTemplates();
      setTemplates(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this template? This will not affect existing quotations.")) return;
    await deleteTemplate(id);
    setTemplates(templates.filter(t => t.id !== id));
  }

  return (
    <div className="p-4 md:p-0">
        <PageHeader
          title="Document Templates"
          subtitle="Manage your business quotation and invoice layouts"
          action={
            <Link href="/quotations/templates/new">
              <Button className="font-semibold shadow-sm">
                <Plus size={16} />
                New Template
              </Button>
            </Link>
          }
        />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-3xl">
          <Building2 size={48} className="mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-bold mb-1">No custom templates yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Create your first custom design to get started.</p>
          <Link href="/quotations/templates/new">
            <Button variant="outline" className="gap-2">
              <Plus size={16} />
              Create Template
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <Card key={t.id} className="group flex flex-col border border-border shadow-sm hover:shadow-md transition-all h-[240px] relative">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-6 pb-4 border-b border-gray-50 flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-[17px] text-foreground leading-tight">{t.name}</h3>
                    <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1">{t.companyName || "No Company Specified"}</p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-gray-100 shadow-inner"
                    style={{ backgroundColor: (t.primaryColor || "#0F172A") + "10" }}
                  >
                    <Building2 size={20} style={{ color: t.primaryColor || "#000" }} />
                  </div>
                </div>
                
                <div className="p-6 py-4 space-y-3 flex-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">Document Prefix</span>
                    <span className="font-mono font-bold px-2 py-0.5 bg-gray-50 rounded text-primary border border-gray-100">{t.subjectPrefix}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">Layout Type</span>
                    <span className="font-medium bg-secondary/50 px-2 py-0.5 rounded text-secondary-foreground text-[11px] uppercase tracking-wider">{t.layoutPreset || "Standard"}</span>
                  </div>
                </div>

                <div className="p-6 pt-0 mt-auto flex items-center gap-2">
                  <Link href={`/quotations/templates/${t.id}`} className="flex-1">
                    <Button variant="outline" className="w-full text-[13px] font-semibold h-10">
                      Configure Design
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 text-destructive hover:bg-destructive/5 hover:text-destructive shrink-0"
                    onClick={() => handleDelete(t.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
