"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Edit2, MoreHorizontal, ChevronDown, Printer, Copy, Trash2, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { updateDeliveryChallan, updateDeliveryChallanStatus } from "@/app/actions/delivery-challans";
import { formatINR } from "@/lib/utils";
import { getTemplateConfig } from "@/lib/pdf-templates/registry";
import { useDocumentEditor } from "@/lib/hooks/useDocumentEditor";
import { TemplateRenderer } from "@/components/document/TemplateRenderer";
import type { Client } from "@/app/db/schema";
import { alerts } from "@/lib/alerts";

interface Props {
  deliveryChallan: NonNullable<Awaited<ReturnType<typeof import("@/app/actions/delivery-challans").getDeliveryChallan>>>;
  clients: Client[];
}

export default function DCDetailClient({ deliveryChallan: dc, clients }: Props) {
  const router = useRouter();
  const tplConfig = getTemplateConfig(dc.template?.name, dc.template);
  const [downloading, setDownloading] = useState(false);

  const editor = useDocumentEditor({
    mode: "delivery_challan", templateName: dc.template?.name,
    initialNumber: dc.challanNumber, initialDate: dc.challanDate || new Date(dc.createdAt).toISOString().split("T")[0],
    initialClientName: dc.clientName || "", initialClientBranch: dc.clientBranch || "", initialClientGstin: dc.clientGstin,
    initialPlaceOfSupply: dc.placeOfSupply, initialSubject: dc.subject || "", initialNotes: dc.notes || "",
    initialItems: dc.items.map((i) => ({ description: i.description, rate: i.rate, qty: i.quantity, taxed: i.taxed || "", amount: i.amount })),
    initialAccount: { bankName: tplConfig.bank.bankName, accountNumber: tplConfig.bank.accountNumber, ifsc: tplConfig.bank.ifsc, accountHolder: tplConfig.bank.accountHolder, pan: tplConfig.bank.pan },
    initialShowTotal: dc.showTotal, template: dc.template,
  });

  async function handleDownloadPDF() { setDownloading(true); try { await editor.handleDownloadPDF(editor.docNumber, editor.docNumber); } catch (err) { console.error(err); } finally { setDownloading(false); } }

  return (
    <div className="max-w-[820px] mx-auto">
      <div className="flex items-center p-2 justify-between md:mb-4 mb-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/delivery-challans" className="flex items-center gap-1.5 text-[13px] text-muted hover:text-primary transition-colors"><ArrowLeft size={14} /> Back</Link>
          <span className="text-muted">|</span>
          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg ${dc.status === "delivered" ? "bg-green-100 text-green-700" : dc.status === "dispatched" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{dc.status.toUpperCase()}</span>
          <input value={editor.docNumber} readOnly className="text-[15px] font-bold text-foreground bg-transparent border-0 focus:outline-none w-[160px] pointer-events-none" />
        </div>
        <div className="flex justify-end w-full md:w-auto md:items-center gap-1 text-[13px] font-medium text-muted">
          <Link href={`/delivery-challans/${dc.id}/edit`} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors"><Edit2 size={14} /> Edit</Link>
          <span className="w-px h-4 bg-slate-200 mx-1" />
          <DropdownMenu><DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors outline-none cursor-pointer">{downloading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF <ChevronDown size={14} className="opacity-70" /></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem onClick={handleDownloadPDF}><FileText size={14} className="mr-2" /> PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          <span className="w-px h-4 bg-slate-200 mx-1" />
          <DropdownMenu><DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 hover:bg-slate-100 rounded-md transition-colors outline-none cursor-pointer"><MoreHorizontal size={14} /></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-[200px]">
            {dc.status === "draft" && <DropdownMenuItem onClick={async () => { await updateDeliveryChallanStatus(dc.id, "dispatched"); alerts.success("Dispatched"); router.refresh(); }}>Mark Dispatched</DropdownMenuItem>}
            <DropdownMenuItem onClick={async () => { const { cloneDeliveryChallan } = await import("@/app/actions/delivery-challans"); const c = await cloneDeliveryChallan(dc.id); alerts.success("Cloned"); router.push(`/delivery-challans/${c.id}`); }}><Copy size={14} className="mr-2" /> Clone</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => { if (await alerts.confirm("Delete?", "Cannot be undone.")) { const { deleteDeliveryChallan } = await import("@/app/actions/delivery-challans"); await deleteDeliveryChallan(dc.id); alerts.success("Deleted"); router.push("/delivery-challans"); } }}><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent></DropdownMenu>
        </div>
      </div>
      <div className="w-full flex justify-center overflow-hidden pb-0 md:pb-4 document-readonly">
        <div className="bg-white border border-gray-200 overflow-hidden px-2 md:px-8 w-full max-w-none origin-top" style={{ zoom: "min(1, calc((100vw - 32px) / 820))" } as any}>
          <TemplateRenderer generator={tplConfig.generator} mode="delivery_challan" items={editor.items} subtotal={editor.subtotal} clientName={editor.clientName} setClientName={editor.setClientName} clientBranch={editor.clientBranch} setClientBranch={editor.setClientBranch} clientGstin={editor.clientGstin} placeOfSupply={editor.placeOfSupply} setPlaceOfSupply={editor.setPlaceOfSupply} qtNumber={editor.docNumber} date={editor.date} setDate={editor.setDate} subject={editor.subject} setSubject={editor.setSubject} terms={editor.terms} setTerms={editor.setTerms} accountBankName={editor.accountBankName} setAccountBankName={editor.setAccountBankName} accountNumber={editor.accountNumber} setAccountNumber={editor.setAccountNumber} accountIfsc={editor.accountIfsc} setAccountIfsc={editor.setAccountIfsc} accountHolder={editor.accountHolder} setAccountHolder={editor.setAccountHolder} accountPan={editor.accountPan} setAccountPan={editor.setAccountPan} updateItem={editor.updateItem} handleKeyDown={editor.handleKeyDown} tableRef={editor.tableRef as React.RefObject<HTMLTableElement>} clients={clients} signatureImage={tplConfig.signatureImage} primaryColor={tplConfig.primaryColor} secondaryColor={tplConfig.secondaryColor} headerImage={tplConfig.headerImage} templateName={dc.template?.name || ""} formatINR={formatINR} isReadOnly={true} inputCls={editor.inputCls} showTotal={editor.showTotal} setShowTotal={editor.setShowTotal} />
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}
