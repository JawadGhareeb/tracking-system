"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApiService } from "@/services/api.orders.service";
import { normalizeOrder } from "@/lib/normalize-api";
import { IOrder, OrderStatus } from "@/types";
import { useToast } from "@/components/ui/toast";

const stages: OrderStatus[] = ["PENDING", "CUTTING", "SEWING", "PRINTING", "PACKAGING", "STORAGE", "DELIVERY"];
const statusKey: Record<OrderStatus, string> = { PENDING: "pending", CUTTING: "cutting", SEWING: "sewing", PRINTING: "printing", PACKAGING: "packaging", STORAGE: "storage", DELIVERY: "delivery" };

export default function MyOrderDetailsPage() {
  const { t } = useTranslation();
  const params = useParams(); const { error } = useToast(); const [order, setOrder] = useState<IOrder | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; ordersApiService.getMyOrderById(params.id as string).then((response) => { if (active) setOrder(normalizeOrder(response, params.id as string)); }).catch((err) => error({ title: t("myOrderDetails.loadFailed"), description: err instanceof Error ? err.message : undefined })).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [error, params.id, t]);
  if (loading) return <main className="min-h-screen bg-[var(--white-100)] p-8"><div className="mx-auto max-w-5xl space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-52 w-full" /><Skeleton className="h-64 w-full" /></div></main>;
  if (!order) return <main className="min-h-screen p-8">{t("myOrderDetails.notFound")}</main>;
  const currentIndex = stages.indexOf(order.status);
  return <main className="min-h-screen bg-[var(--white-100)] p-4 md:p-8"><div className="mx-auto max-w-5xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--primary-400)]">{t("myOrderDetails.badge")}</p><h1 className="mt-1 text-3xl font-bold">{t("myOrderDetails.title")}</h1></div><div className="flex gap-2"><Link href="/my-orders"><Button variant="outline">{t("myOrderDetails.myOrders")}</Button></Link><Link href="/my-orders/new"><Button>{t("myOrderDetails.addOrder")}</Button></Link></div></div>
    <Card><CardHeader><CardTitle>{t("myOrderDetails.progress")}</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stages.map((stage, index) => <div key={stage} className={`rounded-xl border p-3 text-center text-sm font-semibold ${index <= currentIndex ? "border-[var(--primary-300)] bg-[var(--primary-100)] text-[var(--primary-500)]" : "border-[var(--primary-100)] bg-[var(--white)] text-[var(--black-100)]"}`}>{index < currentIndex ? "✓ " : index === currentIndex ? "● " : "○ "}{t(`orderStatus.${statusKey[stage]}`)}</div>)}</div></CardContent></Card>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>{t("myOrderDetails.information")}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p><strong>{t("myOrderDetails.description")}:</strong> {order.description}</p><p><strong>{t("myOrderDetails.notes")}:</strong> {order.notes}</p><p><strong>{t("myOrderDetails.orderDate")}:</strong> {dayjs(order.createdAt).format("YYYY-MM-DD")}</p><p><strong>{t("myOrderDetails.expectedDelivery")}:</strong> {order.expectedFinishDate ? dayjs(order.expectedFinishDate).format("YYYY-MM-DD") : t("myOrderDetails.notAssigned")}</p><p><strong>{t("myOrderDetails.employee")}:</strong> {order.employee ? `${order.employee.fullName.firstName} ${order.employee.fullName.lastName}` : t("myOrderDetails.notAssigned")}</p><p><strong>{t("myOrderDetails.address")}:</strong> {order.deliveryLocation?.address || "-"}</p></CardContent></Card><Card><CardHeader><CardTitle>{t("myOrderDetails.cost")}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex justify-between"><span>{t("myOrderDetails.materials")}</span><strong>{order.materialCost.toLocaleString()}</strong></div><div className="flex justify-between"><span>{t("myOrderDetails.additional")}</span><strong>{order.additionalCost.toLocaleString()}</strong></div><div className="flex justify-between border-t border-[var(--primary-100)] pt-3 text-lg"><span>{t("myOrderDetails.total")}</span><strong className="text-[var(--primary-500)]">{order.totalPrice.toLocaleString()}</strong></div></CardContent></Card></div>
    <Card><CardHeader><CardTitle>{t("myOrderDetails.rawMaterials")}</CardTitle></CardHeader><CardContent>{order.rawMaterials.length === 0 ? <p className="text-sm text-[var(--black-100)]">{t("myOrderDetails.legacyNoMaterials")}</p> : <div className="grid gap-3 md:grid-cols-2">{order.rawMaterials.map((line, index) => <div key={`${line.rawMaterial._id}-${index}`} className="rounded-xl border border-[var(--primary-100)] p-4"><p className="font-bold">{line.nameSnapshot} {line.colorSnapshot ? `- ${line.colorSnapshot}` : ""}</p><div className="mt-2 flex justify-between text-sm"><span>{line.quantity} × {line.unitPriceSnapshot.toLocaleString()}</span><strong>{line.subtotal.toLocaleString()}</strong></div></div>)}</div>}</CardContent></Card>
  </div></main>;
}
