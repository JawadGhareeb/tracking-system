"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const stages: OrderStatus[] = ["PENDING", "CUTTING", "SEWING", "PRINTING", "PACKAGING", "STORAGE", "DELIVERY", "DELIVERED"];
const employeeReportableStages: OrderStatus[] = ["CUTTING", "SEWING", "PRINTING", "PACKAGING", "STORAGE", "DELIVERY"];
const statusKey: Record<OrderStatus, string> = { PENDING: "pending", CUTTING: "cutting", SEWING: "sewing", PRINTING: "printing", PACKAGING: "packaging", STORAGE: "storage", DELIVERY: "delivery", DELIVERED: "delivered" };

export default function EmployeeOrderDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const orderId = params.id as string;
  const { success, error } = useToast();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void ordersApiService.getAssignedOrderById(orderId)
      .then((response) => { if (active) setOrder(normalizeOrder(response, orderId)); })
      .catch((requestError) => error({ title: t("employeePortal.loadFailed"), description: requestError instanceof Error ? requestError.message : undefined }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [error, orderId, t]);

  const pendingCompletion = useMemo(() => {
    if (!order) return undefined;
    return order.stageCompletionRequests.find((request) => request.stage === order.status && request.status === "PENDING");
  }, [order]);

  const requestStageCompletion = async () => {
    if (!order || !employeeReportableStages.includes(order.status) || pendingCompletion) return;
    setSaving(true);
    try {
      const response = await ordersApiService.requestStageCompletion(order._id);
      setOrder(normalizeOrder(response, order._id));
      success({ title: t("employeePortal.completionSent") });
    } catch (requestError) {
      error({ title: t("employeePortal.completionFailed"), description: requestError instanceof Error ? requestError.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="p-8"><div className="mx-auto max-w-5xl space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-52 w-full" /><Skeleton className="h-64 w-full" /></div></main>;
  if (!order) return <main className="p-8"><div className="mx-auto max-w-5xl">{t("employeePortal.loadFailed")}</div></main>;

  const currentIndex = stages.indexOf(order.status);
  const canReportCompletion = employeeReportableStages.includes(order.status);

  return (
    <main className="p-4 md:p-8"><div className="mx-auto max-w-5xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--primary-400)]">{t("employeePortal.detailsBadge")}</p><h1 className="mt-1 text-3xl font-bold">{t("employeePortal.detailsTitle")}</h1></div><Link href="/employee/orders"><Button variant="outline">{t("employeePortal.back")}</Button></Link></div>
      <Card><CardHeader><CardTitle>{t("employeePortal.progress")}</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stages.map((stage, index) => <div key={stage} className={`rounded-xl border p-3 text-center text-sm font-semibold ${index <= currentIndex ? "border-[var(--primary-300)] bg-[var(--primary-100)] text-[var(--primary-500)]" : "border-[var(--primary-100)] bg-[var(--white)] text-[var(--black-100)]"}`}>{index < currentIndex ? "✓ " : index === currentIndex ? "● " : "○ "}{t(`orderStatus.${statusKey[stage]}`)}</div>)}</div></CardContent></Card>

      <Card>
        <CardHeader><CardTitle>{t("employeePortal.stageCompletionTitle")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {pendingCompletion ? (
            <div className="rounded-xl border border-[var(--secondary-200)] bg-[var(--secondary-100)] p-4 text-sm font-semibold text-[var(--secondary-500)]">
              {t("employeePortal.completionPending")}
            </div>
          ) : canReportCompletion ? (
            <>
              <p className="text-sm text-[var(--black-200)]">{t("employeePortal.stageCompletionDescription")}</p>
              <Button onClick={() => void requestStageCompletion()} disabled={saving}>
                {saving ? t("employeePortal.sendingCompletion") : t("employeePortal.completeStage")}
              </Button>
            </>
          ) : order.status === "PENDING" ? (
            <p className="text-sm text-[var(--black-100)]">{t("employeePortal.completionBeforeStart")}</p>
          ) : (
            <p className="text-sm text-[var(--black-100)]">{t("employeePortal.completionFinished")}</p>
          )}
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle>{t("employeePortal.information")}</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm md:grid-cols-2"><p><strong>{t("employeePortal.customer")}:</strong> {order.customer.fullName.firstName} {order.customer.fullName.lastName}</p><p><strong>{t("employeePortal.orderDate")}:</strong> {dayjs(order.createdAt).format("YYYY-MM-DD")}</p><p><strong>{t("employeePortal.descriptionLabel")}:</strong> {order.description}</p>{order.productType ? <><p><strong>{t("employeePortal.productType", { defaultValue: "نوع القطعة" })}:</strong> {order.productType}</p><p><strong>{t("employeePortal.orderQuantity", { defaultValue: "كمية الطلب" })}:</strong> {order.orderQuantity || 1}</p><p><strong>{t("employeePortal.measurements", { defaultValue: "القياسات" })}:</strong> {order.measurementMode === "STANDARD" ? order.standardSize || "-" : t("employeePortal.customMeasurements", { defaultValue: "قياسات خاصة" })}</p>{Object.entries(order.designAttributes || {}).map(([key, value]) => <p key={key}><strong>{key}:</strong> {value}</p>)}{Object.entries(order.customizations || {}).filter(([, value]) => value).map(([key]) => <p key={key}><strong>{t("employeePortal.customization", { defaultValue: "تخصيص" })}:</strong> {key}</p>)}</> : null}<p><strong>{t("employeePortal.notes")}:</strong> {order.notes || t("employeePortal.notSpecified")}</p><p><strong>{t("employeePortal.expectedFinish")}:</strong> {order.expectedFinishDate ? dayjs(order.expectedFinishDate).format("YYYY-MM-DD") : t("employeePortal.notSpecified")}</p><p><strong>{t("employeePortal.address")}:</strong> {order.deliveryLocation?.address || t("employeePortal.notSpecified")}</p><p><strong>{t("employeePortal.city")}:</strong> {order.deliveryLocation?.city || t("employeePortal.notSpecified")}</p><p><strong>{t("employeePortal.deliveryNotes")}:</strong> {order.deliveryLocation?.notes || t("employeePortal.notSpecified")}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>{t("employeePortal.rawMaterials")}</CardTitle></CardHeader><CardContent>{order.rawMaterials.length === 0 ? <p className="text-sm text-[var(--black-100)]">{t("employeePortal.noMaterials")}</p> : <div className="grid gap-3 md:grid-cols-2">{order.rawMaterials.map((line, index) => <div key={`${line.rawMaterial._id}-${index}`} className="rounded-xl border border-[var(--primary-100)] p-4"><p className="font-bold">{line.nameSnapshot} {line.colorSnapshot ? `- ${line.colorSnapshot}` : ""}</p><p className="mt-2 text-sm text-[var(--black-200)]">{t("employeePortal.quantity")}: <strong>{line.quantity}</strong></p></div>)}</div>}</CardContent></Card>
    </div></main>
  );
}
