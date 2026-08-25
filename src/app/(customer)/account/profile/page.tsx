"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { authApiService } from "@/services/api.auth.service";
import { usersApiService } from "@/services/api.users.service";
import { normalizeUser } from "@/lib/normalize-api";
import { IUser } from "@/types";

export default function CustomerProfilePage() {
  const { t } = useTranslation(); const { success, error } = useToast();
  const [user, setUser] = useState<IUser | null>(null); const [editing, setEditing] = useState(false); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState(""); const [email, setEmail] = useState(""); const [username, setUsername] = useState(""); const [password, setPassword] = useState("");
  const fill = (next: IUser) => { setUser(next); setFirstName(next.fullName.firstName); setLastName(next.fullName.lastName); setEmail(next.email); setUsername(next.username); setPassword(""); };
  useEffect(() => { let active = true; authApiService.me().then((response) => { if (active) fill(normalizeUser(response)); }).catch((err) => error({ title: t("customerProfile.loadingFailed"), description: err instanceof Error ? err.message : undefined })).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [error, t]);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!user) return; setSaving(true); try { const response = await usersApiService.update(user._id, { fullName: { firstName: firstName.trim(), lastName: lastName.trim() }, email: email.trim(), username: username.trim(), ...(password ? { password } : {}) }); fill(normalizeUser(response, user._id)); setEditing(false); success({ title: t("customerProfile.updateSuccess") }); } catch (err) { error({ title: t("customerProfile.updateFailed"), description: err instanceof Error ? err.message : undefined }); } finally { setSaving(false); } };
  if (loading) return <main className="min-h-screen bg-[var(--white-100)] p-8"><div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-10 w-56" /><Skeleton className="h-80 w-full" /></div></main>;
  if (!user) return <main className="min-h-screen p-8">{t("customerProfile.unavailable")}</main>;
  return <main className="min-h-screen bg-[var(--white-100)] p-4 md:p-8"><div className="mx-auto max-w-3xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--primary-400)]">{t("customerProfile.badge")}</p><h1 className="mt-1 text-3xl font-bold">{t("customerProfile.title")}</h1></div><div className="flex gap-2"><Link href="/my-orders"><Button variant="outline">{t("customerProfile.myOrders")}</Button></Link><Link href="/my-orders/new"><Button>{t("customerProfile.addOrder")}</Button></Link></div></div><Card><CardHeader><CardTitle>{t("customerProfile.personalInfo")}</CardTitle></CardHeader><CardContent>{!editing ? <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Info label={t("customerProfile.firstName")} value={user.fullName.firstName} /><Info label={t("customerProfile.lastName")} value={user.fullName.lastName} /><Info label={t("customerProfile.email")} value={user.email} /><Info label={t("customerProfile.username")} value={user.username} /></div><Button onClick={() => setEditing(true)}>{t("customerProfile.edit")}</Button></div> : <form onSubmit={submit} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Field label={t("customerProfile.firstName")} value={firstName} setValue={setFirstName} /><Field label={t("customerProfile.lastName")} value={lastName} setValue={setLastName} /><Field label={t("customerProfile.email")} value={email} setValue={setEmail} type="email" /><Field label={t("customerProfile.username")} value={username} setValue={setUsername} /><Field label={t("customerProfile.newPasswordOptional")} value={password} setValue={setPassword} type="password" /></div><div className="flex gap-2"><Button type="submit" disabled={saving}>{saving ? t("common.saving") : t("customerProfile.save")}</Button><Button type="button" variant="outline" onClick={() => { fill(user); setEditing(false); }}>{t("customerProfile.cancel")}</Button></div></form>}</CardContent></Card></div></main>;
}
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[var(--primary-100)]/60 p-4"><p className="text-xs text-[var(--black-100)]">{label}</p><p className="mt-1 font-semibold">{value || "-"}</p></div>; }
function Field({ label, value, setValue, type = "text" }: { label: string; value: string; setValue: (value: string) => void; type?: string }) { return <div className="space-y-2"><Label>{label}</Label><Input type={type} value={value} onChange={(e) => setValue(e.target.value)} required={type !== "password"} /></div>; }
