"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, ArrowLeft, Loader2, Edit2, MoreHorizontal, ChevronDown, Printer, Copy, Trash2, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { updateSalesOrder, updateSalesOrderStatus } from "@/app/actions/sales-orders";
import { formatINR } from "@/lib/utils";
import { getTemplateConfig } from "@/lib/pdf-templates/registry";
import { useDocumentEditor } from "@/lib/hooks/useDocumentEditor";
import { TemplateRenderer } from "@/components/document/TemplateRenderer";
import type { Client } from "@/app/db/schema";
import { alerts } from "@/lib/alerts";

interface Props {
  salesOrder: NonNullable<Awaited<ReturnType<typeof import("@/app/actions/sales-orders").getSalesOrder>>>;
  clients: Client[];
}

export default function SalesOrderDetailClient({ salesOrder, clients }: Props) {
  const router = useRouter();
  const tplConfig = getTemplateConfig(salesOrder.template?.name, salesOrder.template);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const initialItems = salesOrder.items.map((i) => ({
    description: i.description,
    rate: i.rate,
    qty: i.quantity,
    taxed: i.taxed || "",
    amount: i.amount,
  }));

  const defaultTerms = salesOrder.notes || "Payment 100% Against Work Done.\n18% GST Included";

  const editor = useDocumentEditor({
    mode: "sales_order",
    templateName: salesOrder.template?.name,
    initialNumber: salesOrder.orderNumber,
    initialDate: salesOrder.orderDate || new Date(salesOrder.createdAt).toISOString().split("T")[0],
    initialClientName: salesOrder.clientName || "",
    initialClientBranch: salesOrder.clientBranch || "",
    initialClientGstin: salesOrder.clientGstin,
    initialPlaceOfSupply: salesOrder.placeOfSupply,
    initialSubject: salesOrder.subject || "",
    initialNotes: defaultTerms,
    initialItems,
    initialAccount: {
      bankName: tplConfig.bank.bankName,
      accountNumber: tplConfig.bank.accountNumber,
      ifsc: tplConfig.bank.ifsc,
      accountHolder: tplConfig.bank.accountHolder,
      pan: tplConfig.bank.pan,
    },
    initialShowTotal: salesOrder.showTotal,
    template: salesOrder.template,
  });

  async function handleSave() {
    const { valid, message } = editor.validate();
    if (!valid) { alerts.warning(message || "Please check required fields"); return; }
    setSaving(true);
    const matchedClient = clients.find((c) => c.name.toLowerCase() === editor.clientName.toLowerCase());
    let clientId = matchedClient?.id || salesOrder.clientId;
    if (!matchedClient && editor.clientName) {
      const { createClient } = await import("@/app/actions/clients");
      const newClient = await createClient({ name: editor.clientName, contactPerson: null, phone: null, email: null, address: null });
      clientId = newClient.id;
    }
    await updateSalesOrder(
      salesOrder.id,
      { clientId, orderNumber: editor.docNumber, subject: editor.subject || null, clientBranch: editor.clientBranch || null, notes: editor.terms || null, placeOfSupply: editor.placeOfSupply || null, showTotal: editor.showTotal },
      editor.filledItems.map((i) => ({ description: i.description, quantity: i.qty, rate: i.rate, taxed: i.taxed || null, amount: i.amount })),
    );
    setSaving(false);
    alerts.success("Sales order updated");
    router.refresh();
  }

  async function handleDownloadPDF() {
    setDownloading(true);
    try { await editor.handleDownloadPDF(editor.docNumber, editor.docNumber); } catch (err) { console.error(err); } finally { setDownloading(false); }
  }

  const isDraft = salesOrder.status === "draft";

  return (
    <div className="max-w-[820px] mx-auto">
      <div className="flex items-center p-2 justify-between md:mb-4 mb-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/sales-orders" className="flex items-center gap-1.5 text-[13px] text-muted hover:text-primary transition-colors"><ArrowLeft size={14} /> Back</Link>
          <span className="text-muted">|</span>
          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-lg ${salesOrder.status === "confirmed" ? "bg-green-100 text-green-700" : salesOrder.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
            {salesOrder.status.toUpperCase()}
          </span>
          <input value={editor.docNumber} readOnly className="text-[15px] font-bold text-foreground bg-transparent border-0 focus:outline-none w-[160px] pointer-events-none" />
        </div>
        <div className="flex justify-end w-full md:w-auto md:items-center gap-1 text-[13px] font-medium text-muted">
          <Link href={`/sales-orders/${salesOrder.id}/edit`} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors"><Edit2 size={14} /> Edit</Link>
          <span className="w-px h-4 bg-slate-200 mx-1"></span>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 rounded-md transition-colors outline-none cursor-pointer">
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF/Print <ChevronDown size={14} className="opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuItem onClick={handleDownloadPDF} disabled={downloading}><FileText size={14} className="mr-2" /> PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF} disabled={downloading}><Printer size={14} className="mr-2" /> Print</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="w-px h-4 bg-slate-200 mx-1"></span>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 hover:bg-slate-100 rounded-md transition-colors outline-none cursor-pointer"><MoreHorizontal size={14} /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {isDraft && (
                <DropdownMenuItem onClick={async () => { await updateSalesOrderStatus(salesOrder.id, "confirmed"); alerts.success("Marked as confirmed"); router.refresh(); }}>Confirm Order</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={async () => { const { cloneSalesOrder } = await import("@/app/actions/sales-orders"); const cloned = await cloneSalesOrder(salesOrder.id); alerts.success("Cloned"); router.push(`/sales-orders/${cloned.id}`); }}><Copy size={14} className="mr-2" /> Clone</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => { if (await alerts.confirm("Delete?", "Cannot be undone.")) { const { deleteSalesOrder } = await import("@/app/actions/sales-orders"); await deleteSalesOrder(salesOrder.id); alerts.success("Deleted"); router.push("/sales-orders"); } }}><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="w-full flex justify-center overflow-hidden pb-0 md:pb-4 document-readonly">
        <div className="bg-white border border-gray-200 overflow-hidden px-2 md:px-8 w-full max-w-none origin-top" style={{ zoom: "min(1, calc((100vw - 32px) / 820))" } as any}>
          <TemplateRenderer
            generator={tplConfig.generator}
            mode="sales_order"
            items={editor.items}
            subtotal={editor.subtotal}
            clientName={editor.clientName}
            setClientName={editor.setClientName}
            clientBranch={editor.clientBranch}
            setClientBranch={editor.setClientBranch}
            clientGstin={editor.clientGstin}
            placeOfSupply={editor.placeOfSupply}
            setPlaceOfSupply={editor.setPlaceOfSupply}
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
            templateName={salesOrder.template?.name || ""}
            formatINR={formatINR}
            isReadOnly={true}
            inputCls={editor.inputCls}
            showTotal={editor.showTotal}
            setShowTotal={editor.setShowTotal}
          />
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}
