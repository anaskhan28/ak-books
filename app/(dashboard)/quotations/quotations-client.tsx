"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { deleteQuotation } from "@/app/actions/quotations";
import StatusBadge from "@/components/ui/status-badge";
import { formatINR } from "@/lib/utils";
import type { QuotationTemplate } from "@/app/db/schema";

import DocumentCard from "@/components/common/document-card";
import QuotationRowActions from "@/components/quotations/QuotationRowActions";
import PageHeader from "@/components/ui/page-header";

type QuotationRow = {
  id: number;
  templateId: number | null;
  templateName: string | null;
  clientId: number;
  clientName: string | null;
  projectName: string | null;
  quotationNumber: string;
  subject: string | null;
  clientBranch: string | null;
  totalAmount: number;
  status: string;
  createdAt: Date;
};

interface Props {
  quotations: QuotationRow[];
  templates: QuotationTemplate[];
}

export default function QuotationsClient({ quotations, templates }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");

  const filtered =
    activeTab === "all"
      ? quotations
      : quotations.filter((q) => String(q.templateId) === activeTab);

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  async function handleDelete(e: React.MouseEvent, id: number) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!confirm("Delete this quotation?")) return;
    await deleteQuotation(id);
    router.refresh();
  }

  async function handleDownloadPDF(quotationId: number | number) {
    setDownloadingId(quotationId);
    try {
      const { getQuotation } = await import("@/app/actions/quotations");
      const { generateAndDownloadPdf } = await import("@/lib/download-pdf");

      const dbQuotation = await getQuotation(quotationId);
      if (!dbQuotation) throw new Error("Quotation not found");

      const { getTemplateConfig } = await import("@/lib/pdf-templates/registry");
      const tplConfig = getTemplateConfig(dbQuotation.template?.name);

      await generateAndDownloadPdf({
        mode: "quotation",
        templateName: dbQuotation.template?.name,
        docNumber: dbQuotation.quotationNumber,
        filenamePrefix: dbQuotation.quotationNumber,
        date: new Date(dbQuotation.createdAt).toISOString().split("T")[0],
        clientName: dbQuotation.clientName || "",
        clientBranch: dbQuotation.clientBranch || "",
        subject: dbQuotation.subject || "",
        items: dbQuotation.items.map((i) => ({
          description: i.description,
          rate: i.rate,
          qty: i.quantity,
          taxed: i.taxed || "",
          amount: i.amount,
        })),
        subtotal: dbQuotation.items.reduce((sum, item) => sum + item.amount, 0),
        terms: dbQuotation.notes || "",
        accountInfo: {
          bankName: tplConfig.bank.bankName,
          accountNumber: tplConfig.bank.accountNumber,
          ifsc: tplConfig.bank.ifsc,
          accountHolder: tplConfig.bank.accountHolder,
          pan: tplConfig.bank.pan,
        },
      });
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="p-2 md:p-0">
      {/* Header */}
      <PageHeader title="Quotations" subtitle="Select a template below or create one directly"
        action={
          <div className="flex items-center gap-2">
            <Link
              href={activeTab !== "all" ? `/quotations/new?template=${activeTab}` : "/quotations/new"}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-semibold hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
            >
              <Plus size={16} />
              <span className="hidden sm:inline text-[13px]">Create Quotation</span>
              <span className="sm:hidden text-[13px]">Create Quote</span>
            </Link>
          </div>
        }

      >




      </PageHeader>

      {/* Template Tabs */}
      <div className="flex items-center gap-1 pt-1  md:pt-0 mb-0 md:mb-5 md:border-b border-b-0 border-border overflow-x-auto md:overflow-hidden pb-0">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === "all"
            ? "text-primary border-primary"
            : "text-muted border-transparent hover:text-foreground"
            }`}
        >
          All ({quotations.length})
        </button>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(String(t.id))}
            className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === String(t.id)
              ? "text-primary border-primary"
              : "text-muted border-transparent hover:text-foreground"
              }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Horizontal Divider for mobile header feeling */}
      {/* <div className="h-px bg-border/40 mb-0 md:hidden" /> */}

      {/* Quotation List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[13px] text-muted">No quotations yet.</p>
          <p className="text-[12px] text-muted mt-1">
            Choose a template above to generate your first quotation.
          </p>
        </div>
      ) : (
        <div>
          {/* Mobile Card View (shown only on mobile) */}
          <div className="md:hidden">
            {filtered.map((q) => (
              <DocumentCard
                key={q.id}
                data={{
                  ...q,
                  number: q.quotationNumber
                }}
                mode="quotation"
                onDelete={handleDelete}
                isDownloading={downloadingId === q.id}
                onDownloadPDF={() => handleDownloadPDF(q.id)}
              />
            ))}
          </div>

          {/* Desktop Table View (hidden on mobile) */}
          <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-muted/70 text-left">
                    <th className="px-5 py-3 font-bold">Quotation #</th>
                    <th className="px-5 py-3 font-bold">Client</th>
                    <th className="px-5 py-3 font-bold">Branch</th>
                    <th className="px-5 py-3 font-bold">Subject</th>
                    <th className="px-5 py-3 font-bold text-right">Amount</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 font-bold">Date</th>
                    <th className="px-5 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => (
                    <tr
                      key={q.id}
                      className="border-b border-border/50 hover:bg-primary-light/20 transition-colors group"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/quotations/${q.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {q.quotationNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        {q.clientName}
                      </td>
                      <td className="px-5 py-3 text-foreground">
                        {q.clientBranch || "—"}
                      </td>
                      <td className="px-5 py-3 text-foreground truncate max-w-[200px]">
                        {q.subject || "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-foreground">
                        {formatINR(q.totalAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="px-5 py-3 text-foreground">
                        {new Date(q.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-3">
                        <QuotationRowActions
                          quotationId={q.id}
                          status={q.status}
                          isDownloading={downloadingId === q.id}
                          onDownloadPDF={() => handleDownloadPDF(q.id)}
                          onDelete={() => handleDelete(null as any, q.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
