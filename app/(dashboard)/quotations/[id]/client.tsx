"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  Save,
  ArrowLeft,
  Send,
  CheckCircle2,
  Loader2,
  Edit2,
} from "lucide-react";
import {
  updateQuotation,
  updateQuotationStatus,
} from "@/app/actions/quotations";
import { formatINR } from "@/lib/utils";
import { getTemplateConfig } from "@/lib/pdf-templates/registry";
import { useDocumentEditor } from "@/lib/hooks/useDocumentEditor";
import { TemplateRenderer } from "@/components/document/TemplateRenderer";
import type { Client } from "@/app/db/schema";

interface Props {
  quotation: NonNullable<
    Awaited<ReturnType<typeof import("@/app/actions/quotations").getQuotation>>
  >;
  clients: Client[];
}

export default function QuotationDetailClient({ quotation, clients }: Props) {
  const router = useRouter();
  const tplConfig = getTemplateConfig(quotation.template?.name);

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const inputCls =
    "w-full px-2 py-2 bg-transparent text-[15px] text-gray-800 border-0 focus:outline-none focus:bg-blue-50/30 placeholder:text-gray-300";

  const initialItems = quotation.items.map((i) => ({
    description: i.description,
    rate: i.rate,
    qty: i.quantity,
    taxed: i.taxed || "",
    amount: i.amount,
  }));

  const defaultTerms =
    tplConfig.generator === "madhu"
      ? quotation.notes || "GST(18%) is Extra."
      : tplConfig.generator === "atk"
        ? quotation.notes ||
        "1. Authorized work group\n2. Payment 100% Against Work Done .\n3. 18% GST Included"
        : quotation.notes ||
        "Payment 100% Against Work Done.\n18% GST Included";

  const editor = useDocumentEditor({
    mode: "quotation",
    templateName: quotation.template?.name,
    initialNumber: quotation.quotationNumber,
    initialDate: new Date(quotation.createdAt).toISOString().split("T")[0],
    initialClientName: quotation.clientName || "",
    initialClientBranch: quotation.clientBranch || "",
    initialSubject: quotation.subject || "",
    initialNotes: defaultTerms,
    initialItems,
    initialAccount: {
      bankName: tplConfig.bank.bankName,
      accountNumber: tplConfig.bank.accountNumber,
      ifsc: tplConfig.bank.ifsc,
      accountHolder: tplConfig.bank.accountHolder,
      pan: tplConfig.bank.pan,
    },
  });

  async function handleSave() {
    setSaving(true);
    const matchedClient = clients.find(
      (c) => c.name.toLowerCase() === editor.clientName.toLowerCase(),
    );
    let clientId = matchedClient?.id || quotation.clientId;
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
    await updateQuotation(
      quotation.id,
      {
        clientId,
        quotationNumber: editor.docNumber,
        subject: editor.subject || null,
        clientBranch: editor.clientBranch || null,
        notes: editor.terms || null,
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

  async function handleSend() {
    setSending(true);
    await updateQuotationStatus(quotation.id, "sent");
    setSending(false);
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

  const isSent = quotation.status === "sent";
  const isDraft = quotation.status === "draft";

  return (
    <div className="max-w-[820px] mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
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
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg ${isSent ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
          >
            {quotation.status.toUpperCase()}
          </span>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-[13px] font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Send size={13} /> {sending ? "Sending..." : "Mark Sent"}
            </button>
          )}
          {isSent && (
            <div className="flex items-center gap-1.5 px-3 py-2 text-green-600 text-[13px] font-semibold">
              <CheckCircle2 size={14} /> Sent
            </div>
          )}
          <Link
            href={`/quotations/${quotation.id}/edit`}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-[13px] font-medium text-muted hover:text-muted transition-colors disabled:opacity-50"
          >
            <Edit2 size={14} /> Edit
          </Link>
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
      <div className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden px-8">
        <div className="border-b border-gray-100">
          <img src={tplConfig.headerImage} alt="Header" className="w-full" />
        </div>
        <TemplateRenderer
          generator={tplConfig.generator}
          mode="quotation"
          items={editor.items}
          subtotal={editor.subtotal}
          clientName={editor.clientName}
          setClientName={editor.setClientName}
          clientBranch={editor.clientBranch}
          setClientBranch={editor.setClientBranch}
          qtNumber={editor.docNumber}
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
          signatureImage={tplConfig.signatureImage}
          formatINR={formatINR}
          inputCls={editor.inputCls}
        />
      </div>
      <div className="h-8" />
    </div>
  );
}
