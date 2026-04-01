"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Download,
  Save,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  IndianRupee,
  Edit2,
  XCircle,
} from "lucide-react";
import { updateInvoice, updateInvoiceStatus } from "@/app/actions/invoices";
import { formatINR } from "@/lib/utils";
import { getTemplateConfig } from "@/lib/pdf-templates/registry";
import { useDocumentEditor } from "@/lib/hooks/useDocumentEditor";
import { TemplateRenderer } from "@/components/document/TemplateRenderer";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import type { Client } from "@/app/db/schema";

interface Props {
  invoice: NonNullable<
    Awaited<ReturnType<typeof import("@/app/actions/invoices").getInvoice>>
  >;
  clients: Client[];
}

export default function InvoiceDetailClient({ invoice, clients }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tplConfig = getTemplateConfig(invoice.template?.name);

  const [saving, setSaving] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const hasPayments = invoice.payments && invoice.payments.length > 0;

  const initialItems = invoice.items.map((i) => ({
    description: i.description,
    rate: i.rate,
    qty: i.quantity,
    taxed: i.taxed || "",
    amount: i.amount,
  }));

  const editor = useDocumentEditor({
    mode: "invoice",
    templateName: invoice.template?.name,
    initialNumber: invoice.invoiceNumber,
    initialDate:
      invoice.invoiceDate ||
      new Date(invoice.createdAt).toISOString().split("T")[0],
    initialClientName: invoice.clientName || "",
    initialClientBranch: invoice.clientBranch || "",
    initialSubject: invoice.subject || "",
    initialNotes: invoice.notes || "",
    initialItems,
    initialAccount: {
      bankName: invoice.accountBankName || tplConfig.bank.bankName,
      accountNumber: invoice.accountNumber || tplConfig.bank.accountNumber,
      ifsc: invoice.accountIfsc || tplConfig.bank.ifsc,
      accountHolder: invoice.accountHolder || tplConfig.bank.accountHolder,
      pan: invoice.accountPan || tplConfig.bank.pan,
    },
  });

  // Auto-download PDF when navigated with ?download=true
  useEffect(() => {
    if (searchParams.get("download") === "true") {
      // Small delay to ensure editor is fully initialized
      const timer = setTimeout(async () => {
        try {
          await editor.handleDownloadPDF(editor.docNumber, editor.docNumber);
        } catch (err) {
          console.error("Auto PDF download failed:", err);
        }
        // Clean up the URL
        router.replace(`/invoices/${invoice.id}`, { scroll: false });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setSaving(true);
    const matchedClient = clients.find(
      (c) => c.name.toLowerCase() === editor.clientName.toLowerCase(),
    );
    let clientId = matchedClient?.id || invoice.clientId;
    if (!matchedClient && editor.clientName) {
      const { createClient } = await import("@/app/actions/clients");
      const newClient = await createClient({
        name: editor.clientName,
        contactPerson: null,
        phone: null,
        email: null,
        address: null,
      });
      clientId = newClient.id;
    }
    await updateInvoice(
      invoice.id,
      {
        clientId,
        invoiceNumber: editor.docNumber,
        subject: editor.subject || null,
        clientBranch: editor.clientBranch || null,
        notes: editor.terms || null,
        invoiceDate: editor.date,
        accountBankName: editor.accountBankName,
        accountNumber: editor.accountNumber,
        accountIfsc: editor.accountIfsc,
        accountHolder: editor.accountHolder,
        accountPan: editor.accountPan,
      },
      editor.filledItems.map((i) => ({
        description: i.description,
        quantity: i.qty,
        rate: i.rate,
        taxed: i.taxed || null,
        amount: i.amount,
      })),
    );
    setSaving(false);
    router.refresh();
  }

  async function handleMarkPaid() {
    setMarkingPaid(true);
    await updateInvoiceStatus(invoice.id, "paid");
    setMarkingPaid(false);
    router.refresh();
  }

  async function handleDownloadPDF() {
    setDownloading(true);
    try {
      await editor.handleDownloadPDF(editor.docNumber, editor.docNumber);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  const isPaid = invoice.status === "paid";
  const isUnpaid = invoice.status === "unpaid";

  return (
    <div className="max-w-[820px] mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="flex items-center gap-1.5 text-[13px] text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <span className="text-muted">|</span>
          <input
            value={editor.docNumber}
            onChange={(e) => editor.setDocNumber(e.target.value)}
            className="text-[15px] font-bold text-muted bg-transparent border-0 border-b border-dashed border-transparent hover:border-gray-300 focus:border-primary focus:outline-none w-[160px]"
          />
          <span
            className={`flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-lg ${isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
          >
            {isPaid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{invoice.status.toUpperCase()}
          </span>
        </div>
        <div className="flex gap-2">
          {/* {isUnpaid && (
            <button
              onClick={handleMarkPaid}
              disabled={markingPaid}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-[13px] font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <IndianRupee size={13} />{" "}
              {markingPaid ? "Updating..." : "Mark as Paid"}
            </button>
          )} */}

          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-[13px] font-medium text-muted hover:text-muted transition-colors disabled:opacity-50"
          >
            <Edit2 size={14} /> Edit
          </Link>

          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-[13px] font-semibold hover:bg-green-700 transition-colors"
          >
            <IndianRupee size={14} /> {hasPayments ? "View Payments" : "Record Payment"}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-[13px] font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-[13px] font-medium text-muted hover:text-muted transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {downloading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
        <div className="border-b border-gray-100">
          <img src={tplConfig.headerImage} alt="Header" className="w-full" />
        </div>
        <TemplateRenderer
          generator={tplConfig.generator}
          mode="invoice"
          items={editor.items}
          subtotal={editor.subtotal}
          clientName={editor.clientName}
          setClientName={editor.setClientName}
          clientBranch={editor.clientBranch}
          setClientBranch={editor.setClientBranch}
          date={editor.date}
          setDate={editor.setDate}
          subject={editor.subject}
          setSubject={editor.setSubject}
          terms={editor.terms}
          setTerms={editor.setTerms}
          accountBankName={editor.accountBankName}
          setAccountBankName={editor.setAccountBankName}
          accountNumber={editor.accountNumber}
          setAccountNumber={editor.setAccountNumber}
          accountIfsc={editor.accountIfsc}
          setAccountIfsc={editor.setAccountIfsc}
          accountHolder={editor.accountHolder}
          setAccountHolder={editor.setAccountHolder}
          accountPan={editor.accountPan}
          setAccountPan={editor.setAccountPan}
          updateItem={editor.updateItem}
          handleKeyDown={editor.handleKeyDown}
          tableRef={editor.tableRef as React.RefObject<HTMLTableElement>}
          clients={clients}
          qtNumber={editor.docNumber}
          signatureImage={tplConfig.signatureImage}
          formatINR={formatINR}
          inputCls={editor.inputCls}
        />
      </div>
      <div className="h-8" />
      {paymentModalOpen && (
        <RecordPaymentModal
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          clientName={invoice.clientName || ""}
          totalAmount={invoice.totalAmount}
          paidAmount={invoice.payments?.reduce((s, p) => s + p.amount + (p.TDSAmount || 0), 0) || 0}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => {
            setPaymentModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
