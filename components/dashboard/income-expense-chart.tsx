"use client";

import { ChevronDown } from "lucide-react";
import { formatINR } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface IncomeExpenseChartProps {
  data: { month: string; income: number; expense: number }[];
  totalIncome: number;
  totalExpenses: number;
}

const chartConfig = {
  income: {
    label: "Income",
    color: "#10b981",
  },
  expense: {
    label: "Expense",
    color: "#f43f5e",
  },
} satisfies ChartConfig;

export default function IncomeExpenseChart({
  data,
  totalIncome,
  totalExpenses,
}: IncomeExpenseChartProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-foreground tracking-tight">
          Income and Expense
        </h3>
        <div className="flex items-center gap-4">
          <button className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 tracking-widest hover:text-slate-600">
            Last 12 Months <ChevronDown size={14} />
          </button>
          <div className="flex rounded bg-slate-50 border border-slate-200 p-0.5">
            <button className="px-3 py-1 text-[10px] font-bold text-slate-600 bg-white border border-slate-100 rounded-sm shadow-sm transition-all tracking-wider">
              Accrual
            </button>
            <button className="px-3 py-1 text-[10px] font-semibold text-muted-foreground hover:text-slate-600 tracking-wider">
              Cash
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-6 md:p-8 flex items-start justify-between mb-0 pb-6 border-b border-slate-50">
          <div className="flex items-center gap-6 md:gap-12">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <p className="text-[13px] font-medium text-muted-foreground tracking-widest">
                  Total Income
                </p>
              </div>
              <h2 className="text-2xl font-medium text-foreground tracking-tight">
                {formatINR(totalIncome)}
              </h2>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <p className="text-[13px] font-medium text-muted-foreground tracking-widest">
                  Total Expenses
                </p>
              </div>
              <h2 className="text-2xl font-medium text-foreground tracking-tight">
                {formatINR(totalExpenses)}
              </h2>
            </div>
          </div>
        </div>

        <div className="h-[250px] md:h-[300px] w-full p-6 pt-0">
          <ChartContainer
            config={chartConfig}
            className="w-full h-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-accent/20"
          >
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                dy={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </div>

        <p className="mt-auto p-6 pt-0 text-[11px] text-muted-foreground font-medium italic opacity-70">
          * Income and expense values displayed are exclusive of taxes.
        </p>
      </div>
    </div>
  );
}


