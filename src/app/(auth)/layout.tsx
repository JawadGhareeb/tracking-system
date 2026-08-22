"use client";

import { useTranslation } from "react-i18next";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <section className="flex items-center justify-center p-6">{children}</section>

      <section className="relative hidden overflow-hidden rounded-r-4xl md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/images/auth.jpg"
          alt={t("authLayout.imageAlt")}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-black/20 to-[var(--primary-500)]/25" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-right text-[var(--white)]">
          <p className="text-sm opacity-90">{t("authLayout.subtitle")}</p>
          <h2 className="mt-2 text-3xl font-bold leading-tight">
            {t("authLayout.titleLine1")}
            <br />
            {t("authLayout.titleLine2")}
          </h2>
        </div>
      </section>
    </div>
  );
}
