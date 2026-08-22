"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Languages,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Phone,
  Scissors,
  Sun,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/hook/use-auth";
import { getAuthTokenCookie } from "@/services/auth-cookie";
import { authApiService } from "@/services/api.auth.service";
import { normalizeUser } from "@/lib/normalize-api";
import { cn } from "@/lib/utils";
import { ROLE_IDS } from "@/constant/roles";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

type ThemeMode = "system" | "light" | "dark";
type LanguageMode = "ar" | "en";

export default function HomePage() {
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const languageMode: LanguageMode = i18n.resolvedLanguage === "en" ? "en" : "ar";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const storedThemeMode = window.localStorage.getItem("theme-mode") as ThemeMode | null;
    const legacyTheme = window.localStorage.getItem("theme");
    const resolvedThemeMode =
      storedThemeMode ?? (legacyTheme === "dark" || legacyTheme === "light" ? legacyTheme : "system");

    const applyThemeMode = (mode: ThemeMode) => {
      const shouldUseDark = mode === "dark" || (mode === "system" && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", shouldUseDark);
      setIsDark(shouldUseDark);
      setThemeMode(mode);
      window.localStorage.setItem("theme-mode", mode);
    };

    applyThemeMode(resolvedThemeMode);

    const token = getAuthTokenCookie();
    setIsAuthenticated(Boolean(token));

    if (!token) {
      setRoleId("");
      return;
    }

    void authApiService
      .me(token)
      .then((user) => {
        const normalizedUser = normalizeUser(user);
        setRoleId(normalizedUser.role._id);
      })
      .catch(() => {
        setRoleId("");
      });
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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }

      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }

      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
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

  const handleUserAction = () => {
    if (!isAuthenticated) {
      router.push("/login");
      setIsUserMenuOpen(false);
      return;
    }

    logout();
    setIsAuthenticated(false);
    setRoleId("");
    setIsUserMenuOpen(false);
    router.push("/login");
  };

  const goToDashboard = () => {
    setIsUserMenuOpen(false);
    router.push("/dashboard");
  };

  const isAdmin = roleId === ROLE_IDS.ADMIN;

  return (
    <div className="relative overflow-hidden bg-[var(--white-100)] text-[var(--black-300)]">
      <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-[var(--primary-200)]/45 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 top-[28rem] h-80 w-80 rounded-full bg-[var(--secondary-200)]/35 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-[var(--primary-100)]/90 bg-[var(--white)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-300)] text-[var(--white)] shadow-[0_14px_30px_rgba(199,91,122,0.35)]">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--primary-400)]">{t("common.brand")}</p>
              <p className="text-lg font-bold">{t("common.appTitle")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--primary-100)] bg-[var(--white)]/85 p-2 shadow-[0_8px_22px_rgba(0,0,0,0.08)]">
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
                    <span>{t("language.ar")}</span>
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
                    <span>{t("language.en")}</span>
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
                  {isAuthenticated && isAdmin ? (
                    <button
                      type="button"
                      onClick={goToDashboard}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm font-semibold text-[var(--black-300)] transition hover:bg-[var(--primary-100)]"
                    >
                      <span>{t("auth.dashboard")}</span>
                      <LayoutDashboard className="h-4 w-4" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleUserAction}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm font-semibold text-[var(--black-300)] transition hover:bg-[var(--primary-100)]"
                  >
                    <span>{isAuthenticated ? t("auth.logout") : t("auth.login")}</span>
                    {isAuthenticated ? (
                      <LogOut className="h-4 w-4" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            className="space-y-7"
          >
            <span className="inline-flex items-center rounded-full border border-[var(--primary-200)] bg-[var(--primary-100)] px-4 py-1 text-sm font-semibold text-[var(--primary-400)]">
              {t("home.smartPlatform")}
            </span>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              {t("home.heroTitleLine1")}
              <br />
              {t("home.heroTitleLine2")}
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[var(--black-200)]">
              {t("home.heroDescription")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary-300)] px-6 py-3 text-sm font-semibold text-[var(--white)] shadow-[0_14px_28px_rgba(199,91,122,0.32)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-400)]"
              >
                {t("home.startNow")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#about"
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--primary-200)] bg-[var(--white)] px-6 py-3 text-sm font-semibold text-[var(--black-300)] transition hover:border-[var(--primary-300)]"
              >
                {t("home.discoverPlatform")}
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/creative-1.jpg"
              alt={t("common.appTitle")}
              className="h-[520px] w-full rounded-[2.2rem] object-cover shadow-[0_30px_55px_rgba(24,24,27,0.2)]"
            />
            <div className="absolute inset-0 rounded-[2.2rem] bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
            <div className="absolute bottom-6 right-6 rounded-2xl bg-[var(--white)]/90 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold text-[var(--primary-400)]">{t("home.flowTag")}</p>
              <p className="text-sm font-bold text-[var(--black-300)]">{t("home.flowText")}</p>
            </div>
          </motion.div>
        </section>

        <section id="about" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <span className="mb-3 inline-flex items-center rounded-full border border-[var(--primary-200)] bg-[var(--primary-100)] px-4 py-1 text-sm font-semibold text-[var(--primary-400)]">
              {t("home.aboutBadge")}
            </span>
            <h2 className="text-3xl font-extrabold sm:text-4xl">{t("home.aboutTitle")}</h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {["/assets/images/creative-2.jpg", "/assets/images/creative-3.jpg", "/assets/images/creative-1.jpg"].map(
              (image, index) => (
                <motion.article
                  key={image}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  variants={fadeUp}
                  transition={{ duration: 0.6, delay: index * 0.12 }}
                  className="overflow-hidden rounded-3xl border border-[var(--primary-100)] bg-[var(--white)] shadow-[0_18px_40px_rgba(0,0,0,0.1)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={languageMode === "ar" ? `صورة تعريفية ${index + 1}` : `Intro image ${index + 1}`}
                    className="h-52 w-full object-cover"
                  />
                  <div className="space-y-2 p-6 text-right">
                    <h3 className="text-xl font-bold text-[var(--black-300)]">
                      {index === 0
                        ? t("home.card1Title")
                        : index === 1
                          ? t("home.card2Title")
                          : t("home.card3Title")}
                    </h3>
                    <p className="leading-7 text-[var(--black-200)]">
                      {index === 0
                        ? t("home.card1Text")
                        : index === 1
                          ? t("home.card2Text")
                          : t("home.card3Text")}
                    </p>
                  </div>
                </motion.article>
              )
            )}
          </div>
        </section>

        <section id="contact" className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 gap-8 overflow-hidden rounded-[2rem] border border-[var(--primary-100)] bg-[var(--white)] p-8 shadow-[0_20px_45px_rgba(0,0,0,0.12)] lg:grid-cols-2"
          >
            <div className="space-y-5">
              <span className="inline-flex items-center rounded-full border border-[var(--primary-200)] bg-[var(--primary-100)] px-4 py-1 text-sm font-semibold text-[var(--primary-400)]">
                {t("home.contactBadge")}
              </span>
              <h2 className="text-3xl font-black">{t("home.contactTitle")}</h2>
              <p className="leading-8 text-[var(--black-200)]">
                {t("home.contactText")}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-[var(--primary-100)]/70 p-3">
                  <Mail className="h-5 w-5 text-[var(--primary-400)]" />
                  <span className="text-sm font-medium">support@sewing-os.com</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[var(--secondary-100)]/70 p-3">
                  <Phone className="h-5 w-5 text-[var(--secondary-400)]" />
                  <span className="text-sm font-medium">+963 944 000 000</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[var(--primary-100)]/70 p-3">
                  <MapPin className="h-5 w-5 text-[var(--primary-400)]" />
                  <span className="text-sm font-medium">{languageMode === "ar" ? "دمشق - سوريا" : "Damascus - Syria"}</span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/images/creative-3.jpg"
                alt={t("home.contactBadge")}
                className="h-full min-h-[320px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
              <div className="absolute bottom-5 right-5 rounded-xl bg-[var(--white)]/90 px-4 py-2 text-sm font-semibold text-[var(--black-300)]">
                {t("home.closeToNeed")}
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-[var(--primary-100)] bg-[var(--white)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-[var(--black-200)] sm:flex-row sm:px-6 lg:px-8">
          <p>{t("footer.copy", { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-4">
            <a href="#about" className="hover:text-[var(--primary-400)]">{t("footer.about")}</a>
            <a href="#contact" className="hover:text-[var(--primary-400)]">{t("footer.contact")}</a>
            <Link href="/login" className="hover:text-[var(--primary-400)]">{t("footer.login")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
