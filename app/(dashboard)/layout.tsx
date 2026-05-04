import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Session fetch for user data — auth redirect is handled by middleware
  const { data: session } = await auth.getSession();

  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset className="flex flex-col overflow-hidden h-screen">
        <Header user={session?.user ?? null} />
        <main className="flex-1 overflow-y-auto md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
