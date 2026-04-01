"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-context";
import {
  LayoutDashboard,
  FolderKanban,
  HardHat,
  Receipt,
  FileText,
  FileCheck,
  Building2,
  IndianRupee,
  ChevronDown,
  ChevronRight,
  Settings,
  HelpCircle,
  Plus,
  ArrowRight,
  Users,
} from "lucide-react";
import Image from "next/image";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: number;
}

const operationsNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects / Jobs", href: "/projects", icon: FolderKanban },
  { label: "Labour Tracking", href: "/labour", icon: HardHat },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Workers", href: "/workers", icon: Users },
];

const billingNav: NavItem[] = [
  { label: "Quotations", href: "/quotations", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: FileCheck },
  { label: "Payments", href: "/payments", icon: IndianRupee },
];

export default function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const navLinkCls = (href: string) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-150 ${isActive(href)
      ? "bg-primary text-white shadow-sm shadow-primary/25"
      : "text-muted hover:bg-accent mt-2 hover:text-foreground"
    }`;

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-5 border-b justify-start border-border group overflow-hidden">
        <div className="relative">
          <Image src="/ak-enterprise-logo.png" alt="Logo" width={40} height={40} className="filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[17px] font-bold tracking-tight text-primary block leading-none">
            AK Books
          </span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.05em] mt-1 opacity-70">
            Enterprise Suite
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4">
        <p className="px-3 text-[11px] font-normal text-muted  tracking-wider mb-2">
          Operations
        </p>
        <ul className="space-y-0.5">
          {operationsNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={navLinkCls(item.href)}
              >
                <item.icon
                  size={18}
                  strokeWidth={isActive(item.href) ? 2.2 : 1.8}
                />
                <span className="flex-1 text-left">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="px-3 text-[11px] font-normal text-muted  tracking-wider mt-6 mb-2">
          Billing
        </p>
        <ul className="space-y-0.5">
          {billingNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={navLinkCls(item.href)}
              >
                <item.icon
                  size={18}
                  strokeWidth={isActive(item.href) ? 2.2 : 1.8}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="px-3 text-[11px] font-normal text-muted  tracking-wider mt-6 mb-2">
          Directory
        </p>
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/clients"
              onClick={() => setMobileOpen(false)}
              className={navLinkCls("/clients")}
            >
              <Building2
                size={18}
                strokeWidth={isActive("/clients") ? 2.2 : 1.8}
              />
              <span>Client Database</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-border px-3 py-2">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-muted hover:bg-sidebar-hover hover:text-muted transition-all">
          <Settings size={18} strokeWidth={1.8} />
          <span>Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-muted hover:bg-sidebar-hover hover:text-muted transition-all">
          <HelpCircle size={18} strokeWidth={1.8} />
          <span>Help & Support</span>
        </button>
      </div>

      {/* New Project Quick Action */}
      <Link
        href="/projects/new"
        onClick={() => setMobileOpen(false)}
        className="mx-3 mb-3 bg-primary rounded-xl p-3.5 flex items-center gap-3 hover:bg-primary-dark transition-colors"
      >
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
          <Plus size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-normal text-white">New Project</p>
          <p className="text-[11px] text-white/70">Create a new job</p>
        </div>
        <ArrowRight size={16} className="text-white/80" />
      </Link>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <aside className={`hidden md:flex w-[260px] min-w-[260px] h-screen bg-surface border-r border-border flex-col animate-slide-in-left ${className}`}>
        {sidebarContent}
      </aside>

      {/* Sidebar - mobile */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-border flex flex-col transition-transform duration-300 shadow-2xl ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
