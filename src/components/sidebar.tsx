"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Languages, Monitor, Moon, Scissors, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Icons } from "@/lib/icons";
import { getUserDisplayName } from "@/lib/normalize-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hook/use-auth";

export function Sidebar() {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const { logout, profile, fetchProfile } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<"system" | "light" | "dark">("system");
  const [isDark, setIsDark] = useState(false);
  const languageMode: "ar" | "en" = i18n.resolvedLanguage === "en" ? "en" : "ar";

  const handleLogout = () => {
    logout();
    setIsLogoutOpen(false);
    setIsUserMenuOpen(false);
    router.replace("/");
  };

  useEffect(() => {
    void fetchProfile().catch(() => undefined);
  }, [fetchProfile]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const storedThemeMode = window.localStorage.getItem("theme-mode");
    const legacyTheme = window.localStorage.getItem("theme");
    const resolvedThemeMode =
      storedThemeMode === "system" || storedThemeMode === "light" || storedThemeMode === "dark"
        ? storedThemeMode
        : legacyTheme === "dark" || legacyTheme === "light"
          ? legacyTheme
          : "system";

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
      if (themeMode !== "system") {
        return;
      }

      const shouldUseDark = mediaQuery.matches;
      document.documentElement.classList.toggle("dark", shouldUseDark);
      setIsDark(shouldUseDark);
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [themeMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current) {
        return;
      }

      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToProfile = () => {
    setIsUserMenuOpen(false);
    router.push("/profile");
  };

  const goToWebsite = () => {
    setIsUserMenuOpen(false);
    router.push("/");
  };

  const openLogoutDialog = () => {
    setIsUserMenuOpen(false);
    setIsLogoutOpen(true);
  };

  const applyLanguageMode = (mode: "ar" | "en") => {
    void i18n.changeLanguage(mode);
  };

  const applyThemeMode = (mode: "system" | "light" | "dark") => {
    const shouldUseDark =
      mode === "dark" ||
      (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
    setThemeMode(mode);
    window.localStorage.setItem("theme-mode", mode);
  };

  const displayName = profile ? getUserDisplayName(profile) : t("auth.account");
  const navigation = [
    {
      name: t("sidebar.dashboard"),
      href: "/dashboard",
      icon: Icons.home,
    },
    {
      name: t("sidebar.users"),
      href: "/employees",
      icon: Icons.users,
    },
    {
      name: t("sidebar.orders"),
      href: "/orders",
      icon: Icons.orders,
    },
    {
      name: "المواد الخام",
      href: "/raw-materials",
      icon: Icons.fileText,
    },
    {
      name: "المصاريف",
      href: "/expenses",
      icon: Icons.dollar,
    },
    {
      name: t("sidebar.roles"),
      href: "/roles",
      icon: Icons.briefcase,
    },
  ];

  return (
    <div className="flex h-screen w-[272px] flex-col border-l border-[var(--primary-100)] bg-[var(--white-100)] shadow-[0_12px_32px_rgba(199,91,122,0.06)]">
      <div className="flex h-20 items-center border-b border-[var(--primary-100)] bg-[var(--primary-300)] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)]">
            <Scissors className="h-5 w-5" />
          </div>
          <div className="text-right leading-tight text-white">
            <p className="text-xs font-semibold opacity-90">{t("common.brand")}</p>
            <p className="text-base font-bold">{t("common.appTitle")}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-4 bg-[var(--white-100)] px-4 py-6">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition-colors",
                isActive
                  ? "bg-[var(--primary-300)] text-white shadow-[0_12px_24px_rgba(199,91,122,0.18)]"
                  : "text-[var(--black-300)] hover:bg-[var(--primary-100)] hover:text-[var(--primary-400)]"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--primary-100)] bg-[var(--white-100)] p-5">
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-[var(--primary-200)] bg-[var(--white)] px-3 py-2.5 text-right transition hover:border-[var(--primary-300)] hover:bg-[var(--primary-100)]"
            onClick={() => setIsUserMenuOpen((previous) => !previous)}
            aria-label="خيارات المستخدم"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-100)] text-[var(--primary-400)]">
                <Icons.user className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--black-300)]">{displayName}</p>
                <p className="text-xs text-[var(--black-200)]">{t("sidebar.accountOptions")}</p>
              </div>
            </div>
          </button>

          {isUserMenuOpen ? (
            <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-[var(--primary-100)] bg-[var(--white)] p-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.12)]">
              <button
                type="button"
                onClick={goToProfile}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-[var(--black-300)] transition hover:bg-[var(--primary-100)]"
              >
                <span>{t("sidebar.profile")}</span>
                <Icons.user className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goToWebsite}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-[var(--black-300)] transition hover:bg-[var(--primary-100)]"
              >
                <span>{t("sidebar.goToWebsite")}</span>
                <Icons.home className="h-4 w-4" />
              </button>
              <div className="my-1 h-px bg-[var(--primary-100)]" />
              <div className="rounded-lg px-3 py-2">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[var(--black-200)]">
                  <span>{t("language.options")}</span>
                  <Languages className="h-3.5 w-3.5" />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => applyLanguageMode("ar")}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs font-semibold transition",
                      languageMode === "ar"
                        ? "border-[var(--primary-300)] bg-[var(--primary-100)] text-[var(--primary-400)]"
                        : "border-[var(--primary-100)] text-[var(--black-300)] hover:bg-[var(--primary-100)]"
                    )}
                  >
                    {t("language.ar")}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLanguageMode("en")}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs font-semibold transition",
                      languageMode === "en"
                        ? "border-[var(--primary-300)] bg-[var(--primary-100)] text-[var(--primary-400)]"
                        : "border-[var(--primary-100)] text-[var(--black-300)] hover:bg-[var(--primary-100)]"
                    )}
                  >
                    {t("language.en")}
                  </button>
                </div>
              </div>
              <div className="rounded-lg px-3 py-2">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[var(--black-200)]">
                  <span>{t("theme.options")}</span>
                  {themeMode === "system" ? (
                    <Monitor className="h-3.5 w-3.5" />
                  ) : isDark ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => applyThemeMode("system")}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border px-2 py-1 text-xs font-semibold transition",
                      themeMode === "system"
                        ? "border-[var(--primary-300)] bg-[var(--primary-100)] text-[var(--primary-400)]"
                        : "border-[var(--primary-100)] text-[var(--black-300)] hover:bg-[var(--primary-100)]"
                    )}
                  >
                    <span>{t("theme.system")}</span>
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyThemeMode("light")}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border px-2 py-1 text-xs font-semibold transition",
                      themeMode === "light"
                        ? "border-[var(--primary-300)] bg-[var(--primary-100)] text-[var(--primary-400)]"
                        : "border-[var(--primary-100)] text-[var(--black-300)] hover:bg-[var(--primary-100)]"
                    )}
                  >
                    <span>{t("theme.light")}</span>
                    <Sun className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyThemeMode("dark")}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border px-2 py-1 text-xs font-semibold transition",
                      themeMode === "dark"
                        ? "border-[var(--primary-300)] bg-[var(--primary-100)] text-[var(--primary-400)]"
                        : "border-[var(--primary-100)] text-[var(--black-300)] hover:bg-[var(--primary-100)]"
                    )}
                  >
                    <span>{t("theme.dark")}</span>
                    <Moon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="my-1 h-px bg-[var(--primary-100)]" />
              <button
                type="button"
                onClick={openLogoutDialog}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-[var(--black-300)] transition hover:bg-[var(--primary-100)]"
              >
                <span>{t("auth.logout")}</span>
                <Icons.logout className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sidebar.logoutConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("sidebar.logoutConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoutOpen(false)}>
              {t("sidebar.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              {t("auth.logout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
