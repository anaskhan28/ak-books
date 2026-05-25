"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteDeliveryChallan } from "@/app/actions/delivery-challans";
import PageHeader from "@/components/ui/page-header";
import StatusBadge from "@/components/ui/status-badge";
import EmptyState from "@/components/ui/empty-state";
import { formatINR } from "@/lib/utils";
import { Plus, FileDown, ChevronDown, MoreHorizontal } from "lucide-react";
import DocumentCard from "@/components/common/document-card";
import Pagination from "@/components/common/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { alerts } from "@/lib/alerts";
import type { QuotationTemplate } from "@/app/db/schema";

type DCRow = {
  id: number; templateId: number | null; templateName: string | null; clientId: number | null; clientName: string | null;
  challanNumber: string; subject: string | null; clientBranch: string | null; totalAmount: number; status: string;
  notes: string | null; placeOfSupply: string | null; challanDate: string | null; showTotal: boolean; createdAt: Date;
  salesOrderId: number | null; dispatchDate: string | null; transportMode: string | null; vehicleNumber: string | null;
};

interface Props {
  deliveryChallans: DCRow[]; totalCount: number; templates: QuotationTemplate[];
  currentPage: number; limit: number; activeStatus: string; activeTemplateId: string;
}

const STATUSES = [
  { value: "all", label: "All Challans" }, { value: "draft", label: "Draft" },
  { value: "dispatched", label: "Dispatched" }, { value: "delivered", label: "Delivered" }, { value: "cancelled", label: "Cancelled" },
];

export default function DeliveryChallansClient({ deliveryChallans: initialData, totalCount, templates, currentPage, limit, activeStatus, activeTemplateId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  function updateParams(p: { page?: number; limit?: number; status?: string; template?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (p.page !== undefined) params.set("page", String(p.page)); else params.delete("page");
    if (p.limit !== undefined) params.set("limit", String(p.limit));
    if (p.status !== undefined) { params.set("status", p.status); params.set("page", "1"); }
    if (p.template !== undefined) { params.set("template", p.template); params.set("page", "1"); }
    router.push(`?${params.toString()}`);
  }

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const list = initialData;
  const idsOnCurrentPage = list.map((r) => r.id);
  const isAllSelected = idsOnCurrentPage.length > 0 && idsOnCurrentPage.every((id) => selectedIds.includes(id));
  const toggleSelect = (id: number) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const handleSelectAll = (ids: number[]) => { if (ids.every((id) => selectedIds.includes(id))) { setSelectedIds((prev) => prev.filter((id) => !ids.includes(id))); } else { setSelectedIds((prev) => Array.from(new Set([...prev, ...ids]))); } };
  const clearSelection = () => setSelectedIds([]);

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!(await alerts.confirm(`Delete ${selectedIds.length} challans?`, "Cannot be undone."))) return;
    for (const id of selectedIds) await deleteDeliveryChallan(id);
    alerts.success(`Deleted ${selectedIds.length} challans`); setSelectedIds([]); router.refresh();
  }

  async function handleBulkDownload() {
    if (selectedIds.length === 0) return; setBulkDownloading(true);
    try {
      const { getDeliveryChallan } = await import("@/app/actions/delivery-challans");
      const { generateAndDownloadMergedPdf } = await import("@/lib/download-pdf");
      const docs = [];
      for (const id of selectedIds) { const dc = await getDeliveryChallan(id); if (!dc) continue; docs.push({ mode: "delivery_challan" as const, templateName: dc.template?.name, docNumber: dc.challanNumber, filenamePrefix: dc.challanNumber, date: dc.challanDate || new Date(dc.createdAt).toISOString().split("T")[0], clientName: dc.clientName || "", clientBranch: dc.clientBranch || "", subject: dc.subject || "", items: dc.items.map((i) => ({ description: i.description, rate: i.rate, qty: i.quantity, taxed: i.taxed || "", amount: i.amount })), subtotal: dc.items.reduce((s, i) => s + i.amount, 0), terms: dc.notes || "", showTotal: dc.showTotal ?? undefined }); }
      if (docs.length > 0) { await generateAndDownloadMergedPdf(docs, "delivery-challans"); alerts.success(`Downloaded ${selectedIds.length} merged PDFs`); setSelectedIds([]); }
    } catch { alerts.error("Bulk download failed"); } finally { setBulkDownloading(false); }
  }

  async function handleDownloadPDF(id: number) {
    setDownloadingId(id);
    try {
      const { getDeliveryChallan } = await import("@/app/actions/delivery-challans");
      const { generateAndDownloadPdf } = await import("@/lib/download-pdf");
      const dc = await getDeliveryChallan(id); if (!dc) throw new Error("Not found");
      await generateAndDownloadPdf({ mode: "delivery_challan", templateName: dc.template?.name, docNumber: dc.challanNumber, filenamePrefix: dc.challanNumber, date: dc.challanDate || new Date(dc.createdAt).toISOString().split("T")[0], clientName: dc.clientName || "", clientBranch: dc.clientBranch || "", subject: dc.subject || "", items: dc.items.map((i) => ({ description: i.description, rate: i.rate, qty: i.quantity, taxed: i.taxed || "", amount: i.amount })), subtotal: dc.items.reduce((s, i) => s + i.amount, 0), terms: dc.notes || "", showTotal: dc.showTotal ?? undefined });
    } catch { alerts.error("Failed to download PDF"); } finally { setDownloadingId(null); }
  }

  async function handleDelete(e: React.MouseEvent | null, id: number) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!(await alerts.confirm("Delete this challan?", "Cannot be undone."))) return;
    await deleteDeliveryChallan(id); alerts.success("Deleted"); router.refresh();
  }

  const currentStatusObj = STATUSES.find(s => s.value === activeStatus) || STATUSES[0];
  const titleNode = (<div className="flex items-center gap-1"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex items-center gap-1.5 text-[18px] md:text-[22px] font-bold text-foreground hover:text-primary transition-colors focus:outline-none cursor-pointer"><span>{currentStatusObj.label}</span><ChevronDown size={20} className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5" /></button></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-48">{STATUSES.map((s) => (<DropdownMenuItem key={s.value} onClick={() => updateParams({ status: s.value })} className={`cursor-pointer ${activeStatus === s.value ? "text-primary font-semibold" : ""}`}>{s.label}</DropdownMenuItem>))}</DropdownMenuContent></DropdownMenu></div>);

  return (
    <div className="p-2 md:p-0">
      {selectedIds.length > 0 ? (
        <>
          <div className="hidden md:flex flex-wrap items-center justify-between gap-3 p-3 mb-5 bg-white dark:bg-card border border-border rounded-xl shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <button onClick={handleBulkDownload} disabled={bulkDownloading} className="p-2 border border-border rounded-lg hover:bg-accent cursor-pointer disabled:opacity-40"><FileDown size={15} /></button>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-[13px] hover:bg-red-50 font-medium cursor-pointer">Delete</button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-foreground bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">{selectedIds.length} Selected</span>
              <button onClick={clearSelection} className="text-muted-foreground hover:text-foreground text-[13px] font-medium cursor-pointer">Esc ✕</button>
            </div>
          </div>
          <div className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-card border-b border-border px-4 py-3 flex items-center justify-between md:hidden animate-fade-in">
            <div className="flex items-center gap-3"><button onClick={clearSelection} className="p-1 hover:bg-accent rounded-full cursor-pointer"><span className="text-[20px]">✕</span></button><div><h2 className="text-[15px] font-bold">Delivery Challans</h2><p className="text-[12px] text-muted-foreground">{selectedIds.length} Selected</p></div></div>
            <button onClick={() => handleSelectAll(idsOnCurrentPage)} className="px-3 py-1.5 border border-border rounded-full text-[12px] font-semibold cursor-pointer">{isAllSelected ? "Deselect All" : "Select All"}</button>
          </div>
        </>
      ) : (
        <PageHeader title={titleNode} subtitle="Track goods dispatched to customers" action={<Link href="/delivery-challans/new" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20 cursor-pointer"><Plus size={16} /><span className="hidden sm:inline">Create Challan</span><span className="sm:hidden">New</span></Link>} />
      )}
      {/* Template Tabs */}
      <div className="flex items-center gap-1 pt-1 md:pt-0 mb-0 md:mb-5 overflow-x-auto md:overflow-x-visible custom-scrollbar-hide md:border-b border-border pb-0 whitespace-nowrap">
        <div className="flex items-center gap-1 min-w-max md:min-w-0">
          <button onClick={() => updateParams({ template: "all" })} className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTemplateId === "all" ? "text-primary border-primary" : "text-muted border-transparent hover:text-foreground"}`}>
            All ({totalCount})
          </button>
          {templates.slice(0, 6).map((t) => (
            <button key={t.id} onClick={() => updateParams({ template: String(t.id) })} className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTemplateId === String(t.id) ? "text-primary border-primary" : "text-muted border-transparent hover:text-foreground"}`} title={t.name}>
              {t.name.length > 14 ? t.name.substring(0, 26) : t.name}
            </button>
          ))}
          {(templates.length > 6) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`px-2 py-1.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${templates.slice(6).some(t => String(t.id) === activeTemplateId)
                    ? "text-primary border-primary"
                    : "text-muted border-transparent hover:text-foreground"
                    }`}
                >
                  More <ChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {templates.slice(6).map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => updateParams({ template: String(t.id) })}
                    className={`cursor-pointer ${activeTemplateId === String(t.id) ? "text-primary font-semibold" : ""}`}
                  >
                    {t.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {list.length === 0 ? (<EmptyState title="No delivery challans yet" message="Create a new delivery challan to get started." />) : (
        <div className="mt-0 md:mt-2">
          <div className="md:hidden">{list.map((dc) => (<DocumentCard key={dc.id} mode="delivery_challan" onDelete={handleDelete} onDownloadPDF={() => handleDownloadPDF(dc.id)} isDownloading={downloadingId === dc.id} onRefresh={() => router.refresh()} isSelected={selectedIds.includes(dc.id)} onSelect={() => toggleSelect(dc.id)} selectionMode={selectedIds.length > 0} data={{ ...dc, number: dc.challanNumber, date: dc.challanDate, subject: dc.subject }} />))}</div>
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-2xs overflow-visible">
            <table className="w-full text-[13px] border-collapse">
              <thead><tr className="text-muted/70 text-left">
                <th className="sticky top-0 bg-background px-4 py-3 border-b border-border z-10 w-10 text-center rounded-tl-2xl"><input type="checkbox" checked={isAllSelected} onChange={() => handleSelectAll(idsOnCurrentPage)} className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer accent-primary" /></th>
                <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10">Challan #</th>
                <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10">Customer</th>
                <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10">Branch</th>
                <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10">Status</th>
                <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 text-right">Amount</th>
                <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 w-10 rounded-tr-2xl" />
              </tr></thead>
              <tbody className="divide-y divide-gray-100">{list.map((dc) => (
                <tr key={dc.id} className={`hover:bg-gray-50/80 transition-colors cursor-pointer group ${selectedIds.includes(dc.id) ? "bg-primary-light/10" : ""}`} onClick={() => router.push(`/delivery-challans/${dc.id}`)}>
                  <td className="px-4 py-3 w-10 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(dc.id)} onChange={() => toggleSelect(dc.id)} className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer accent-primary" /></td>
                  <td className="px-5 py-4 whitespace-nowrap"><Link href={`/delivery-challans/${dc.id}`} className="font-semibold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{dc.challanNumber}</Link></td>
                  <td className="px-5 py-4 whitespace-nowrap font-medium">{dc.clientName}</td>
                  <td className="px-5 py-4 whitespace-nowrap">{dc.clientBranch || "—"}</td>
                  <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={dc.status} /></td>
                  <td className="px-5 py-4 whitespace-nowrap text-right font-medium text-gray-800">{formatINR(dc.totalAmount)}</td>
                  <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu><DropdownMenuTrigger className="p-1.5 hover:bg-accent rounded-lg cursor-pointer outline-none"><MoreHorizontal size={16} /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleDownloadPDF(dc.id)} className="cursor-pointer">Download PDF</DropdownMenuItem><DropdownMenuItem onClick={(e) => handleDelete(e as any, dc.id)} className="cursor-pointer text-red-600">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} limit={limit} totalCount={totalCount} onPageChange={(page) => updateParams({ page })} onLimitChange={(limit) => updateParams({ limit })} />
        </div>
      )}
      {selectedIds.length > 0 && (<div className="fixed bottom-0 left-0 w-full z-50 bg-white dark:bg-card border-t border-border p-4 flex items-center gap-3 md:hidden shadow-lg animate-fade-in-up"><button onClick={handleBulkDownload} disabled={bulkDownloading} className="flex-1 py-3 bg-primary text-white hover:opacity-90 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"><FileDown size={16} /> Download PDF</button></div>)}
    </div>
  );
}
