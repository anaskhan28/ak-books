"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteSalesOrder, updateSalesOrderStatus } from "@/app/actions/sales-orders";
import PageHeader from "@/components/ui/page-header";
import StatusBadge from "@/components/ui/status-badge";
import EmptyState from "@/components/ui/empty-state";
import { formatINR } from "@/lib/utils";
import { Plus, FileDown, ChevronDown, Trash2, MoreHorizontal } from "lucide-react";
import DocumentCard from "@/components/common/document-card";
import Pagination from "@/components/common/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { alerts } from "@/lib/alerts";
import type { QuotationTemplate } from "@/app/db/schema";

type SalesOrderRow = {
  id: number;
  templateId: number | null;
  templateName: string | null;
  clientId: number | null;
  clientName: string | null;
  orderNumber: string;
  subject: string | null;
  clientBranch: string | null;
  totalAmount: number;
  status: string;
  notes: string | null;
  placeOfSupply: string | null;
  orderDate: string | null;
  expectedDeliveryDate: string | null;
  showTotal: boolean;
  createdAt: Date;
};

interface SalesOrdersClientProps {
  salesOrders: SalesOrderRow[];
  totalCount: number;
  templates: QuotationTemplate[];
  currentPage: number;
  limit: number;
  activeStatus: string;
  activeTemplateId: string;
}

const STATUSES = [
  { value: "all", label: "All Sales Orders" },
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "invoiced", label: "Invoiced" },
  { value: "cancelled", label: "Cancelled" },
];

export default function SalesOrdersClient({
  salesOrders: initialData,
  totalCount,
  templates,
  currentPage,
  limit,
  activeStatus,
  activeTemplateId,
}: SalesOrdersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(newParams: { page?: number; limit?: number; status?: string; template?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (newParams.page !== undefined) params.set("page", String(newParams.page));
    else params.delete("page");
    if (newParams.limit !== undefined) params.set("limit", String(newParams.limit));
    if (newParams.status !== undefined) { params.set("status", newParams.status); params.set("page", "1"); }
    if (newParams.template !== undefined) { params.set("template", newParams.template); params.set("page", "1"); }
    router.push(`?${params.toString()}`);
  }

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const list = initialData;
  const idsOnCurrentPage = list.map((r) => r.id);
  const isAllSelected = idsOnCurrentPage.length > 0 && idsOnCurrentPage.every((id) => selectedIds.includes(id));

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const handleSelectAll = (ids: number[]) => {
    if (ids.every((id) => selectedIds.includes(id))) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };
  const clearSelection = () => setSelectedIds([]);

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!(await alerts.confirm(`Delete ${selectedIds.length} sales orders?`, "This action cannot be undone."))) return;
    for (const id of selectedIds) await deleteSalesOrder(id);
    alerts.success(`Deleted ${selectedIds.length} sales orders`);
    setSelectedIds([]);
    router.refresh();
  }

  async function handleBulkDownload() {
    if (selectedIds.length === 0) return;
    setBulkDownloading(true);
    try {
      const { getSalesOrder } = await import("@/app/actions/sales-orders");
      const { generateAndDownloadMergedPdf } = await import("@/lib/download-pdf");
      const docs = [];
      for (const id of selectedIds) {
        const so = await getSalesOrder(id);
        if (!so) continue;
        docs.push({
          mode: "sales_order" as const,
          templateName: so.template?.name,
          docNumber: so.orderNumber,
          filenamePrefix: so.orderNumber,
          date: so.orderDate || new Date(so.createdAt).toISOString().split("T")[0],
          clientName: so.clientName || "",
          clientBranch: so.clientBranch || "",
          subject: so.subject || "",
          items: so.items.map((i) => ({ description: i.description, rate: i.rate, qty: i.quantity, taxed: i.taxed || "", amount: i.amount })),
          subtotal: so.items.reduce((s, i) => s + i.amount, 0),
          terms: so.notes || "",
          showTotal: so.showTotal ?? undefined,
        });
      }
      if (docs.length > 0) {
        await generateAndDownloadMergedPdf(docs, "sales-orders");
        alerts.success(`Downloaded ${selectedIds.length} merged PDFs`);
        setSelectedIds([]);
      }
    } catch (err) {
      alerts.error("Bulk download failed", "An error occurred.");
    } finally { setBulkDownloading(false); }
  }

  async function handleDownloadPDF(id: number) {
    setDownloadingId(id);
    try {
      const { getSalesOrder } = await import("@/app/actions/sales-orders");
      const { generateAndDownloadPdf } = await import("@/lib/download-pdf");
      const so = await getSalesOrder(id);
      if (!so) throw new Error("Not found");
      await generateAndDownloadPdf({
        mode: "sales_order",
        templateName: so.template?.name,
        docNumber: so.orderNumber,
        filenamePrefix: so.orderNumber,
        date: so.orderDate || new Date(so.createdAt).toISOString().split("T")[0],
        clientName: so.clientName || "",
        clientBranch: so.clientBranch || "",
        subject: so.subject || "",
        items: so.items.map((i) => ({ description: i.description, rate: i.rate, qty: i.quantity, taxed: i.taxed || "", amount: i.amount })),
        subtotal: so.items.reduce((s, i) => s + i.amount, 0),
        terms: so.notes || "",
        showTotal: so.showTotal ?? undefined,
      });
    } catch (err) {
      alerts.error("Failed to download PDF");
    } finally { setDownloadingId(null); }
  }

  async function handleDelete(e: React.MouseEvent | null, id: number) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!(await alerts.confirm("Delete this sales order?", "This action cannot be undone."))) return;
    await deleteSalesOrder(id);
    alerts.success("Sales order deleted");
    router.refresh();
  }

  const currentStatusObj = STATUSES.find(s => s.value === activeStatus) || STATUSES[0];

  const titleNode = (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 text-[18px] md:text-[22px] font-bold text-foreground hover:text-primary transition-colors focus:outline-none cursor-pointer">
            <span>{currentStatusObj.label}</span>
            <ChevronDown size={20} className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {STATUSES.map((s) => (
            <DropdownMenuItem key={s.value} onClick={() => updateParams({ status: s.value })} className={`cursor-pointer ${activeStatus === s.value ? "text-primary font-semibold" : ""}`}>
              {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="p-2 md:p-0">
      {selectedIds.length > 0 ? (
        <>
          <div className="hidden md:flex flex-wrap items-center justify-between gap-3 p-3 mb-5 bg-white dark:bg-card border border-border rounded-xl shadow-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <button onClick={handleBulkDownload} disabled={bulkDownloading} className="p-2 border border-border rounded-lg hover:bg-accent cursor-pointer disabled:opacity-40 flex items-center justify-center" title="Download PDFs">
                <FileDown size={15} />
              </button>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-[13px] hover:bg-red-50 hover:border-red-300 font-medium cursor-pointer">Delete</button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-foreground bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">{selectedIds.length} Selected</span>
              <button onClick={clearSelection} className="text-muted-foreground hover:text-foreground text-[13px] font-medium flex items-center gap-1 cursor-pointer">
                <span>Esc</span><span className="w-5 h-5 flex items-center justify-center border border-border rounded text-[11px]">✕</span>
              </button>
            </div>
          </div>
          <div className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-card border-b border-border px-4 py-3 flex items-center justify-between md:hidden animate-fade-in">
            <div className="flex items-center gap-3">
              <button onClick={clearSelection} className="p-1 hover:bg-accent rounded-full text-muted-foreground cursor-pointer"><span className="text-[20px] font-light">✕</span></button>
              <div><h2 className="text-[15px] font-bold text-foreground">Sales Orders</h2><p className="text-[12px] text-muted-foreground">{selectedIds.length} Selected</p></div>
            </div>
            <button onClick={() => handleSelectAll(idsOnCurrentPage)} className="px-3 py-1.5 border border-border rounded-full text-[12px] font-semibold hover:bg-accent bg-white dark:bg-card text-foreground cursor-pointer">
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
        </>
      ) : (
        <PageHeader
          title={titleNode}
          subtitle="Manage confirmed orders before invoicing"
          action={
            <Link href="/sales-orders/new" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20 cursor-pointer">
              <Plus size={16} className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline text-[13px]">Create Sales Order</span>
              <span className="sm:hidden text-[13px]">New</span>
            </Link>
          }
        />
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

      {list.length === 0 ? (
        <EmptyState title="No sales orders yet" message="Create a new sales order to get started." />
      ) : (
        <div className="mt-0 md:mt-2">
          {/* Mobile View */}
          <div className="md:hidden">
            {list.map((so) => (
              <DocumentCard
                key={so.id}
                mode="sales_order"
                onDelete={handleDelete}
                onDownloadPDF={() => handleDownloadPDF(so.id)}
                isDownloading={downloadingId === so.id}
                onRefresh={() => router.refresh()}
                isSelected={selectedIds.includes(so.id)}
                onSelect={() => toggleSelect(so.id)}
                selectionMode={selectedIds.length > 0}
                data={{ ...so, number: so.orderNumber, date: so.orderDate, subject: so.subject }}
              />
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl shadow-2xs overflow-visible">
            <div className="overflow-x-auto md:overflow-x-visible relative">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="text-muted/70 text-left">
                    <th className="sticky top-0 bg-background px-4 py-3 border-b border-border z-10 w-10 text-center rounded-tl-2xl">
                      <input type="checkbox" checked={isAllSelected} onChange={() => handleSelectAll(idsOnCurrentPage)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary" />
                    </th>
                    <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 whitespace-nowrap">Order #</th>
                    <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 whitespace-nowrap">Customer</th>
                    <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 whitespace-nowrap">Branch</th>
                    <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 whitespace-nowrap">Status</th>
                    <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 text-right whitespace-nowrap">Amount</th>
                    <th className="sticky top-0 bg-background px-5 py-4 font-bold border-b border-border z-10 w-10 rounded-tr-2xl" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.map((so) => (
                    <tr key={so.id} className={`hover:bg-gray-50/80 transition-colors cursor-pointer group ${selectedIds.includes(so.id) ? "bg-primary-light/10" : ""}`} onClick={() => router.push(`/sales-orders/${so.id}`)}>
                      <td className="px-4 py-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.includes(so.id)} onChange={() => toggleSelect(so.id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary" />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link href={`/sales-orders/${so.id}`} className="font-semibold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{so.orderNumber}</Link>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-foreground">{so.clientName}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-foreground">{so.clientBranch || "—"}</td>
                      <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={so.status} /></td>
                      <td className="px-5 py-4 whitespace-nowrap text-right font-medium text-gray-800">{formatINR(so.totalAmount)}</td>
                      <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1.5 hover:bg-accent rounded-lg cursor-pointer outline-none"><MoreHorizontal size={16} /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadPDF(so.id)} className="cursor-pointer">Download PDF</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleDelete(e as any, so.id)} className="cursor-pointer text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={currentPage} limit={limit} totalCount={totalCount} onPageChange={(page) => updateParams({ page })} onLimitChange={(limit) => updateParams({ limit })} />
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white dark:bg-card border-t border-border p-4 flex items-center gap-3 md:hidden shadow-lg animate-fade-in-up">
          <button onClick={handleBulkDownload} disabled={bulkDownloading} className="flex-1 py-3 bg-primary text-white hover:opacity-90 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-40">
            <FileDown size={16} /> Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
