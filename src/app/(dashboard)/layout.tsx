"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/sidebar";
import { authApiService } from "@/services/api.auth.service";
import { normalizeUser } from "@/lib/normalize-api";

const ADMIN_ROLES = new Set(["admin", "superadmin", "أدمن"]);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    authApiService.me()
      .then((response) => {
        if (!active) return;
        const user = normalizeUser(response);
        const role = user.role.name.trim().toLowerCase();
        if (!ADMIN_ROLES.has(role)) {
          router.replace("/");
          return;
        }
        setAllowed(true);
      })
      .catch(() => { if (active) router.replace("/login"); });
    return () => { active = false; };
  }, [router]);

  if (!allowed) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--white-100)] text-sm text-[var(--black-200)]">{t("dashboardAccess.checking")}</div>;
  }

  return <div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 overflow-y-auto bg-[var(--white-100)]">{children}</main></div>;
}
