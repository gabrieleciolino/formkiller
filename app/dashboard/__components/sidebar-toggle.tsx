"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

export default function SidebarToggle() {
  const sidebar = useSidebar();

  const handleSidebarToggle = () => {
    sidebar.toggleSidebar();
  };

  return (
    <Button size="icon-lg" variant="ghost" onClick={handleSidebarToggle}>
      <Menu className="size-6 md:size-5" />
    </Button>
  );
}
