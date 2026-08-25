"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { normalizeOrder } from "@/lib/normalize-api";
import { ordersApiService } from "@/services/api.orders.service";
import { IOrder, OrderStatus } from "@/types";

const stages: OrderStatus[] = ["PENDING", "CUTTING", "SEWING", "PRINTING", "PACKAGING", "STORAGE", "DELIVERY"];
const statusKey: Record<OrderStatus, string> = { PENDING: "pending", CUTTING: "cutting", SEWING: "sewing", PRINTING: "printing", PACKAGING: "packaging", STORAGE: "storage", DELIVERY: "delivery" };

export default function EmployeeOrderDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const { error } = useToast();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void ordersApiService.getAssignedOrderById(params.id as string)
      .then((response) => { if (active) setOrder(normalizeOrder(response, params.id as string)); })
      .catch((requestError) => error({ title: t("employeePortal.loadFailed"), description: requestError instanceof Error ? requestError.message : undefined }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [error, params.id, t]);

  if (loading) return <main className="p-8"><div className="mx-auto max-w-5xl space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-52 w-full" /><Skeleton className="h-64 w-full" /></div></main>;
  if (!order) return <main className="p-8"><div className="mx-auto max-w-5xl">{t("employeePortal.loadFailed")}</div></main>;

  const currentIndex = stages.indexOf(order.status);
  return (
    <main className="p-4 md:p-8"><div className="mx-auto max-w-5xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--primary-400)]">{t("employeePortal.detailsBadge")}</p><h1 className="mt-1 text-3xl font-bold">{t("employeePortal.detailsTitle")}</h1></div><Link href="/employee/orders"><Button variant="outline">{t("employeePortal.back")}</Button></Link></div>
      <Card><CardHeader><CardTitle>{t("employeePortal.progress")}</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stages.map((stage, index) => <div key={stage} className={`rounded-xl border p-3 text-center text-sm font-semibold ${index <= currentIndex ? "border-[var(--primary-300)] bg-[var(--primary-100)] text-[var(--primary-500)]" : "border-[var(--primary-100)] bg-[var(--white)] text-[var(--black-100)]"}`}>{index < currentIndex ? "✓ " : index === currentIndex ? "● " : "○ "}{t(`orderStatus.${statusKey[stage]}`)}</div>)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>{t("employeePortal.information")}</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm md:grid-cols-2"><p><strong>{t("employeePortal.customer")}:</strong> {order.customer.fullName.firstName} {order.customer.fullName.lastName}</p><p><strong>{t("employeePortal.orderDate")}:</strong> {dayjs(order.createdAt).format("YYYY-MM-DD")}</p><p><strong>{t("employeePortal.descriptionLabel")}:</strong> {order.description}</p><p><strong>{t("employeePortal.notes")}:</strong> {order.notes || t("employeePortal.notSpecified")}</p><p><strong>{t("employeePortal.expectedFinish")}:</strong> {order.expectedFinishDate ? dayjs(order.expectedFinishDate).format("YYYY-MM-DD") : t("employeePortal.notSpecified")}</p><p><strong>{t("employeePortal.address")}:</strong> {order.deliveryLocation?.address || t("employeePortal.notSpecified")}</p><p><strong>{t("employeePortal.city")}:</strong> {order.deliveryLocation?.city || t("employeePortal.notSpecified")}</p><p><strong>{t("employeePortal.deliveryNotes")}:</strong> {order.deliveryLocation?.notes || t("employeePortal.notSpecified")}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>{t("employeePortal.rawMaterials")}</CardTitle></CardHeader><CardContent>{order.rawMaterials.length === 0 ? <p className="text-sm text-[var(--black-100)]">{t("employeePortal.noMaterials")}</p> : <div className="grid gap-3 md:grid-cols-2">{order.rawMaterials.map((line, index) => <div key={`${line.rawMaterial._id}-${index}`} className="rounded-xl border border-[var(--primary-100)] p-4"><p className="font-bold">{line.nameSnapshot} {line.colorSnapshot ? `- ${line.colorSnapshot}` : ""}</p><p className="mt-2 text-sm text-[var(--black-200)]">{t("employeePortal.quantity")}: <strong>{line.quantity}</strong></p></div>)}</div>}</CardContent></Card>
    </div></main>
  );
}
