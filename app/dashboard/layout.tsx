import DashboardSidebar from "@/app/dashboard/dashboard-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main>
        <div className="p-2 flex items-center gap-4">
          <SidebarTrigger />
          <span>FormKiller</span>
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
