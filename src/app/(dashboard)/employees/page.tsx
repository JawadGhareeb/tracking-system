"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/lib/icons";
import { useAuth } from "@/hook/use-auth";
import { useUsers } from "@/hook/use-users";
import { IUser } from "@/types";

export default function EmployeesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile, fetchProfile } = useAuth();
  const {
    users,
    pagination,
    query,
    isLoading,
    isMutating,
    error,
    setPage,
    setFilters,
    clearFilters,
    removeUser,
    toggleUserActive,
  } = useUsers({
    page: 1,
    perPage: 10,
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<IUser | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<IUser | null>(null);

  useEffect(() => {
    if (profile?._id) {
      return;
    }

    void fetchProfile().catch(() => undefined);
  }, [fetchProfile, profile?._id]);

  const visibleUsers = useMemo(() => {
    if (!profile?._id) {
      return users;
    }

    return users.filter((user) => user._id !== profile._id);
  }, [profile?._id, users]);

  const totalPages = useMemo(() => {
    if (!pagination.perPage) {
      return 1;
    }

    return Math.max(1, Math.ceil(pagination.documentCount / pagination.perPage));
  }, [pagination.documentCount, pagination.perPage]);

  const hasActiveFilters =
    query.minSalary !== undefined ||
    query.maxSalary !== undefined ||
    query.orderByAlpha !== undefined;

  const openDeleteDialog = (user: IUser) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const openStatusDialog = (user: IUser) => {
    setUserToToggle(user);
    setIsStatusDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) {
      return;
    }

    try {
      await removeUser(userToDelete._id);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch {
      // handled in hook toast + error state
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!userToToggle) {
      return;
    }

    try {
      await toggleUserActive(userToToggle);
      setIsStatusDialogOpen(false);
      setUserToToggle(null);
    } catch {
      // handled in hook toast + error state
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 text-[var(--primary-300)]">
        <Icons.users className="h-6 w-6" />
        <span className="text-sm font-semibold uppercase tracking-wide text-[var(--primary-400)]">
          {t("dashboardUsers.badge")}
        </span>
      </div>

      <div className="my-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--black-300)]">{t("dashboardUsers.title")}</h1>
          <p className="text-sm text-[var(--black-100)]">
            {t("dashboardUsers.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
        <Link href="/employees/new" className="self-start">
          <Button className="gap-2">
            {t("dashboardUsers.addUser")}
            <Icons.add className="h-4 w-4" />
          </Button>
        </Link>
         <Button
              variant="outline"
              onClick={() => clearFilters()}
              disabled={!hasActiveFilters}
            >
              {t("dashboardUsers.clearFilters")}
            <Icons.FilterX className="h-4 w-4" />
          </Button>

        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <Card className="mb-6 bg-transparent border-none shadow-none">
        <CardContent className="pb-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="min-salary-filter">{t("dashboardUsers.minSalary")}</Label>
              <Input
                id="min-salary-filter"
                type="number"
                placeholder={t("dashboardUsers.minSalaryPlaceholder")}
                value={query.minSalary ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const parsedValue = Number(nextValue);
                  setFilters({
                    minSalary:
                      nextValue === "" || !Number.isFinite(parsedValue)
                        ? undefined
                        : parsedValue,
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-salary-filter">{t("dashboardUsers.maxSalary")}</Label>
              <Input
                id="max-salary-filter"
                type="number"
                placeholder={t("dashboardUsers.maxSalaryPlaceholder")}
                value={query.maxSalary ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const parsedValue = Number(nextValue);
                  setFilters({
                    maxSalary:
                      nextValue === "" || !Number.isFinite(parsedValue)
                        ? undefined
                        : parsedValue,
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-alpha-filter">{t("dashboardUsers.alphabeticalOrder")}</Label>
              <Select
                value={
                  query.orderByAlpha === undefined ? "all" : String(query.orderByAlpha)
                }
                onValueChange={(value) => {
                  setFilters({
                    orderByAlpha:
                      value === "all" ? undefined : value === "1" ? 1 : 0,
                  });
                }}
              >
                <SelectTrigger id="order-alpha-filter">
                  <SelectValue placeholder={t("dashboardUsers.defaultOrder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dashboardUsers.defaultOrder")}</SelectItem>
                  <SelectItem value="0">{t("dashboardUsers.ascOrder")}</SelectItem>
                  <SelectItem value="1">{t("dashboardUsers.descOrder")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

           
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboardUsers.table.fullName")}</TableHead>
                <TableHead>{t("dashboardUsers.table.email")}</TableHead>
                <TableHead>{t("dashboardUsers.table.username")}</TableHead>
                <TableHead>{t("dashboardUsers.table.role")}</TableHead>
                <TableHead>{t("dashboardUsers.table.salary")}</TableHead>
                <TableHead>{t("dashboardUsers.table.status")}</TableHead>
                <TableHead className="text-center">{t("dashboardUsers.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={`employees-skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-44" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : visibleUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    {t("dashboardUsers.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                visibleUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-semibold text-[var(--black-300)]">
                      {user.fullName.firstName} {user.fullName.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-[var(--primary-100)] px-3 py-1 text-xs font-semibold text-[var(--primary-400)]">
                        {user.role.name}
                      </span>
                    </TableCell>
                    <TableCell>{user.salary.toLocaleString()}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive
                            ? "bg-[#ddf6e8] text-[#2b9b5c]"
                            : "bg-[#ffe8e8] text-[#d04242]"
                        }`}
                      >
                        {user.isActive ? t("dashboardUsers.statusActive") : t("dashboardUsers.statusInactive")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openStatusDialog(user)}
                          aria-label={t("dashboardUsers.aria.toggleStatus")}
                        >
                          {user.isActive ? (
                            <Icons.deactivate className="h-5 w-5 text-[var(--black-200)]" />
                          ) : (
                            <Icons.activate className="h-5 w-5 text-[var(--secondary-400)]" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/employees/${user._id}`)}
                          aria-label={t("dashboardUsers.aria.editUser")}
                        >
                          <Icons.edit className="h-5 w-5 text-[var(--primary-300)]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(user)}
                          aria-label={t("dashboardUsers.aria.deleteUser")}
                        >
                          <Icons.delete className="h-5 w-5 text-[var(--danger)]" />
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboardUsers.deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("dashboardUsers.deleteDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isMutating}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void handleDeleteConfirm();
              }}
              disabled={isMutating}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboardUsers.statusDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("dashboardUsers.statusDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={isMutating}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                void handleToggleStatusConfirm();
              }}
              disabled={isMutating}
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-6">
        <Pagination>
          <PaginationContent className="flex-row-reverse gap-2">
            <PaginationItem>
              <PaginationLink
                href="#"
                className={`min-w-[80px] justify-center rounded-xl text-sm font-semibold ${
                  query.page === 1 ? "pointer-events-none opacity-50" : ""
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  if (query.page > 1) {
                    setPage(query.page - 1);
                  }
                }}
              >
                {t("common.previous")}
              </PaginationLink>
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  className="min-w-[48px] justify-center rounded-xl text-sm font-semibold"
                  onClick={(event) => {
                    event.preventDefault();
                    setPage(page);
                  }}
                  isActive={query.page === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationLink
                href="#"
                className={`min-w-[80px] justify-center rounded-xl text-sm font-semibold ${
                  query.page === totalPages ? "pointer-events-none opacity-50" : ""
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  if (query.page < totalPages) {
                    setPage(query.page + 1);
                  }
                }}
              >
                {t("common.next")}
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
