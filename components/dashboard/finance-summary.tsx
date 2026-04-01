"use client";

import { Plus, ChevronDown } from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";

interface FinanceCardProps {
  title: string;
  subtitle: string;
  total: number;
  current: number;
  overdue: number;
  newHref: string;
  type: "receivables" | "payables";
}

function FinanceCard({
  title,
  subtitle,
  total,
  current,
  overdue,
  newHref,
  type,
}: FinanceCardProps) {
  const currentPercentage = total > 0 ? (current / total) * 100 : 0;
  const overduePercentage = total > 0 ? (overdue / total) * 100 : 0;

  const labels =
    type === "receivables"
      ? { current: "Current", overdue: "Overdue" }
      : { current: "Received", overdue: "Pending" };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-full p-4 md:p-0">
      <div className="md:p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-foreground tracking-tight">
          {title}
        </h3>
        <Link
          href={newHref}
          className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded text-[13px] font-normal text-primary hover:bg-blue-100 transition-colors mb-1 md:mb-0"
        >
          <Plus size={12} className="" strokeWidth={2} />
          New
        </Link>
      </div>

      <div className="md:p-6 py-2 flex flex-col flex-1">
        <p className="text-[13px] font-medium text-muted-foreground mb-1 tracking-widest">
          {subtitle}
        </p>
        <h2 className="text-2xl font-medium text-foreground md:mb-6 mb-4 font-primary">
          {formatINR(total)}
        </h2>

        {/* Segmented Progress Bar */}
        <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden flex md:mb-8 mb-4 border border-slate-100">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${currentPercentage}%` }}
          />
          <div
            className="h-full bg-orange-400 transition-all duration-500"
            style={{ width: `${overduePercentage}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-col md:flex-row items-start md:gap-8 gap-2">
          <div className="flex items-center md:gap-2 gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[13px] text-muted-foreground font-normal tracking-tight">
              {labels.current}:
            </span>
            <span className="text-[13px] font-medium text-foreground">
              {formatINR(current)}
            </span>
          </div>
          <div className="flex items-center md:gap-2 gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-[13px] text-muted-foreground font-normal tracking-tight">
              {labels.overdue}:
            </span>
            <span className="text-[13px] font-medium text-foreground">
              {formatINR(overdue)}
            </span>
          </div>
          {/* <div className="flex items-start justify-center md:items-center md:justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="md:text-[12px] text-[10px] text-slate-700  font-medium">
              {labels.overdue}
            </span>
            <span className="md:text-[12px] text-[10px] font-semibold text-slate-800 flex items-center gap-0.5 group cursor-pointer">
              {formatINR(overdue)}
              <ChevronDown
                size={14}
                className="text-slate-400 group-hover:text-slate-600"
              />
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
}

interface FinanceSummaryProps {
  receivables: number;
  totalIncome: number;
  overdueInvoicesAmount: number;
  overdueInvoicesCount: number;
  unpaidInvoicesCount: number;
}

export default function FinanceSummary({
  receivables,
  totalIncome,
  overdueInvoicesAmount,
  overdueInvoicesCount,
  unpaidInvoicesCount,
}: FinanceSummaryProps) {
  const totalReceived = totalIncome - receivables;

  return (
    <div className="lg:col-span-2">
      <FinanceCard
        title="Total Sales"
        subtitle="Total Revenue Invoiced"
        total={totalIncome}
        current={totalReceived > 0 ? totalReceived : 0}
        overdue={receivables}
        newHref="/quotations/new"
        type="payables"
      />
    </div>
  );
}
