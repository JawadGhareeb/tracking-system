"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { ordersApiService } from "@/services/api.orders.service";
import { productConfigurationsApiService } from "@/services/api.product-configurations.service";
import { rawMaterialsApiService } from "@/services/api.raw-materials.service";
import { ICreateMyOrderPayload, IOrder, IProductConfiguration, IRawMaterial, ProductType } from "@/types";

type Props = { initialOrder?: IOrder; orderId?: string };
const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export function OrderConfigurator({ initialOrder, orderId }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { success, error } = useToast();
  const [configs, setConfigs] = useState<IProductConfiguration[]>([]);
  const [materials, setMaterials] = useState<IRawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productType, setProductType] = useState<ProductType | "">(initialOrder?.productType || "");
  const [materialId, setMaterialId] = useState(initialOrder?.rawMaterials?.[0]?.rawMaterial?._id || "");
  const [designAttributes, setDesignAttributes] = useState<Record<string, string>>(initialOrder?.designAttributes || {});
  const [measurementMode, setMeasurementMode] = useState<"STANDARD" | "CUSTOM">(initialOrder?.measurementMode || "STANDARD");
  const [standardSize, setStandardSize] = useState(initialOrder?.standardSize || "M");
  const [measurements, setMeasurements] = useState<Record<string, number>>(initialOrder?.measurements || {});
  const [customizations, setCustomizations] = useState<Record<string, boolean>>(initialOrder?.customizations || {});
  const [orderQuantity, setOrderQuantity] = useState(Math.max(1, initialOrder?.orderQuantity || 1));
  const [notes, setNotes] = useState(initialOrder?.notes || "");
  const [address, setAddress] = useState(initialOrder?.deliveryLocation?.address || "");
  const [city, setCity] = useState(initialOrder?.deliveryLocation?.city || "");
  const [deliveryNotes, setDeliveryNotes] = useState(initialOrder?.deliveryLocation?.notes || "");

  useEffect(() => {
    let active = true;
    Promise.all([productConfigurationsApiService.getAll(), rawMaterialsApiService.getAvailable()])
      .then(([configResponse, materialResponse]) => {
        if (!active) return;
        setConfigs(configResponse.items || []);
        const available = materialResponse.items || [];
        const current = initialOrder?.rawMaterials?.[0]?.rawMaterial;
        setMaterials(current && !available.some((item) => item._id === current._id) ? [current, ...available] : available);
      })
      .catch((requestError) => error({ title: t("common.error", { defaultValue: "خطأ" }), description: requestError instanceof Error ? requestError.message : undefined }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [error, initialOrder, t]);

  const config = useMemo(() => configs.find((item) => item.type === productType), [configs, productType]);
  const selectedMaterial = useMemo(() => materials.find((item) => item._id === materialId), [materials, materialId]);
  const configUnitPrice = useMemo(() => {
    if (!config) return 0;
    let value = Number(config.basePrice || 0);
    for (const field of config.attributes) value += Number(field.options?.find((option) => option.value === designAttributes[field.key])?.priceModifier || 0);
    for (const customization of config.customizations) if (customizations[customization.key]) value += Number(customization.priceModifier || 0);
    return value;
  }, [config, customizations, designAttributes]);
  const previewTotal = (Number(selectedMaterial?.unitPrice || 0) + configUnitPrice) * orderQuantity;

  const chooseProductType = (value: ProductType) => {
    setProductType(value); setDesignAttributes({}); setMeasurements({}); setCustomizations({}); setMeasurementMode("STANDARD"); setStandardSize("M");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!config || !productType || !materialId) return error({ title: t("common.error", { defaultValue: "يرجى إكمال بيانات الطلب" }) });
    if (config.attributes.some((field) => field.required && !designAttributes[field.key])) return error({ title: t("common.error", { defaultValue: "يرجى اختيار جميع تفاصيل التصميم" }) });
    if (measurementMode === "CUSTOM" && config.measurements.some((field) => field.required && !(measurements[field.key] > 0))) return error({ title: t("common.error", { defaultValue: "يرجى إدخال جميع القياسات" }) });
    const payload: ICreateMyOrderPayload = {
      productType,
      designAttributes,
      measurementMode,
      standardSize: measurementMode === "STANDARD" ? standardSize : null,
      measurements: measurementMode === "CUSTOM" ? measurements : {},
      customizations,
      orderQuantity,
      materialId,
      notes: notes.trim() || null,
      deliveryLocation: { address: address.trim(), city: city.trim(), notes: deliveryNotes.trim() },
    };
    setSaving(true);
    try {
      const response = orderId ? await ordersApiService.updateMyOrder(orderId, payload) : await ordersApiService.createMyOrder(payload);
      success({ title: t(orderId ? "customerOrderEdit.updateSuccess" : "customerOrderNew.createSuccess", { defaultValue: orderId ? "تم تعديل الطلب" : "تم إنشاء الطلب" }) });
      router.push(`/my-orders/${response._id}`);
    } catch (requestError) {
      error({ title: t("common.error", { defaultValue: "تعذر حفظ الطلب" }), description: requestError instanceof Error ? requestError.message : undefined });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="mx-auto max-w-5xl p-8 text-center">{t("common.loading", { defaultValue: "جاري التحميل..." })}</div>;
  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div><p className="text-sm font-semibold text-[var(--primary-400)]">{t("customerOrderConfigurator.badge", { defaultValue: "تخصيص المنتج" })}</p><h1 className="mt-2 text-3xl font-bold">{t(orderId ? "customerOrderEdit.title" : "customerOrderNew.title", { defaultValue: orderId ? "تعديل الطلب" : "طلب جديد" })}</h1></div>
      <Section title={t("customerOrderConfigurator.product", { defaultValue: "1. نوع القطعة" })}><Select value={productType || undefined} onValueChange={(value) => chooseProductType(value as ProductType)}><SelectTrigger><SelectValue placeholder={t("customerOrderConfigurator.chooseProduct", { defaultValue: "اختر نوع القطعة" })} /></SelectTrigger><SelectContent>{configs.map((item) => <SelectItem key={item.type} value={item.type}>{i18n.language.startsWith("ar") ? item.label.ar : item.label.en}</SelectItem>)}</SelectContent></Select></Section>
      {config ? <>
        <Section title={t("customerOrderConfigurator.material", { defaultValue: "2. القماش واللون" })}><Select value={materialId || undefined} onValueChange={setMaterialId}><SelectTrigger><SelectValue placeholder={t("customerOrderConfigurator.chooseMaterial", { defaultValue: "اختر القماش" })} /></SelectTrigger><SelectContent>{materials.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}{item.color ? ` - ${item.color}` : ""} ({item.availableQuantity})</SelectItem>)}</SelectContent></Select></Section>
        <Section title={t("customerOrderConfigurator.design", { defaultValue: "3. التصميم" })}><div className="grid gap-4 md:grid-cols-2">{config.attributes.map((field) => <div className="space-y-2" key={field.key}><Label>{typeof field.label === "string" ? field.label : (i18n.language.startsWith("ar") ? field.label.ar : field.label.en)}</Label><Select value={designAttributes[field.key] || undefined} onValueChange={(value) => setDesignAttributes((previous) => ({ ...previous, [field.key]: value }))}><SelectTrigger><SelectValue placeholder="-" /></SelectTrigger><SelectContent>{field.options?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>)}</div></Section>
        <Section title={t("customerOrderConfigurator.measurements", { defaultValue: "4. القياسات" })}><div className="flex gap-3"><Button type="button" variant={measurementMode === "STANDARD" ? "default" : "outline"} onClick={() => setMeasurementMode("STANDARD")}>{t("customerOrderConfigurator.standard", { defaultValue: "مقاس جاهز" })}</Button><Button type="button" variant={measurementMode === "CUSTOM" ? "default" : "outline"} onClick={() => setMeasurementMode("CUSTOM")}>{t("customerOrderConfigurator.custom", { defaultValue: "قياسات خاصة" })}</Button></div>{measurementMode === "STANDARD" ? <div className="mt-4"><Select value={standardSize} onValueChange={setStandardSize}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STANDARD_SIZES.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}</SelectContent></Select></div> : <div className="mt-4 grid gap-4 md:grid-cols-2">{config.measurements.map((field) => <div key={field.key} className="space-y-2"><Label>{field.label}</Label><Input type="number" min="0.1" step="0.1" value={measurements[field.key] || ""} onChange={(event) => setMeasurements((previous) => ({ ...previous, [field.key]: Number(event.target.value) }))} required={field.required} /></div>)}</div>}</Section>
        <Section title={t("customerOrderConfigurator.customizations", { defaultValue: "5. التخصيصات" })}><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">{config.customizations.map((field) => <label key={field.key} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3"><input type="checkbox" checked={Boolean(customizations[field.key])} onChange={(event) => setCustomizations((previous) => ({ ...previous, [field.key]: event.target.checked }))} /><span>{field.label}</span></label>)}</div></Section>
        <Section title={t("customerOrderConfigurator.quantity", { defaultValue: "6. الكمية" })}><Input type="number" min="1" step="1" value={orderQuantity} onChange={(event) => setOrderQuantity(Math.max(1, Math.trunc(Number(event.target.value) || 1)))} /></Section>
        <Section title={t("customerOrderConfigurator.delivery", { defaultValue: "7. التسليم والملاحظات" })}><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>{t("customerOrderConfigurator.address", { defaultValue: "العنوان" })}</Label><Input value={address} onChange={(event) => setAddress(event.target.value)} /></div><div className="space-y-2"><Label>{t("customerOrderConfigurator.city", { defaultValue: "المدينة" })}</Label><Input value={city} onChange={(event) => setCity(event.target.value)} /></div></div><div className="mt-4 space-y-2"><Label>{t("customerOrderConfigurator.notesOptional", { defaultValue: "ملاحظات (اختياري)" })}</Label><textarea className="min-h-28 w-full rounded-md border bg-transparent p-3" value={notes} onChange={(event) => setNotes(event.target.value)} /></div><div className="mt-4 space-y-2"><Label>{t("customerOrderConfigurator.deliveryNotes", { defaultValue: "ملاحظات التسليم" })}</Label><Input value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} /></div></Section>
        <Card><CardHeader><CardTitle>{t("customerOrderConfigurator.price", { defaultValue: "8. مراجعة السعر" })}</CardTitle></CardHeader><CardContent className="space-y-2"><div className="flex justify-between"><span>{t("customerOrderConfigurator.materialPrice", { defaultValue: "سعر المادة للقطعة" })}</span><strong>{Number(selectedMaterial?.unitPrice || 0).toLocaleString()}</strong></div><div className="flex justify-between"><span>{t("customerOrderConfigurator.optionsPrice", { defaultValue: "إضافات التصميم للقطعة" })}</span><strong>{configUnitPrice.toLocaleString()}</strong></div><div className="flex justify-between text-lg"><span>{t("customerOrderConfigurator.previewTotal", { defaultValue: "السعر التقديري" })}</span><strong>{previewTotal.toLocaleString()}</strong></div><p className="text-xs text-[var(--black-100)]">{t("customerOrderConfigurator.priceHint", { defaultValue: "السعر النهائي يعاد احتسابه في الخادم ويمكن للأدمن إضافة كلفة إضافية." })}</p></CardContent></Card>
        <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button></div>
      </> : null}
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>;
}
