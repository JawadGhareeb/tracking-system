"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ordersApiService } from "@/services/api.orders.service";
import { usersApiService } from "@/services/api.users.service";
import { normalizeOrder, normalizeUser } from "@/lib/normalize-api";
import { IOrder, IUser, OrderStatus } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "قيد الانتظار",
  CUTTING: "مرحلة القص",
  SEWING: "مرحلة الخياطة",
  PRINTING: "مرحلة الطباعة",
  PACKAGING: "مرحلة التغليف",
  STORAGE: "مرحلة التخزين",
  DELIVERY: "مرحلة التسليم",
};
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CUTTING",
  CUTTING: "SEWING",
  SEWING: "PRINTING",
  PRINTING: "PACKAGING",
  PACKAGING: "STORAGE",
  STORAGE: "DELIVERY",
};

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { success, error } = useToast();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [employee, setEmployee] = useState("");
  const [expectedFinishDate, setExpectedFinishDate] = useState("");
  const [additionalCost, setAdditionalCost] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const employees = useMemo(() => users.filter((user) => {
    const role = user.role.name.trim().toLowerCase();
    return ["employee", "موظف", "worker", "عامل"].includes(role);
  }), [users]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orderResponse, usersResponse] = await Promise.all([
        ordersApiService.getById(orderId),
        usersApiService.getAll({ page: 1, perPage: 100 }),
      ]);
      const nextOrder = normalizeOrder(orderResponse, orderId);
      setOrder(nextOrder);
      setUsers((usersResponse.users ?? []).map((user) => normalizeUser(user)));
      setEmployee(nextOrder.employee?._id || "");
      setExpectedFinishDate(nextOrder.expectedFinishDate ? dayjs(nextOrder.expectedFinishDate).format("YYYY-MM-DD") : "");
      setAdditionalCost(String(nextOrder.additionalCost || 0));
    } catch (err) {
      error({ title: "تعذر تحميل الطلب", description: err instanceof Error ? err.message : undefined });
    } finally {
      setLoading(false);
    }
  }, [error, orderId]);

  useEffect(() => { void load(); }, [load]);

  const saveAssignment = async () => {
    if (!employee || !expectedFinishDate) {
      error({ title: "بيانات ناقصة", description: "حدد الموظف وتاريخ التسليم المتوقع." });
      return;
    }
    setSaving(true);
    try {
      const response = await ordersApiService.assign(orderId, {
        employee,
        expectedFinishDate: new Date(expectedFinishDate).toISOString(),
        additionalCost: Math.max(0, Number(additionalCost) || 0),
      });
      const updated = normalizeOrder(response, orderId);
      setOrder(updated);
      success({ title: "تم حفظ بيانات التنفيذ" });
    } catch (err) {
      error({ title: "تعذر حفظ بيانات التنفيذ", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  const moveToNextStage = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setSaving(true);
    try {
      const response = await ordersApiService.updateStatus(orderId, next);
      setOrder(normalizeOrder(response, orderId));
      success({ title: `تم نقل الطلب إلى ${STATUS_LABELS[next]}` });
    } catch (err) {
      error({ title: "تعذر تغيير المرحلة", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto space-y-4 p-6"><Skeleton className="h-10 w-72" /><Skeleton className="h-64 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (!order) return <div className="container mx-auto p-6">تعذر العثور على الطلب.</div>;

  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-semibold text-[var(--primary-400)]">مراجعة الطلب</p><h1 className="mt-1 text-3xl font-bold">تفاصيل الطلب</h1></div>
        <Link href="/orders"><Button variant="outline">العودة للطلبات</Button></Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>بيانات الزبون والطلب</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          <p><strong>الزبون:</strong> {order.customer.fullName.firstName} {order.customer.fullName.lastName}</p>
          <p><strong>الحالة:</strong> {STATUS_LABELS[order.status]}</p>
          <p><strong>الوصف:</strong> {order.description}</p>
          <p><strong>الملاحظات:</strong> {order.notes || "-"}</p>
          <p><strong>تاريخ الطلب:</strong> {dayjs(order.createdAt).format("YYYY-MM-DD")}</p>
          <p><strong>العنوان:</strong> {order.deliveryLocation?.address || "-"}</p>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>التكلفة</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="flex justify-between"><span>تكلفة المواد</span><strong>{order.materialCost.toLocaleString()}</strong></div>
          <div className="flex justify-between"><span>تكاليف إضافية</span><strong>{order.additionalCost.toLocaleString()}</strong></div>
          <div className="border-t border-[var(--primary-100)] pt-3 text-lg"><div className="flex justify-between"><span>الإجمالي</span><strong className="text-[var(--primary-500)]">{order.totalPrice.toLocaleString()}</strong></div></div>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>المواد الخام المطلوبة</CardTitle></CardHeader><CardContent>
        {order.rawMaterials.length === 0 ? <p className="text-sm text-[var(--black-100)]">طلب قديم بدون مواد خام مرتبطة.</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{order.rawMaterials.map((line, index) => <div key={`${line.rawMaterial._id}-${index}`} className="rounded-xl border border-[var(--primary-100)] p-4"><p className="font-bold">{line.nameSnapshot} {line.colorSnapshot ? `- ${line.colorSnapshot}` : ""}</p><p className="mt-2 text-sm">الكمية: {line.quantity}</p><p className="text-sm">سعر الوحدة: {line.unitPriceSnapshot.toLocaleString()}</p><p className="mt-2 font-semibold">{line.subtotal.toLocaleString()}</p></div>)}</div>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>التنفيذ والإسناد</CardTitle></CardHeader><CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label>الموظف المسؤول</Label><Select value={employee || undefined} onValueChange={setEmployee}><SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger><SelectContent>{employees.map((user) => <SelectItem key={user._id} value={user._id}>{user.fullName.firstName} {user.fullName.lastName}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>تاريخ التسليم المتوقع</Label><Input type="date" value={expectedFinishDate} onChange={(e) => setExpectedFinishDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>تكاليف إضافية</Label><Input type="number" min="0" value={additionalCost} onChange={(e) => setAdditionalCost(e.target.value)} /></div>
        </div>
        <div className="flex flex-wrap gap-3"><Button onClick={() => void saveAssignment()} disabled={saving}>حفظ بيانات التنفيذ</Button>{nextStatus ? <Button variant="outline" onClick={() => void moveToNextStage()} disabled={saving}>{order.status === "PENDING" ? "بدء مرحلة القص" : `الانتقال إلى ${STATUS_LABELS[nextStatus]}`}</Button> : <span className="rounded-lg bg-[#ddf6e8] px-4 py-2 text-sm font-semibold text-[#2b9b5c]">تم الوصول إلى مرحلة التسليم</span>}</div>
      </CardContent></Card>
    </div>
  );
}
