import {
  BookOpen,
  Calendar,
  CheckSquare,
  Home,
  Inbox,
  LayoutTemplate,
  Search,
  Settings,
  User,
} from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import TemplateGalleryDialog from "@/components/template-gallery-dialog";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "All Tasks",
    url: "/tasks",
    icon: CheckSquare,
  },
];

export function AppSidebar() {
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setIsTemplateGalleryOpen(true)}>
                  <LayoutTemplate />
                  <span>Browse Templates</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <TemplateGalleryDialog
        open={isTemplateGalleryOpen}
        onOpenChange={setIsTemplateGalleryOpen}
      />
    </Sidebar>
  );
}
