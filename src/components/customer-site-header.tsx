"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ClipboardList,
  Home,
  Languages,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Scissors,
  Sun,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/hook/use-auth";
import { cn } from "@/lib/utils";

type ThemeMode = "system" | "light" | "dark";
type LanguageMode = "ar" | "en";

export function CustomerSiteHeader() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [isDark, setIsDark] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const languageMode: LanguageMode = i18n.resolvedLanguage === "en" ? "en" : "ar";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const storedThemeMode = window.localStorage.getItem("theme-mode") as ThemeMode | null;
    const legacyTheme = window.localStorage.getItem("theme");
    const resolvedThemeMode =
      storedThemeMode ??
      (legacyTheme === "dark" || legacyTheme === "light" ? legacyTheme : "system");
    const shouldUseDark =
      resolvedThemeMode === "dark" ||
      (resolvedThemeMode === "system" && mediaQuery.matches);

    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
    setThemeMode(resolvedThemeMode);
    window.localStorage.setItem("theme-mode", resolvedThemeMode);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (themeMode !== "system") return;
      document.documentElement.classList.toggle("dark", mediaQuery.matches);
      setIsDark(mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [themeMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setIsThemeMenuOpen(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(target)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyThemeMode = (mode: ThemeMode) => {
    const shouldUseDark =
      mode === "dark" ||
      (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
    setThemeMode(mode);
    window.localStorage.setItem("theme-mode", mode);
    setIsThemeMenuOpen(false);
  };

  const applyLanguageMode = (mode: LanguageMode) => {
    void i18n.changeLanguage(mode);
    setIsLanguageMenuOpen(false);
  };

  const navigateFromAccount = (href: string) => {
    setIsUserMenuOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--primary-100)]/90 bg-[var(--white)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--primary-200)]"
          aria-label={t("common.appTitle")}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-300)] text-[var(--white)] shadow-[0_14px_30px_rgba(199,91,122,0.35)]">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--primary-400)]">{t("common.brand")}</p>
            <p className="text-lg font-bold">{t("common.appTitle")}</p>
          </div>
        </Link>

        <div className="flex items-center gap-3"><Link href="/" className="hidden items-center gap-2 rounded-xl border border-[var(--primary-100)] px-3 py-2 text-sm font-semibold text-[var(--black-300)] transition hover:bg-[var(--primary-100)] sm:inline-flex"><Home className="h-4 w-4" />{t("sidebar.goToWebsite", { defaultValue: "الرئيسية" })}</Link><div className="flex items-center gap-3 rounded-2xl border border-[var(--primary-100)] bg-[var(--white)]/85 p-2 shadow-[0_8px_22px_rgba(0,0,0,0.08)]">
          <div ref={languageMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsLanguageMenuOpen((previous) => !previous)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--black-200)] transition hover:bg-[var(--primary-100)] hover:text-[var(--primary-400)]"
              aria-label={t("language.options")}
            >
              <Languages className="h-5 w-5" />
            </button>
            {isLanguageMenuOpen ? (
              <div className="absolute left-0 top-12 min-w-40 rounded-xl border border-[var(--primary-100)] bg-[var(--white)] p-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.12)]">
                <button
                  type="button"
                  onClick={() => applyLanguageMode("ar")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm font-semibold transition hover:bg-[var(--primary-100)]",
                    languageMode === "ar"
                      ? "bg-[var(--primary-100)] text-[var(--primary-400)]"
                      : "text-[var(--black-300)]"
                  )}
                >
                  {t("language.ar")}
                </button>
                <button
                  type="button"
                  onClick={() => applyLanguageMode("en")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm font-semibold transition hover:bg-[var(--primary-100)]",
                    languageMode === "en"
                      ? "bg-[var(--primary-100)] text-[var(--primary-400)]"
                      : "text-[var(--black-300)]"
                  )}
                >
                  {t("language.en")}
                </button>
              </div>
            ) : null}
          </div>

          <div ref={themeMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen((previous) => !previous)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--black-200)] transition hover:bg-[var(--primary-100)] hover:text-[var(--primary-400)]"
              aria-label={t("theme.options")}
            >
              {themeMode === "system" ? (
                <Monitor className="h-5 w-5" />
              ) : isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            {isThemeMenuOpen ? (
              <div className="absolute left-0 top-12 min-w-44 rounded-xl border border-[var(--primary-100)] bg-[var(--white)] p-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.12)]">
                <button
                  type="button"
                  onClick={() => applyThemeMode("system")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm font-semibold transition hover:bg-[var(--primary-100)]",
                    themeMode === "system"
                      ? "bg-[var(--primary-100)] text-[var(--primary-400)]"
                      : "text-[var(--black-300)]"
                  )}
                >
                  <span>{t("theme.system")}</span>
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyThemeMode("light")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm font-semibold transition hover:bg-[var(--primary-100)]",
                    themeMode === "light"
                      ? "bg-[var(--primary-100)] text-[var(--primary-400)]"
                      : "text-[var(--black-300)]"
                  )}
                >
                  <span>{t("theme.light")}</span>
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyThemeMode("dark")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm font-semibold transition hover:bg-[var(--primary-100)]",
                    themeMode === "dark"
                      ? "bg-[var(--primary-100)] text-[var(--primary-400)]"
                      : "text-[var(--black-300)]"
                  )}
                >
                  <span>{t("theme.dark")}</span>
                  <Moon className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((previous) => !previous)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary-300)] px-3 py-2 text-[var(--white)] transition hover:bg-[var(--primary-400)]"
              aria-label={t("auth.account")}
            >
              <UserRound className="h-5 w-5" />
              <span className="text-sm font-semibold">{t("auth.account")}</span>
            </button>
            {isUserMenuOpen ? (
              <div className="absolute left-0 top-12 min-w-52 rounded-xl border border-[var(--primary-100)] bg-[var(--white)] p-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.12)]">
                <button
                  type="button"
                  onClick={() => navigateFromAccount("/account/profile")}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm font-semibold text-[var(--black-300)] transition hover:bg-[var(--primary-100)]"
                >
                  <span>{t("customerMenu.profile")}</span>
                  <UserRound className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateFromAccount("/my-orders")}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm font-semibold text-[var(--black-300)] transition hover:bg-[var(--primary-100)]"
                >
                  <span>{t("customerMenu.myOrders")}</span>
                  <ClipboardList className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateFromAccount("/my-orders/new")}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm font-semibold text-[var(--black-300)] transition hover:bg-[var(--primary-100)]"
                >
                  <span>{t("customerMenu.addOrder")}</span>
                  <Plus className="h-4 w-4" />
                </button>
                <div className="my-1 h-px bg-[var(--primary-100)]" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm font-semibold text-[var(--black-300)] transition hover:bg-[var(--primary-100)]"
                >
                  <span>{t("auth.logout")}</span>
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div></div>
      </div>
    </header>
  );
}
