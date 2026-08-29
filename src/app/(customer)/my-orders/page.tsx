"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApiService } from "@/services/api.orders.service";
import { normalizeOrder } from "@/lib/normalize-api";
import { IOrder, OrderStatus } from "@/types";
import { useToast } from "@/components/ui/toast";

const statusKey: Record<OrderStatus, string> = { PENDING: "pending", CUTTING: "cutting", SEWING: "sewing", PRINTING: "printing", PACKAGING: "packaging", STORAGE: "storage", DELIVERY: "delivery", DELIVERED: "delivered" };

export default function MyOrdersPage() {
  const { t } = useTranslation();
  const { error } = useToast();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; ordersApiService.getMyOrders(1, 100).then((response) => { if (active) setOrders((response.orders ?? []).map((order, index) => normalizeOrder(order, `order-${index}`))); }).catch((err) => error({ title: t("myOrders.loadFailed"), description: err instanceof Error ? err.message : undefined })).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [error, t]);
  return <main className="min-h-screen bg-[var(--white-100)] p-4 md:p-8"><div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--primary-400)]">{t("myOrders.badge")}</p><h1 className="mt-1 text-3xl font-bold">{t("myOrders.title")}</h1><p className="mt-2 text-sm text-[var(--black-100)]">{t("myOrders.description")}</p></div><div className="flex gap-2"><Link href="/account/profile"><Button variant="outline">{t("myOrders.profile")}</Button></Link><Link href="/my-orders/new"><Button>{t("myOrders.addOrder")}</Button></Link></div></div>
    {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-64 w-full" />)}</div> : orders.length === 0 ? <Card><CardContent className="py-14 text-center"><p className="text-lg font-semibold">{t("myOrders.empty")}</p><Link href="/my-orders/new" className="mt-5 inline-block"><Button>{t("myOrders.addFirstOrder")}</Button></Link></CardContent></Card> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{orders.map((order) => <Card key={order._id} className="h-full"><CardHeader><CardTitle className="line-clamp-2 text-lg">{order.description}</CardTitle></CardHeader><CardContent className="flex h-full flex-col gap-3 text-sm"><div className={`rounded-full px-3 py-1 text-center font-semibold ${order.isCancelled || order.isRejected ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" : "bg-[var(--primary-100)] text-[var(--primary-500)]"}`}>{order.isRejected ? t("myOrders.rejected", { defaultValue: "مرفوض" }) : order.isCancelled ? t("myOrders.cancelled", { defaultValue: "ملغى" }) : t(`orderStatus.${statusKey[order.status]}`)}</div><div className="space-y-2 text-[var(--black-200)]"><p>{t("myOrders.orderDate")}: {dayjs(order.createdAt).format("YYYY-MM-DD")}</p><p>{t("myOrders.materialsCount")}: {order.rawMaterials.length}</p><p>{t("myOrders.cost")}: <strong>{order.totalPrice.toLocaleString()}</strong></p><p>{t("myOrders.deliveryDate")}: {order.expectedFinishDate ? dayjs(order.expectedFinishDate).format("YYYY-MM-DD") : t("myOrders.waitingAdmin")}</p></div><Link href={`/my-orders/${order._id}`} className="mt-auto pt-3"><Button className="w-full" variant="outline">{t("myOrders.details")}</Button></Link></CardContent></Card>)}</div>}
  </div></main>;
}
