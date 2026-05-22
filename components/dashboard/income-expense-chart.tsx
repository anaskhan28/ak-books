"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { formatINR } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// ── Types ────────────────────────────────────────────────────────────────────

interface RawTransactionData {
  invoices: { totalAmount: number; invoiceDate: string | null; createdAt: Date }[];
  payments: { amount: number; paymentDate: string }[];
  expenses: { amount: number; date: string }[];
  labour: { totalCost: number; date: string }[];
}

interface IncomeExpenseChartProps {
  rawData: RawTransactionData;
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

type Period = "1m" | "3m" | "6m" | "12m" | "last_year";
type Basis = "accrual" | "cash";

const PERIODS = [
  { value: "1m", label: "Last 30 Days" },
  { value: "3m", label: "Last 3 Months" },
  { value: "6m", label: "Last 6 Months" },
  { value: "12m", label: "Last 12 Months" },
  { value: "last_year", label: "Last Year" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(str: string | Date | null | undefined): Date | null {
  if (!str) return null;
  if (str instanceof Date) return str;
  if (typeof str !== "string") return null;

  if (str.includes("T")) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  const parts = str.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function IncomeExpenseChart({ rawData }: IncomeExpenseChartProps) {
  const [basis, setBasis] = useState<Basis>("accrual");
  const [period, setPeriod] = useState<Period>("12m");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 1. Generate Buckets
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  interface Bucket {
    label: string;
    key: string; // YYYY-MM-DD or YYYY-MM
    income: number;
    expense: number;
  }

  let buckets: Bucket[] = [];

  if (period === "1m") {
    // Generate 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      const key = formatDate(d);
      buckets.push({ label, key, income: 0, expense: 0 });
    }
  } else if (period === "3m" || period === "6m" || period === "12m") {
    const monthsCount = period === "3m" ? 3 : period === "6m" ? 6 : 12;
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.push({ label, key, income: 0, expense: 0 });
    }
  } else if (period === "last_year") {
    const lastYear = today.getFullYear() - 1;
    for (let m = 0; m < 12; m++) {
      const d = new Date(lastYear, m, 1);
      const label = d.toLocaleDateString("en-GB", { month: "short" });
      const key = `${lastYear}-${String(m + 1).padStart(2, "0")}`;
      buckets.push({ label, key, income: 0, expense: 0 });
    }
  }

  // Helper to match date to a bucket
  const matchBucketIndex = (itemDate: Date): number => {
    if (period === "1m") {
      const itemKey = formatDate(itemDate);
      return buckets.findIndex((b) => b.key === itemKey);
    } else {
      const itemKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, "0")}`;
      return buckets.findIndex((b) => b.key === itemKey);
    }
  };

  // 2. Aggregate Income
  if (basis === "accrual") {
    rawData.invoices.forEach((inv) => {
      const date = parseDate(inv.invoiceDate || inv.createdAt);
      if (date) {
        const idx = matchBucketIndex(date);
        if (idx !== -1) {
          buckets[idx].income += inv.totalAmount;
        }
      }
    });
  } else {
    rawData.payments.forEach((p) => {
      const date = parseDate(p.paymentDate);
      if (date) {
        const idx = matchBucketIndex(date);
        if (idx !== -1) {
          buckets[idx].income += p.amount;
        }
      }
    });
  }

  // 3. Aggregate Expenses
  rawData.expenses.forEach((e) => {
    const date = parseDate(e.date);
    if (date) {
      const idx = matchBucketIndex(date);
      if (idx !== -1) {
        buckets[idx].expense += e.amount;
      }
    }
  });

  rawData.labour.forEach((l) => {
    const date = parseDate(l.date);
    if (date) {
      const idx = matchBucketIndex(date);
      if (idx !== -1) {
        buckets[idx].expense += l.totalCost;
      }
    }
  });

  // Calculate totals for the visible period
  const totalIncome = buckets.reduce((sum, b) => sum + b.income, 0);
  const totalExpenses = buckets.reduce((sum, b) => sum + b.expense, 0);

  const activePeriodLabel = PERIODS.find((p) => p.value === period)?.label || "Last 12 Months";

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-foreground tracking-tight">
          Income and Expense
        </h3>
        <div className="flex items-center gap-4">
          {/* Dropdown Select Period */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 tracking-widest hover:text-slate-600 focus:outline-none"
            >
              {activePeriodLabel.toUpperCase()} <ChevronDown size={14} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-[12px]">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setPeriod(p.value as Period);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors ${
                      period === p.value ? "text-primary font-semibold" : "text-gray-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Basis Toggle */}
          <div className="flex rounded bg-slate-50 border border-slate-200 p-0.5">
            <button
              onClick={() => setBasis("accrual")}
              className={`px-3 py-1 text-[10px] rounded-sm transition-all tracking-wider ${
                basis === "accrual"
                  ? "font-bold text-slate-600 bg-white border border-slate-100 shadow-sm"
                  : "font-semibold text-muted-foreground hover:text-slate-600"
              }`}
            >
              Accrual
            </button>
            <button
              onClick={() => setBasis("cash")}
              className={`px-3 py-1 text-[10px] rounded-sm transition-all tracking-wider ${
                basis === "cash"
                  ? "font-bold text-slate-600 bg-white border border-slate-100 shadow-sm"
                  : "font-semibold text-muted-foreground hover:text-slate-600"
              }`}
            >
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
              data={buckets}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                dy={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${v / 1000}K` : v)}
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
                dot={period === "1m" ? false : { r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={period === "1m" ? false : { r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" }}
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
