"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { rawMaterialsApiService } from "@/services/api.raw-materials.service";
import { ordersApiService } from "@/services/api.orders.service";
import { IRawMaterial } from "@/types";

interface MaterialLine {
  rawMaterialId: string;
  quantity: number;
}

export default function NewCustomerOrderPage() {
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
      .catch((err) => error({ title: "تعذر تحميل المواد الخام", description: err instanceof Error ? err.message : undefined }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [error]);

  const selectedIds = useMemo(() => new Set(lines.map((line) => line.rawMaterialId).filter(Boolean)), [lines]);
  const total = useMemo(() => lines.reduce((sum, line) => {
    const material = materials.find((item) => item._id === line.rawMaterialId);
    return sum + (material ? material.unitPrice * Math.max(0, line.quantity) : 0);
  }, 0), [lines, materials]);

  const updateLine = (index: number, patch: Partial<MaterialLine>) => {
    setLines((previous) => previous.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (description.trim().length < 3 || notes.trim().length < 3) {
      error({ title: "أكمل بيانات الطلب", description: "الوصف والملاحظات حقول مطلوبة." });
      return;
    }
    if (lines.some((line) => !line.rawMaterialId || line.quantity <= 0)) {
      error({ title: "راجع المواد الخام", description: "اختر مادة وحدد كمية صحيحة لكل سطر." });
      return;
    }
    if (selectedIds.size !== lines.length) {
      error({ title: "مادة مكررة", description: "لا يمكن إضافة نفس المادة أكثر من مرة. عدّل الكمية في السطر نفسه." });
      return;
    }

    setSaving(true);
    try {
      await ordersApiService.createMyOrder({
        description: description.trim(),
        notes: notes.trim(),
        rawMaterials: lines,
        deliveryLocation: address.trim() || city.trim() || deliveryNotes.trim() ? {
          address: address.trim(),
          city: city.trim() || undefined,
          notes: deliveryNotes.trim() || undefined,
        } : undefined,
      });
      success({ title: "تم إرسال الطلب", description: "الطلب الآن قيد الانتظار لمراجعة الإدارة." });
      router.push("/my-orders");
    } catch (err) {
      error({ title: "تعذر إرسال الطلب", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--white-100)] p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--primary-400)]">طلبات الزبون</p>
            <h1 className="mt-1 text-3xl font-bold text-[var(--black-300)]">إضافة طلب جديد</h1>
          </div>
          <Link href="/my-orders"><Button variant="outline">العودة إلى طلباتي</Button></Link>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Card><CardHeader><CardTitle>بيانات الطلب</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="description">وصف الطلب *</Label><Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: تفصيل دفعة قمصان" required /></div>
            <div className="space-y-2"><Label htmlFor="notes">الملاحظات *</Label><textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} required rows={4} className="w-full rounded-lg border border-[var(--primary-100)] bg-[var(--white)] px-4 py-3 text-sm outline-none focus:border-[var(--primary-300)]" placeholder="مثال: 50 قطعة مخمل خمري و50 قطعة مخمل أسود بنفس التصميم" /></div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>المواد الخام</CardTitle></CardHeader><CardContent className="space-y-4">
            {loading ? <p className="text-sm text-[var(--black-100)]">جاري تحميل المواد...</p> : materials.length === 0 ? <p className="text-sm text-[var(--danger)]">لا توجد مواد خام متاحة حاليًا.</p> : null}
            {lines.map((line, index) => {
              const material = materials.find((item) => item._id === line.rawMaterialId);
              const subtotal = material ? material.unitPrice * Math.max(0, line.quantity) : 0;
              return <div key={index} className="grid gap-3 rounded-2xl border border-[var(--primary-100)] p-4 md:grid-cols-[1fr_180px_140px_auto] md:items-end">
                <div className="space-y-2"><Label>المادة</Label><Select value={line.rawMaterialId || undefined} onValueChange={(value) => updateLine(index, { rawMaterialId: value })}><SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger><SelectContent>{materials.map((item) => <SelectItem key={item._id} value={item._id} disabled={selectedIds.has(item._id) && item._id !== line.rawMaterialId}>{item.name}{item.color ? ` - ${item.color}` : ""} — {item.unitPrice.toLocaleString()}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>الكمية</Label><Input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>التكلفة</Label><div className="flex h-11 items-center rounded-lg bg-[var(--primary-100)] px-3 font-semibold">{subtotal.toLocaleString()}</div></div>
                <Button type="button" variant="outline" disabled={lines.length === 1} onClick={() => setLines((previous) => previous.filter((_, i) => i !== index))}>إزالة</Button>
              </div>;
            })}
            <Button type="button" variant="outline" onClick={() => setLines((previous) => [...previous, { rawMaterialId: "", quantity: 1 }])}>+ إضافة مادة أخرى</Button>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>التسليم والتكلفة</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>العنوان</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div><div className="space-y-2"><Label>المدينة</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div></div>
            <div className="space-y-2"><Label>ملاحظات التسليم</Label><Input value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} /></div>
            <div className="rounded-2xl bg-[var(--primary-100)] p-5"><p className="text-sm text-[var(--black-200)]">التكلفة التقديرية للمواد</p><p className="mt-2 text-3xl font-black text-[var(--primary-500)]">{total.toLocaleString()}</p><p className="mt-2 text-xs text-[var(--black-100)]">سيعيد الخادم حساب السعر من الأسعار الحالية عند إرسال الطلب.</p></div>
          </CardContent></Card>

          <div className="flex justify-end"><Button type="submit" disabled={saving || loading || materials.length === 0}>{saving ? "جاري الإرسال..." : "إرسال الطلب"}</Button></div>
        </form>
      </div>
    </main>
  );
}
