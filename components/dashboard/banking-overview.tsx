"use client";

import { Wallet, Landmark, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface BankingOverviewProps {
  bankBalance: number;
  cashInHand: number;
}

export default function BankingOverview({
  bankBalance,
  cashInHand,
}: BankingOverviewProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="bg-white rounded-lg border border-slate-200 p-5 hover:bg-slate-50 transition-colors cursor-pointer group">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50/50 rounded flex items-center justify-center text-primary transition-colors">
              <Landmark size={20} />
            </div>
            <h3 className="text-[15px] font-medium text-foreground tracking-tight">
              Bank Accounts
            </h3>
          </div>
          <ChevronRight
            size={18}
            className="text-slate-300 group-hover:text-blue-500 transition-colors"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-[13px] font-medium text-muted-foreground tracking-widest uppercase mb-1">
            Total Balance
          </p>
          <p className="text-2xl font-medium text-foreground leading-none tracking-tight">
            {formatINR(bankBalance)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5 hover:bg-slate-50 transition-colors cursor-pointer group">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50/50 rounded flex items-center justify-center text-emerald-600 transition-colors">
              <Wallet size={20} />
            </div>
            <h3 className="text-[15px] font-medium text-foreground tracking-tight">
              Cash In Hand
            </h3>
          </div>
          <ChevronRight
            size={18}
            className="text-slate-300 group-hover:text-emerald-500 transition-colors"
          />
        </div>
        <div className="flex flex-col">
          <p className="text-[13px] font-medium text-muted-foreground tracking-widest uppercase mb-1">
            Total Amount
          </p>
          <p className="text-2xl font-medium text-foreground leading-none tracking-tight">
            {formatINR(cashInHand)}
          </p>
        </div>
      </div>
    </div>
  );
}
