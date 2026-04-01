"use client";

import { ChevronRight, FileCheck2 } from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  status: string;
  dateDisplay: string; // Pre-formatted for hydration safety
}

interface RecentInvoicesProps {
  invoices: Invoice[];
}

export default function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100  tracking-wider">
            Paid
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100  tracking-wider">
            Pending
          </span>
        );
      case "overdue":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100  tracking-wider">
            Overdue
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700  bg-slate-50 px-2 py-0.5 rounded border border-slate-100  tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-full py-2">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-foreground tracking-tight">
          Recent Invoices
        </h3>
        <Link
          href="/invoices"
          className="text-primary text-[12px] font-medium flex items-center gap-1 hover:underline underline-offset-4"
        >
          View All Invoices
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-muted-foreground uppercase">
              <th className="md:px-6 px-4 md:py-3 py-2 text-[12px] font-medium tracking-wider">
                Invoice #
              </th>
              <th className="md:px-6 px-4 md:py-3 py-2 text-[12px] font-medium tracking-wider">
                Client
              </th>
              <th className="md:px-6 px-4 md:py-3 py-2 text-[12px] font-medium tracking-wider text-center">
                Status
              </th>
              <th className="md:px-6 px-4 md:py-3 py-2 text-[12px] font-medium tracking-wider text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="md:px-6 px-4 md:py-3 py-2 text-[13px] font-medium text-foreground leading-tight">
                    <span className="group-hover:text-primary transition-colors underline-offset-4">
                      {invoice.invoiceNumber}
                    </span>
                  </td>
                  <td className="md:px-6 px-4 md:py-3 py-1">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-foreground">
                        {invoice.clientName}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-normal">
                        Due: {invoice.dateDisplay}
                      </span>
                    </div>
                  </td>
                  <td className="md:px-6 px-4 md:py-3 py-1 text-center">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="md:px-6 px-4 md:py-3 py-1 text-right">
                    <span className="text-[13px] font-medium text-foreground">
                      {formatINR(invoice.totalAmount)}
                    </span>
                  </td>
                </tr>
              ))

            ) : (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <FileCheck2 size={32} className="text-slate-200 mb-3" />
                    <p className="text-[12px] text-slate-400 font-medium  tracking-wider">
                      No recent invoices found
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
