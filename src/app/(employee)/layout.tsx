"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { authApiService } from "@/services/api.auth.service";
import { normalizeUser } from "@/lib/normalize-api";
import { isAdminRoleName, isEmployeeRoleName } from "@/lib/role-access";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    void authApiService.me().then((response) => {
      if (!active) return;
      const user = normalizeUser(response);
      if (isEmployeeRoleName(user.role.name)) {
        setAllowed(true);
        return;
      }
      router.replace(isAdminRoleName(user.role.name) ? "/dashboard" : "/");
    }).catch(() => router.replace("/login"));
    return () => { active = false; };
  }, [router]);

  if (!allowed) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--white-100)] p-6 text-sm text-[var(--black-200)]">{t("employeePortal.checkingAccess")}</main>;
  }

  return (
    <div className="min-h-screen bg-[var(--white-100)]">
      <header className="border-b border-[var(--primary-100)] bg-[var(--white)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-bold text-[var(--primary-500)]">{t("common.appTitle")}</Link>
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <Link href="/employee/orders" className="rounded-xl bg-[var(--primary-100)] px-4 py-2 text-[var(--primary-500)]">{t("employeePortal.workOrders")}</Link>
            <Link href="/employee/profile" className="rounded-xl px-4 py-2 text-[var(--black-200)] hover:bg-[var(--primary-100)]">{t("employeePortal.profile")}</Link>
            <Link href="/" className="rounded-xl px-4 py-2 text-[var(--black-200)] hover:bg-[var(--primary-100)]">{t("sidebar.goToWebsite")}</Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
