const variants: Record<string, string> = {
  planning: "bg-blue-50 text-blue-700 border-blue-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "in-progress": "bg-amber-50 text-amber-700 border-amber-200",
  "on-hold": "bg-orange-50 text-orange-700 border-orange-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  draft: "bg-slate-50 text-slate-600 border-slate-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  invoiced: "bg-violet-50 text-violet-700 border-violet-200",
  unpaid: "bg-red-50 text-red-700 border-red-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-red-100 text-red-800 border-red-300",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = variants[status] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-normal capitalize border ${cls}`}
    >
      {status.replace("-", " ")}
    </span>
  );
}
