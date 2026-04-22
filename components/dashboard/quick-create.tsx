"use client";

import {
  Users,
  FileText,
  Receipt,
  HardHat,
  FileBadge,
  Zap,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

const actions = [
  {
    label: "New Customer",
    href: "/clients?action=new",
    icon: UserPlus,
    bg: "bg-[#F8FAFC]",
    iconColor: "text-[#64748B]",
  },
  {
    label: "New Invoice",
    href: "/invoices/new",
    icon: FileText,
    bg: "bg-[#F0FDF4]",
    iconColor: "text-[#16a34a]",
  },
  {
    label: "New Quote",
    href: "/quotations/new",
    icon: FileBadge,
    bg: "bg-[#FEF2F2]",
    iconColor: "text-[#dc2626]",
  },
  {
    label: "New Expense",
    href: "/expenses?action=new",
    icon: Receipt,
    bg: "bg-[#FFF7ED]",
    iconColor: "text-[#ea580c]",
  },
];

export default function QuickCreate() {
  return (
    <div className="md:hidden mb-8">
      <div className="flex items-center gap-2 mb-5 px-1">
        <Zap size={14} className="text-slate-800" />
        <h3 className="text-[15px] font-normal text-slate-900   tracking-widest">
          Quick Create
        </h3>
      </div>
      <div className="grid grid-cols-4 gap-10 px-2">
        {actions.map((action) => (
          <div key={action.label} className="flex flex-col items-center ">
            <Link
              href={action.href}
              className="flex flex-col items-center gap-3 p-3.5 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 active:bg-slate-50 transition-all shadow-sm shadow-slate-200/50"
            >
              <div
                className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center`}
              >
                <action.icon
                  size={22}
                  className={action.iconColor}
                  strokeWidth={1.8}
                />
              </div>
            </Link>
            <span className="text-[13px]  w-12 font-medium text-slate-600 text-center pt-2">
              {action.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
