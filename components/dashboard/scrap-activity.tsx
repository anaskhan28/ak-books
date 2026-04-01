"use client";

import { Recycle, ChevronRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";

interface ScrapEntry {
  id: number;
  projectName: string | null;
  type: string;
  amount: number;
  weight: string | null;
  date: string;
  dateDisplay: string; // Pre-formatted for hydration safety
}

interface ScrapActivityProps {
  entries: ScrapEntry[];
}

export default function ScrapActivity({ entries }: ScrapActivityProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-foreground tracking-tight">
          Recent Scrap Activity
        </h3>
        <Link
          href="/scrap"
          className="text-primary text-[11px] font-bold flex items-center gap-1 hover:underline underline-offset-4 tracking-wider uppercase"
        >
          View All
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="p-6 space-y-4">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded border border-slate-50 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center ${entry.type === "purchase" ? "bg-amber-100/50 text-amber-600" : "bg-emerald-100/50 text-emerald-600"}`}
                >
                  {entry.type === "purchase" ? (
                    <ArrowDownLeft size={14} />
                  ) : (
                    <ArrowUpRight size={14} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-foreground">
                    {entry.projectName || "General Site"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal tracking-wider mt-0.5">
                    {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[14px] font-medium text-foreground tracking-tight">
                  {formatINR(entry.amount)}
                </span>
                <span className="text-[11px] text-muted-foreground font-normal mt-0.5">
                  {entry.dateDisplay}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Recycle size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] text-slate-400 font-medium">
              No scrap activity recently
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
