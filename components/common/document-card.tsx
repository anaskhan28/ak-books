"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/status-badge";
import { formatINR, formatDateDMY } from "@/lib/utils";
import { getDueDateStatus } from "@/lib/due-date";
import QuotationRowActions from "@/components/quotations/QuotationRowActions";
import InvoiceRowActions from "@/components/invoices/InvoiceRowActions";
import { MoreHorizontal, FileText, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DocumentCardProps {
  data: {
    id: number;
    clientName: string | null;
    number: string;
    totalAmount: number;
    subject: string | null;
    clientBranch: string | null;
    status: string;
    createdAt: Date;
    date?: string | null;
    isComparative?: boolean;
    dueDate?: string | null;
    paidAmount?: number;
  };
  mode: "quotation" | "invoice" | "sales_order" | "delivery_challan" | "eway_bill" | "credit_note";
  onDelete: (e: React.MouseEvent, id: number) => void;
  // Shared actions
  onRecordPayment?: () => void;
  onDownloadPDF?: () => void;
  isDownloading?: boolean;
  onRefresh?: () => void;
  // Selection handlers
  isSelected?: boolean;
  onSelect?: () => void;
  selectionMode?: boolean;
}

export default function DocumentCard({
  data,
  mode,
  onDelete,
  onRecordPayment,
  onDownloadPDF,
  isDownloading,
  onRefresh,
  isSelected,
  onSelect,
  selectionMode,
}: DocumentCardProps) {
  const getHref = () => {
    switch (mode) {
      case "quotation": return `/quotations/${data.id}`;
      case "invoice": return `/invoices/${data.id}`;
      case "sales_order": return `/sales-orders/${data.id}`;
      case "delivery_challan": return `/delivery-challans/${data.id}`;
      case "eway_bill": return `/eway-bills/${data.id}`;
      case "credit_note": return `/credit-notes/${data.id}`;
      default: return "#";
    }
  };
  const href = getHref();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    if ("button" in e && e.button !== 0) return;
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onSelect?.();
      
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 600);
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div className={`relative transition-all duration-150 border-b border-border/60 ${
      selectionMode && isSelected 
        ? "border-2 border-primary rounded-xl p-3 my-2 mx-1 shadow-sm bg-blue-50/5" 
        : "p-0"
    }`}>
      <Link
        href={href}
        onClick={(e) => {
          if (selectionMode || isLongPress.current) {
            e.preventDefault();
            e.stopPropagation();
            if (selectionMode && !isLongPress.current) {
              onSelect?.();
            }
          }
        }}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onMouseMove={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchMove={endPress}
        className="block bg-transparent py-2 active:bg-primary-light/5 transition-all active:scale-[0.98]"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[16px] pt-1 text-foreground leading-tight truncate">
              {data.clientName}
            </h3>
            <div className="flex items-start gap-1 font-normal text-muted">
              {data.clientBranch && (
                <span className="text-muted shrink-0 font-normal text-[13px] pt-0.5">
                  {data.clientBranch.slice(0, 30)}
                </span>
              )}
              {data.clientBranch && data.subject && <span>•</span>}

              {data.subject && (
                <span className="text-muted shrink-0 font-normal text-[13px] pt-0.5 truncate max-w-[150px]">
                  {data.subject}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[13px] font-normal text-muted mt-0.5">
              <span>
                {formatDateDMY(data.date || data.createdAt)}
              </span>
              <span>•</span>
              <span className="text-primary">{data.number}</span>
            </div>
          </div>
          <div className="text-right pl-4">
            <div className="font-medium text-[16px] text-foreground">
              {formatINR(data.totalAmount)}.00
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 pt-1 mt-1">
          <div className="flex items-center gap-1.5">
            {mode === "invoice" ? (() => {
              const isPaid = data.status === "paid" || (data.paidAmount !== undefined && Number(data.paidAmount) >= data.totalAmount);
              if (isPaid) {
                return (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[13px] md:text-[11px] font-semibold capitalize border bg-emerald-50 text-emerald-700 border-emerald-200">
                    PAID
                  </span>
                );
              }
              const due = getDueDateStatus(data.dueDate ?? null);
              const dueColors: Record<string, string> = {
                blue: "bg-blue-50 text-blue-700 border-blue-200",
                orange: "bg-orange-50 text-[#e67e22] border-orange-200",
                red: "bg-red-50 text-[#e74c3c] border-red-200",
                gray: "bg-gray-50 text-gray-500 border-gray-200",
              };
              return (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[13px] md:text-[11px] font-medium border ${dueColors[due.color] || dueColors.gray}`}>
                  {due.label}
                </span>
              );
            })() : (
              <StatusBadge status={data.status} />
            )}
            {data.isComparative && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-600 border border-amber-200">
                Comparative
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="absolute right-0 bottom-[10px] z-10">
        {selectionMode ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.();
            }}
            className="p-2 cursor-pointer outline-none select-none"
          >
            {isSelected ? (
              <div className="w-5.5 h-5.5 rounded-full bg-primary flex items-center justify-center text-white border border-primary shadow-sm">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-5.5 h-5.5 rounded-full border-2 border-slate-300 bg-white" />
            )}
          </button>
        ) : (
          mode === "quotation" ? (
            <QuotationRowActions
              quotationId={data.id}
              status={data.status}
              onDelete={() => onDelete(null as any, data.id)}
              onRefresh={onRefresh}
            />
          ) : mode === "invoice" ? (
            <InvoiceRowActions
              invoiceId={data.id}
              status={data.status}
              isDownloading={isDownloading}
              onDelete={() => onDelete(null as any, data.id)}
              onRecordPayment={onRecordPayment || (() => { })}
              onDownloadPDF={onDownloadPDF || (() => { })}
              onRefresh={onRefresh}
            />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1.5 hover:bg-accent rounded-lg cursor-pointer outline-none">
                <MoreHorizontal size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDownloadPDF} className="cursor-pointer">
                  <FileText size={14} className="mr-2" /> Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => onDelete(e as any, data.id)} className="cursor-pointer text-red-600">
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )}
      </div>
    </div>
  );
}

