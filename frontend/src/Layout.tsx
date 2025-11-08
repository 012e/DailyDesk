import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet } from "react-router";
import { ThemeProvider } from "@/components/theme-provider";

export default function Layout() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col w-full h-screen bg-background">
          <SidebarTrigger />
          <Outlet />
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}
