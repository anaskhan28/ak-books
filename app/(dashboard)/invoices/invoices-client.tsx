"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateInvoice, deleteInvoice } from "@/app/actions/invoices";
import PageHeader from "@/components/ui/page-header";
import StatusBadge from "@/components/ui/status-badge";
import EmptyState from "@/components/ui/empty-state";
import InvoiceRowActions from "@/components/invoices/InvoiceRowActions";
import { formatINR } from "@/lib/utils";
import { getDueDateStatus } from "@/lib/due-date";
import { Plus, FileDown } from "lucide-react";
import DocumentCard from "@/components/common/document-card";

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
  pendingQuotations: QuotationRow[];
}

// ── Due status badge colors ──────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  blue: "text-primary",
  orange: "text-[#e67e22]",
  red: "text-[#e74c3c]",
  gray: "text-gray-400",
};

import { alerts } from "@/lib/alerts";

export default function InvoicesClient({ invoices: initialInvoices, pendingQuotations }: InvoicesClientProps) {
  const router = useRouter();
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<InvoiceRow | null>(null);

  // Use server-provided data, refresh via router.refresh()
  const invoiceList = initialInvoices;

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

  return (
    <div className="p-2 md:p-0">
      <PageHeader
        title="Invoices"
        subtitle="Create invoices or generate from accepted quotations"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/invoices/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
            >
              <Plus size={16} className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline text-[13px]">Create Invoice</span>
              <span className="sm:hidden text-[13px]">Invoice</span>
            </Link>
            <button
              onClick={() => setShowGenerate(!showGenerate)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-normal hover:bg-gray-50 transition-colors shadow-sm"
            >
              <FileDown size={16} />
              <span className="hidden sm:inline">From Quotation</span>
              <span className="sm:hidden">From Quotes</span>
            </button>
          </div>
        }
      />

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
            <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-background/50 text-muted/70 text-left">
                      <th className="px-5 py-4 whitespace-nowrap">Invoice #</th>
                      <th className="px-5 py-4 whitespace-nowrap">Customer Name</th>
                      <th className="px-5 py-4 whitespace-nowrap">Branch</th>
                      <th className="px-5 py-4 whitespace-nowrap">Invoice Status</th>
                      <th className="px-5 py-4 text-right whitespace-nowrap">Amount</th>
                      <th className="px-5 py-4 text-right whitespace-nowrap">Paid</th>
                      <th className="px-5 py-4 whitespace-nowrap">Status</th>
                      <th className="px-5 py-4 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoiceList.map((inv) => {
                      const due = getDueDateStatus(inv.dueDate);
                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                        >
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
                          <td className="px-5 py-4 whitespace-nowrap">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
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
          </div>
        )
      )}

      {/* ── Record Payment Modal ── */}
      {paymentTarget && RecordPaymentModal && (
        <RecordPaymentModal
          invoiceId={paymentTarget.id}
          invoiceNumber={paymentTarget.invoiceNumber}
          clientName={paymentTarget.clientName ?? ""}
          totalAmount={paymentTarget.totalAmount}
          paidAmount={Number(paymentTarget.paidAmount)}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
