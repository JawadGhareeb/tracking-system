"use client";

import { ReactNode, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { ToastProvider } from "@/components/ui/toast";
import i18n, { applyDocumentLanguage } from "@/lib/i18n";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("language-mode");
    const initialLanguage = storedLanguage === "en" ? "en" : "ar";

    if (i18n.resolvedLanguage !== initialLanguage) {
      void i18n.changeLanguage(initialLanguage);
    }

    applyDocumentLanguage(initialLanguage);

    const handleLanguageChanged = (language: string) => {
      const normalized = language === "en" ? "en" : "ar";
      window.localStorage.setItem("language-mode", normalized);
      applyDocumentLanguage(normalized);
    };

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ToastProvider>{children}</ToastProvider>
    </I18nextProvider>
  );
}
