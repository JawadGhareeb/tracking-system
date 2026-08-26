"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

const emptyForm: IRawMaterialPayload = { name: "", category: "FABRIC", color: "", unit: "PIECE", stockQuantity: 0, unitPrice: 0, minimumStock: 0, isActive: true };
const RAW_MATERIAL_NAME_DIGITS_PATTERN = /[0-9٠-٩۰-۹]/;
const RAW_MATERIAL_NAME_DIGITS_GLOBAL_PATTERN = /[0-9٠-٩۰-۹]/g;
const COLOR_SEPARATOR_PATTERN = /[,،]/;

export default function RawMaterialsPage() {
  const { t } = useTranslation(); const { success, error: errorToast } = useToast();
  const [items, setItems] = useState<IRawMaterial[]>([]); const [loading, setLoading] = useState(true); const [mutating, setMutating] = useState(false); const [form, setForm] = useState<IRawMaterialPayload>(emptyForm); const [editing, setEditing] = useState<IRawMaterial | null>(null); const [deleting, setDeleting] = useState<IRawMaterial | null>(null); const [dialogOpen, setDialogOpen] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { const response = await rawMaterialsApiService.getAll(); setItems(response.items ?? []); } catch (err) { errorToast({ title: t("rawMaterialsPage.loadFailed"), description: err instanceof Error ? err.message : undefined }); } finally { setLoading(false); } }, [errorToast, t]);
  useEffect(() => { void load(); }, [load]);
  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item: IRawMaterial) => { setEditing(item); setForm({ name: item.name, category: item.category, color: item.color, unit: item.unit, stockQuantity: item.stockQuantity, unitPrice: item.unitPrice, minimumStock: item.minimumStock, isActive: item.isActive }); setDialogOpen(true); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (RAW_MATERIAL_NAME_DIGITS_PATTERN.test(form.name)) {
      errorToast({ title: t("rawMaterialsPage.validation.nameNoDigits") });
      return;
    }
    if (editing && COLOR_SEPARATOR_PATTERN.test(form.color || "")) {
      errorToast({ title: t("rawMaterialsPage.validation.singleColorOnly") });
      return;
    }

    setMutating(true);
    try {
      if (editing) await rawMaterialsApiService.update(editing._id, form);
      else await rawMaterialsApiService.create(form);
      success({ title: t(editing ? "rawMaterialsPage.updateSuccess" : "rawMaterialsPage.createSuccess") });
      setDialogOpen(false);
      await load();
    } catch (err) {
      errorToast({ title: t("rawMaterialsPage.saveFailed"), description: err instanceof Error ? err.message : undefined });
    } finally {
      setMutating(false);
    }
  };
  const remove = async () => { if (!deleting) return; setMutating(true); try { await rawMaterialsApiService.remove(deleting._id); success({ title: t("rawMaterialsPage.deleteSuccess") }); setDeleting(null); await load(); } catch (err) { errorToast({ title: t("rawMaterialsPage.deleteFailed"), description: err instanceof Error ? err.message : undefined }); } finally { setMutating(false); } };
  return <div className="container mx-auto p-6"><div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold text-[var(--primary-400)]">{t("rawMaterialsPage.badge")}</p><h1 className="mt-2 text-3xl font-bold text-[var(--black-300)]">{t("rawMaterialsPage.title")}</h1><p className="mt-2 text-sm text-[var(--black-100)]">{t("rawMaterialsPage.description")}</p></div><Button onClick={openCreate}><Icons.add className="h-4 w-4" />{t("rawMaterialsPage.add")}</Button></div>
    <Card className="p-0"><CardContent className="px-0 pb-0"><Table><TableHeader><TableRow><TableHead>{t("rawMaterialsPage.table.material")}</TableHead><TableHead>{t("rawMaterialsPage.table.type")}</TableHead><TableHead>{t("rawMaterialsPage.table.color")}</TableHead><TableHead>{t("rawMaterialsPage.table.stock")}</TableHead><TableHead>{t("rawMaterialsPage.table.reserved")}</TableHead><TableHead>{t("rawMaterialsPage.table.available")}</TableHead><TableHead>{t("rawMaterialsPage.table.price")}</TableHead><TableHead>{t("rawMaterialsPage.table.status")}</TableHead><TableHead>{t("rawMaterialsPage.table.actions")}</TableHead></TableRow></TableHeader><TableBody>{loading ? Array.from({ length: 5 }, (_, i) => <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-8 w-full" /></TableCell></TableRow>) : items.length === 0 ? <TableRow><TableCell colSpan={9} className="py-10 text-center">{t("rawMaterialsPage.empty")}</TableCell></TableRow> : items.map((item) => <TableRow key={item._id}><TableCell className="font-semibold">{item.name}</TableCell><TableCell>{t(`rawMaterialsPage.categories.${item.category}`)}</TableCell><TableCell>{item.color || "-"}</TableCell><TableCell>{item.stockQuantity}</TableCell><TableCell>{item.reservedQuantity}</TableCell><TableCell>{item.availableQuantity}</TableCell><TableCell>{item.unitPrice.toLocaleString()}</TableCell><TableCell>{t(item.isActive ? "rawMaterialsPage.active" : "rawMaterialsPage.inactive")}</TableCell><TableCell><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Icons.edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleting(item)}><Icons.delete className="h-4 w-4 text-[var(--danger)]" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{t(editing ? "rawMaterialsPage.dialog.editTitle" : "rawMaterialsPage.dialog.addTitle")}</DialogTitle><DialogDescription>{t("rawMaterialsPage.dialog.description")}</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>{t("rawMaterialsPage.dialog.name")}</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.replace(RAW_MATERIAL_NAME_DIGITS_GLOBAL_PATTERN, "") })} placeholder={t("rawMaterialsPage.dialog.namePlaceholder")} /><p className="text-xs text-[var(--black-100)]">{t("rawMaterialsPage.dialog.nameHint")}</p></div><div className="space-y-2"><Label>{t("rawMaterialsPage.dialog.color")}</Label><Input value={form.color || ""} onChange={(e) => setForm({ ...form, color: editing ? e.target.value.replace(/[,،]/g, "") : e.target.value })} placeholder={t(editing ? "rawMaterialsPage.dialog.singleColorPlaceholder" : "rawMaterialsPage.dialog.colorsPlaceholder")} /><p className="text-xs text-[var(--black-100)]">{t(editing ? "rawMaterialsPage.dialog.singleColorHint" : "rawMaterialsPage.dialog.colorsHint")}</p></div><div className="space-y-2"><Label>{t("rawMaterialsPage.dialog.type")}</Label><Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as RawMaterialCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["FABRIC","THREAD","ACCESSORY"] as RawMaterialCategory[]).map((value) => <SelectItem key={value} value={value}>{t(`rawMaterialsPage.categories.${value}`)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>{t("rawMaterialsPage.dialog.unit")}</Label><Select value={form.unit} onValueChange={(value) => setForm({ ...form, unit: value as RawMaterialUnit })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["PIECE","METER","KILOGRAM","ROLL","UNIT"] as RawMaterialUnit[]).map((value) => <SelectItem key={value} value={value}>{t(`rawMaterialsPage.units.${value}`)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>{t("rawMaterialsPage.dialog.stock")}</Label><Input type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })} /></div><div className="space-y-2"><Label>{t("rawMaterialsPage.dialog.unitPrice")}</Label><Input type="number" min="0" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} /></div><div className="space-y-2"><Label>{t("rawMaterialsPage.dialog.minimumStock")}</Label><Input type="number" min="0" value={form.minimumStock || 0} onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t("rawMaterialsPage.dialog.cancel")}</Button><Button type="submit" disabled={mutating}>{t("rawMaterialsPage.dialog.save")}</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}><DialogContent><DialogHeader><DialogTitle>{t("rawMaterialsPage.dialog.deleteTitle")}</DialogTitle><DialogDescription>{t("rawMaterialsPage.dialog.deleteDescription")}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>{t("rawMaterialsPage.dialog.cancel")}</Button><Button variant="destructive" onClick={() => void remove()} disabled={mutating}>{t("rawMaterialsPage.dialog.delete")}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
