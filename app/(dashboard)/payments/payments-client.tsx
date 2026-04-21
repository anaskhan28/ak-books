"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { formatINR } from "@/lib/utils";
import StatusBadge from "@/components/ui/status-badge";
import dynamic from "next/dynamic";

// Dynamic import for modal to reduce main bundle size
const RecordPaymentModal = dynamic(() => import("@/components/payments/RecordPaymentModal"), {
  ssr: false,
});

interface PaymentRow {
  id: number;
  invoiceId: number;
  invoiceNumber: string | null;
  clientName: string | null;
  amount: number;
  TDSAmount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string | null;
  depositTo: string | null;
  paymentReceivedOn: string | null;
  notes: string | null;
}

interface InvoiceRow {
  id: number;
  invoiceNumber: string;
  clientName: string | null;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

interface PaymentsClientProps {
  payments: PaymentRow[];
  invoices: InvoiceRow[];
}

export default function PaymentsClient({ payments, invoices }: PaymentsClientProps) {
  const router = useRouter();
  const [showInvoiceSelector, setShowInvoiceSelector] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<InvoiceRow | null>(null);

  const unpaidInvoices = invoices.filter((i) => i.status !== "paid");

  function handleRecordForInvoice(inv: InvoiceRow) {
    setPaymentTarget(inv);
    setShowInvoiceSelector(false);
  }

  function handleViewInvoicePayments(invoiceId: number) {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) setPaymentTarget(inv);
  }

  return (
    <div className="p-2 md:p-0">
      <PageHeader
        title="Payments"
        subtitle="Track client payments against invoices"
        action={
          <button
            onClick={() => setShowInvoiceSelector(!showInvoiceSelector)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            Record Payment
          </button>
        }
      />

      {showInvoiceSelector && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 mb-6 animate-fade-in-up">
          <label className="block text-[13px] font-medium text-gray-700 mb-2">
            Select an invoice to record payment
          </label>
          <div className="flex gap-3 max-w-2xl">
            <select
              onChange={(e) => {
                const inv = unpaidInvoices.find(
                  (i) => i.id === Number(e.target.value),
                );
                if (inv) handleRecordForInvoice(inv);
              }}
              className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>
                Choose an invoice...
              </option>
              {unpaidInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.clientName} (Balance:{" "}
                  {formatINR(inv.totalAmount - Number(inv.paidAmount))})
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowInvoiceSelector(false)}
              className="px-4 py-2.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          {unpaidInvoices.length === 0 && (
            <p className="text-[13px] text-gray-500 mt-3">
              No unpaid or partially paid invoices available.
            </p>
          )}
        </div>
      )}

      {payments.length === 0 && !showInvoiceSelector ? (
        <EmptyState
          title="No payments recorded"
          message="Record payments against invoices."
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] mt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#f9fafb] border-b border-gray-200 text-gray-500 text-left text-[11px] font-semibold tracking-wider">
                  <th className="px-5 py-4 font-medium uppercase whitespace-nowrap">Date</th>
                  <th className="px-5 py-4 font-medium uppercase whitespace-nowrap">Invoice</th>
                  <th className="px-5 py-4 font-medium uppercase whitespace-nowrap">Client</th>
                  <th className="px-5 py-4 text-right font-medium uppercase whitespace-nowrap">Amount</th>
                  <th className="px-5 py-4 text-right font-medium uppercase whitespace-nowrap">TDS</th>
                  <th className="px-5 py-4 font-medium uppercase whitespace-nowrap">Method</th>
                  <th className="px-5 py-4 font-medium uppercase hidden lg:table-cell whitespace-nowrap">Ref#</th>
                  <th className="px-5 py-4 font-medium uppercase hidden xl:table-cell whitespace-nowrap">Deposit To</th>
                  <th className="px-5 py-4 font-medium uppercase whitespace-nowrap">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                    onClick={() => handleViewInvoicePayments(p.invoiceId)}
                  >
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                      {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 font-medium text-primary hover:underline whitespace-nowrap">
                      {p.invoiceNumber}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800 whitespace-nowrap">
                      {p.clientName}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatINR(p.amount)}
                    </td>
                    <td className="px-5 py-4 text-right font-normal text-red-500 whitespace-nowrap">
                      {p.TDSAmount > 0 ? formatINR(p.TDSAmount) : "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600 capitalize whitespace-nowrap">
                      {p.paymentMethod.replace("_", " ")}
                    </td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap hidden lg:table-cell">
                      {p.referenceNumber || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600 capitalize whitespace-nowrap hidden xl:table-cell">
                      {p.depositTo?.replace(/_/g, " ") || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-500 italic max-w-[200px] truncate whitespace-nowrap">
                      {p.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
