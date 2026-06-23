import type { ReactNode } from "react";
import { AppNavbar } from "@/components/layout/app-navbar";
import { AppSidebar } from "@/components/layout/app-sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="page-shell">
      <div className="grid min-h-[calc(100svh-2rem)] grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <AppSidebar />
        <div className="flex min-h-0 flex-col gap-4">
          <AppNavbar />
          <main id="main-content" className="min-h-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
