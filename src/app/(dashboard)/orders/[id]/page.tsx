"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
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
import { isEmployeeRoleName } from "@/lib/role-access";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = { PENDING: "CUTTING", CUTTING: "SEWING", SEWING: "PRINTING", PRINTING: "PACKAGING", PACKAGING: "STORAGE", STORAGE: "DELIVERY" };
const statusKey: Record<OrderStatus, string> = { PENDING: "pending", CUTTING: "cutting", SEWING: "sewing", PRINTING: "printing", PACKAGING: "packaging", STORAGE: "storage", DELIVERY: "delivery", DELIVERED: "delivered" };

export default function AdminOrderDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const orderId = params.id as string;
  const { success, error } = useToast();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [employee, setEmployee] = useState("");
  const [deliveryEmployee, setDeliveryEmployee] = useState("");
  const [expectedFinishDate, setExpectedFinishDate] = useState("");
  const [additionalCost, setAdditionalCost] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const employees = useMemo(
    () => users
      .filter((user) => isEmployeeRoleName(user.role.name, user.role.group))
      .sort((a, b) => `${a.fullName.firstName} ${a.fullName.lastName}`.localeCompare(`${b.fullName.firstName} ${b.fullName.lastName}`)),
    [users]
  );

  const pendingCompletion = useMemo(() => {
    if (!order) return undefined;
    return order.stageCompletionRequests.find((request) => request.status === "PENDING" && request.stage === order.status);
  }, [order]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orderResponse, usersResponse] = await Promise.all([
        ordersApiService.getById(orderId),
        usersApiService.getAll({ page: 1, perPage: 100, roleGroup: "employee", orderByAlpha: "asc" }),
      ]);
      const nextOrder = normalizeOrder(orderResponse, orderId);
      setOrder(nextOrder);
      setUsers((usersResponse.users ?? []).map((user) => normalizeUser(user)));
      setEmployee(nextOrder.employee?._id || "");
      setDeliveryEmployee(nextOrder.deliveryEmployee?._id || "");
      setExpectedFinishDate(nextOrder.expectedFinishDate ? dayjs(nextOrder.expectedFinishDate).format("YYYY-MM-DD") : "");
      setAdditionalCost(String(nextOrder.additionalCost || 0));
    } catch (requestError) {
      error({ title: t("adminOrderDetails.loadFailed"), description: requestError instanceof Error ? requestError.message : undefined });
    } finally {
      setLoading(false);
    }
  }, [error, orderId, t]);

  useEffect(() => { void load(); }, [load]);

  const saveAssignment = async () => {
    if (!employee || !expectedFinishDate) {
      error({ title: t("adminOrderDetails.missingTitle"), description: t("adminOrderDetails.missingDescription") });
      return;
    }
    setSaving(true);
    try {
      const response = await ordersApiService.assign(orderId, {
        employee,
        expectedFinishDate: new Date(expectedFinishDate).toISOString(),
        additionalCost: Math.max(0, Number(additionalCost) || 0),
      });
      setOrder(normalizeOrder(response, orderId));
      success({ title: t("adminOrderDetails.assignmentSaved") });
    } catch (requestError) {
      error({ title: t("adminOrderDetails.assignmentFailed"), description: requestError instanceof Error ? requestError.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  const saveDeliveryAssignment = async () => {
    if (!deliveryEmployee) return error({ title: t("adminOrderDetails.missingTitle"), description: t("adminOrderDetails.deliveryEmployeeRequired", { defaultValue: "اختر موظف التسليم" }) });
    setSaving(true);
    try { const response = await ordersApiService.assignDeliveryEmployee(orderId, deliveryEmployee); setOrder(normalizeOrder(response, orderId)); success({ title: t("adminOrderDetails.deliveryAssignmentSaved", { defaultValue: "تم تعيين موظف التسليم" }) }); }
    catch (requestError) { error({ title: t("adminOrderDetails.assignmentFailed"), description: requestError instanceof Error ? requestError.message : undefined }); }
    finally { setSaving(false); }
  };

  const rejectOrder = async () => {
    if (!order || order.status !== "PENDING" || order.isCancelled || order.isRejected) return;
    if (!window.confirm(t("adminOrderDetails.rejectOrderConfirm", { defaultValue: "هل أنت متأكد من رفض الطلب؟" }))) return;
    setSaving(true);
    try { const response = await ordersApiService.rejectOrder(orderId); setOrder(normalizeOrder(response, orderId)); success({ title: t("adminOrderDetails.orderRejected", { defaultValue: "تم رفض الطلب" }) }); }
    catch (requestError) { error({ title: t("adminOrderDetails.rejectOrderFailed", { defaultValue: "تعذر رفض الطلب" }), description: requestError instanceof Error ? requestError.message : undefined }); }
    finally { setSaving(false); }
  };

  const moveToNextStage = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setSaving(true);
    try {
      const response = await ordersApiService.updateStatus(orderId, next);
      setOrder(normalizeOrder(response, orderId));
      success({ title: t("adminOrderDetails.stageChanged", { status: t(`orderStatus.${statusKey[next]}`) }) });
    } catch (requestError) {
      error({ title: t("adminOrderDetails.stageChangeFailed"), description: requestError instanceof Error ? requestError.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  const reviewCompletion = async (decision: "approve" | "reject") => {
    if (!pendingCompletion) return;
    setSaving(true);
    try {
      const response = decision === "approve"
        ? await ordersApiService.approveStageCompletion(orderId, pendingCompletion._id)
        : await ordersApiService.rejectStageCompletion(orderId, pendingCompletion._id);
      setOrder(normalizeOrder(response, orderId));
      success({ title: t(decision === "approve" ? "adminOrderDetails.completionApproved" : "adminOrderDetails.completionRejected") });
    } catch (requestError) {
      error({ title: t("adminOrderDetails.completionReviewFailed"), description: requestError instanceof Error ? requestError.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto space-y-4 p-6"><Skeleton className="h-10 w-72" /><Skeleton className="h-64 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (!order) return <div className="container mx-auto p-6">{t("adminOrderDetails.notFound")}</div>;
  const nextStatus = NEXT_STATUS[order.status];

  return <div className="container mx-auto space-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--primary-400)]">{t("adminOrderDetails.badge")}</p><h1 className="mt-1 text-3xl font-bold">{t("adminOrderDetails.title")}</h1></div><Link href="/orders"><Button variant="outline">{t("adminOrderDetails.back")}</Button></Link></div>

    {pendingCompletion ? <Card className="border-[var(--secondary-300)]"><CardHeader><CardTitle>{t("adminOrderDetails.completionRequestTitle")}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 text-sm md:grid-cols-3"><p><strong>{t("adminOrderDetails.completionRequestedBy")}:</strong> {pendingCompletion.employee.fullName.firstName} {pendingCompletion.employee.fullName.lastName}</p><p><strong>{t("adminOrderDetails.status")}:</strong> {t(`orderStatus.${statusKey[pendingCompletion.stage]}`)}</p><p><strong>{t("adminOrderDetails.completionRequestedAt")}:</strong> {pendingCompletion.requestedAt ? dayjs(pendingCompletion.requestedAt).format("YYYY-MM-DD HH:mm") : "-"}</p></div><div className="flex flex-wrap gap-3"><Button onClick={() => void reviewCompletion("approve")} disabled={saving}>{t("adminOrderDetails.approveCompletion")}</Button><Button variant="destructive" onClick={() => void reviewCompletion("reject")} disabled={saving}>{t("adminOrderDetails.rejectCompletion")}</Button></div></CardContent></Card> : null}

    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>{t("adminOrderDetails.orderData")}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p><strong>{t("adminOrderDetails.customer")}:</strong> {order.customer.fullName.firstName} {order.customer.fullName.lastName}</p><p><strong>{t("adminOrderDetails.status")}:</strong> {t(`orderStatus.${statusKey[order.status]}`)}</p><p><strong>{t("adminOrderDetails.description")}:</strong> {order.description}</p>{order.isCancelled ? <p className="font-semibold text-[var(--danger)]">{t("adminOrderDetails.cancelled", { defaultValue: "ملغى من الزبون" })}</p> : null}{order.isRejected ? <p className="font-semibold text-[var(--danger)]">{t("adminOrderDetails.rejected", { defaultValue: "مرفوض" })}{order.rejectReason ? `: ${order.rejectReason}` : ""}</p> : null}{order.productType ? <><p><strong>{t("adminOrderDetails.productType", { defaultValue: "نوع القطعة" })}:</strong> {order.productType}</p><p><strong>{t("adminOrderDetails.orderQuantity", { defaultValue: "الكمية" })}:</strong> {order.orderQuantity || 1}</p><p><strong>{t("adminOrderDetails.measurementMode", { defaultValue: "القياسات" })}:</strong> {order.measurementMode === "STANDARD" ? order.standardSize || "-" : t("adminOrderDetails.customMeasurements", { defaultValue: "قياسات خاصة" })}</p>{Object.entries(order.designAttributes || {}).map(([key, value]) => <p key={key}><strong>{key}:</strong> {value}</p>)}</> : null}<p><strong>{t("adminOrderDetails.notes")}:</strong> {order.notes || "-"}</p><p><strong>{t("adminOrderDetails.orderDate")}:</strong> {dayjs(order.createdAt).format("YYYY-MM-DD")}</p><p><strong>{t("adminOrderDetails.address")}:</strong> {order.deliveryLocation?.address || "-"}</p></CardContent></Card><Card><CardHeader><CardTitle>{t("adminOrderDetails.cost")}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex justify-between"><span>{t("adminOrderDetails.materialCost")}</span><strong>{order.materialCost.toLocaleString()}</strong></div><div className="flex justify-between"><span>{t("adminOrderDetails.additionalCost")}</span><strong>{order.additionalCost.toLocaleString()}</strong></div><div className="border-t border-[var(--primary-100)] pt-3 text-lg"><div className="flex justify-between"><span>{t("adminOrderDetails.total")}</span><strong className="text-[var(--primary-500)]">{order.totalPrice.toLocaleString()}</strong></div></div></CardContent></Card></div>

    <Card><CardHeader><CardTitle>{t("adminOrderDetails.requiredMaterials")}</CardTitle></CardHeader><CardContent>{order.rawMaterials.length === 0 ? <p className="text-sm text-[var(--black-100)]">{t("adminOrderDetails.legacyNoMaterials")}</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{order.rawMaterials.map((line, index) => <div key={`${line.rawMaterial._id}-${index}`} className="rounded-xl border border-[var(--primary-100)] p-4"><p className="font-bold">{line.nameSnapshot} {line.colorSnapshot ? `- ${line.colorSnapshot}` : ""}</p><p className="mt-2 text-sm">{t("adminOrderDetails.quantity")}: {line.quantity}</p><p className="text-sm">{t("adminOrderDetails.unitPrice")}: {line.unitPriceSnapshot.toLocaleString()}</p><p className="mt-2 font-semibold">{line.subtotal.toLocaleString()}</p></div>)}</div>}</CardContent></Card>

    <Card><CardHeader><CardTitle>{t("adminOrderDetails.assignment")}</CardTitle></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>{t("adminOrderDetails.employee")}</Label><Select value={employee || undefined} onValueChange={setEmployee}><SelectTrigger><SelectValue placeholder={t("adminOrderDetails.selectEmployee")} /></SelectTrigger><SelectContent>{employees.map((user) => <SelectItem key={user._id} value={user._id}>{user.fullName.firstName} {user.fullName.lastName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>{t("adminOrderDetails.expectedDelivery")}</Label><Input type="date" value={expectedFinishDate} onChange={(event) => setExpectedFinishDate(event.target.value)} /></div><div className="space-y-2"><Label>{t("adminOrderDetails.additionalCost")}</Label><Input type="number" min="0" value={additionalCost} onChange={(event) => setAdditionalCost(event.target.value)} /></div></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>{t("adminOrderDetails.deliveryEmployee", { defaultValue: "موظف التسليم" })}</Label><Select value={deliveryEmployee || undefined} onValueChange={setDeliveryEmployee}><SelectTrigger><SelectValue placeholder={t("adminOrderDetails.selectEmployee")} /></SelectTrigger><SelectContent>{employees.map((user) => <SelectItem key={user._id} value={user._id}>{user.fullName.firstName} {user.fullName.lastName}</SelectItem>)}</SelectContent></Select></div><div className="flex items-end"><Button variant="outline" onClick={() => void saveDeliveryAssignment()} disabled={saving || Boolean(order.isCancelled) || Boolean(order.isRejected)}>{t("adminOrderDetails.saveDeliveryEmployee", { defaultValue: "حفظ موظف التسليم" })}</Button></div></div><div className="flex flex-wrap gap-3"><Button onClick={() => void saveAssignment()} disabled={saving || Boolean(order.isCancelled) || Boolean(order.isRejected)}>{t("adminOrderDetails.saveAssignment")}</Button>{order.status === "PENDING" && !order.isCancelled && !order.isRejected ? <Button variant="destructive" onClick={() => void rejectOrder()} disabled={saving}>{t("adminOrderDetails.rejectOrder", { defaultValue: "رفض الطلب" })}</Button> : null}{nextStatus ? <Button variant="outline" onClick={() => void moveToNextStage()} disabled={saving || Boolean(order.isCancelled) || Boolean(order.isRejected)}>{order.status === "PENDING" ? t("adminOrderDetails.startCutting") : t("adminOrderDetails.moveTo", { status: t(`orderStatus.${statusKey[nextStatus]}`) })}</Button> : <span className="rounded-lg bg-[#ddf6e8] px-4 py-2 text-sm font-semibold text-[#2b9b5c]">{t("adminOrderDetails.delivered")}</span>}</div></CardContent></Card>
  </div>;
}
