"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/lib/icons";
import { expensesApiService } from "@/services/api.expenses.service";
import { ExpenseCategory, IExpense, IExpensePayload } from "@/types";
import { useToast } from "@/components/ui/toast";

const categoryLabels: Record<ExpenseCategory, string> = {
  RAW_MATERIAL: "مواد خام", SALARY: "رواتب", ELECTRICITY: "كهرباء", TRANSPORT: "نقل", MAINTENANCE: "صيانة", RENT: "إيجار", OTHER: "أخرى",
};
const emptyForm = (): IExpensePayload => ({ title: "", category: "OTHER", amount: 0, date: dayjs().format("YYYY-MM-DD"), description: "" });

export default function ExpensesPage() {
  const { success, error } = useToast();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [items, setItems] = useState<IExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [form, setForm] = useState<IExpensePayload>(emptyForm());
  const [editing, setEditing] = useState<IExpense | null>(null);
  const [deleting, setDeleting] = useState<IExpense | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await expensesApiService.getAll(month); setItems(response.items ?? []); }
    catch (err) { error({ title: "تعذر تحميل المصاريف", description: err instanceof Error ? err.message : undefined }); }
    finally { setLoading(false); }
  }, [error, month]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (item: IExpense) => { setEditing(item); setForm({ title: item.title, category: item.category, amount: item.amount, date: dayjs(item.date).format("YYYY-MM-DD"), description: item.description }); setDialogOpen(true); };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMutating(true);
    try {
      const payload = { ...form, date: new Date(form.date).toISOString() };
      if (editing) await expensesApiService.update(editing._id, payload); else await expensesApiService.create(payload);
      success({ title: editing ? "تم تعديل المصروف" : "تمت إضافة المصروف" }); setDialogOpen(false); await load();
    } catch (err) { error({ title: "تعذر حفظ المصروف", description: err instanceof Error ? err.message : undefined }); }
    finally { setMutating(false); }
  };

  const remove = async () => {
    if (!deleting) return; setMutating(true);
    try { await expensesApiService.remove(deleting._id); success({ title: "تم حذف المصروف" }); setDeleting(null); await load(); }
    catch (err) { error({ title: "تعذر حذف المصروف", description: err instanceof Error ? err.message : undefined }); }
    finally { setMutating(false); }
  };

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return <div className="container mx-auto p-6">
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-[var(--primary-400)]">الإدارة المالية</p><h1 className="mt-2 text-3xl font-bold">المصاريف</h1><p className="mt-2 text-sm text-[var(--black-100)]">سجل مصاريف المعمل حسب الشهر والتصنيف.</p></div><div className="flex flex-wrap items-end gap-3"><div className="space-y-2"><Label>الشهر</Label><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div><Button onClick={openCreate}><Icons.add className="h-4 w-4" />إضافة مصروف</Button></div></div>
    <Card className="mb-5"><CardContent className="flex items-center justify-between py-5"><span className="font-semibold">إجمالي مصاريف الشهر</span><strong className="text-2xl text-[var(--primary-500)]">{total.toLocaleString()}</strong></CardContent></Card>
    <Card className="p-0"><CardContent className="px-0 pb-0"><Table><TableHeader><TableRow><TableHead>العنوان</TableHead><TableHead>التصنيف</TableHead><TableHead>المبلغ</TableHead><TableHead>التاريخ</TableHead><TableHead>الوصف</TableHead><TableHead>الإجراءات</TableHead></TableRow></TableHeader><TableBody>
      {loading ? Array.from({ length: 5 }, (_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>) : items.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center">لا توجد مصاريف في هذا الشهر.</TableCell></TableRow> : items.map((item) => <TableRow key={item._id}><TableCell className="font-semibold">{item.title}</TableCell><TableCell>{categoryLabels[item.category]}</TableCell><TableCell>{item.amount.toLocaleString()}</TableCell><TableCell>{dayjs(item.date).format("YYYY-MM-DD")}</TableCell><TableCell>{item.description || "-"}</TableCell><TableCell><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Icons.edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleting(item)}><Icons.delete className="h-4 w-4 text-[var(--danger)]" /></Button></div></TableCell></TableRow>)}
    </TableBody></Table></CardContent></Card>

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "تعديل مصروف" : "إضافة مصروف"}</DialogTitle><DialogDescription>أدخل قيمة المصروف وتاريخه وتصنيفه.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label>العنوان</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>التصنيف</Label><Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as ExpenseCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>المبلغ</Label><Input type="number" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div><div className="space-y-2"><Label>التاريخ</Label><Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div></div><div className="space-y-2"><Label>الوصف</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button type="submit" disabled={mutating}>حفظ</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}><DialogContent><DialogHeader><DialogTitle>حذف المصروف</DialogTitle><DialogDescription>هل تريد حذف هذا المصروف؟</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>إلغاء</Button><Button variant="destructive" onClick={() => void remove()} disabled={mutating}>حذف</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
