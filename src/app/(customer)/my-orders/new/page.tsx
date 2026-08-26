"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { rawMaterialsApiService } from "@/services/api.raw-materials.service";
import { ordersApiService } from "@/services/api.orders.service";
import { IRawMaterial } from "@/types";

interface MaterialLine { rawMaterialId: string; quantity: number }

export default function NewCustomerOrderPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { success, error } = useToast();
  const [materials, setMaterials] = useState<IRawMaterial[]>([]);
  const [lines, setLines] = useState<MaterialLine[]>([{ rawMaterialId: "", quantity: 1 }]);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    rawMaterialsApiService.getAvailable()
      .then((response) => { if (active) setMaterials(response.items ?? []); })
      .catch((err) => error({ title: t("customerOrderCreate.loadMaterialsFailed"), description: err instanceof Error ? err.message : undefined }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [error, t]);

  const selectedIds = useMemo(() => new Set(lines.map((line) => line.rawMaterialId).filter(Boolean)), [lines]);
  const total = useMemo(() => lines.reduce((sum, line) => {
    const material = materials.find((item) => item._id === line.rawMaterialId);
    return sum + (material ? material.unitPrice * Math.max(0, line.quantity) : 0);
  }, 0), [lines, materials]);

  const updateLine = (index: number, patch: Partial<MaterialLine>) => setLines((previous) => previous.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (description.trim().length < 3 || notes.trim().length < 3) {
      error({ title: t("customerOrderCreate.incompleteTitle"), description: t("customerOrderCreate.incompleteDescription") }); return;
    }
    if (lines.some((line) => !line.rawMaterialId || !Number.isInteger(line.quantity) || line.quantity < 1)) {
      error({ title: t("customerOrderCreate.reviewMaterialsTitle"), description: t("customerOrderCreate.reviewMaterialsDescription") }); return;
    }
    if (selectedIds.size !== lines.length) {
      error({ title: t("customerOrderCreate.duplicateTitle"), description: t("customerOrderCreate.duplicateDescription") }); return;
    }
    setSaving(true);
    try {
      await ordersApiService.createMyOrder({
        description: description.trim(), notes: notes.trim(), rawMaterials: lines,
        deliveryLocation: address.trim() || city.trim() || deliveryNotes.trim() ? { address: address.trim(), city: city.trim() || undefined, notes: deliveryNotes.trim() || undefined } : undefined,
      });
      success({ title: t("customerOrderCreate.successTitle"), description: t("customerOrderCreate.successDescription") });
      router.push("/my-orders");
    } catch (err) {
      error({ title: t("customerOrderCreate.submitFailed"), description: err instanceof Error ? err.message : undefined });
    } finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-[var(--white-100)] p-4 md:p-8"><div className="mx-auto max-w-5xl">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--primary-400)]">{t("customerOrderCreate.badge")}</p><h1 className="mt-1 text-3xl font-bold text-[var(--black-300)]">{t("customerOrderCreate.title")}</h1></div><Link href="/my-orders"><Button variant="outline">{t("customerOrderCreate.back")}</Button></Link></div>
    <form onSubmit={submit} className="space-y-6">
      <Card><CardHeader><CardTitle>{t("customerOrderCreate.orderData")}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="description">{t("customerOrderCreate.description")}</Label><Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("customerOrderCreate.descriptionPlaceholder")} required /></div><div className="space-y-2"><Label htmlFor="notes">{t("customerOrderCreate.notes")}</Label><textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} required rows={4} className="w-full rounded-lg border border-[var(--primary-100)] bg-[var(--white)] px-4 py-3 text-sm outline-none focus:border-[var(--primary-300)]" placeholder={t("customerOrderCreate.notesPlaceholder")} /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>{t("customerOrderCreate.rawMaterials")}</CardTitle></CardHeader><CardContent className="space-y-4">
        {loading ? <p className="text-sm text-[var(--black-100)]">{t("customerOrderCreate.loadingMaterials")}</p> : materials.length === 0 ? <p className="text-sm text-[var(--danger)]">{t("customerOrderCreate.noMaterials")}</p> : null}
        {lines.map((line, index) => { const material = materials.find((item) => item._id === line.rawMaterialId); const subtotal = material ? material.unitPrice * Math.max(0, line.quantity) : 0; return <div key={index} className="grid gap-3 rounded-2xl border border-[var(--primary-100)] p-4 md:grid-cols-[1fr_180px_140px_auto] md:items-end"><div className="space-y-2"><Label>{t("customerOrderCreate.material")}</Label><Select value={line.rawMaterialId || undefined} onValueChange={(value) => updateLine(index, { rawMaterialId: value })}><SelectTrigger><SelectValue placeholder={t("customerOrderCreate.selectMaterial")} /></SelectTrigger><SelectContent>{materials.map((item) => <SelectItem key={item._id} value={item._id} disabled={selectedIds.has(item._id) && item._id !== line.rawMaterialId}>{item.name}{item.color ? ` - ${item.color}` : ""} — {item.unitPrice.toLocaleString()}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>{t("customerOrderCreate.quantity")}</Label><Input type="number" min="1" step="1" inputMode="numeric" value={line.quantity} onKeyDown={(event) => { if (["e", "E", "+", "-", ".", ","].includes(event.key)) event.preventDefault(); }} onChange={(e) => { if (/^\d+$/.test(e.target.value)) updateLine(index, { quantity: Math.max(1, Number(e.target.value)) }); }} /></div><div className="space-y-2"><Label>{t("customerOrderCreate.cost")}</Label><div className="flex h-11 items-center rounded-lg bg-[var(--primary-100)] px-3 font-semibold">{subtotal.toLocaleString()}</div></div><Button type="button" variant="outline" disabled={lines.length === 1} onClick={() => setLines((previous) => previous.filter((_, i) => i !== index))}>{t("customerOrderCreate.remove")}</Button></div>; })}
        <Button type="button" variant="outline" onClick={() => setLines((previous) => [...previous, { rawMaterialId: "", quantity: 1 }])}>{t("customerOrderCreate.addAnother")}</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>{t("customerOrderCreate.deliveryAndCost")}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>{t("customerOrderCreate.address")}</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div><div className="space-y-2"><Label>{t("customerOrderCreate.city")}</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div></div><div className="space-y-2"><Label>{t("customerOrderCreate.deliveryNotes")}</Label><Input value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} /></div><div className="rounded-2xl bg-[var(--primary-100)] p-5"><p className="text-sm text-[var(--black-200)]">{t("customerOrderCreate.estimatedMaterialCost")}</p><p className="mt-2 text-3xl font-black text-[var(--primary-500)]">{total.toLocaleString()}</p><p className="mt-2 text-xs text-[var(--black-100)]">{t("customerOrderCreate.serverRecalculates")}</p></div></CardContent></Card>
      <div className="flex justify-end"><Button type="submit" disabled={saving || loading || materials.length === 0}>{saving ? t("customerOrderCreate.sending") : t("customerOrderCreate.submit")}</Button></div>
    </form>
  </div></main>;
}
