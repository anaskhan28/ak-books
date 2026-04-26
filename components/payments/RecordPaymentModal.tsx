"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { alerts } from "@/lib/alerts";
import { X, Trash2, Loader2, AlertCircle } from "lucide-react";
import {
  recordPayment,
  getPaymentsForInvoice,
  deletePayment,
} from "@/app/actions/payments";
import { updateInvoiceStatus } from "@/app/actions/invoices";

import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Credit/Debit Card" },
];

const DEPOSIT_OPTIONS = [
  { value: "petty_cash", label: "Petty Cash" },
  { value: "bank_account", label: "Bank Account" },
  { value: "undeposited_funds", label: "Undeposited Funds" },
];

// ── CSS Constants ────────────────────────────────────────────────────────────

const fieldCls = "w-full px-3 py-2 text-[13px] text-[#1a1d26] bg-white border border-[#e5e7eb] rounded-[10px] outline-none transition-all focus:border-[#0052cc] focus:ring-4 focus:ring-[#0052cc]/10 placeholder:text-[#c0c4cc]";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RecordPaymentProps {
  invoiceId: number;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  onClose: () => void;
  onSuccess?: () => void;
}

type PaymentRecord = Awaited<ReturnType<typeof getPaymentsForInvoice>>[number];

// ── Component ────────────────────────────────────────────────────────────────

export default function RecordPaymentModal({
  invoiceId,
  invoiceNumber,
  totalAmount,
  onClose,
  onSuccess,
}: RecordPaymentProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Payments State
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [amount, setAmount] = useState("");
  const [tdsAmount, setTdsAmount] = useState("0");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentReceivedOn, setPaymentReceivedOn] = useState("");
  const [depositTo, setDepositTo] = useState("petty_cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadPayments() {
    try {
      setLoadingInitial(true);
      const data = await getPaymentsForInvoice(invoiceId);
      setPaymentsList(data);
      const totalSettled = data.reduce(
        (sum, p) => sum + p.amount + p.TDSAmount,
        0,
      );
      const rem = Math.max(0, totalAmount - totalSettled);
      if (rem > 0) setAmount(String(rem));
      else setAmount("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInitial(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, [invoiceId]);

  const totalSettledFromPayments = paymentsList.reduce(
    (sum, p) => sum + p.amount + p.TDSAmount,
    0,
  );
  const balance = Math.max(0, totalAmount - totalSettledFromPayments);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleSave() {
    setError("");
    const numAmount = Number(amount);
    const numTds = Number(tdsAmount) || 0;

    if (!numAmount || numAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (numTds < 0) {
      setError("TDS amount cannot be negative");
      return;
    }
    if (numAmount + numTds > balance) {
      setError(
        `Amount received (₹${numAmount.toLocaleString(
          "en-IN",
        )}) + TDS (₹${numTds.toLocaleString(
          "en-IN",
        )}) = ₹${(numAmount + numTds).toLocaleString(
          "en-IN",
        )} exceeds remaining balance of ₹${balance.toLocaleString("en-IN")}`,
      );
      return;
    }
    if (!paymentDate) {
      setError("Payment date is required");
      return;
    }

    setSaving(true);
    try {
      await recordPayment({
        invoiceId,
        amount: numAmount,
        TDSAmount: numTds,
        paymentDate,
        paymentMethod: paymentMode,
        referenceNumber: referenceNumber || null,
        depositTo,
        paymentReceivedOn: paymentReceivedOn || null,
        notes: notes || null,
      });
      onSuccess?.();
      await loadPayments();
      setTdsAmount("0");
      setReferenceNumber("");
      setNotes("");
    } catch {
      setError("Failed to record payment. Please try again.");
    } finally {
      setSaving(false);
    }
  }



  async function handleDeletePayment(id: number) {
    if (!(await alerts.confirm("Delete this payment?", "This action cannot be undone."))) return;
    setDeletingId(id);
    try {
      await deletePayment(id);
      alerts.success("Payment deleted");
      onSuccess?.();
      await loadPayments();
    } catch (err) {
      console.error(err);
      alerts.error("Failed to delete payment");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleFixStatus() {
    if (!(await alerts.confirm("Remove the Paid status from this invoice?"))) return;
    setSaving(true);
    try {
      await updateInvoiceStatus(invoiceId, "unpaid");
      alerts.success("Invoice status updated to Unpaid");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      alerts.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  const numAmt = Number(amount) || 0;
  const numTds = Number(tdsAmount) || 0;
  const totalSettledSummary = numAmt + numTds;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-2 bg-foreground/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[660px] max-h-[90vh] flex flex-col ">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900">
              Payments for {invoiceNumber}
            </h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Invoice Total: ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:py-5 ">
          {loadingInitial ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : (
            <div className="space-y-6">
              {paymentsList.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[13px] font-semibold text-foreground">
                    Recorded Payments
                  </h3>
                  <div className="border border-gray-100 rounded-lg overflow-x-auto bg-gray-50/50">
                    <table className="w-full text-left text-[13px] min-w-[550px]">
                      <thead>
                        <tr className="border-b border-gray-100 text-muted font-medium">
                          <th className="px-4 py-2 font-medium">Date</th>
                          <th className="px-4 py-2 font-medium">Received On</th>
                          <th className="px-4 py-2 font-medium">Mode</th>
                          <th className="px-4 py-2 font-medium">Ref#</th>
                          <th className="px-4 py-2 font-medium text-right">Amount</th>
                          <th className="px-4 py-2 font-medium text-right">TDS</th>
                          <th className="px-4 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {paymentsList.map((p) => (
                          <Fragment key={p.id}>
                            <tr className={p.notes ? "" : "border-b border-gray-100"}>
                              <td className="px-4 py-2.5 align-top">
                                <div className="font-medium text-gray-800">
                                  {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 align-top">
                                <div className="text-foreground">
                                  {p.paymentReceivedOn ? new Date(p.paymentReceivedOn).toLocaleDateString("en-IN") : "—"}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 align-top capitalize">
                                <div className="text-foreground">
                                  {p.paymentMethod.replace("_", " ")}
                                </div>
                                {p.depositTo && (
                                  <div className="text-muted text-[11px] mt-0.5">
                                    To: {p.depositTo.replace(/_/g, " ")}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5 align-top">
                                <div className="text-foreground">
                                  {p.referenceNumber || "—"}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right align-top">
                                <div className="font-medium text-foreground">
                                  ₹{p.amount.toLocaleString("en-IN")}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right align-top">
                                <div className="text-foreground">
                                  {p.TDSAmount > 0 ? `₹${p.TDSAmount.toLocaleString("en-IN")}` : "—"}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right align-top">
                                <button
                                  onClick={() => handleDeletePayment(p.id)}
                                  disabled={deletingId === p.id}
                                  className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors disabled:opacity-50"
                                  title="Delete Payment"
                                >
                                  {deletingId === p.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
                                </button>
                              </td>
                            </tr>
                            {p.notes && (
                              <tr className="bg-gray-50/50 border-b border-gray-100">
                                <td colSpan={7} className="px-4 pb-2 pt-0 text-[12px] text-gray-600 italic">
                                  <span className="font-medium not-italic text-gray-500 mr-1">Note:</span>
                                  {p.notes}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end text-[13px] font-medium text-gray-800">
                    Remaining Balance: ₹{balance.toLocaleString("en-IN")}
                  </div>
                </div>
              )}
              {/* 
              {paymentsList.length === 0 && balance === totalAmount && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] text-amber-800 font-medium">
                      No payments recorded
                    </p>
                    <p className="text-[12px] text-amber-700 mt-1">
                      If this invoice shows as &quot;Paid&quot;, it was marked manually without an actual payment record. You can revert it to Unpaid or record a payment below.
                    </p>
                    <button
                      onClick={handleFixStatus}
                      disabled={saving}
                      className="mt-3 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[12px] font-medium transition-colors"
                    >
                      Revert to Unpaid Status
                    </button>
                  </div>
                </div>
              )} */}

              {balance > 0 ? (
                <div className="pt-2">
                  <h3 className="text-[13px] font-semibold text-gray-800 pb-1">
                    Record New Payment
                  </h3>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] px-4 py-2.5 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Field label="Amount Received (INR)" required>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className={`${fieldCls} pl-7 font-semibold md:text-[15px] text-[13px] border-primary ring-1 ring-primary/20`}
                          min={0}
                          max={balance}
                        />
                      </div>
                    </Field>
                    <Field label="TDS Deducted (if any)">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent text-[13px]">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={tdsAmount}
                          onChange={(e) => setTdsAmount(e.target.value)}
                          placeholder="0"
                          className={`${fieldCls} pl-7`}
                          min={0}
                        />
                      </div>
                    </Field>
                  </div>

                  {numTds > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-[12px] text-blue-700 flex items-center justify-between">
                      <span>
                        Amount Received: ₹{numAmt.toLocaleString("en-IN")} + TDS:
                        ₹{numTds.toLocaleString("en-IN")}
                      </span>
                      <span className="font-semibold">
                        Total Settled: ₹{totalSettledSummary.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Payment Date" required>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              fieldCls,
                              "justify-start text-left font-normal h-auto hover:bg-transparent hover:text-inherit w-full",
                              !paymentDate && "text-[#c0c4cc]"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {paymentDate ? format(parseISO(paymentDate), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[60]" align="start">
                          <Calendar
                            mode="single"
                            selected={paymentDate ? parseISO(paymentDate) : undefined}
                            onSelect={(d) => setPaymentDate(d ? format(d, "yyyy-MM-dd") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field label="Payment Mode">
                      <Select value={paymentMode} onValueChange={setPaymentMode}>
                        <SelectTrigger className={cn(fieldCls, "h-auto font-normal w-full overflow-hidden whitespace-nowrap")}>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent className="z-[60]">
                          {PAYMENT_MODES.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Payment Received On">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              fieldCls,
                              "justify-start text-left font-normal h-auto hover:bg-transparent hover:text-inherit w-full",
                              !paymentReceivedOn && "text-[#c0c4cc]"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {paymentReceivedOn ? format(parseISO(paymentReceivedOn), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[60]" align="start">
                          <Calendar
                            mode="single"
                            selected={paymentReceivedOn ? parseISO(paymentReceivedOn) : undefined}
                            onSelect={(d) => setPaymentReceivedOn(d ? format(d, "yyyy-MM-dd") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field label="Deposit To" required>
                      <Select value={depositTo} onValueChange={setDepositTo}>
                        <SelectTrigger className={cn(fieldCls, "h-auto font-normal w-full overflow-hidden whitespace-nowrap")}>
                          <SelectValue placeholder="Select deposit account" />
                        </SelectTrigger>
                        <SelectContent className="z-[60]">
                          {DEPOSIT_OPTIONS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Reference #">
                      <input
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Transaction / Cheque No."
                        className={fieldCls}
                      />
                    </Field>
                    <Field label="Notes">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={1}
                        placeholder="Optional notes..."
                        className={`${fieldCls}`}
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl text-center">
                  <span className="text-[14px] font-semibold block mb-1">
                    Invoice Fully Paid
                  </span>
                  <span className="text-[13px] opacity-90">
                    No further payments can be recorded for this invoice.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving || loadingInitial}
            className="px-5 py-2.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {balance === 0 ? "Close" : "Cancel"}
          </button>
          {balance > 0 && !loadingInitial && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 text-[13px] font-medium text-white bg-primary rounded-xl hover:bg-primary/80 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Record Payment"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-gray-500 mb-1.5 mt-4 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
