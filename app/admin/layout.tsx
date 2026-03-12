import AdminSidebar from "@/app/admin/__components/admin-sidebar";
import SidebarToggle from "@/app/dashboard/__components/sidebar-toggle";
import { SidebarProvider } from "@/components/ui/sidebar";
import { urls } from "@/lib/urls";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex-1">
        <div className="p-2 flex items-center gap-4">
          <div className="order-1 ml-auto md:order-0 md:ml-0">
            <SidebarToggle />
          </div>
          <Link href={urls.admin.index}>
            <Image
              src="/logo.png"
              width={100}
              height={100}
              alt="FormKiller Logo"
              className="block w-auto min-h-[40px] md:hidden mb-2"
              loading="eager"
            />
          </Link>
        </div>
        <div className="p-2 md:p-4">{children}</div>
      </main>
    </SidebarProvider>
  );
}
