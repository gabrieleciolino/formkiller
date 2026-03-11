import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { urls } from "@/lib/urls";
import { Form, PersonStanding, Layers, LibraryBig } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import LocaleSwitcher from "./locale-switcher";

export default async function DashboardSidebar() {
  const [t, currentLocale] = await Promise.all([
    getTranslations("dashboard.sidebar"),
    getLocale(),
  ]);

  const items = [
    {
      label: t("forms"),
      icon: Form,
      url: urls.dashboard.forms.index,
    },
    {
      label: t("leads"),
      icon: PersonStanding,
      url: urls.dashboard.leads.index,
    },
    {
      label: t("sessions"),
      icon: Layers,
      url: urls.dashboard.sessions.index,
    },
    {
      label: t("library"),
      icon: LibraryBig,
      url: urls.dashboard.library.index,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="hidden md:block">
        <Image
          src="/logo.png"
          width={150}
          height={150}
          alt="FormKiller Logo"
          className="w-full max-w-[200px]"
          loading="eager"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((project) => (
                <SidebarMenuItem key={project.label}>
                  <SidebarMenuButton asChild>
                    <Link href={project.url} className="text-lg font-bold">
                      <project.icon />
                      <span>{project.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <LocaleSwitcher currentLocale={currentLocale} />
      </SidebarFooter>
    </Sidebar>
  );
}
