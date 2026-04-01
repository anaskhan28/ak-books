"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Pencil, Download, CreditCard, Loader2 } from "lucide-react";

interface InvoiceRowActionsProps {
  invoiceId: number;
  paymentLabel?: string;
  isDownloading?: boolean;
  onRecordPayment: () => void;
  onDownloadPDF: () => void;
}

export default function InvoiceRowActions({
  invoiceId,
  paymentLabel = "Record Payment",
  isDownloading = false,
  onRecordPayment,
  onDownloadPDF,
}: InvoiceRowActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const actions = [
    {
      label: "Edit",
      icon: Pencil,
      onClick: () => router.push(`/invoices/${invoiceId}`),
    },
    {
      label: isDownloading ? "Downloading..." : "Download PDF",
      icon: isDownloading ? Loader2 : Download,
      onClick: onDownloadPDF,
      disabled: isDownloading,
      loading: isDownloading,
    },
    {
      label: paymentLabel,
      icon: CreditCard,
      onClick: onRecordPayment,
      highlight: true,
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-[180px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {actions.map((action) => (
            <button
              key={action.label}
              disabled={action.disabled}
              onClick={(e) => {
                e.stopPropagation();
                if (!action.disabled) {
                  setOpen(false);
                  action.onClick();
                }
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-left transition-colors ${
                action.disabled ? "opacity-60 cursor-not-allowed" : ""
              } ${
                action.highlight && !action.disabled
                  ? "text-[#0052cc] font-medium hover:bg-blue-50"
                  : !action.disabled ? "text-gray-700 hover:bg-gray-50" : "text-gray-700"
              }`}
            >
              <action.icon size={14} className={action.loading ? "animate-spin" : ""} />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
