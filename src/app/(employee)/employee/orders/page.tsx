"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { normalizeOrder } from "@/lib/normalize-api";
import { ordersApiService } from "@/services/api.orders.service";
import { IOrder, OrderStatus } from "@/types";

const statusKey: Record<OrderStatus, string> = { PENDING: "pending", CUTTING: "cutting", SEWING: "sewing", PRINTING: "printing", PACKAGING: "packaging", STORAGE: "storage", DELIVERY: "delivery" };

export default function EmployeeOrdersPage() {
  const { t } = useTranslation();
  const { error } = useToast();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void ordersApiService.getAssignedOrders(1, 100)
      .then((response) => { if (active) setOrders((response.orders ?? []).map((order, index) => normalizeOrder(order, `assigned-order-${index}`))); })
      .catch((requestError) => error({ title: t("employeePortal.loadFailed"), description: requestError instanceof Error ? requestError.message : undefined }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [error, t]);

  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[var(--primary-400)]">{t("employeePortal.badge")}</p>
          <h1 className="mt-1 text-3xl font-bold">{t("employeePortal.title")}</h1>
          <p className="mt-2 text-sm text-[var(--black-100)]">{t("employeePortal.description")}</p>
        </div>
        {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-64 w-full" />)}</div> : orders.length === 0 ? <Card><CardContent className="py-14 text-center text-lg font-semibold">{t("employeePortal.empty")}</CardContent></Card> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{orders.map((order) => <Card key={order._id} className="h-full"><CardHeader><CardTitle className="line-clamp-2 text-lg">{order.description}</CardTitle></CardHeader><CardContent className="flex h-full flex-col gap-3 text-sm"><div className="rounded-full bg-[var(--primary-100)] px-3 py-1 text-center font-semibold text-[var(--primary-500)]">{t(`orderStatus.${statusKey[order.status]}`)}</div><div className="space-y-2 text-[var(--black-200)]"><p>{t("employeePortal.customer")}: <strong>{order.customer.fullName.firstName} {order.customer.fullName.lastName}</strong></p><p>{t("employeePortal.orderDate")}: {dayjs(order.createdAt).format("YYYY-MM-DD")}</p><p>{t("employeePortal.deadline")}: {order.expectedFinishDate ? dayjs(order.expectedFinishDate).format("YYYY-MM-DD") : t("employeePortal.notSpecified")}</p><p>{t("employeePortal.materialsCount")}: {order.rawMaterials.length}</p></div><Link href={`/employee/orders/${order._id}`} className="mt-auto pt-3"><Button className="w-full" variant="outline">{t("employeePortal.details")}</Button></Link></CardContent></Card>)}</div>}
      </div>
    </main>
  );
}
