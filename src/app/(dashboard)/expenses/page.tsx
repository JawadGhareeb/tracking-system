"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/lib/icons";
import { expensesApiService } from "@/services/api.expenses.service";
import { ExpenseCategory, IExpense, IExpensePayload, IExpenseSummary, IPagination } from "@/types";
import { useToast } from "@/components/ui/toast";

const CATEGORIES: ExpenseCategory[] = [
  "RAW_MATERIAL",
  "SALARY",
  "ELECTRICITY",
  "TRANSPORT",
  "MAINTENANCE",
  "RENT",
  "OTHER",
];
const PER_PAGE = 10;
const emptyPagination: IPagination = { page: 1, perPage: PER_PAGE, count: 0, documentCount: 0 };
const emptyCategoryTotals = (): Record<ExpenseCategory, number> => ({
  RAW_MATERIAL: 0,
  SALARY: 0,
  ELECTRICITY: 0,
  TRANSPORT: 0,
  MAINTENANCE: 0,
  RENT: 0,
  OTHER: 0,
});
const emptySummary = (): IExpenseSummary => ({ monthTotal: 0, filteredTotal: 0, categoryTotals: emptyCategoryTotals() });

function dateForMonth(month: string) {
  const currentMonth = dayjs().format("YYYY-MM");
  return month === currentMonth ? dayjs().format("YYYY-MM-DD") : `${month}-01`;
}

function emptyForm(month: string): IExpensePayload {
  return { title: "", category: "OTHER", amount: 0, date: dateForMonth(month), description: "" };
}

export default function ExpensesPage() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [category, setCategory] = useState<ExpenseCategory | "all">("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<IExpense[]>([]);
  const [pagination, setPagination] = useState<IPagination>(emptyPagination);
  const [summary, setSummary] = useState<IExpenseSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [form, setForm] = useState<IExpensePayload>(() => emptyForm(dayjs().format("YYYY-MM")));
  const [editing, setEditing] = useState<IExpense | null>(null);
  const [deleting, setDeleting] = useState<IExpense | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await expensesApiService.getAll({
        page,
        perPage: PER_PAGE,
        month,
        category: category === "all" ? undefined : category,
        search: search || undefined,
      });
      setItems(response.items ?? []);
      setPagination(response.pagination ?? emptyPagination);
      setSummary(response.summary ?? emptySummary());
    } catch (requestError) {
      error({
        title: t("expensesPage.loadFailed"),
        description: requestError instanceof Error ? requestError.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [category, error, month, page, search, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(pagination.documentCount / pagination.perPage)),
    [pagination.documentCount, pagination.perPage]
  );
  const hasActiveFilters = category !== "all" || Boolean(search);
  const operatingExpenses = Math.max(
    0,
    summary.monthTotal - summary.categoryTotals.RAW_MATERIAL - summary.categoryTotals.SALARY
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(month));
    setDialogOpen(true);
  };

  const openEdit = (item: IExpense) => {
    setEditing(item);
    setForm({
      title: item.title,
      category: item.category,
      amount: item.amount,
      date: dayjs(item.date).format("YYYY-MM-DD"),
      description: item.description,
    });
    setDialogOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.title.trim().length < 2) {
      error({ title: t("expensesPage.validation.title") });
      return;
    }
    if (!Number.isFinite(form.amount) || form.amount <= 0) {
      error({ title: t("expensesPage.validation.amount") });
      return;
    }

    setMutating(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() ?? "",
        date: new Date(`${form.date}T00:00:00.000Z`).toISOString(),
      };
      if (editing) {
        await expensesApiService.update(editing._id, payload);
        success({ title: t("expensesPage.updateSuccess") });
      } else {
        await expensesApiService.create(payload);
        success({ title: t("expensesPage.createSuccess") });
      }
      setDialogOpen(false);
      setEditing(null);
      setPage(1);
      await load();
    } catch (requestError) {
      error({
        title: t("expensesPage.saveFailed"),
        description: requestError instanceof Error ? requestError.message : undefined,
      });
    } finally {
      setMutating(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setMutating(true);
    try {
      await expensesApiService.remove(deleting._id);
      success({ title: t("expensesPage.deleteSuccess") });
      setDeleting(null);
      if (items.length === 1 && page > 1) setPage((value) => value - 1);
      else await load();
    } catch (requestError) {
      error({
        title: t("expensesPage.deleteFailed"),
        description: requestError instanceof Error ? requestError.message : undefined,
      });
    } finally {
      setMutating(false);
    }
  };

  const applySearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setCategory("all");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const summaryCards = [
    { label: t("expensesPage.summary.total"), value: summary.monthTotal, icon: Icons.dollar },
    { label: t("expensesPage.summary.rawMaterials"), value: summary.categoryTotals.RAW_MATERIAL, icon: Icons.fileText },
    { label: t("expensesPage.summary.salaries"), value: summary.categoryTotals.SALARY, icon: Icons.users },
    { label: t("expensesPage.summary.operating"), value: operatingExpenses, icon: Icons.briefcase },
  ];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--primary-400)]">{t("expensesPage.badge")}</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--black-300)]">{t("expensesPage.title")}</h1>
          <p className="mt-2 text-sm text-[var(--black-100)]">{t("expensesPage.description")}</p>
        </div>
        <Button onClick={openCreate}>
          <Icons.add className="h-4 w-4" />
          {t("expensesPage.add")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between py-5">
              <div>
                <p className="text-sm font-semibold text-[var(--black-200)]">{label}</p>
                {loading ? <Skeleton className="mt-3 h-8 w-28" /> : <p className="mt-2 text-2xl font-black">{value.toLocaleString()}</p>}
              </div>
              <span className="rounded-xl bg-[var(--primary-100)] p-3 text-[var(--primary-500)]">
                <Icon className="h-5 w-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-transparent shadow-none">
        <CardContent className="space-y-4 pb-6">
          <div className="grid gap-4 lg:grid-cols-[220px_220px_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="expense-month">{t("expensesPage.month")}</Label>
              <Input
                id="expense-month"
                type="month"
                value={month}
                onChange={(event) => {
                  setMonth(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category">{t("expensesPage.categoryFilter")}</Label>
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value as ExpenseCategory | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger id="expense-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("expensesPage.allCategories")}</SelectItem>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>{t(`expensesPage.categories.${item}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <form onSubmit={applySearch} className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="expense-search">{t("expensesPage.search")}</Label>
                <Input
                  id="expense-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t("expensesPage.searchPlaceholder")}
                />
              </div>
              <Button type="submit" variant="outline" className="self-end">
                <Icons.search className="h-4 w-4" />
                {t("expensesPage.searchButton")}
              </Button>
            </form>
            <Button variant="outline" onClick={clearFilters} disabled={!hasActiveFilters}>
              <Icons.FilterX className="h-4 w-4" />
              {t("expensesPage.clearFilters")}
            </Button>
          </div>
          {hasActiveFilters ? (
            <p className="text-sm text-[var(--black-200)]">
              {t("expensesPage.filteredTotal")}: <strong>{summary.filteredTotal.toLocaleString()}</strong>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("expensesPage.table.title")}</TableHead>
                <TableHead>{t("expensesPage.table.category")}</TableHead>
                <TableHead>{t("expensesPage.table.amount")}</TableHead>
                <TableHead>{t("expensesPage.table.date")}</TableHead>
                <TableHead>{t("expensesPage.table.description")}</TableHead>
                <TableHead className="text-center">{t("expensesPage.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={`expense-skeleton-${index}`}>
                    <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center">{t("expensesPage.empty")}</TableCell></TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-semibold">{item.title}</TableCell>
                    <TableCell>{t(`expensesPage.categories.${item.category}`)}</TableCell>
                    <TableCell>{item.amount.toLocaleString()}</TableCell>
                    <TableCell>{dayjs(item.date).format("YYYY-MM-DD")}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label={t("expensesPage.editAria")}>
                          <Icons.edit className="h-4 w-4 text-[var(--primary-400)]" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(item)} aria-label={t("expensesPage.deleteAria")}>
                          <Icons.delete className="h-4 w-4 text-[var(--danger)]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination>
        <PaginationContent className="flex-row-reverse gap-2">
          <PaginationItem>
            <PaginationLink
              href="#"
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
              onClick={(event) => { event.preventDefault(); if (page > 1) setPage(page - 1); }}
            >
              {t("common.previous")}
            </PaginationLink>
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href="#"
                isActive={page === pageNumber}
                onClick={(event) => { event.preventDefault(); setPage(pageNumber); }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationLink
              href="#"
              className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              onClick={(event) => { event.preventDefault(); if (page < totalPages) setPage(page + 1); }}
            >
              {t("common.next")}
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("expensesPage.dialog.editTitle") : t("expensesPage.dialog.addTitle")}</DialogTitle>
            <DialogDescription>{t("expensesPage.dialog.description")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-title">{t("expensesPage.dialog.title")}</Label>
              <Input id="expense-title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("expensesPage.dialog.category")}</Label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as ExpenseCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((item) => <SelectItem key={item} value={item}>{t(`expensesPage.categories.${item}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-amount">{t("expensesPage.dialog.amount")}</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date">{t("expensesPage.dialog.date")}</Label>
                <Input id="expense-date" type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-description">{t("expensesPage.dialog.descriptionField")}</Label>
              <textarea
                id="expense-description"
                rows={4}
                maxLength={1000}
                value={form.description || ""}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full rounded-lg border border-[var(--primary-100)] bg-[var(--white)] px-4 py-3 text-sm outline-none focus:border-[var(--primary-300)]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={mutating}>{t("expensesPage.dialog.cancel")}</Button>
              <Button type="submit" disabled={mutating}>{mutating ? t("expensesPage.saving") : t("expensesPage.dialog.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("expensesPage.dialog.deleteTitle")}</DialogTitle>
            <DialogDescription>{t("expensesPage.dialog.deleteDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={mutating}>{t("expensesPage.dialog.cancel")}</Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={mutating}>{t("expensesPage.dialog.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
