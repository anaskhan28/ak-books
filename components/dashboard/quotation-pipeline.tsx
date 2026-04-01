"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import { formatINR } from "@/lib/utils";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PipelineData {
  status: string;
  count: number;
  value: number;
}

interface QuotationPipelineProps {
  data: PipelineData[];
}

const COLORS = ["#94a3b8", "#3b82f6", "#10b981", "#f59e0b"];

export default function QuotationPipeline({ data }: QuotationPipelineProps) {
  const totalValue = data.reduce((acc, item) => acc + item.value, 0);

  const chartConfig = {
    value: {
      label: "Value",
    },
    ...data.reduce((acc, item, index) => {
      const statusKey = item.status.toLowerCase();
      acc[statusKey] = {
        label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        color: COLORS[index % COLORS.length],
      };
      return acc;
    }, {} as ChartConfig),
  } satisfies ChartConfig;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-foreground tracking-tight">
          Quotation Pipeline
        </h3>
        <p className="text-[10px] text-muted-foreground font-normal tracking-[0.1em]">
          By Status
        </p>
      </div>

      <div className="flex flex-col min-h-[300px] p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-[13px] font-medium text-muted-foreground tracking-widest mb-0.5">
              Total Pipeline Value
            </p>
            <p className="text-2xl font-medium text-foreground leading-tight">
              {formatINR(totalValue).replace(".00", "")}
            </p>
          </div>
        </div>

        <div className="h-[150px] md:h-[220px] w-full">
          <ChartContainer
            config={chartConfig}
            className="w-full h-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-accent/20"
          >
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="status"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)}
              />
              <ChartTooltip
                cursor={false} // Use the CSS cursor styling from ChartContainer or default
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                barSize={32}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        <div className="grid grid-cols-2 gap-y-4 mt-8">
          {data.map((item, index) => (
            <div key={item.status} className="flex items-center gap-3">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex flex-col">
                <span className="text-[12px] text-muted-foreground font-normal tracking-wider">
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)} ({item.count})
                </span>
                <span className="text-[13px] font-normal text-foreground">
                  {formatINR(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


