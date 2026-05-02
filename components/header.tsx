"use client";

import { Search, Bell, Calendar, ChevronDown, Download, Menu, FileOutput, Sparkles, BadgeCheck, CreditCard, LogOut } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export default function Header({ user }: { user: any | null }) {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();

  return (
    <header className="h-16 bg-white md:bg-surface border-b border-border flex items-center justify-between px-2 md:px-6 z-30">
      {/* Mobile Hamburger & Logo/Title */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 text-foreground hover:bg-accent rounded-lg transition-colors border border-border/50 shadow-sm"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Search */}
        <div className="hidden md:relative md:block w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search projects, clients..."
            className="w-full pl-10 pr-16 py-2.5 bg-background border border-border rounded-xl text-[13px] text-muted placeholder:text-muted/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-muted bg-background border border-border rounded-md px-1.5 py-0.5">
            <span className="text-[10px]">⌘</span> K
          </span>
        </div>

        {/* Mobile Search Icon */}
        <div className="md:hidden relative max-w-xl mr-2">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search projects, clients..."
            className="w-full pl-10 pr-16 py-2.5 bg-background border border-border rounded-xl text-[13px] text-muted placeholder:text-muted/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-muted bg-background border border-border rounded-md px-1.5 py-0.5">
            <span className="text-[10px]">⌘</span> K
          </span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 md:gap-3">
        {/* Export Report (Mobile Icon / Desktop Button) */}
        <button className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-primary text-white rounded-xl text-[13px] font-normal hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20">
          <Download size={15} strokeWidth={2} />
          <span className="hidden md:inline">Export Report</span>
        </button>

        {/* Date Filter (Compact on Mobile) */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-[13px] text-muted hover:text-muted hover:bg-background transition-all">
          <Calendar size={14} strokeWidth={1.8} />
          <span className="hidden md:inline">Mar 2026</span>
          <span className="hidden lg:inline text-[12px] text-muted/60">Monthly</span>
          <ChevronDown size={14} />
        </button>

        {/* Notifications */}
        {/* <button className="relative w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted hover:text-muted hover:bg-background transition-all">
          <Bell size={17} strokeWidth={1.8} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] text-white font-medium flex items-center justify-center">
            3
          </span>
        </button> */}

        {/* User / Admin (Dropdown Menu) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 md:gap-2.5 cursor-pointer group outline-none">
              <Avatar className="w-9 h-9 rounded-md shadow-sm">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="rounded-md bg-linear-to-br from-amber-400 to-orange-500 text-white text-sm font-medium">
                  {user.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-[13px] font-normal text-muted leading-tight group-hover:text-primary transition-colors">
                  {user.name}
                </p>
                <p className="text-[11px] text-muted font-medium">{user.role || "Operator"}</p>
              </div>
              <ChevronDown size={14} className="text-muted hidden md:block" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-md"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-md">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback className="rounded-md bg-linear-to-br from-amber-400 to-orange-500 text-white">
                    {user.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                <BadgeCheck className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={async () => {
                await authClient.signOut();
                router.push("/login");
                router.refresh();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
