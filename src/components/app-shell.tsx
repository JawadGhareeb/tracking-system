"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

const LAYOUT_WITHOUT_SIDEBAR = ["/login"];

interface IAppShellProps {
  children: React.ReactNode;
}

function shouldRenderSidebar(pathname: string): boolean {
  return !LAYOUT_WITHOUT_SIDEBAR.some((route) => {
    if (pathname === route) {
      return true;
    }

    return pathname.startsWith(`${route}/`);
  });
}

export function AppShell({ children }: IAppShellProps) {
  const pathname = usePathname();
  const renderSidebar = shouldRenderSidebar(pathname);

  if (!renderSidebar) {
    return <main className="min-h-screen bg-[var(--white-100)]">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[var(--white-100)]">{children}</main>
    </div>
  );
}
