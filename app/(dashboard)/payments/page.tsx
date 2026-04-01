"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { getPayments } from "@/app/actions/payments";
import { getInvoices } from "@/app/actions/invoices";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import { formatINR } from "@/lib/utils";

type PaymentRow = Awaited<ReturnType<typeof getPayments>>[number];
type InvoiceRow = Awaited<ReturnType<typeof getInvoices>>[number];

export default function PaymentsPage() {
  const [paymentList, setPaymentList] = useState<PaymentRow[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceRow[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<InvoiceRow[]>([]);
  const [showInvoiceSelector, setShowInvoiceSelector] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<InvoiceRow | null>(null);

  async function load() {
    const [pay, inv] = await Promise.all([getPayments(), getInvoices()]);
    setPaymentList(pay);
    setAllInvoices(inv);
    setUnpaidInvoices(inv.filter((i) => i.status !== "paid"));
  }

  useEffect(() => {
    load();
  }, []);

  function handleRecordForInvoice(inv: InvoiceRow) {
    setPaymentTarget(inv);
    setShowInvoiceSelector(false);
  }

  function handleViewInvoicePayments(invoiceId: number) {
    const inv = allInvoices.find((i) => i.id === invoiceId);
    if (inv) setPaymentTarget(inv);
  }

  return (
    <>
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

      {paymentList.length === 0 && !showInvoiceSelector ? (
        <EmptyState
          title="No payments recorded"
          message="Record payments against invoices."
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#f9fafb] border-b border-gray-200 text-gray-500 text-left text-[11px] font-semibold  tracking-wider">
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Invoice</th>
                  <th className="px-5 py-4 font-medium">Client</th>
                  <th className="px-5 py-4 text-right font-medium">Amount</th>
                  <th className="px-5 py-4 text-right font-medium">TDS</th>
                  <th className="px-5 py-4 font-medium">Method</th>
                  <th className="px-5 py-4 font-medium">Ref#</th>
                  <th className="px-5 py-4 font-medium">Deposit To</th>
                  <th className="px-5 py-4 font-medium">Received On</th>
                  <th className="px-5 py-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentList.map((p) => (
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
                    <td className="px-5 py-4 font-medium text-[#0052cc] hover:underline whitespace-nowrap">
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
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                      {p.referenceNumber || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600 capitalize whitespace-nowrap">
                      {p.depositTo?.replace(/_/g, " ") || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                      {p.paymentReceivedOn
                        ? new Date(p.paymentReceivedOn).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-500 italic max-w-[150px] truncate">
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
          onSuccess={() => load()}
        />
      )}
    </>
  );
}
