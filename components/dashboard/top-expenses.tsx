"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR } from "@/lib/utils";

interface ExpenseItem {
  name: string;
  amount: number;
  percentage: number;
}

interface TopExpensesProps {
  data: ExpenseItem[];
}

const COLORS = [
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
];

export default function TopExpenses({ data }: TopExpensesProps) {
  const totalAmount = data.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-foreground tracking-tight">
          Top Expenses
        </h3>
        <p className="text-[10px] text-muted-foreground font-normal whitespace-nowrap tracking-[0.1em] uppercase">
          Last 12 Months
        </p>
      </div>

      <div className="flex flex-col xl:flex-row items-center min-h-[300px]">
        {/* Donut Chart Section */}
        <div className="w-full xl:w-[250px] h-[250px] relative p-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="amount"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => formatINR(Number(value))}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Inner Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[11px] font-medium text-muted-foreground tracking-widest mb-0.5 uppercase">
              Total
            </p>
            <p className="text-xl font-medium text-foreground leading-tight">
              {formatINR(totalAmount).replace(".00", "")}
            </p>
          </div>
        </div>

        {/* Legend List Section */}
        <div className="w-full xl:flex-1 p-6 xl:pl-8 mt-6 xl:mt-0 space-y-4">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-[13px] text-muted-foreground font-normal group-hover:text-foreground transition-colors">
                  {item.name}
                </span>
              </div>
              <span className="text-[14px] font-medium text-foreground">
                {formatINR(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

