"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { alerts } from "@/lib/alerts";
import { Plus, ChevronDown, Settings2, FileDown, Printer } from "lucide-react";
import { deleteQuotation, updateQuotationStatus } from "@/app/actions/quotations";
import StatusBadge from "@/components/ui/status-badge";
import { formatINR, formatDateDMY } from "@/lib/utils";
import type { QuotationTemplate } from "@/app/db/schema";

import DocumentCard from "@/components/common/document-card";
import QuotationRowActions from "@/components/quotations/QuotationRowActions";
import PageHeader from "@/components/ui/page-header";
import Pagination from "@/components/common/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
  isComparative: boolean;
  createdAt: Date;
};

interface Props {
  quotations: QuotationRow[];
  totalCount: number;
  templates: QuotationTemplate[];
  currentPage: number;
  limit: number;
  activeStatus: string;
  activeTemplateId: string;
}

const STATUSES = [
  { value: "all", label: "All Quotes" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "invoiced", label: "Invoiced" },
];


export default function QuotationsClient({
  quotations,
  totalCount,
  templates,
  currentPage,
  limit,
  activeStatus,
  activeTemplateId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(newParams: { page?: number; limit?: number; status?: string; template?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (newParams.page !== undefined) params.set("page", String(newParams.page));
    else params.delete("page");

    if (newParams.limit !== undefined) params.set("limit", String(newParams.limit));
    if (newParams.status !== undefined) {
      params.set("status", newParams.status);
      params.set("page", "1");
    }
    if (newParams.template !== undefined) {
      params.set("template", newParams.template);
      params.set("page", "1");
    }
    router.push(`?${params.toString()}`);
  }

  const activeTab = activeTemplateId;
  const filtered = quotations;

  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const idsOnCurrentPage = filtered.map((q) => q.id);
  const isAllSelected = idsOnCurrentPage.length > 0 && idsOnCurrentPage.every((id) => selectedIds.includes(id));

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (ids: number[]) => {
    if (ids.every((id) => selectedIds.includes(id))) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!(await alerts.confirm(`Delete ${selectedIds.length} quotations?`, "This action cannot be undone."))) return;
    try {
      let successCount = 0;
      let lastError = "";
      for (const id of selectedIds) {
        const res = await deleteQuotation(id);
        if (res.success) {
          successCount++;
        } else {
          lastError = res.error || "Failed to delete";
        }
      }
      if (successCount === selectedIds.length) {
        alerts.success(`Successfully deleted ${successCount} quotations`);
      } else if (successCount > 0) {
        alerts.warning(`Deleted ${successCount} of ${selectedIds.length} quotations. Error: ${lastError}`);
      } else {
        alerts.error("Failed to delete selected quotations", lastError);
      }
      setSelectedIds([]);
      router.refresh();
    } catch (err: any) {
      alerts.error("Bulk delete failed", err.message || "An error occurred.");
    }
  }

  async function handleBulkUpdateStatus(newStatus: string) {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        await updateQuotationStatus(id, newStatus);
      }
      alerts.success(`Updated status of ${selectedIds.length} quotations to ${newStatus.toUpperCase()}`);
      setSelectedIds([]);
      router.refresh();
    } catch (err: any) {
      alerts.error("Bulk status update failed", err.message || "An error occurred.");
    }
  }

  async function handleBulkDownload() {
    if (selectedIds.length === 0) return;
    setBulkDownloading(true);
    try {
      const { generateAndDownloadMergedPdf } = await import("@/lib/download-pdf");
      const { getQuotation } = await import("@/app/actions/quotations");
      const { getTemplateConfig } = await import("@/lib/pdf-templates/registry");

      const documentsData = [];
      for (const id of selectedIds) {
        const dbQuotation = await getQuotation(id);
        if (!dbQuotation) continue;

        const tplConfig = getTemplateConfig(dbQuotation.template?.name, dbQuotation.template);
        documentsData.push({
          mode: "quotation" as const,
          templateName: dbQuotation.template?.name,
          dbTemplate: dbQuotation.template,
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
          showTotal: dbQuotation.showTotal ?? undefined,
          accountInfo: {
            bankName: tplConfig.bank.bankName,
            accountNumber: tplConfig.bank.accountNumber,
            ifsc: tplConfig.bank.ifsc,
            accountHolder: tplConfig.bank.accountHolder,
            pan: tplConfig.bank.pan,
          },
        });
      }

      if (documentsData.length > 0) {
        const filename = "quotes";
        await generateAndDownloadMergedPdf(documentsData, filename);
        alerts.success(`Downloaded ${selectedIds.length} merged PDFs into one file`);
        setSelectedIds([]);
      }
    } catch (err: any) {
      console.error("Bulk download error:", err);
      alerts.error("Bulk download failed", "An error occurred during download.");
    } finally {
      setBulkDownloading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!(await alerts.confirm("Delete this quotation?", "This action cannot be undone."))) return;

    try {
      const result = await deleteQuotation(id);
      if (result.success) {
        alerts.success("Quotation deleted successfully");
        router.refresh();
      } else {
        alerts.error("Delete failed", result.error);
      }
    } catch (error: any) {
      alerts.error("Delete failed", "An unexpected error occurred.");
    }
  }

  async function handleDownloadPDF(quotationId: number | number) {
    setDownloadingId(quotationId);
    try {
      const { getQuotation } = await import("@/app/actions/quotations");
      const { generateAndDownloadPdf } = await import("@/lib/download-pdf");

      const dbQuotation = await getQuotation(quotationId);
      if (!dbQuotation) throw new Error("Quotation not found");

      const { getTemplateConfig } = await import("@/lib/pdf-templates/registry");
      const tplConfig = getTemplateConfig(dbQuotation.template?.name, dbQuotation.template);

      await generateAndDownloadPdf({
        mode: "quotation",
        templateName: dbQuotation.template?.name,
        dbTemplate: dbQuotation.template,
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
        showTotal: dbQuotation.showTotal ?? undefined,
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
      alerts.error("Failed to download PDF", "Please try again later.");
    } finally {
      setDownloadingId(null);
    }
  }

  const currentStatusObj = STATUSES.find(s => s.value === activeStatus) || STATUSES[0];

  const titleNode = (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 text-[18px] md:text-[22px] font-bold text-foreground hover:text-primary transition-colors focus:outline-none cursor-pointer">
            <span>{currentStatusObj.label}</span>
            <ChevronDown size={20} className=" h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {STATUSES.map((s) => (
            <DropdownMenuItem
              key={s.value}
              onClick={() => updateParams({ status: s.value })}
              className={`cursor-pointer ${activeStatus === s.value ? "text-primary font-semibold" : ""}`}
            >
              {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="p-2 md:p-0">
      {/* Header / Selection Bar */}
      {selectedIds.length > 0 ? (
        <>
          {/* Desktop Bulk Actions Bar */}
          <div className="hidden md:flex flex-wrap items-center justify-between gap-3 p-3 mb-5 bg-white dark:bg-card border border-border rounded-xl shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-1.5 border border-border rounded-lg text-[13px] hover:bg-accent font-medium flex items-center gap-1 cursor-pointer">
                    <span>Bulk Update</span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => handleBulkUpdateStatus("draft")} className="cursor-pointer">Mark as Draft</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkUpdateStatus("sent")} className="cursor-pointer">Mark as Sent</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkUpdateStatus("accepted")} className="cursor-pointer">Mark as Accepted</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkUpdateStatus("invoiced")} className="cursor-pointer">Mark as Invoiced</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={handleBulkDownload}
                disabled={bulkDownloading}
                className="p-2 border border-border rounded-lg hover:bg-accent cursor-pointer disabled:opacity-40 flex items-center justify-center"
                title="Download PDFs"
              >
                <FileDown size={15} />
              </button>

              <button
                onClick={() => handleBulkUpdateStatus("sent")}
                className="px-3 py-1.5 border border-border rounded-lg text-[13px] hover:bg-accent font-medium cursor-pointer"
              >
                Mark As Sent
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-[13px] hover:bg-red-50 hover:border-red-300 font-medium cursor-pointer"
              >
                Delete
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-foreground bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                {selectedIds.length} Selected
              </span>
              <button
                onClick={clearSelection}
                className="text-muted-foreground hover:text-foreground text-[13px] font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Esc</span>
                <span className="w-5 h-5 flex items-center justify-center border border-border rounded text-[11px]">✕</span>
              </button>
            </div>
          </div>

          {/* Mobile Bulk Header (fixed over global header) */}
          <div className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-card border-b border-border px-4 py-3 flex items-center justify-between md:hidden animate-fade-in">
            <div className="flex items-center gap-3">
              <button
                onClick={clearSelection}
                className="p-1 hover:bg-accent rounded-full text-muted-foreground cursor-pointer"
              >
                <span className="text-[20px] font-light">✕</span>
              </button>
              <div>
                <h2 className="text-[15px] font-bold text-foreground">Quotations</h2>
                <p className="text-[12px] text-muted-foreground">{selectedIds.length} Selected</p>
              </div>
            </div>
            <button
              onClick={() => handleSelectAll(idsOnCurrentPage)}
              className="px-3 py-1.5 border border-border rounded-full text-[12px] font-semibold hover:bg-accent bg-white dark:bg-card text-foreground cursor-pointer"
            >
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
        </>
      ) : (
        <PageHeader title={titleNode} subtitle="Select a template below or create one directly"
          action={
            <div className="flex items-center gap-2">
              <Link
                href={activeTab !== "all" ? `/quotations/new?template=${activeTab}` : "/quotations/new"}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-semibold hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20 cursor-pointer"
              >
                <Plus size={16} />
                <span className="hidden sm:inline text-[13px]">Create Quotation</span>
                <span className="sm:hidden text-[13px]">Create Quote</span>
              </Link>
            </div>
          }
        />
      )}

      {/* Template Tabs - Scrollable on mobile, bordered on desktop */}
      <div className="flex items-center gap-1 pt-1 md:pt-0 mb-0 md:mb-5 overflow-x-auto md:overflow-x-visible custom-scrollbar-hide md:border-b border-border pb-0 whitespace-nowrap">
        <div className="flex items-center gap-1 min-w-max md:min-w-0">
          <button
            onClick={() => updateParams({ template: "all" })}
            className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === "all"
              ? "text-primary border-primary"
              : "text-muted border-transparent hover:text-foreground"
              }`}
          >
            All ({totalCount})
          </button>

          {/* Show first 6 templates as tabs with truncated names */}
          {templates.slice(0, 6).map((t) => (
            <button
              key={t.id}
              onClick={() => updateParams({ template: String(t.id) })}
              className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === String(t.id)
                ? "text-primary border-primary"
                : "text-muted border-transparent hover:text-foreground"
                }`}
              title={t.name}
            >
              {t.name.length > 14 ? t.name.substring(0, 26) : t.name}
            </button>
          ))}

          {/* Create Template button if no templates exist */}
          {templates.length === 0 && (
            <Link href="/quotations/templates/new">
              <button className="px-2 py-1.5 text-[13px] font-bold text-primary hover:text-primary-dark transition-all flex items-center gap-1 border-b-2 border-transparent cursor-pointer">
                <Plus size={14} /> Create Template
              </button>
            </Link>
          )}

          {/* More dropdown if > 6 templates or if we want to manage templates */}
          {(templates.length > 6 || templates.length > 0) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${templates.slice(6).some(t => String(t.id) === activeTab)
                    ? "text-primary border-primary"
                    : "text-muted border-transparent hover:text-foreground"
                    }`}
                >
                  {templates.length > 6 ? "More" : <Settings2 size={16} />}
                  {templates.length > 6 && <ChevronDown size={14} />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {templates.slice(6).map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => updateParams({ template: String(t.id) })}
                    className={`cursor-pointer ${activeTab === String(t.id) ? "text-primary font-semibold" : ""}`}
                  >
                    {t.name}
                  </DropdownMenuItem>
                ))}
                {templates.length > 6 && <DropdownMenuSeparator />}
                <DropdownMenuItem asChild>
                  <Link href="/quotations/templates/new" className="flex items-center gap-2 text-primary font-semibold cursor-pointer">
                    <Plus size={14} />
                    <span>Create Template</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/quotations/templates" className="flex items-center gap-2 cursor-pointer">
                    <Settings2 size={14} />
                    <span>Manage Templates</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
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
                  number: q.quotationNumber,
                  isComparative: q.isComparative,
                }}
                mode="quotation"
                onDelete={handleDelete}
                isDownloading={downloadingId === q.id}
                onDownloadPDF={() => handleDownloadPDF(q.id)}
                isSelected={selectedIds.includes(q.id)}
                onSelect={() => toggleSelect(q.id)}
                selectionMode={true}
              />
            ))}
          </div>

          <div className="hidden md:block bg-surface border border-border rounded-2xl shadow-2xs overflow-visible">
            <div className="overflow-x-auto md:overflow-x-visible relative">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="text-muted/70 text-left">
                    <th className="sticky top-0 bg-background px-4 py-3 border-b border-border z-10 w-10 text-center rounded-tl-2xl">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => handleSelectAll(idsOnCurrentPage)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                    </th>
                    <th className="sticky top-0 bg-background px-5 py-3 font-bold border-b border-border z-10">Quotation #</th>
                    <th className="sticky top-0 bg-background px-5 py-3 font-bold border-b border-border z-10">Client</th>
                    <th className="sticky top-0 bg-background px-5 py-3 font-bold border-b border-border z-10">Branch</th>
                    <th className="sticky top-0 bg-background px-5 py-3 font-bold border-b border-border z-10">Subject</th>
                    <th className="sticky top-0 bg-background px-5 py-3 font-bold border-b border-border z-10 text-right">Amount</th>
                    <th className="sticky top-0 bg-background px-5 py-3 font-bold border-b border-border z-10">Status</th>
                    <th className="sticky top-0 bg-background px-5 py-3 font-bold border-b border-border z-10">Date</th>
                    <th className="sticky top-0 bg-background px-5 py-3 w-10 border-b border-border z-10 rounded-tr-2xl" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map((q) => (
                    <tr
                      key={q.id}
                      className={`hover:bg-primary-light/20 transition-colors group ${selectedIds.includes(q.id) ? "bg-primary-light/10" : ""}`}
                    >
                      <td className="px-4 py-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(q.id)}
                          onChange={() => toggleSelect(q.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                      </td>
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
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={q.status} />
                          {q.isComparative && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-600 border border-amber-200">
                              Comparative
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-foreground">
                        {formatDateDMY(q.createdAt)}
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
          <Pagination
            currentPage={currentPage}
            limit={limit}
            totalCount={totalCount}
            onPageChange={(page) => updateParams({ page })}
            onLimitChange={(limit) => updateParams({ limit })}
          />
        </div>
      )}

      {/* Mobile Sticky Actions Bar at bottom */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white dark:bg-card border-t border-border p-4 flex items-center gap-3 md:hidden shadow-lg animate-fade-in-up">
          <button
            onClick={handleBulkDownload}
            disabled={bulkDownloading}
            className="flex-1 py-3 bg-slate-50 border border-border text-foreground hover:bg-accent rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <span className="text-[15px]">🖨️</span> Print PDF
          </button>
          <button
            onClick={handleBulkDownload}
            disabled={bulkDownloading}
            className="flex-1 py-3 bg-primary text-white hover:opacity-90 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-40 flex items-center justify-center"
          >
            <FileDown size={16} /> Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
