"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { normalizeOrder, normalizeRawMaterial } from "@/lib/normalize-api";
import { ordersApiService } from "@/services/api.orders.service";
import { rawMaterialsApiService } from "@/services/api.raw-materials.service";
import { IRawMaterial } from "@/types";

interface MaterialLine {
  rawMaterialId: string;
  quantity: number;
}

export default function EditCustomerOrderPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { success, error } = useToast();
  const [materials, setMaterials] = useState<IRawMaterial[]>([]);
  const [lines, setLines] = useState<MaterialLine[]>([]);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      ordersApiService.getMyOrderById(orderId),
      rawMaterialsApiService.getAvailable(),
    ])
      .then(([orderResponse, materialsResponse]) => {
        if (!active) return;
        const order = normalizeOrder(orderResponse, orderId);
        const available = (materialsResponse.items ?? []).map((item, index) => normalizeRawMaterial(item, `available-${index}`));
        const byId = new Map(available.map((item) => [item._id, item]));
        order.rawMaterials.forEach((line) => {
          if (!byId.has(line.rawMaterial._id)) byId.set(line.rawMaterial._id, line.rawMaterial);
        });
        setMaterials(Array.from(byId.values()).sort((a, b) => `${a.name} ${a.color}`.localeCompare(`${b.name} ${b.color}`)));
        setLines(order.rawMaterials.map((line) => ({ rawMaterialId: line.rawMaterial._id, quantity: line.quantity })));
        setDescription(order.description);
        setNotes(order.notes);
        setAddress(order.deliveryLocation?.address || "");
        setCity(order.deliveryLocation?.city || "");
        setDeliveryNotes(order.deliveryLocation?.notes || "");
        setIsPending(order.status === "PENDING");
      })
      .catch((requestError) => error({
        title: t("customerOrderEdit.loadFailed"),
        description: requestError instanceof Error ? requestError.message : undefined,
      }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [error, orderId, t]);

  const selectedIds = useMemo(() => new Set(lines.map((line) => line.rawMaterialId).filter(Boolean)), [lines]);
  const total = useMemo(() => lines.reduce((sum, line) => {
    const material = materials.find((item) => item._id === line.rawMaterialId);
    return sum + (material ? material.unitPrice * line.quantity : 0);
  }, 0), [lines, materials]);

  const updateLine = (index: number, patch: Partial<MaterialLine>) => {
    setLines((previous) => previous.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isPending) return;
    if (description.trim().length < 3 || notes.trim().length < 3) {
      error({ title: t("customerOrderCreate.incompleteTitle"), description: t("customerOrderCreate.incompleteDescription") });
      return;
    }
    if (lines.length === 0 || lines.some((line) => !line.rawMaterialId || !Number.isInteger(line.quantity) || line.quantity < 1)) {
      error({ title: t("customerOrderCreate.reviewMaterialsTitle"), description: t("customerOrderCreate.reviewMaterialsDescription") });
      return;
    }
    if (selectedIds.size !== lines.length) {
      error({ title: t("customerOrderCreate.duplicateTitle"), description: t("customerOrderCreate.duplicateDescription") });
      return;
    }

    setSaving(true);
    try {
      await ordersApiService.updateMyOrder(orderId, {
        description: description.trim(),
        notes: notes.trim(),
        rawMaterials: lines,
        deliveryLocation: address.trim() || city.trim() || deliveryNotes.trim()
          ? { address: address.trim(), city: city.trim() || undefined, notes: deliveryNotes.trim() || undefined }
          : undefined,
      });
      success({ title: t("customerOrderEdit.success") });
      router.push(`/my-orders/${orderId}`);
    } catch (requestError) {
      error({ title: t("customerOrderEdit.updateFailed"), description: requestError instanceof Error ? requestError.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-[var(--white-100)] p-8"><div className="mx-auto max-w-5xl space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-60 w-full" /><Skeleton className="h-80 w-full" /></div></main>;
  }

  if (!isPending) {
    return <main className="min-h-screen bg-[var(--white-100)] p-4 md:p-8"><div className="mx-auto max-w-3xl"><Card><CardContent className="space-y-4 py-10 text-center"><p className="text-lg font-bold">{t("customerOrderEdit.notEditable")}</p><p className="text-sm text-[var(--black-100)]">{t("customerOrderEdit.notEditableDescription")}</p><Link href={`/my-orders/${orderId}`}><Button variant="outline">{t("customerOrderEdit.back")}</Button></Link></CardContent></Card></div></main>;
  }

  return <main className="min-h-screen bg-[var(--white-100)] p-4 md:p-8"><div className="mx-auto max-w-5xl">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--primary-400)]">{t("customerOrderEdit.badge")}</p><h1 className="mt-1 text-3xl font-bold">{t("customerOrderEdit.title")}</h1></div><Link href={`/my-orders/${orderId}`}><Button variant="outline">{t("customerOrderEdit.back")}</Button></Link></div>
    <form onSubmit={submit} className="space-y-6">
      <Card><CardHeader><CardTitle>{t("customerOrderCreate.orderData")}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="description">{t("customerOrderCreate.description")}</Label><Input id="description" value={description} onChange={(event) => setDescription(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="notes">{t("customerOrderCreate.notes")}</Label><textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} required rows={4} className="w-full rounded-lg border border-[var(--primary-100)] bg-[var(--white)] px-4 py-3 text-sm outline-none focus:border-[var(--primary-300)]" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>{t("customerOrderCreate.rawMaterials")}</CardTitle></CardHeader><CardContent className="space-y-4">
        {lines.map((line, index) => { const material = materials.find((item) => item._id === line.rawMaterialId); const subtotal = material ? material.unitPrice * line.quantity : 0; return <div key={index} className="grid gap-3 rounded-2xl border border-[var(--primary-100)] p-4 md:grid-cols-[1fr_180px_140px_auto] md:items-end"><div className="space-y-2"><Label>{t("customerOrderCreate.material")}</Label><Select value={line.rawMaterialId || undefined} onValueChange={(value) => updateLine(index, { rawMaterialId: value })}><SelectTrigger><SelectValue placeholder={t("customerOrderCreate.selectMaterial")} /></SelectTrigger><SelectContent>{materials.map((item) => <SelectItem key={item._id} value={item._id} disabled={selectedIds.has(item._id) && item._id !== line.rawMaterialId}>{item.name}{item.color ? ` - ${item.color}` : ""} — {item.unitPrice.toLocaleString()}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>{t("customerOrderCreate.quantity")}</Label><Input type="number" min="1" step="1" inputMode="numeric" value={line.quantity} onKeyDown={(event) => { if (["e", "E", "+", "-", ".", ","].includes(event.key)) event.preventDefault(); }} onChange={(event) => { if (/^\d+$/.test(event.target.value)) updateLine(index, { quantity: Math.max(1, Number(event.target.value)) }); }} /></div><div className="space-y-2"><Label>{t("customerOrderCreate.cost")}</Label><div className="flex h-11 items-center rounded-lg bg-[var(--primary-100)] px-3 font-semibold">{subtotal.toLocaleString()}</div></div><Button type="button" variant="outline" disabled={lines.length === 1} onClick={() => setLines((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}>{t("customerOrderCreate.remove")}</Button></div>; })}
        <Button type="button" variant="outline" onClick={() => setLines((previous) => [...previous, { rawMaterialId: "", quantity: 1 }])}>{t("customerOrderCreate.addAnother")}</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>{t("customerOrderCreate.deliveryAndCost")}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>{t("customerOrderCreate.address")}</Label><Input value={address} onChange={(event) => setAddress(event.target.value)} /></div><div className="space-y-2"><Label>{t("customerOrderCreate.city")}</Label><Input value={city} onChange={(event) => setCity(event.target.value)} /></div></div><div className="space-y-2"><Label>{t("customerOrderCreate.deliveryNotes")}</Label><Input value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} /></div><div className="rounded-2xl bg-[var(--primary-100)] p-5"><p className="text-sm text-[var(--black-200)]">{t("customerOrderCreate.estimatedMaterialCost")}</p><p className="mt-2 text-3xl font-black text-[var(--primary-500)]">{total.toLocaleString()}</p></div></CardContent></Card>
      <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? t("customerOrderEdit.saving") : t("customerOrderEdit.save")}</Button></div>
    </form>
  </div></main>;
}
