"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { OrderConfigurator } from "@/components/order-configurator/order-configurator";
import { ordersApiService } from "@/services/api.orders.service";
import { normalizeOrder } from "@/lib/normalize-api";
import { IOrder } from "@/types";
import { Button } from "@/components/ui/button";

export default function EditCustomerOrderPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { let active = true; ordersApiService.getMyOrderById(id).then((response) => { if (!active) return; const next = normalizeOrder(response, id); if (next.status !== "PENDING" || next.isCancelled || next.isRejected) setMessage("يمكن تعديل الطلب فقط عندما يكون قيد الانتظار."); else if (!next.productType) setMessage("هذا طلب قديم ولا يستخدم نموذج تخصيص المنتج الجديد."); else setOrder(next); }).catch((error) => active && setMessage(error instanceof Error ? error.message : "تعذر تحميل الطلب")).finally(() => active && setLoading(false)); return () => { active = false; }; }, [id]);
  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!order) return <div className="mx-auto max-w-xl space-y-4 p-8 text-center"><p>{message}</p><Link href={`/my-orders/${id}`}><Button variant="outline">العودة للطلب</Button></Link></div>;
  return <OrderConfigurator initialOrder={order} orderId={id} />;
}
