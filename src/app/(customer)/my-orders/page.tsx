"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApiService } from "@/services/api.orders.service";
import { normalizeOrder } from "@/lib/normalize-api";
import { IOrder, OrderStatus } from "@/types";
import { useToast } from "@/components/ui/toast";

const labels: Record<OrderStatus, string> = {
  PENDING: "قيد الانتظار", CUTTING: "مرحلة القص", SEWING: "مرحلة الخياطة", PRINTING: "مرحلة الطباعة", PACKAGING: "مرحلة التغليف", STORAGE: "مرحلة التخزين", DELIVERY: "مرحلة التسليم",
};

export default function MyOrdersPage() {
  const { error } = useToast();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    ordersApiService.getMyOrders(1, 100)
      .then((response) => { if (active) setOrders((response.orders ?? []).map((order, index) => normalizeOrder(order, `order-${index}`))); })
      .catch((err) => error({ title: "تعذر تحميل طلباتك", description: err instanceof Error ? err.message : undefined }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [error]);

  return (
    <main className="min-h-screen bg-[var(--white-100)] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold text-[var(--primary-400)]">حسابي</p><h1 className="mt-1 text-3xl font-bold">طلباتي</h1><p className="mt-2 text-sm text-[var(--black-100)]">تابع حالة كل طلب من لحظة الإرسال حتى التسليم.</p></div>
          <div className="flex gap-2"><Link href="/account/profile"><Button variant="outline">الملف الشخصي</Button></Link><Link href="/my-orders/new"><Button>إضافة طلب</Button></Link></div>
        </div>

        {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-64 w-full" />)}</div> : orders.length === 0 ? (
          <Card><CardContent className="py-14 text-center"><p className="text-lg font-semibold">ما عندك طلبات حتى الآن.</p><Link href="/my-orders/new" className="mt-5 inline-block"><Button>إضافة أول طلب</Button></Link></CardContent></Card>
        ) : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{orders.map((order) => <Card key={order._id} className="h-full"><CardHeader><CardTitle className="line-clamp-2 text-lg">{order.description}</CardTitle></CardHeader><CardContent className="flex h-full flex-col gap-3 text-sm">
          <div className="rounded-full bg-[var(--primary-100)] px-3 py-1 text-center font-semibold text-[var(--primary-500)]">{labels[order.status]}</div>
          <div className="space-y-2 text-[var(--black-200)]"><p>تاريخ الطلب: {dayjs(order.createdAt).format("YYYY-MM-DD")}</p><p>عدد المواد: {order.rawMaterials.length}</p><p>التكلفة: <strong>{order.totalPrice.toLocaleString()}</strong></p><p>موعد التسليم: {order.expectedFinishDate ? dayjs(order.expectedFinishDate).format("YYYY-MM-DD") : "بانتظار تحديد الإدارة"}</p></div>
          <Link href={`/my-orders/${order._id}`} className="mt-auto pt-3"><Button className="w-full" variant="outline">تفاصيل الطلب</Button></Link>
        </CardContent></Card>)}</div>}
      </div>
    </main>
  );
}
