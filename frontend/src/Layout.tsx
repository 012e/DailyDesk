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

export default function Layout() {
  return (
    <Providers>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col w-full h-screen bg-background overflow-hidden">
          <ReactQueryDevtools initialIsOpen={false} />
          {/* Theme Toggle - Fixed position top right */}
          <div className="sticky top-0 right-0 flex justify-between items-center px-4 py-2 z-50 bg-background/80 backdrop-blur-sm">
            <SidebarTrigger />
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
              <div className="flex-1 overflow-y-auto">
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
        <Chatbox />
      </SidebarProvider>
    </Providers>
  );
}
