import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet } from "react-router";
import Providers from "./components/providers";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import PageLoader from "./components/full-page-loader";
import { Chatbox } from "@/components/chatbox";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { GlobalSearch } from "@/components/global-search";

export default function Layout() {
  return (
    <Providers>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col w-full h-screen bg-background overflow-hidden">
          <ReactQueryDevtools initialIsOpen={false} />
          {/* Header with Search Bar */}
          <div className="sticky top-0 right-0 flex items-center gap-3 px-4 py-2 z-50 bg-background/80 backdrop-blur-sm">
            <SidebarTrigger />
            <GlobalSearch />
            <ThemeToggle />
          </div>

          <ErrorBoundary
            fallback={
              <div className="flex justify-center items-center w-full h-full">
                Something went wrong
              </div>
            }
          >
            <Suspense fallback={<PageLoader />}>
              <Toaster richColors />
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
        <Chatbox />
      </SidebarProvider>
    </Providers>
  );
}
