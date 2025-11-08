import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet } from "react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

export default function Layout() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <AppSidebar />
          <ReactQueryDevtools initialIsOpen={false} />
          <main className="flex flex-col w-full h-screen bg-background">
            <SidebarTrigger />
            <Outlet />
          </main>
        </SidebarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
