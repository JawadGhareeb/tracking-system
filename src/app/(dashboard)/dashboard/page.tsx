"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Layers3,
  Scissors,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hook/use-orders";
import { useUsers } from "@/hook/use-users";

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function DashboardHomePage() {
  const { t } = useTranslation();
  const { pagination: usersPagination, isLoading: usersLoading } = useUsers({
    page: 1,
    perPage: 10,
  });
  const { orders, pagination: ordersPagination, isLoading: ordersLoading } =
    useOrders({
      page: 1,
      perPage: 50,
    });

  const totalUsers = usersPagination?.documentCount ?? 0;
  const totalOrders = ordersPagination?.documentCount ?? 0;
  const pendingOrders = orders.filter((order) => order.status === "PENDING").length;
  const inProgressOrders = orders.filter((order) =>
    ["CUTTING", "SEWING", "PRINTING", "PACKAGING", "STORAGE"].includes(order.status)
  ).length;
  const completedOrders = orders.filter((order) => order.status === "DELIVERY").length;

  const productivityRate =
    totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const statCards = [
    {
      label: t("dashboardHome.stats.totalUsers"),
      value: totalUsers,
      loading: usersLoading,
      icon: Users2,
      tone: "from-[var(--primary-100)] to-[var(--white)]",
      accent: "text-[var(--primary-400)]",
    },
    {
      label: t("dashboardHome.stats.totalOrders"),
      value: totalOrders,
      loading: ordersLoading,
      icon: ClipboardList,
      tone: "from-[var(--secondary-100)] to-[var(--white)]",
      accent: "text-[var(--secondary-400)]",
    },
    {
      label: t("dashboardHome.stats.pendingOrders"),
      value: pendingOrders,
      loading: ordersLoading,
      icon: Clock3,
      tone: "from-[var(--accent-100)] to-[var(--white)]",
      accent: "text-[var(--primary-400)]",
    },
    {
      label: t("dashboardHome.stats.inProgressOrders"),
      value: inProgressOrders,
      loading: ordersLoading,
      icon: Activity,
      tone: "from-[var(--primary-100)] to-[var(--white)]",
      accent: "text-[var(--secondary-400)]",
    },
  ];

  const quickLinks = [
    {
      title: t("dashboardHome.quick.usersTitle"),
      description: t("dashboardHome.quick.usersDescription"),
      href: "/employees",
      cta: t("dashboardHome.quick.openUsers"),
      icon: Users2,
    },
    {
      title: t("dashboardHome.quick.ordersTitle"),
      description: t("dashboardHome.quick.ordersDescription"),
      href: "/orders",
      cta: t("dashboardHome.quick.openOrders"),
      icon: ClipboardList,
    },
    {
      title: t("dashboardHome.quick.rolesTitle"),
      description: t("dashboardHome.quick.rolesDescription"),
      href: "/roles",
      cta: t("dashboardHome.quick.openRoles"),
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-8 h-72 w-72 rounded-full bg-[var(--primary-200)]/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-24 h-64 w-64 rounded-full bg-[var(--secondary-200)]/30 blur-3xl" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="container mx-auto space-y-8 p-6"
      >
        <motion.section
          variants={item}
          className="grid gap-6 rounded-[2rem] border border-[var(--primary-100)] bg-[var(--white)]/95 p-6 shadow-[0_18px_42px_rgba(0,0,0,0.08)] lg:grid-cols-[1.3fr_1fr]"
        >
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-200)] bg-[var(--primary-100)] px-4 py-1 text-sm font-semibold text-[var(--primary-400)]">
              <Sparkles className="h-4 w-4" />
              {t("dashboardHome.badge")}
            </span>
            <h1 className="text-4xl font-black leading-tight text-[var(--black-300)]">
              {t("dashboardHome.title")}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--black-200)]">
              {t("dashboardHome.description")}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/orders?status=PENDING">
                <Button className="rounded-xl px-5">
                  مراجعة الطلبات قيد الانتظار
                  <ArrowUpRight className="ms-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/employees/new">
                <Button
                  variant="outline"
                  className="rounded-xl border-[var(--primary-200)] text-[var(--primary-400)]"
                >
                  {t("dashboardHome.addEmployee")}
                </Button>
              </Link>
            </div>
          </div>


        </motion.section>

        <motion.section variants={item} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className={`rounded-3xl border border-[var(--primary-100)] bg-gradient-to-br ${stat.tone} p-5 shadow-[0_12px_26px_rgba(0,0,0,0.07)]`}
              >
                <div className="mb-5 flex items-start justify-between">
                  <p className="text-sm font-semibold text-[var(--black-200)]">{stat.label}</p>
                  <span className={`rounded-xl bg-white/80 p-2 ${stat.accent}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="text-4xl font-black text-[var(--black-300)]">
                  {stat.loading ? <Skeleton className="h-10 w-16" /> : stat.value}
                </div>
              </div>
            );
          })}
        </motion.section>

        <motion.section variants={item} className="grid gap-6 lg:grid-cols-3">
          {quickLinks.map((section) => {
            const Icon = section.icon;

            return (
              <article
                key={section.title}
                className="group rounded-3xl border border-[var(--primary-100)] bg-[var(--white)] p-6 shadow-[0_12px_26px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(122,46,66,0.16)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-xl bg-[var(--primary-100)] p-2 text-[var(--primary-400)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <Layers3 className="h-4 w-4 text-[var(--black-100)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--black-300)]">{section.title}</h3>
                <p className="mt-2 min-h-14 leading-7 text-[var(--black-200)]">{section.description}</p>
                <Link href={section.href} className="mt-5 block">
                  <Button className="w-full rounded-xl">
                    {section.cta}
                    <ArrowUpRight className="ms-2 h-4 w-4" />
                  </Button>
                </Link>
              </article>
            );
          })}
        </motion.section>

        <motion.section variants={item} className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[var(--primary-100)] bg-[var(--white)] p-6 shadow-[0_10px_24px_rgba(0,0,0,0.07)]">
            <h3 className="text-xl font-bold text-[var(--black-300)]">{t("dashboardHome.focusTitle")}</h3>
            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-[var(--primary-100)]/70 p-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--primary-400)]" />
                <p className="text-sm leading-7 text-[var(--black-300)]">
                  {t("dashboardHome.focus1")}
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-[var(--secondary-100)]/70 p-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--secondary-400)]" />
                <p className="text-sm leading-7 text-[var(--black-300)]">
                  {t("dashboardHome.focus2")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[var(--primary-300)] to-[var(--primary-500)] p-5 text-white shadow-[0_20px_36px_rgba(122,46,66,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold opacity-90">{t("dashboardHome.pulse")}</p>
              <Scissors className="h-5 w-5" />
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{t("dashboardHome.completionRate")}</span>
                  <span className="font-bold">{productivityRate}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${productivityRate}%` }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/15 p-3">
                  <p className="opacity-85">{t("dashboardHome.completed")}</p>
                  <p className="mt-1 text-xl font-bold">{completedOrders}</p>
                </div>
                <div className="rounded-xl bg-white/15 p-3">
                  <p className="opacity-85">{t("dashboardHome.inProgress")}</p>
                  <p className="mt-1 text-xl font-bold">{inProgressOrders}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
