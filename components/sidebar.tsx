"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  HardHat,
  Receipt,
  FileText,
  FileCheck,
  Building2,
  IndianRupee,
  Settings,
  HelpCircle,
  Plus,
  ArrowRight,
  Users,
} from "lucide-react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
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

export default function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <Sidebar className="border-r border-border bg-white">
      <SidebarHeader className="p-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b justify-start border-border group overflow-hidden bg-white">
          <div className="relative">
            <Image
              src="/ak-enterprise-logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
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
      </SidebarHeader>

      <SidebarContent className="px-3 pt-4 bg-white">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-[13px] font-medium text-muted-foreground/80 mb-2 h-auto capitalize">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {operationsNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-medium transition-all duration-150 h-auto",
                        active
                          ? "shadow-sm shadow-primary/25"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon
                          size={18}
                          strokeWidth={active ? 2.2 : 1.8}
                        />
                        <span className="flex-1 text-left">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0 mt-6">
          <SidebarGroupLabel className="px-3 text-[13px] font-medium text-muted-foreground/80 mb-2 h-auto capitalize">
            Billing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {billingNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-medium transition-all duration-150 h-auto",
                        active
                          ? "shadow-sm shadow-primary/25"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon
                          size={18}
                          strokeWidth={active ? 2.2 : 1.8}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0 mt-6">
          <SidebarGroupLabel className="px-3 text-[13px] font-medium text-muted-foreground/80 mb-2 h-auto capitalize">
            Directory
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {(() => {
                  const active = isActive("/clients");
                  return (
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-medium transition-all duration-150 h-auto",
                        active
                          ? "shadow-sm shadow-primary/25"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <Link
                        href="/clients"
                        onClick={() => setOpenMobile(false)}
                      >
                        <Building2
                          size={18}
                          strokeWidth={active ? 2.2 : 1.8}
                        />
                        <span>Client Database</span>
                      </Link>
                    </SidebarMenuButton>
                  );
                })()}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0 bg-white">
        <div className="border-t border-border px-3 py-2">
          <SidebarMenuButton
            asChild
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all h-auto"
          >
            <button>
              <Settings size={18} strokeWidth={1.8} />
              <span>Settings</span>
            </button>
          </SidebarMenuButton>
          <SidebarMenuButton
            asChild
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all h-auto"
          >
            <button>
              <HelpCircle size={18} strokeWidth={1.8} />
              <span>Help & Support</span>
            </button>
          </SidebarMenuButton>
        </div>

        {/* New Project Quick Action */}
        <Link
          href="/projects/new"
          onClick={() => setOpenMobile(false)}
          className="mx-3 my-1 bg-primary rounded-md  p-2 md:p-3 flex items-center gap-3 hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
        >
          <div className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center shrink-0">
            <Plus size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-white leading-tight">
              New Project
            </p>
            <p className="text-[11px] text-white/80 mt-0.5">Create a new job</p>
          </div>
          <ArrowRight size={16} className="text-white/80" />
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
