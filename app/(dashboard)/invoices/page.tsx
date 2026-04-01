"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getInvoices } from "@/app/actions/invoices";
import { getQuotations } from "@/app/actions/quotations";
import { generateInvoice } from "@/app/actions/invoices";
import PageHeader from "@/components/ui/page-header";
import StatusBadge from "@/components/ui/status-badge";
import EmptyState from "@/components/ui/empty-state";
import InvoiceRowActions from "@/components/invoices/InvoiceRowActions";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import { formatINR } from "@/lib/utils";
import { getDueDateStatus } from "@/lib/due-date";
import { Plus, FileDown } from "lucide-react";

type InvoiceRow = Awaited<ReturnType<typeof getInvoices>>[number];
type QuotationRow = Awaited<ReturnType<typeof getQuotations>>[number];

// ── Due status badge colors ──────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  blue: "text-[#0052cc]",
  orange: "text-[#e67e22]",
  red: "text-[#e74c3c]",
  gray: "text-gray-400",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const router = useRouter();
  const [invoiceList, setInvoiceList] = useState<InvoiceRow[]>([]);
  const [pendingQuotations, setPendingQuotations] = useState<QuotationRow[]>(
    [],
  );
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<InvoiceRow | null>(null);

  async function load() {
    const [inv, quot] = await Promise.all([getInvoices(), getQuotations()]);
    setInvoiceList(inv);
    setPendingQuotations(
      quot.filter((q) => q.status === "accepted" || q.status === "sent"),
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function handleGenerate(quotationId: number) {
    setGenerating(true);
    const invoice = await generateInvoice(quotationId);
    setGenerating(false);
    router.push(`/invoices/${invoice.id}`);
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
        date:
          dbInvoice.invoiceDate ||
          new Date(dbInvoice.createdAt).toISOString().split("T")[0],
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
      alert(
        "Failed to download PDF. Please try again or download from the editor.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Create invoices or generate from accepted quotations"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/invoices/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
            >
              <Plus size={16} />
              Create Invoice
            </Link>
            <button
              onClick={() => setShowGenerate(!showGenerate)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-normal hover:bg-gray-50 transition-colors shadow-sm"
            >
              <FileDown size={16} />
              From Quotation
            </button>
          </div>
        }
      />

      {/* ── Generate from Quotation panel ── */}
      {showGenerate && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 mb-6 animate-fade-in-up">
          <h3 className="text-[14px] font-medium text-gray-800 mb-3">
            Select a quotation to convert to invoice
          </h3>
          {pendingQuotations.length === 0 ? (
            <p className="text-[13px] text-gray-500">
              No accepted quotations available. Mark a quotation as
              &quot;accepted&quot; or &quot;sent&quot; first.
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
                    <p className="text-[12px] text-gray-500">
                      {formatINR(q.totalAmount)}
                    </p>
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

      {/* ── Invoice Table ── */}
      {invoiceList.length === 0 && !showGenerate ? (
        <EmptyState
          title="No invoices yet"
          message="Create a new invoice or generate one from an accepted quotation."
        />
      ) : (
        invoiceList.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[#f9fafb] border-b border-gray-200">
                  <tr className="text-left text-[11px] font-semibold text-gray-500  tracking-wider">
                    <th className="px-5 py-4 whitespace-nowrap">Invoice #</th>
                    <th className="px-5 py-4 whitespace-nowrap">
                      Customer Name
                    </th>
                    <th className="px-5 py-4 whitespace-nowrap">Branch</th>
                    <th className="px-5 py-4 whitespace-nowrap">
                      Invoice Status
                    </th>
                    <th className="px-5 py-4 text-right whitespace-nowrap">
                      Amount
                    </th>
                    <th className="px-5 py-4 text-right whitespace-nowrap">
                      Paid
                    </th>
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
                            className="font-medium text-[#0052cc] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-800">
                          {inv.clientName}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                          {inv.clientBranch || "—"}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-semibold tracking-wide ${STATUS_COLORS[due.color]}`}
                          >
                            {due.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right font-medium text-gray-800">
                          {formatINR(inv.totalAmount)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right text-gray-600">
                          {formatINR(Number(inv.paidAmount))}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <InvoiceRowActions
                            invoiceId={inv.id}
                            isDownloading={downloadingId === inv.id}
                            paymentLabel={
                              inv.status === "paid" ||
                              Number(inv.paidAmount) > 0
                                ? "View Payments"
                                : "Record Payment"
                            }
                            onRecordPayment={() => setPaymentTarget(inv)}
                            onDownloadPDF={() => handleDownloadPDF(inv.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Record Payment Modal ── */}
      {paymentTarget && (
        <RecordPaymentModal
          invoiceId={paymentTarget.id}
          invoiceNumber={paymentTarget.invoiceNumber}
          clientName={paymentTarget.clientName ?? ""}
          totalAmount={paymentTarget.totalAmount}
          paidAmount={Number(paymentTarget.paidAmount)}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => load()}
        />
      )}
    </>
  );
}
