"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { dashboardApiService } from "@/services/api.dashboard.service";
import { IDashboardSummary, IFinanceSummary } from "@/types";

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = String(now.getMonth() + 1).padStart(2, "0");
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, index) => String(CURRENT_YEAR - index));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));

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
  rawMaterialExpenses: 0,
  rawMaterialsAdded: 0,
});

export default function DashboardHomePage() {
  const { t, i18n } = useTranslation();
  const { error } = useToast();
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [summary, setSummary] = useState<IDashboardSummary>(emptySummary);
  const [finance, setFinance] = useState<IFinanceSummary>(
    emptyFinance(`${CURRENT_YEAR}-${CURRENT_MONTH}`)
  );
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingFinance, setLoadingFinance] = useState(true);

  const selectedPeriod = `${selectedYear}-${selectedMonth}`;
  const locale = i18n.resolvedLanguage?.startsWith("en") ? "en-US" : "ar-SY";

  const monthLabel = (month: string) =>
    new Intl.DateTimeFormat(locale, {
      month: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, Number(month) - 1, 1)));

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
      setFinance(await dashboardApiService.getFinance(selectedPeriod));
    } catch (requestError) {
      error({
        title: t("adminOverview.loadFinanceFailed"),
        description: requestError instanceof Error ? requestError.message : undefined,
      });
      setFinance(emptyFinance(selectedPeriod));
    } finally {
      setLoadingFinance(false);
    }
  }, [error, selectedPeriod, t]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

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

  const statisticCards = [
    { label: t("adminOverview.stats.revenue"), value: finance.revenue, icon: Banknote },
    { label: t("adminOverview.stats.expenses"), value: finance.expenses, icon: DollarSign },
    { label: t("adminOverview.stats.profit"), value: finance.profit, icon: TrendingUp },
    { label: t("adminOverview.stats.loss"), value: finance.loss, icon: TrendingDown },
    {
      label: t("adminOverview.stats.rawMaterialExpenses"),
      value: finance.rawMaterialExpenses,
      icon: DollarSign,
    },
    {
      label: t("adminOverview.stats.rawMaterialsAdded"),
      value: finance.rawMaterialsAdded,
      icon: Boxes,
    },
  ];

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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t("adminOverview.monthlyStatistics")}</h2>
            <p className="mt-1 text-sm text-[var(--black-100)]">
              {t("adminOverview.monthlyStatisticsDescription")}
            </p>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto lg:min-w-[420px]">
            <div className="space-y-2">
              <Label htmlFor="statistics-year">{t("adminOverview.year")}</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="statistics-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statistics-month">{t("adminOverview.month")}</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="statistics-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {monthLabel(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {statisticCards.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="h-full">
              <CardContent className="py-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--black-200)]">{label}</p>
                    {loadingFinance ? (
                      <Skeleton className="mt-5 h-10 w-32" />
                    ) : (
                      <p className="mt-4 text-3xl font-black text-[var(--black-300)]">
                        {value.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className="rounded-xl bg-[var(--secondary-100)] p-2 text-[var(--secondary-500)]">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
