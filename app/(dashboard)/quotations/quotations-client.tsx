"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { deleteQuotation } from "@/app/actions/quotations";
import StatusBadge from "@/components/ui/status-badge";
import { formatINR } from "@/lib/utils";
import type { QuotationTemplate } from "@/app/db/schema";

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

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this quotation?")) return;
    await deleteQuotation(id);
    router.refresh();
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-muted">Quotations</h1>
          <p className="text-[13px] text-muted mt-0.5">
            Select a template to create a new quotation
          </p>
        </div>
      </div>

      {/* Template Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto pb-0">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === "all"
            ? "text-primary border-primary"
            : "text-muted border-transparent hover:text-muted"
            }`}
        >
          All ({quotations.length})
        </button>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(String(t.id))}
            className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === String(t.id)
              ? "text-primary border-primary"
              : "text-muted border-transparent hover:text-muted"
              }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Active Template → New Quotation CTA */}
      {activeTab !== "all" && (
        <div className="mb-5">
          <Link
            href={`/quotations/new?template=${activeTab}`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-[13px] font-semibold hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            New {templates.find((t) => String(t.id) === activeTab)?.name}{" "}
            Quotation
          </Link>
        </div>
      )}

      {/* Quotation List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[14px] text-muted">No quotations yet.</p>
          <p className="text-[12px] text-muted mt-1">
            Select a template above to create your first quotation.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-background/50 text-muted text-left">
                  <th className="px-5 py-3 font-medium">Quotation #</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Branch</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
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
                        className="font-medium text-primary hover:underline"
                      >
                        {q.quotationNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-medium text-muted">
                      {q.clientName}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {q.clientBranch || "—"}
                    </td>
                    <td className="px-5 py-3 text-muted truncate max-w-[200px]">
                      {q.subject || "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-muted">
                      {formatINR(q.totalAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {new Date(q.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={(e) => handleDelete(e, q.id)}
                        className="text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
