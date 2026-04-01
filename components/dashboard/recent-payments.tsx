"use client";

import { ArrowDownLeft, ChevronRight, ReceiptText } from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";

interface Payment {
  id: number;
  amount: number;
  date: string;
  dateDisplay: string; // Pre-formatted for hydration safety
  client: string;
  invoiceNumber: string;
  method: string;
}

interface RecentPaymentsProps {
  payments: Payment[];
}

export default function RecentPayments({ payments }: RecentPaymentsProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-foreground tracking-tight">
          Recent Inward Payments
        </h3>
        <Link
          href="/payments"
          className="text-primary text-[12px] font-medium flex items-center gap-1 hover:underline underline-offset-4"
        >
          View All
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <ArrowDownLeft size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-foreground leading-tight">
                    {payment.client}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <ReceiptText size={10} />
                      {payment.invoiceNumber}
                    </span>
                    <span className="text-[11px] text-slate-300">•</span>
                    <span className="text-[11px] text-muted-foreground font-medium tracking-wider uppercase">
                      {payment.method.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[14px] font-medium text-foreground">
                  {formatINR(payment.amount)}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium tracking-tight">
                  {payment.dateDisplay}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <ArrowDownLeft size={32} className="text-slate-200 mb-3" />
            <p className="text-[12px] text-slate-400 font-medium  tracking-wider">
              No payments found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
