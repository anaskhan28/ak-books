"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Pencil, Copy, Trash2, FileText, Loader2, Download } from "lucide-react";
import { cloneQuotation } from "@/app/actions/quotations";
import { generateInvoice } from "@/app/actions/invoices";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuotationRowActionsProps {
  quotationId: number;
  status?: string;
  isDownloading?: boolean;
  onDownloadPDF?: () => void;
  onDelete: () => void;
  onRefresh?: () => void;
  variant?: "icon" | "button";
  label?: string;
}

export default function QuotationRowActions({
  quotationId,
  status,
  isDownloading,
  onDownloadPDF,
  onDelete,
  onRefresh,
  variant = "icon",
  label = "Actions",
}: QuotationRowActionsProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (actionName: string, fn: () => Promise<any>) => {
    if (loadingAction) return;
    setLoadingAction(actionName);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${actionName.toLowerCase()}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConvert = () => handleAction("Converting", async () => {
    const invoice = await generateInvoice(quotationId);
    router.push(`/invoices/${invoice.id}`);
  });

  const handleClone = () => handleAction("Cloning", async () => {
    const cloned = await cloneQuotation(quotationId);
    router.push(`/quotations/${cloned.id}`);
  });

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "icon" ? (
            <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <ChevronDown size={14} />
            </button>
          ) : (
            <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-[13px] font-medium text-muted hover:text-muted transition-colors disabled:opacity-50">
              {label}
              <ChevronDown size={14} className="opacity-70" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[190px]">
          <DropdownMenuItem onClick={() => router.push(`/quotations/${quotationId}`)}>
            <Pencil size={14} className="mr-2" /> Edit
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleConvert} disabled={!!loadingAction || status === "invoiced"}>
            {loadingAction === "Converting" ? <Loader2 size={14} className="mr-2 animate-spin" /> : <FileText size={14} className="mr-2" />}
            {loadingAction === "Converting" ? "Converting..." : "Convert to Invoice"}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleClone} disabled={!!loadingAction}>
            {loadingAction === "Cloning" ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Copy size={14} className="mr-2" />}
            {loadingAction === "Cloning" ? "Cloning..." : "Clone"}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onDownloadPDF?.()} disabled={!!loadingAction || isDownloading}>
            {isDownloading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Download size={14} className="mr-2" />}
            {isDownloading ? "Downloading..." : "Download PDF"}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 size={14} className="mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
