"use client";

import Link from "next/link";
import StatusBadge from "@/components/ui/status-badge";
import { formatINR } from "@/lib/utils";
import QuotationRowActions from "@/components/quotations/QuotationRowActions";
import InvoiceRowActions from "@/components/invoices/InvoiceRowActions";

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
  };
  mode: "quotation" | "invoice";
  onDelete: (e: React.MouseEvent, id: number) => void;
  // Invoice specific handlers
  onRecordPayment?: () => void;
  onDownloadPDF?: () => void;
  isDownloading?: boolean;
  onRefresh?: () => void;
}

export default function DocumentCard({
  data,
  mode,
  onDelete,
  onRecordPayment,
  onDownloadPDF,
  isDownloading,
  onRefresh
}: DocumentCardProps) {
  const href = `/${mode === "quotation" ? "quotations" : "invoices"}/${data.id}`;

  return (
    <div className="relative border-b border-border/60">
      <Link
        href={href}
        className="block bg-white py-2 active:bg-primary-light/10 transition-all active:scale-[0.98]"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[16px] pt-1 text-foreground leading-tight truncate">
              {data.clientName}
            </h3>
            <div className="flex items-start gap-1 font-normal text-muted">
              {data.clientBranch && (
                <span className="text-muted shrink-0 font-normal text-[13px] pt-0.5">
                  {data.clientBranch}
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
                {new Date(data.date || data.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
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
          <StatusBadge status={data.status} />
        </div>
      </Link>

      {/* Actions Button - Positioned absolutely to avoid Link trigger */}
      <div className="absolute right-0 bottom-[10px] z-10">
        {mode === "quotation" ? (
          <QuotationRowActions
            quotationId={data.id}
            status={data.status}
            onDelete={() => onDelete(null as any, data.id)}
            onRefresh={onRefresh}
          />
        ) : (
          <InvoiceRowActions
            invoiceId={data.id}
            status={data.status}
            isDownloading={isDownloading}
            onDelete={() => onDelete(null as any, data.id)}
            onRecordPayment={onRecordPayment || (() => { })}
            onDownloadPDF={onDownloadPDF || (() => { })}
            onRefresh={onRefresh}
          />
        )}
      </div>
    </div>
  );
}
