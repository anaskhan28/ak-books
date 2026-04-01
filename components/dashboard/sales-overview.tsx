"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatINR } from "@/lib/utils";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TemplateStat {
  name: string;
  invoices: { count: number; value: number };
  quotations: { count: number; value: number };
}

interface SalesOverviewProps {
  data: {
    invoices: { count: number; value: number };
    quotations: { count: number; value: number };
    templateStats: TemplateStat[];
  };
}

const chartConfig = {
  invoiceAmt: {
    label: "Invoices",
    color: "hsl(var(--primary))",
  },
  quotationAmt: {
    label: "Quotes",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig;

export default function SalesOverview({ data }: SalesOverviewProps) {
  // Use template stats for the chart. Each template has quote and invoice values.
  const chartData = data.templateStats.map((stat) => ({
    name: stat.name,
    shortName: (stat as any).shortName || stat.name,
    quotationAmt: stat.quotations.value,
    invoiceAmt: stat.invoices.value,
  }));

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-full">
      <div className="md:px-6 px-4 md:py-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-medium text-foreground tracking-tight">
            Template Performance
          </h3>
          <span className="text-[10px] bg-slate-100 text-muted-foreground px-1.5 py-0.5 rounded font-mono">
            SALES_INDEX
          </span>
        </div>
      </div>

      <div className="">
        <div className="flex items-center justify-between mb-8 p-6 pb-0">
          <div className="flex items-center gap-6 md:gap-8">
            <div className="space-y-1">
              <p className="text-[13px] font-medium text-muted-foreground tracking-widest mb-0.5">
                Total Quotes
              </p>
              <h2 className="text-2xl font-medium text-foreground leading-tight">
                {formatINR(data.quotations.value)}
              </h2>
            </div>
            <div className="space-y-1">
              <p className="text-[13px] font-medium text-primary tracking-widest mb-0.5">
                Total Invoiced
              </p>
              <h2 className="text-2xl font-medium text-foreground leading-tight">
                {formatINR(data.invoices.value)}
              </h2>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-blue-500" />
              <span className="text-[12px] text-muted-foreground font-normal">
                Invoices
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-slate-400" />
              <span className="text-[12px] text-muted-foreground font-normal">
                Quotes
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-[250px] md:h-[280px] p-6 pt-0">
          {chartData.length > 0 ? (
            <ChartContainer 
              config={chartConfig} 
              className="w-full h-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-accent/20"
            >
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillInvoice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillQuotation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}M`
                      : v >= 1000
                        ? `${v / 1000}K`
                        : v
                  }
                />
                <ChartTooltip 
                  cursor={false}
                  content={<ChartTooltipContent />} 
                />
                <Area
                  type="monotone"
                  dataKey="quotationAmt"
                  stroke="#94a3b8"
                  fillOpacity={1}
                  fill="url(#fillQuotation)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="invoiceAmt"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#fillInvoice)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg text-muted-foreground text-[12px] font-medium">
              No template data available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


