import type { Metadata } from "next";
import "./globals.css";
import "../../public/style.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: "إدارة معمل الخياطة",
  description: "نظام إدارة معمل الخياطة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
