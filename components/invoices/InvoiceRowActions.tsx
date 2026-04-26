"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { alerts } from "@/lib/alerts";
import { ChevronDown, Pencil, Download, CreditCard, Loader2, Copy, Trash2, Ban, RotateCcw } from "lucide-react";
import { cloneInvoice, updateInvoiceStatus } from "@/app/actions/invoices";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InvoiceRowActionsProps {
  invoiceId: number;
  status?: string;
  paymentLabel?: string;
  isDownloading?: boolean;
  onRecordPayment: () => void;
  onDownloadPDF: () => void;
  onDelete: () => void;
  onRefresh?: () => void;
  variant?: "icon" | "button";
  label?: string;
}

export default function InvoiceRowActions({
  invoiceId,
  status,
  paymentLabel = "Record Payment",
  isDownloading = false,
  onRecordPayment,
  onDownloadPDF,
  onDelete,
  onRefresh,
  variant = "icon",
  label = "Actions",
}: InvoiceRowActionsProps) {
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);



  const handleClone = async () => {
    if (isCloning) return;
    setIsCloning(true);
    try {
      const cloned = await cloneInvoice(invoiceId);
      alerts.success("Invoice cloned");
      router.push(`/invoices/${cloned.id}`);
    } catch (err) {
      console.error(err);
      alerts.error("Failed to clone invoice");
    } finally {
      setIsCloning(false);
    }
  };

  const handleVoid = async () => {
    if (!(await alerts.confirm("Void this invoice?", "This will mark it as Cancelled and cannot be undone."))) return;
    await updateInvoiceStatus(invoiceId, "cancelled");
    alerts.success("Invoice voided");
    router.refresh();
    if (onRefresh) onRefresh();
  };

  const handleRestore = async () => {
    if (!(await alerts.confirm("Restore this invoice?", "It will be marked as Unpaid."))) return;
    await updateInvoiceStatus(invoiceId, "unpaid");
    alerts.success("Invoice restored");
    router.refresh();
    if (onRefresh) onRefresh();
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "icon" ? (
            <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <ChevronDown size={14} />
            </button>
          ) : (
            <button className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl text-[13px] font-medium text-muted hover:text-muted transition-colors disabled:opacity-50">
              {label}
              <ChevronDown size={14} className="opacity-70" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[190px]">
          <DropdownMenuItem onClick={() => router.push(`/invoices/${invoiceId}`)}>
            <Pencil size={14} className="mr-2" /> Edit
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleClone} disabled={isCloning}>
            {isCloning ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Copy size={14} className="mr-2" />}
            {isCloning ? "Cloning..." : "Clone"}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onDownloadPDF} disabled={isDownloading}>
            {isDownloading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Download size={14} className="mr-2" />}
            {isDownloading ? "Downloading..." : "Download PDF"}
          </DropdownMenuItem>

          {status !== "cancelled" && (
            <DropdownMenuItem onClick={onRecordPayment}>
              {status === "paid" ? (
                <>
                  <CreditCard size={14} className="mr-2" /> View Payments
                </>
              ) : (
                <>
                  <CreditCard size={14} className="mr-2" /> {paymentLabel}
                </>
              )}
            </DropdownMenuItem>
          )}

          {status !== "cancelled" ? (
            <DropdownMenuItem onClick={handleVoid}>
              <Ban size={14} className="mr-2" /> Void Invoice
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleRestore} >
              <RotateCcw size={14} className="mr-2" /> Restore Invoice
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={onDelete} >
            <Trash2 size={14} className="mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
