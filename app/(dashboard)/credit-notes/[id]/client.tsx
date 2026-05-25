"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Edit2, MoreHorizontal, ChevronDown, Printer, Copy, Trash2, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { updateCreditNote, updateCreditNoteStatus } from "@/app/actions/credit-notes";
import { formatINR } from "@/lib/utils";
import { getTemplateConfig } from "@/lib/pdf-templates/registry";
import { useDocumentEditor } from "@/lib/hooks/useDocumentEditor";
import { TemplateRenderer } from "@/components/document/TemplateRenderer";
import type { Client } from "@/app/db/schema";
import { alerts } from "@/lib/alerts";

interface Props {
  creditNote: NonNullable<Awaited<ReturnType<typeof import("@/app/actions/credit-notes").getCreditNote>>>;
  clients: Client[];
}

export default function CreditNoteDetailClient({ creditNote: cn, clients }: Props) {
  const router = useRouter();
  const tplConfig = getTemplateConfig(cn.template?.name, cn.template);
  const [downloading, setDownloading] = useState(false);

  const editor = useDocumentEditor({
    mode: "credit_note", templateName: cn.template?.name,
    initialNumber: cn.creditNoteNumber, initialDate: cn.creditNoteDate || new Date(cn.createdAt).toISOString().split("T")[0],
    initialClientName: cn.clientName || "", initialClientBranch: cn.clientBranch || "", initialClientGstin: cn.clientGstin,
    initialPlaceOfSupply: cn.placeOfSupply, initialSubject: cn.subject || "", initialNotes: cn.notes || "",
    initialItems: cn.items.map((i) => ({ description: i.description, rate: i.rate, qty: i.quantity, taxed: i.taxed || "", amount: i.amount })),
    initialAccount: { bankName: tplConfig.bank.bankName, accountNumber: tplConfig.bank.accountNumber, ifsc: tplConfig.bank.ifsc, accountHolder: tplConfig.bank.accountHolder, pan: tplConfig.bank.pan },
    initialShowTotal: cn.showTotal, template: cn.template,
  });

  async function handleDownloadPDF() { setDownloading(true); try { await editor.handleDownloadPDF(editor.docNumber, editor.docNumber); } catch (err) { console.error(err); } finally { setDownloading(false); } }

  return (
    <div className="max-w-[820px] mx-auto">
      <div className="flex items-center p-2 justify-between md:mb-4 mb-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/credit-notes" className="flex items-center gap-1.5 text-[13px] text-muted hover:text-primary transition-colors"><ArrowLeft size={14} /> Back</Link>
          <span className="text-muted">|</span>
          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg ${cn.status === "applied" ? "bg-green-100 text-green-700" : cn.status === "refunded" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"}`}>{cn.status.toUpperCase()}</span>
          <input value={editor.docNumber} readOnly className="text-[15px] font-bold text-foreground bg-transparent border-0 focus:outline-none w-[160px] pointer-events-none" />
        </div>
        <div className="flex justify-end w-full md:w-auto md:items-center gap-1 text-[13px] font-medium text-muted">
          <Link href={`/credit-notes/${cn.id}/edit`} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors"><Edit2 size={14} /> Edit</Link>
          <span className="w-px h-4 bg-slate-200 mx-1" />
          <DropdownMenu><DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors outline-none cursor-pointer">{downloading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF <ChevronDown size={14} className="opacity-70" /></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem onClick={handleDownloadPDF}><FileText size={14} className="mr-2" /> PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          <span className="w-px h-4 bg-slate-200 mx-1" />
          <DropdownMenu><DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 hover:bg-slate-100 rounded-md transition-colors outline-none cursor-pointer"><MoreHorizontal size={14} /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-[200px]">
            {cn.status === "issued" && <DropdownMenuItem onClick={async () => { await updateCreditNoteStatus(cn.id, "applied"); alerts.success("Marked Applied"); router.refresh(); }}>Mark Applied</DropdownMenuItem>}
            <DropdownMenuItem onClick={async () => { const { cloneCreditNote } = await import("@/app/actions/credit-notes"); const cloned = await cloneCreditNote(cn.id); alerts.success("Cloned"); router.push(`/credit-notes/${cloned.id}`); }}><Copy size={14} className="mr-2" /> Clone</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => { if (await alerts.confirm("Delete?", "Cannot be undone.")) { const { deleteCreditNote } = await import("@/app/actions/credit-notes"); await deleteCreditNote(cn.id); alerts.success("Deleted"); router.push("/credit-notes"); } }}><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent></DropdownMenu>
        </div>
      </div>
      <div className="w-full flex justify-center overflow-hidden pb-0 md:pb-4 document-readonly">
        <div className="bg-white border border-gray-200 overflow-hidden px-2 md:px-8 w-full max-w-none origin-top" style={{ zoom: "min(1, calc((100vw - 32px) / 820))" } as any}>
          <TemplateRenderer generator={tplConfig.generator} mode="credit_note" items={editor.items} subtotal={editor.subtotal} clientName={editor.clientName} setClientName={editor.setClientName} clientBranch={editor.clientBranch} setClientBranch={editor.setClientBranch} clientGstin={editor.clientGstin} placeOfSupply={editor.placeOfSupply} setPlaceOfSupply={editor.setPlaceOfSupply} qtNumber={editor.docNumber} date={editor.date} setDate={editor.setDate} subject={editor.subject} setSubject={editor.setSubject} terms={editor.terms} setTerms={editor.setTerms} accountBankName={editor.accountBankName} setAccountBankName={editor.setAccountBankName} accountNumber={editor.accountNumber} setAccountNumber={editor.setAccountNumber} accountIfsc={editor.accountIfsc} setAccountIfsc={editor.setAccountIfsc} accountHolder={editor.accountHolder} setAccountHolder={editor.setAccountHolder} accountPan={editor.accountPan} setAccountPan={editor.setAccountPan} updateItem={editor.updateItem} handleKeyDown={editor.handleKeyDown} tableRef={editor.tableRef as React.RefObject<HTMLTableElement>} clients={clients} signatureImage={tplConfig.signatureImage} primaryColor={tplConfig.primaryColor} secondaryColor={tplConfig.secondaryColor} headerImage={tplConfig.headerImage} templateName={cn.template?.name || ""} formatINR={formatINR} isReadOnly={true} inputCls={editor.inputCls} showTotal={editor.showTotal} setShowTotal={editor.setShowTotal} />
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}
