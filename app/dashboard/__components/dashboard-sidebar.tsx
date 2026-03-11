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
import { Form, PersonStanding } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const items = [
  {
    label: "Forms",
    icon: Form,
    url: urls.dashboard.forms.index,
  },
  {
    label: "Leads",
    icon: PersonStanding,
    url: urls.dashboard.leads.index,
  },
];

export default function DashboardSidebar() {
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
      <SidebarFooter />
    </Sidebar>
  );
}
