import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet } from "react-router";
import Providers from "./components/providers";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function Layout() {
  return (
    <Providers>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col w-full h-screen bg-background">
          <ReactQueryDevtools initialIsOpen={false} />
          <SidebarTrigger />
          <Outlet />
        </main>
      </SidebarProvider>
    </Providers>
  );
}
