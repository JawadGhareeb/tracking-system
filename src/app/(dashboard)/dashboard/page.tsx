"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { Activity, ArrowUpRight, Banknote, Boxes, ClipboardList, DollarSign, TrendingDown, TrendingUp, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardApiService } from "@/services/api.dashboard.service";
import { IDashboardSummary, IFinanceSummary } from "@/types";
import { useToast } from "@/components/ui/toast";

const emptySummary: IDashboardSummary = { pendingOrders: 0, inProduction: 0, deliveredOrders: 0, users: 0, lowStockMaterials: 0 };
const emptyFinance = (month: string): IFinanceSummary => ({ month, revenue: 0, expenses: 0, profit: 0, loss: 0 });

export default function DashboardHomePage() {
  const { error } = useToast();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [summary, setSummary] = useState<IDashboardSummary>(emptySummary);
  const [finance, setFinance] = useState<IFinanceSummary>(emptyFinance(month));
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingFinance, setLoadingFinance] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try { setSummary(await dashboardApiService.getSummary()); }
    catch (err) { error({ title: "تعذر تحميل ملخص لوحة التحكم", description: err instanceof Error ? err.message : undefined }); }
    finally { setLoadingSummary(false); }
  }, [error]);

  const loadFinance = useCallback(async () => {
    setLoadingFinance(true);
    try { setFinance(await dashboardApiService.getFinance(month)); }
    catch (err) { error({ title: "تعذر تحميل البيانات المالية", description: err instanceof Error ? err.message : undefined }); setFinance(emptyFinance(month)); }
    finally { setLoadingFinance(false); }
  }, [error, month]);

  useEffect(() => { void loadSummary(); }, [loadSummary]);
  useEffect(() => { void loadFinance(); }, [loadFinance]);

  const operationalCards = [
    { label: "طلبات قيد الانتظار", value: summary.pendingOrders, icon: ClipboardList, href: "/orders?status=PENDING" },
    { label: "طلبات قيد الإنتاج", value: summary.inProduction, icon: Activity, href: "/orders" },
    { label: "طلبات وصلت للتسليم", value: summary.deliveredOrders, icon: Boxes, href: "/orders?status=DELIVERY" },
    { label: "المستخدمون والموظفون", value: summary.users, icon: Users2, href: "/employees" },
  ];
  const financeCards = [
    { label: "الإيرادات الشهرية", value: finance.revenue, icon: Banknote },
    { label: "المصاريف الشهرية", value: finance.expenses, icon: DollarSign },
    { label: "الأرباح الشهرية", value: finance.profit, icon: TrendingUp },
    { label: "الخسائر الشهرية", value: finance.loss, icon: TrendingDown },
  ];

  return <div className="container mx-auto space-y-8 p-6">
    <section className="rounded-3xl border border-[var(--primary-100)] bg-[var(--white)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-semibold text-[var(--primary-400)]">لوحة إدارة المعمل</p><h1 className="mt-2 text-4xl font-black text-[var(--black-300)]">متابعة الطلبات والماليات</h1><p className="mt-2 max-w-2xl text-[var(--black-200)]">راقب الطلبات الجديدة ومراحل الإنتاج والإيرادات والمصاريف من مكان واحد.</p></div><div className="flex flex-wrap gap-2"><Link href="/orders?status=PENDING"><Button>مراجعة الطلبات<ArrowUpRight className="h-4 w-4" /></Button></Link><Link href="/raw-materials"><Button variant="outline">المواد الخام</Button></Link><Link href="/expenses"><Button variant="outline">المصاريف</Button></Link></div></div>
    </section>

    <section><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-bold">حالة التشغيل</h2>{summary.lowStockMaterials > 0 ? <Link href="/raw-materials" className="text-sm font-semibold text-[var(--danger)]">{summary.lowStockMaterials} مواد وصلت لحد المخزون المنخفض</Link> : null}</div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{operationalCards.map(({ label, value, icon: Icon, href }) => <Link key={label} href={href}><Card className="h-full transition hover:-translate-y-1"><CardContent className="flex items-center justify-between py-6"><div><p className="text-sm text-[var(--black-100)]">{label}</p>{loadingSummary ? <Skeleton className="mt-3 h-10 w-16" /> : <p className="mt-2 text-4xl font-black">{value}</p>}</div><span className="rounded-2xl bg-[var(--primary-100)] p-3 text-[var(--primary-500)]"><Icon className="h-6 w-6" /></span></CardContent></Card></Link>)}</div></section>

    <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold">الملخص المالي الشهري</h2><p className="mt-1 text-sm text-[var(--black-100)]">الإيراد يُحتسب من الطلبات التي وصلت إلى مرحلة التسليم ضمن الشهر.</p></div><div className="space-y-2"><Label htmlFor="dashboard-month">الشهر</Label><Input id="dashboard-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{financeCards.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="py-6"><div className="flex items-start justify-between"><p className="text-sm font-semibold text-[var(--black-200)]">{label}</p><span className="rounded-xl bg-[var(--secondary-100)] p-2 text-[var(--secondary-500)]"><Icon className="h-5 w-5" /></span></div>{loadingFinance ? <Skeleton className="mt-5 h-10 w-32" /> : <p className="mt-4 text-3xl font-black text-[var(--black-300)]">{value.toLocaleString()}</p>}</CardContent></Card>)}</div></section>

    <section className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>إدارة المخزون</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-[var(--black-200)]">حدّث أسعار وكميات الأقمشة والخيوط والإكسسوارات قبل استقبال الطلبات.</p><Link href="/raw-materials"><Button variant="outline" className="w-full">فتح المواد الخام</Button></Link></CardContent></Card><Card><CardHeader><CardTitle>إدارة المصاريف</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-[var(--black-200)]">سجل الرواتب وشراء المواد والكهرباء والنقل وبقية مصاريف المعمل.</p><Link href="/expenses"><Button variant="outline" className="w-full">فتح سجل المصاريف</Button></Link></CardContent></Card></section>
  </div>;
}
