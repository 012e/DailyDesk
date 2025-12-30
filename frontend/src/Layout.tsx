import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet } from "react-router";
import Providers from "./components/providers";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import PageLoader from "./components/full-page-loader";
import { Toaster } from "react-hot-toast";
import { Chatbox } from "@/components/chatbox";

export default function Layout() {
  return (
    <Providers>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col w-full h-screen bg-background">
          <ReactQueryDevtools initialIsOpen={false} />
          <SidebarTrigger />
          <ErrorBoundary
            fallback={
              <div className="flex justify-center items-center w-full h-full">
                Something went wrong
              </div>
            }
          >
            <Suspense fallback={<PageLoader />}>
              <Toaster position="top-right" reverseOrder={false} />
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
        <Chatbox />
      </SidebarProvider>
    </Providers>
  );
}
