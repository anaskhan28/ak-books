import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface MiniFinanceCardProps {
  title: string;
  count: number;
  href: string;
  variant?: "danger" | "default";
}

function MiniFinanceCard({
  title,
  count,
  href,
  variant = "default",
}: MiniFinanceCardProps) {
  const bgColor = variant === "danger" ? "bg-[#FFF1F1]" : "bg-white";
  const textColor = variant === "danger" ? "text-red-600" : "text-slate-700";
  const borderColor =
    variant === "danger" ? "border-red-100" : "border-slate-200";

  return (
    <Link
      href={href}
      className={`${bgColor} ${borderColor} border rounded-xl md:p-5 p-4 flex items-center justify-between hover:shadow-sm transition-all group`}
    >
      <div className="flex flex-col gap-1">
        <span
          className={`text-2xl font-medium ${variant === "danger" ? "text-red-700" : "text-foreground"}`}
        >
          {count}
        </span>
        <span className={`text-[13px] font-medium tracking-tight ${variant === "danger" ? "text-red-600" : "text-muted-foreground"}`}>
          {title}
        </span>
      </div>
      <div className="text-slate-300 group-hover:text-slate-700 transition-colors">
        <ChevronDown size={20} className="-rotate-90" />
      </div>
    </Link>
  );
}

export default function InvoiceCards({
  overdueInvoicesCount,
  unpaidInvoicesCount,
}: {
  overdueInvoicesCount: number;
  unpaidInvoicesCount: number;
}) {
  return (
    <div className="flex flex-col md:gap-6 gap-2">
      <MiniFinanceCard
        title="Overdue Invoices"
        count={overdueInvoicesCount}
        href="/invoices?status=overdue"
        variant="danger"
      />
      <MiniFinanceCard
        title="Unpaid Invoices"
        count={unpaidInvoicesCount}
        href="/invoices?status=unpaid"
      />
    </div>
  );
}
