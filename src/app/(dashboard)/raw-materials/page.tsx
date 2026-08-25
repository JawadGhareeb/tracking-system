"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/lib/icons";
import { rawMaterialsApiService } from "@/services/api.raw-materials.service";
import { IRawMaterial, IRawMaterialPayload, RawMaterialCategory, RawMaterialUnit } from "@/types";
import { useToast } from "@/components/ui/toast";

const emptyForm: IRawMaterialPayload = {
  name: "",
  category: "FABRIC",
  color: "",
  unit: "PIECE",
  stockQuantity: 0,
  unitPrice: 0,
  minimumStock: 0,
  isActive: true,
};

export default function RawMaterialsPage() {
  const { success, error: errorToast } = useToast();
  const [items, setItems] = useState<IRawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [form, setForm] = useState<IRawMaterialPayload>(emptyForm);
  const [editing, setEditing] = useState<IRawMaterial | null>(null);
  const [deleting, setDeleting] = useState<IRawMaterial | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await rawMaterialsApiService.getAll();
      setItems(response.items ?? []);
    } catch (err) {
      errorToast({ title: "تعذر تحميل المواد الخام", description: err instanceof Error ? err.message : undefined });
    } finally {
      setLoading(false);
    }
  }, [errorToast]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: IRawMaterial) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      color: item.color,
      unit: item.unit,
      stockQuantity: item.stockQuantity,
      unitPrice: item.unitPrice,
      minimumStock: item.minimumStock,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMutating(true);
    try {
      if (editing) await rawMaterialsApiService.update(editing._id, form);
      else await rawMaterialsApiService.create(form);
      success({ title: editing ? "تم تعديل المادة الخام" : "تمت إضافة المادة الخام" });
      setDialogOpen(false);
      await load();
    } catch (err) {
      errorToast({ title: "تعذر حفظ المادة الخام", description: err instanceof Error ? err.message : undefined });
    } finally {
      setMutating(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setMutating(true);
    try {
      await rawMaterialsApiService.remove(deleting._id);
      success({ title: "تم حذف المادة الخام" });
      setDeleting(null);
      await load();
    } catch (err) {
      errorToast({ title: "تعذر حذف المادة الخام", description: err instanceof Error ? err.message : undefined });
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--primary-400)]">إدارة المخزون</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--black-300)]">المواد الخام</h1>
          <p className="mt-2 text-sm text-[var(--black-100)]">إدارة الأقمشة والخيوط والإكسسوارات والأسعار والكميات المتاحة.</p>
        </div>
        <Button onClick={openCreate}><Icons.add className="h-4 w-4" />إضافة مادة خام</Button>
      </div>

      <Card className="p-0"><CardContent className="px-0 pb-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>المادة</TableHead><TableHead>النوع</TableHead><TableHead>اللون</TableHead><TableHead>المخزون</TableHead><TableHead>المحجوز</TableHead><TableHead>المتاح</TableHead><TableHead>السعر</TableHead><TableHead>الحالة</TableHead><TableHead>الإجراءات</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 5 }, (_, i) => <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-8 w-full" /></TableCell></TableRow>) : items.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="py-10 text-center">لا توجد مواد خام بعد.</TableCell></TableRow>
            ) : items.map((item) => (
              <TableRow key={item._id}>
                <TableCell className="font-semibold">{item.name}</TableCell><TableCell>{item.category}</TableCell><TableCell>{item.color || "-"}</TableCell><TableCell>{item.stockQuantity}</TableCell><TableCell>{item.reservedQuantity}</TableCell><TableCell>{item.availableQuantity}</TableCell><TableCell>{item.unitPrice.toLocaleString()}</TableCell><TableCell>{item.isActive ? "فعال" : "معطل"}</TableCell>
                <TableCell><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Icons.edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleting(item)}><Icons.delete className="h-4 w-4 text-[var(--danger)]" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "تعديل مادة خام" : "إضافة مادة خام"}</DialogTitle><DialogDescription>حدد بيانات المادة والسعر والمخزون.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>الاسم</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>اللون</Label><Input value={form.color || ""} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
            <div className="space-y-2"><Label>النوع</Label><Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as RawMaterialCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FABRIC">قماش</SelectItem><SelectItem value="THREAD">خيط</SelectItem><SelectItem value="ACCESSORY">إكسسوار</SelectItem><SelectItem value="OTHER">أخرى</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>الوحدة</Label><Select value={form.unit} onValueChange={(value) => setForm({ ...form, unit: value as RawMaterialUnit })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PIECE">قطعة</SelectItem><SelectItem value="METER">متر</SelectItem><SelectItem value="KILOGRAM">كغ</SelectItem><SelectItem value="ROLL">رول</SelectItem><SelectItem value="UNIT">وحدة</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>المخزون</Label><Input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>سعر الوحدة</Label><Input type="number" min="0" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>حد تنبيه المخزون</Label><Input type="number" min="0" value={form.minimumStock || 0} onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button type="submit" disabled={mutating}>حفظ</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}><DialogContent><DialogHeader><DialogTitle>حذف المادة الخام</DialogTitle><DialogDescription>سيتم حذف المادة إذا لم يكن عليها مخزون محجوز.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>إلغاء</Button><Button variant="destructive" onClick={() => void remove()} disabled={mutating}>حذف</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
