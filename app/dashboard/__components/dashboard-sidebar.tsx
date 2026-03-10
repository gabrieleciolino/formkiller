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
import { Form } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const items = [
  {
    label: "Forms",
    icon: Form,
    url: urls.dashboard.forms.index,
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
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((project) => (
                <SidebarMenuItem key={project.label}>
                  <SidebarMenuButton size="lg" asChild>
                    <Link href={project.url}>
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
