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
import {
  Form,
  PersonStanding,
  Layers,
  Images,
  LibraryBig,
  Users,
  Flame,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import LocaleSwitcher from "@/app/dashboard/__components/locale-switcher";

export default async function AdminSidebar() {
  const [t, currentLocale] = await Promise.all([
    getTranslations(),
    getLocale(),
  ]);

  const items = [
    {
      label: t("dashboard.sidebar.forms"),
      icon: Form,
      url: urls.admin.forms.index,
    },
    {
      label: t("dashboard.sidebar.tests"),
      icon: Flame,
      url: urls.admin.tests.index,
    },
    {
      label: t("dashboard.sidebar.slides"),
      icon: Images,
      url: urls.admin.slides.index,
    },
    {
      label: t("dashboard.sidebar.users"),
      icon: Users,
      url: urls.admin.users.index,
    },
    {
      label: t("dashboard.sidebar.leads"),
      icon: PersonStanding,
      url: urls.admin.leads.index,
    },
    {
      label: t("dashboard.sidebar.sessions"),
      icon: Layers,
      url: urls.admin.sessions.index,
    },
    {
      label: t("dashboard.sidebar.library"),
      icon: LibraryBig,
      url: urls.admin.library.index,
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
              {items.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="text-lg font-bold">
                      <item.icon />
                      <span>{item.label}</span>
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
