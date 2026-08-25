"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
  Activity,
  ArrowUpRight,
  Banknote,
  Boxes,
  ClipboardList,
  DollarSign,
  TrendingDown,
  TrendingUp,
  UserRoundCog,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { dashboardApiService } from "@/services/api.dashboard.service";
import {
  IDashboardSummary,
  IFinanceSummary,
  IMonthlyDashboardStatistic,
} from "@/types";

const emptySummary: IDashboardSummary = {
  pendingOrders: 0,
  inProduction: 0,
  deliveredOrders: 0,
  users: 0,
  employees: 0,
  customers: 0,
  lowStockMaterials: 0,
};
const emptyFinance = (month: string): IFinanceSummary => ({
  month,
  revenue: 0,
  expenses: 0,
  profit: 0,
  loss: 0,
});

export default function DashboardHomePage() {
  const { t, i18n } = useTranslation();
  const { error } = useToast();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [summary, setSummary] = useState<IDashboardSummary>(emptySummary);
  const [finance, setFinance] = useState<IFinanceSummary>(emptyFinance(month));
  const [monthlyStats, setMonthlyStats] = useState<IMonthlyDashboardStatistic[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingFinance, setLoadingFinance] = useState(true);
  const [loadingMonthlyStats, setLoadingMonthlyStats] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      setSummary(await dashboardApiService.getSummary());
    } catch (requestError) {
      error({
        title: t("adminOverview.loadSummaryFailed"),
        description: requestError instanceof Error ? requestError.message : undefined,
      });
    } finally {
      setLoadingSummary(false);
    }
  }, [error, t]);

  const loadFinance = useCallback(async () => {
    setLoadingFinance(true);
    try {
      setFinance(await dashboardApiService.getFinance(month));
    } catch (requestError) {
      error({
        title: t("adminOverview.loadFinanceFailed"),
        description: requestError instanceof Error ? requestError.message : undefined,
      });
      setFinance(emptyFinance(month));
    } finally {
      setLoadingFinance(false);
    }
  }, [error, month, t]);

  const loadMonthlyStats = useCallback(async () => {
    setLoadingMonthlyStats(true);
    try {
      const response = await dashboardApiService.getMonthlyStats(12);
      setMonthlyStats(response.statistics ?? []);
    } catch (requestError) {
      error({
        title: t("adminOverview.loadMonthlyStatsFailed"),
        description: requestError instanceof Error ? requestError.message : undefined,
      });
      setMonthlyStats([]);
    } finally {
      setLoadingMonthlyStats(false);
    }
  }, [error, t]);

  useEffect(() => {
    void loadSummary();
    void loadMonthlyStats();
  }, [loadMonthlyStats, loadSummary]);

  useEffect(() => {
    void loadFinance();
  }, [loadFinance]);

  const operationalCards = [
    {
      label: t("adminOverview.pending"),
      value: summary.pendingOrders,
      icon: ClipboardList,
      href: "/orders?status=PENDING",
    },
    {
      label: t("adminOverview.inProduction"),
      value: summary.inProduction,
      icon: Activity,
      href: "/orders",
    },
    {
      label: t("adminOverview.delivered"),
      value: summary.deliveredOrders,
      icon: Boxes,
      href: "/orders?status=DELIVERY",
    },
    {
      label: t("adminOverview.customers"),
      value: summary.customers,
      icon: Users2,
      href: "/customers",
    },
    {
      label: t("adminOverview.employees"),
      value: summary.employees,
      icon: UserRoundCog,
      href: "/employees",
    },
  ];

  const financeCards = [
    { label: t("adminOverview.revenue"), value: finance.revenue, icon: Banknote },
    { label: t("adminOverview.monthlyExpenses"), value: finance.expenses, icon: DollarSign },
    { label: t("adminOverview.profit"), value: finance.profit, icon: TrendingUp },
    { label: t("adminOverview.loss"), value: finance.loss, icon: TrendingDown },
  ];

  const locale = i18n.resolvedLanguage?.startsWith("en") ? "en-US" : "ar-SY";
  const formatMonth = (value: string) => {
    const [year, monthNumber] = value.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  };

  return (
    <div className="container mx-auto space-y-8 p-6">
      <section className="rounded-3xl border border-[var(--primary-100)] bg-[var(--white)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--primary-400)]">{t("adminOverview.badge")}</p>
            <h1 className="mt-2 text-4xl font-black text-[var(--black-300)]">{t("adminOverview.title")}</h1>
            <p className="mt-2 max-w-2xl text-[var(--black-200)]">{t("adminOverview.description")}</p>
          </div>
          <Link href="/orders?status=PENDING">
            <Button>
              {t("adminOverview.reviewOrders")}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-bold">{t("adminOverview.operations")}</h2>
          {summary.lowStockMaterials > 0 ? (
            <p className="text-sm font-semibold text-[var(--danger)]">
              {t("adminOverview.lowStock", { count: summary.lowStockMaterials })}
            </p>
          ) : null}
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {operationalCards.map(({ label, value, icon: Icon, href }) => (
            <Link key={label} href={href}>
              <Card className="h-full transition hover:-translate-y-1">
                <CardContent className="flex items-center justify-between py-6">
                  <div>
                    <p className="text-sm text-[var(--black-100)]">{label}</p>
                    {loadingSummary ? (
                      <Skeleton className="mt-3 h-10 w-16" />
                    ) : (
                      <p className="mt-2 text-4xl font-black">{value}</p>
                    )}
                  </div>
                  <span className="rounded-2xl bg-[var(--primary-100)] p-3 text-[var(--primary-500)]">
                    <Icon className="h-6 w-6" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{t("adminOverview.monthlyFinance")}</h2>
            <p className="mt-1 text-sm text-[var(--black-100)]">{t("adminOverview.revenueNote")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dashboard-month">{t("adminOverview.month")}</Label>
            <Input
              id="dashboard-month"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {financeCards.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="py-6">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-[var(--black-200)]">{label}</p>
                  <span className="rounded-xl bg-[var(--secondary-100)] p-2 text-[var(--secondary-500)]">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                {loadingFinance ? (
                  <Skeleton className="mt-5 h-10 w-32" />
                ) : (
                  <p className="mt-4 text-3xl font-black text-[var(--black-300)]">
                    {value.toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{t("adminOverview.monthlyStatistics")}</h2>
          <p className="mt-1 text-sm text-[var(--black-100)]">
            {t("adminOverview.monthlyStatisticsDescription")}
          </p>
        </div>
        <Card className="p-0">
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("adminOverview.stats.month")}</TableHead>
                  <TableHead>{t("adminOverview.stats.revenue")}</TableHead>
                  <TableHead>{t("adminOverview.stats.expenses")}</TableHead>
                  <TableHead>{t("adminOverview.stats.profit")}</TableHead>
                  <TableHead>{t("adminOverview.stats.loss")}</TableHead>
                  <TableHead>{t("adminOverview.stats.rawMaterialExpenses")}</TableHead>
                  <TableHead>{t("adminOverview.stats.rawMaterialsAdded")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingMonthlyStats ? (
                  Array.from({ length: 6 }, (_, index) => (
                    <TableRow key={`monthly-stat-skeleton-${index}`}>
                      {Array.from({ length: 7 }, (_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : monthlyStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-[var(--black-100)]">
                      {t("adminOverview.stats.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlyStats.map((stat) => (
                    <TableRow key={stat.month}>
                      <TableCell className="font-semibold">{formatMonth(stat.month)}</TableCell>
                      <TableCell>{stat.revenue.toLocaleString()}</TableCell>
                      <TableCell>{stat.expenses.toLocaleString()}</TableCell>
                      <TableCell>{stat.profit.toLocaleString()}</TableCell>
                      <TableCell>{stat.loss.toLocaleString()}</TableCell>
                      <TableCell>{stat.rawMaterialExpenses.toLocaleString()}</TableCell>
                      <TableCell>{stat.rawMaterialsAdded.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
