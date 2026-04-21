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
  MoreHorizontal,
  ChevronDown,
  Printer,
  Copy,
  Trash2,
  FileText,
  RefreshCw,
  Mail,
  Share,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  const tplConfig = getTemplateConfig(quotation.template?.name, quotation.template);

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
    initialDate: quotation.quotationDate || new Date(quotation.createdAt).toISOString().split("T")[0],
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
    template: quotation.template,
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
      <div className="flex items-center p-2 justify-between md:mb-4 mb-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="flex items-center gap-1.5 text-[13px] text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <span className="text-muted">|</span>
          <span
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg ${isSent ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
          >
            {quotation.status.toUpperCase()}
          </span>
          <input
            value={editor.docNumber}
            readOnly
            className="text-[15px] font-bold text-foreground bg-transparent border-0 focus:outline-none w-[160px] pointer-events-none"
          />

        </div>
        <div className="flex justify-end w-full md:w-auto md:items-center gap-1 text-[13px] font-medium text-muted">
          <Link
            href={`/quotations/${quotation.id}/edit`}
            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Edit2 size={14} /> Edit
          </Link>

          <span className="w-px h-4 bg-slate-200 mx-1"></span>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors outline-none cursor-pointer">
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              PDF/Print <ChevronDown size={14} className="opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuItem onClick={handleDownloadPDF} disabled={downloading}>
                <FileText size={14} className="mr-2" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF} disabled={downloading}>
                <Printer size={14} className="mr-2" /> Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="w-px h-4 bg-slate-200 mx-1"></span>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 hover:bg-slate-100 rounded-md transition-colors outline-none cursor-pointer">
              <MoreHorizontal size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {isDraft && (
                <DropdownMenuItem onClick={handleSend} disabled={sending}>
                  <Mail size={14} className="mr-2" /> Mark As Sent
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                disabled={quotation.status === "invoiced"}
                onClick={async () => {
                  const { generateInvoice } = await import("@/app/actions/invoices");
                  const invoice = await generateInvoice(quotation.id);
                  router.push(`/invoices/${invoice.id}`);
                }}
              >
                <FileText size={14} className="mr-2" /> Convert to Invoice
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  const { cloneQuotation } = await import("@/app/actions/quotations");
                  const cloned = await cloneQuotation(quotation.id);
                  router.push(`/quotations/${cloned.id}`);
                }}
              >
                <Copy size={14} className="mr-2" /> Clone
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  if (confirm("Delete this quotation?")) {
                    const { deleteQuotation } = await import("@/app/actions/quotations");
                    await deleteQuotation(quotation.id);
                    router.push("/quotations");
                  }
                }}
              >
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem>
                <Settings size={14} className="mr-2 text-muted" /> Quote Preferences
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Document */}
      <div className="w-full flex justify-center overflow-hidden pb-0 md:pb-4 document-readonly">
        <div
          className="bg-white border border-gray-200 overflow-hidden px-2 md:px-8 w-full max-w-none origin-top"
          style={{ zoom: "min(1, calc((100vw - 32px) / 820))" } as any}
        >
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
            primaryColor={tplConfig.primaryColor}
            secondaryColor={tplConfig.secondaryColor}
            headerImage={tplConfig.headerImage}
            templateName={quotation.template?.name || ""}
            formatINR={formatINR}
            inputCls={editor.inputCls}
          />
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
