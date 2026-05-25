"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { generateInvoice, deleteInvoice, updateInvoiceStatus } from "@/app/actions/invoices";
import PageHeader from "@/components/ui/page-header";
import StatusBadge from "@/components/ui/status-badge";
import EmptyState from "@/components/ui/empty-state";
import InvoiceRowActions from "@/components/invoices/InvoiceRowActions";
import { formatINR } from "@/lib/utils";
import { getDueDateStatus } from "@/lib/due-date";
import { Plus, FileDown, ChevronDown, Printer } from "lucide-react";
import DocumentCard from "@/components/common/document-card";
import Pagination from "@/components/common/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type InvoiceRow = {
  id: number;
  quotationId: number | null;
  quotationNumber: string | null;
  clientName: string | null;
  clientBranch: string | null;
  invoiceNumber: string;
  invoiceDate: string | null;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  createdAt: Date;
  paidAmount: number;
};

type QuotationRow = {
  id: number;
  quotationNumber: string;
  clientName: string | null;
  totalAmount: number;
  status: string | null;
};

interface InvoicesClientProps {
  invoices: InvoiceRow[];
  totalCount: number;
  pendingQuotations: QuotationRow[];
  currentPage: number;
  limit: number;
  activeStatus: string;
  activeTemplateId: string;
}

const STATUSES = [
  { value: "all", label: "All Invoices" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

// ── Due status badge colors ──────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  blue: "text-primary",
  orange: "text-[#e67e22]",
  red: "text-[#e74c3c]",
  gray: "text-gray-400",
  green: "text-emerald-600 font-semibold",
};

import { alerts } from "@/lib/alerts";

export default function InvoicesClient({
  invoices: initialInvoices,
  totalCount,
  pendingQuotations,
  currentPage,
  limit,
  activeStatus,
  activeTemplateId,
}: InvoicesClientProps) {
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

  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<InvoiceRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  // Use server-provided data, refresh via router.refresh()
  const invoiceList = initialInvoices;

  const idsOnCurrentPage = invoiceList.map((inv) => inv.id);
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
    if (!(await alerts.confirm(`Delete ${selectedIds.length} invoices?`, "This action cannot be undone."))) return;
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        await deleteInvoice(id);
        successCount++;
      }
      alerts.success(`Successfully deleted ${successCount} invoices`);
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
        await updateInvoiceStatus(id, newStatus);
      }
      alerts.success(`Updated status of ${selectedIds.length} invoices to ${newStatus.toUpperCase()}`);
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
      const { getInvoice } = await import("@/app/actions/invoices");
      const { generateAndDownloadMergedPdf } = await import("@/lib/download-pdf");

      const documentsData = [];
      for (const id of selectedIds) {
        const dbInvoice = await getInvoice(id);
        if (!dbInvoice) continue;

        documentsData.push({
          mode: "invoice" as const,
          templateName: dbInvoice.template?.name,
          docNumber: dbInvoice.invoiceNumber,
          filenamePrefix: dbInvoice.invoiceNumber,
          date: dbInvoice.invoiceDate || new Date(dbInvoice.createdAt).toISOString().split("T")[0],
          clientName: dbInvoice.clientName || "",
          clientBranch: dbInvoice.clientBranch || "",
          subject: dbInvoice.subject || "",
          items: dbInvoice.items.map((i) => ({
            description: i.description,
            rate: i.rate,
            qty: i.quantity,
            taxed: i.taxed || "",
            amount: i.amount,
          })),
          subtotal: dbInvoice.items.reduce((sum, item) => sum + item.amount, 0),
          terms: dbInvoice.notes || "",
          showTotal: dbInvoice.showTotal ?? undefined,
          accountInfo: {
            bankName: dbInvoice.accountBankName || "",
            accountNumber: dbInvoice.accountNumber || "",
            ifsc: dbInvoice.accountIfsc || "",
            accountHolder: dbInvoice.accountHolder || "",
            pan: dbInvoice.accountPan || "",
          },
        });
      }

      if (documentsData.length > 0) {
        const filename = "invoices";
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

  async function handleGenerate(quotationId: number) {
    setGenerating(true);
    const invoice = await generateInvoice(quotationId);
    setGenerating(false);
    router.push(`/invoices/${invoice.id}`);
  }

  async function handleDelete(e: React.MouseEvent | null, id: number) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!(await alerts.confirm("Delete this invoice?", "This action cannot be undone."))) return;
    await deleteInvoice(id);
    alerts.success("Invoice deleted");
    router.refresh();
  }
  async function handleDownloadPDF(invoiceId: number) {
    setDownloadingId(invoiceId);
    try {
      const { getInvoice } = await import("@/app/actions/invoices");
      const { generateAndDownloadPdf } = await import("@/lib/download-pdf");

      const dbInvoice = await getInvoice(invoiceId);
      if (!dbInvoice) throw new Error("Invoice not found");

      await generateAndDownloadPdf({
        mode: "invoice",
        templateName: dbInvoice.template?.name,
        docNumber: dbInvoice.invoiceNumber,
        filenamePrefix: dbInvoice.invoiceNumber,
        date: dbInvoice.invoiceDate || new Date(dbInvoice.createdAt).toISOString().split("T")[0],
        clientName: dbInvoice.clientName || "",
        clientBranch: dbInvoice.clientBranch || "",
        subject: dbInvoice.subject || "",
        items: dbInvoice.items.map((i) => ({
          description: i.description,
          rate: i.rate,
          qty: i.quantity,
          taxed: i.taxed || "",
          amount: i.amount,
        })),
        subtotal: dbInvoice.items.reduce((sum, item) => sum + item.amount, 0),
        terms: dbInvoice.notes || "",
        showTotal: dbInvoice.showTotal ?? undefined,
        accountInfo: {
          bankName: dbInvoice.accountBankName || "",
          accountNumber: dbInvoice.accountNumber || "",
          ifsc: dbInvoice.accountIfsc || "",
          accountHolder: dbInvoice.accountHolder || "",
          pan: dbInvoice.accountPan || "",
        },
      });
    } catch (err) {
      console.error(err);
      alerts.error("Failed to download PDF", "Please try again or download from the editor.");
    } finally {
      setDownloadingId(null);
    }
  }

  // Lazy load payment modal only when needed
  const RecordPaymentModal = paymentTarget
    ? require("@/components/payments/RecordPaymentModal").default
    : null;

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
                  <DropdownMenuItem onClick={() => handleBulkUpdateStatus("unpaid")} className="cursor-pointer">Mark as Unpaid</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkUpdateStatus("paid")} className="cursor-pointer">Mark as Paid</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkUpdateStatus("cancelled")} className="cursor-pointer">Mark as Cancelled</DropdownMenuItem>
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
                onClick={() => handleBulkUpdateStatus("paid")}
                className="px-3 py-1.5 border border-border rounded-lg text-[13px] hover:bg-accent font-medium cursor-pointer"
              >
                Mark As Paid
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
                <h2 className="text-[15px] font-bold text-foreground">Invoices</h2>
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
        <PageHeader
          title={titleNode}
          subtitle="Create invoices or generate from accepted quotations"
          action={
            <div className="flex items-center gap-2">
              <Link
                href="/invoices/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20 cursor-pointer"
              >
                <Plus size={16} className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline text-[13px]">Create Invoice</span>
                <span className="sm:hidden text-[13px]">Invoice</span>
              </Link>
              <button
                onClick={() => setShowGenerate(!showGenerate)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-normal hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <FileDown size={16} />
                <span className="hidden sm:inline">From Quotation</span>
                <span className="sm:hidden">From Quotes</span>
              </button>
            </div>
          }
        />
      )}

      {/* ── Generate from Quotation panel ── */}
      {showGenerate && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 mb-0 md:mb-6 animate-fade-in-up">
          <h3 className="text-[14px] font-medium text-gray-800 mb-3">
            Select a quotation to convert to invoice
          </h3>
          {pendingQuotations.length === 0 ? (
            <p className="text-[13px] text-gray-500">
              No accepted quotations available. Mark a quotation as &quot;accepted&quot; or &quot;sent&quot; first.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingQuotations.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary/20 transition-all bg-gray-50/50 hover:bg-white"
                >
                  <div>
                    <p className="text-[13px] font-medium text-gray-800">
                      {q.quotationNumber} — {q.clientName}
                    </p>
                    <p className="text-[12px] text-gray-500">{formatINR(q.totalAmount)}</p>
                  </div>
                  <button
                    onClick={() => handleGenerate(q.id)}
                    disabled={generating}
                    className="px-4 py-2 bg-primary text-white rounded-md text-[12px] font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {generating ? "..." : "Generate"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template Tabs - Scrollable on mobile, bordered on desktop */}
      <div className="flex items-center gap-1 pt-1 md:pt-0 mb-0 md:mb-5 overflow-x-auto md:overflow-x-visible custom-scrollbar-hide md:border-b border-border pb-0 whitespace-nowrap">
        <div className="flex items-center gap-1 min-w-max md:min-w-0">
          <button
            onClick={() => updateParams({ template: "all" })}
            className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTemplateId === "all"
              ? "text-primary border-primary"
              : "text-muted border-transparent hover:text-foreground"
              }`}
          >
            All ({totalCount})
          </button>
          
          <button
            onClick={() => updateParams({ template: "10" })}
            className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTemplateId === "10"
              ? "text-primary border-primary"
              : "text-muted border-transparent hover:text-foreground"
              }`}
          >
            AK Enterprises
          </button>

          <button
            onClick={() => updateParams({ template: "3" })}
            className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTemplateId === "3"
              ? "text-primary border-primary"
              : "text-muted border-transparent hover:text-foreground"
              }`}
          >
            Anas Khan Merchant
          </button>

          <button
            onClick={() => updateParams({ template: "4" })}
            className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTemplateId === "4"
              ? "text-primary border-primary"
              : "text-muted border-transparent hover:text-foreground"
              }`}
          >
            Atique Khan
          </button>
        </div>
      </div>

      {/* ── Invoice Table & Cards ── */}
      {invoiceList.length === 0 && !showGenerate ? (
        <EmptyState
          title="No invoices yet"
          message="Create a new invoice or generate one from an accepted quotation."
        />
      ) : (
        invoiceList.length > 0 && (
          <div className="mt-0 md:mt-2">
            {/* Mobile View */}
            <div className="md:hidden">
              {invoiceList.map((inv) => (
                <DocumentCard
                  key={inv.id}
                  mode="invoice"
                  onDelete={handleDelete}
                  onRecordPayment={() => setPaymentTarget(inv)}
                  onDownloadPDF={() => handleDownloadPDF(inv.id)}
                  isDownloading={downloadingId === inv.id}
                  onRefresh={() => router.refresh()}
                  isSelected={selectedIds.includes(inv.id)}
                  onSelect={() => toggleSelect(inv.id)}
                  selectionMode={selectedIds.length > 0}
                  data={{
                    ...inv,
                    number: inv.invoiceNumber,
                    date: inv.invoiceDate,
                    subject: null,
                  }}
                />
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-2xs overflow-visible">
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
                      <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 whitespace-nowrap">Invoice #</th>
                      <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 whitespace-nowrap">Customer Name</th>
                      <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 whitespace-nowrap">Branch</th>
                      <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 whitespace-nowrap">Invoice Status</th>
                      <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 text-right whitespace-nowrap">Amount</th>
                      <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 text-right whitespace-nowrap">Paid</th>
                      <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 w-10 rounded-tr-2xl" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoiceList.map((inv) => {
                      const isPaid = inv.status === "paid" || Number(inv.paidAmount) >= inv.totalAmount;
                      const due = isPaid
                        ? { label: "PAID", color: "green" }
                        : getDueDateStatus(inv.dueDate);
                      return (
                        <tr
                          key={inv.id}
                          className={`hover:bg-gray-50/80 transition-colors cursor-pointer group ${selectedIds.includes(inv.id) ? "bg-primary-light/10" : ""}`}
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                        >
                          <td className="px-4 py-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(inv.id)}
                              onChange={() => toggleSelect(inv.id)}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                            />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="font-semibold text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {inv.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap font-medium text-foreground">
                            {inv.clientName}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-foreground">
                            {inv.clientBranch || "—"}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-[11px] font-medium tracking-wide ${STATUS_COLORS[due.color]}`}>
                              {due.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right font-medium text-gray-800">
                            {formatINR(inv.totalAmount)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-foreground">
                            {formatINR(Number(inv.paidAmount))}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <InvoiceRowActions
                              invoiceId={inv.id}
                              status={inv.status}
                              isDownloading={downloadingId === inv.id}
                              paymentLabel={inv.status === "paid" || Number(inv.paidAmount) > 0 ? "View Payments" : "Record Payment"}
                              onRecordPayment={() => setPaymentTarget(inv)}
                              onDownloadPDF={() => handleDownloadPDF(inv.id)}
                              onDelete={() => handleDelete(null, inv.id)}
                              onRefresh={() => router.refresh()}
                            />
                          </td>
                        </tr>
                      );
                    })}
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
        )
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

      {/* ── Record Payment Modal ── */}
      {paymentTarget && RecordPaymentModal && (
        <RecordPaymentModal
          invoiceId={paymentTarget.id}
          invoiceNumber={paymentTarget.invoiceNumber}
          clientName={paymentTarget.clientName ?? ""}
          totalAmount={paymentTarget.totalAmount}
          paidAmount={Number(paymentTarget.paidAmount)}
          dueDate={paymentTarget.dueDate}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
