"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApiService } from "@/services/api.orders.service";
import { normalizeOrder } from "@/lib/normalize-api";
import { IOrder, OrderStatus } from "@/types";
import { useToast } from "@/components/ui/toast";

const stages: Array<{ value: OrderStatus; label: string }> = [
  { value: "PENDING", label: "قيد الانتظار" }, { value: "CUTTING", label: "مرحلة القص" }, { value: "SEWING", label: "مرحلة الخياطة" }, { value: "PRINTING", label: "مرحلة الطباعة" }, { value: "PACKAGING", label: "مرحلة التغليف" }, { value: "STORAGE", label: "مرحلة التخزين" }, { value: "DELIVERY", label: "مرحلة التسليم" },
];

export default function MyOrderDetailsPage() {
  const params = useParams();
  const { error } = useToast();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    ordersApiService.getMyOrderById(params.id as string)
      .then((response) => { if (active) setOrder(normalizeOrder(response, params.id as string)); })
      .catch((err) => error({ title: "تعذر تحميل تفاصيل الطلب", description: err instanceof Error ? err.message : undefined }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [error, params.id]);

  if (loading) return <main className="min-h-screen bg-[var(--white-100)] p-8"><div className="mx-auto max-w-5xl space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-52 w-full" /><Skeleton className="h-64 w-full" /></div></main>;
  if (!order) return <main className="min-h-screen p-8">الطلب غير موجود.</main>;
  const currentIndex = stages.findIndex((stage) => stage.value === order.status);

  return <main className="min-h-screen bg-[var(--white-100)] p-4 md:p-8"><div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--primary-400)]">متابعة الطلب</p><h1 className="mt-1 text-3xl font-bold">تفاصيل الطلب</h1></div><div className="flex gap-2"><Link href="/my-orders"><Button variant="outline">طلباتي</Button></Link><Link href="/my-orders/new"><Button>إضافة طلب</Button></Link></div></div>

    <Card><CardHeader><CardTitle>تقدم الطلب</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stages.map((stage, index) => <div key={stage.value} className={`rounded-xl border p-3 text-center text-sm font-semibold ${index <= currentIndex ? "border-[var(--primary-300)] bg-[var(--primary-100)] text-[var(--primary-500)]" : "border-[var(--primary-100)] bg-[var(--white)] text-[var(--black-100)]"}`}>{index < currentIndex ? "✓ " : index === currentIndex ? "● " : "○ "}{stage.label}</div>)}</div></CardContent></Card>

    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>معلومات الطلب</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p><strong>الوصف:</strong> {order.description}</p><p><strong>الملاحظات:</strong> {order.notes}</p><p><strong>تاريخ الطلب:</strong> {dayjs(order.createdAt).format("YYYY-MM-DD")}</p><p><strong>موعد التسليم المتوقع:</strong> {order.expectedFinishDate ? dayjs(order.expectedFinishDate).format("YYYY-MM-DD") : "لم يحدد بعد"}</p><p><strong>الموظف المسؤول:</strong> {order.employee ? `${order.employee.fullName.firstName} ${order.employee.fullName.lastName}` : "لم يحدد بعد"}</p><p><strong>العنوان:</strong> {order.deliveryLocation?.address || "-"}</p></CardContent></Card>
    <Card><CardHeader><CardTitle>التكلفة</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex justify-between"><span>المواد</span><strong>{order.materialCost.toLocaleString()}</strong></div><div className="flex justify-between"><span>إضافي</span><strong>{order.additionalCost.toLocaleString()}</strong></div><div className="flex justify-between border-t border-[var(--primary-100)] pt-3 text-lg"><span>الإجمالي</span><strong className="text-[var(--primary-500)]">{order.totalPrice.toLocaleString()}</strong></div></CardContent></Card></div>

    <Card><CardHeader><CardTitle>المواد الخام</CardTitle></CardHeader><CardContent>{order.rawMaterials.length === 0 ? <p className="text-sm text-[var(--black-100)]">لا توجد تفاصيل مواد لهذا الطلب القديم.</p> : <div className="grid gap-3 md:grid-cols-2">{order.rawMaterials.map((line, index) => <div key={`${line.rawMaterial._id}-${index}`} className="rounded-xl border border-[var(--primary-100)] p-4"><p className="font-bold">{line.nameSnapshot} {line.colorSnapshot ? `- ${line.colorSnapshot}` : ""}</p><div className="mt-2 flex justify-between text-sm"><span>{line.quantity} × {line.unitPriceSnapshot.toLocaleString()}</span><strong>{line.subtotal.toLocaleString()}</strong></div></div>)}</div>}</CardContent></Card>
  </div></main>;
}
