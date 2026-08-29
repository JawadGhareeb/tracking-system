"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
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
import { useOrders } from "@/hook/use-orders";
import { usersApiService } from "@/services/api.users.service";
import { IOrder, IUserBrief, OrderListStatusFilter } from "@/types";

const statusColors: Record<string, string> = {
  PENDING: "bg-[var(--secondary-200)] text-[var(--secondary-500)]",
  CUTTING: "bg-[var(--primary-100)] text-[var(--primary-400)]",
  SEWING: "bg-[var(--primary-200)] text-[var(--primary-400)]",
  PRINTING: "bg-[var(--secondary-100)] text-[var(--secondary-500)]",
  PACKAGING: "bg-[var(--accent-100)] text-[var(--primary-400)]",
  STORAGE: "bg-[var(--white-100)] text-[var(--black-300)]",
  DELIVERY: "bg-[#ddf6e8] text-[#2b9b5c]",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
};

export default function OrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    orders,
    pagination,
    query,
    isLoading,
    isMutating,
    error,
    setPage,
    setFilters,
    clearFilters,
    removeOrder,
  } = useOrders({
    page: 1,
    perPage: 10,
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<IOrder | null>(null);
  const [briefUsers, setBriefUsers] = useState<IUserBrief[]>([]);
  const [isBriefUsersLoading, setIsBriefUsersLoading] = useState(false);
  const [briefUsersError, setBriefUsersError] = useState<string | null>(null);
  const statusLabels: Record<string, string> = {
    PENDING: t("orderStatus.pending"),
    CUTTING: t("orderStatus.cutting"),
    SEWING: t("orderStatus.sewing"),
    PRINTING: t("orderStatus.printing"),
    PACKAGING: t("orderStatus.packaging"),
    STORAGE: t("orderStatus.storage"),
    DELIVERY: t("orderStatus.delivery"),
    DELIVERED: t("orderStatus.delivered", { defaultValue: "تم التسليم" }),
    CANCELLED: t("dashboardOrders.cancelled", { defaultValue: "ملغى" }),
    REJECTED: t("dashboardOrders.rejected", { defaultValue: "مرفوض" }),
  };

  const orderStatusOptions: Array<{ value: OrderListStatusFilter; label: string }> = [
    { value: "PENDING", label: t("orderStatus.pending") },
    { value: "CUTTING", label: t("orderStatus.cutting") },
    { value: "SEWING", label: t("orderStatus.sewing") },
    { value: "PRINTING", label: t("orderStatus.printing") },
    { value: "PACKAGING", label: t("orderStatus.packaging") },
    { value: "STORAGE", label: t("orderStatus.storage") },
    { value: "DELIVERY", label: t("orderStatus.delivery") },
    { value: "DELIVERED", label: t("orderStatus.delivered", { defaultValue: "تم التسليم" }) },
  ];

  const totalPages = useMemo(() => {
    if (!pagination.perPage) {
      return 1;
    }

    return Math.max(1, Math.ceil(pagination.documentCount / pagination.perPage));
  }, [pagination.documentCount, pagination.perPage]);

  const hasActiveFilters = Boolean(query.status || query.userId || query.from || query.to);

  useEffect(() => {
    let isMounted = true;

    const loadBriefUsers = async () => {
      setIsBriefUsersLoading(true);
      setBriefUsersError(null);

      try {
        const response = await usersApiService.getBrief();

        if (!isMounted) {
          return;
        }

        setBriefUsers(response.users);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setBriefUsers([]);
        setBriefUsersError(
          requestError instanceof Error ? requestError.message : t("dashboardOrders.loadUsersFailed")
        );
      } finally {
        if (isMounted) {
          setIsBriefUsersLoading(false);
        }
      }
    };

    void loadBriefUsers();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const openDeleteDialog = (order: IOrder) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) {
      return;
    }

    try {
      await removeOrder(orderToDelete._id);
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch {
      // handled in hook toast + error state
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 text-[var(--primary-300)]">
        <Icons.orders className="h-6 w-6" />
        <span className="text-sm font-semibold uppercase tracking-wide text-[var(--primary-400)]">
          {t("dashboardOrders.badge")}
        </span>
      </div>
      <div className="my-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--black-300)]">{t("dashboardOrders.title")}</h1>
          <p className="text-sm text-[var(--black-100)]">{t("dashboardOrders.description")}</p>
        </div>
        <div className="flex items-center gap-2">

<Button
              variant="outline"
              onClick={() => clearFilters()}
              disabled={!hasActiveFilters}
            >
              {t("dashboardOrders.clearFilters")}
              <Icons.FilterX className="size-4" />
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="order-status-filter">{t("dashboardOrders.filters.status")}</Label>
              <Select
                value={query.status ?? "all"}
                onValueChange={(value) => {
                  setFilters({
                    status:
                      value === "all" ? undefined : (value as OrderListStatusFilter),
                  });
                }}
              >
                <SelectTrigger id="order-status-filter">
                  <SelectValue placeholder={t("dashboardOrders.filters.allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dashboardOrders.filters.allStatuses")}</SelectItem>
                  {orderStatusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-user-filter">{t("dashboardOrders.filters.customer")}</Label>
              <Select
                value={query.userId ?? "all"}
                onValueChange={(value) => {
                  setFilters({
                    userId: value === "all" ? undefined : value,
                  });
                }}
                disabled={isBriefUsersLoading}
              >
                <SelectTrigger id="order-user-filter">
                  <SelectValue
                    placeholder={
                      isBriefUsersLoading
                        ? t("dashboardOrders.filters.loadingCustomers")
                        : t("dashboardOrders.filters.allCustomers")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dashboardOrders.filters.allCustomers")}</SelectItem>
                  {isBriefUsersLoading ? (
                    <SelectItem value="users-loading" disabled>
                      {t("dashboardOrders.filters.loadingCustomers")}
                    </SelectItem>
                  ) : briefUsers.length === 0 ? (
                    <SelectItem value="users-empty" disabled>
                      {t("dashboardOrders.filters.noData")}
                    </SelectItem>
                  ) : (
                    briefUsers.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-from-filter">{t("dashboardOrders.filters.fromDate")}</Label>
              <Input
                id="order-from-filter"
                type="date"
                value={query.from ?? ""}
                onChange={(event) => {
                  setFilters({
                    from: event.target.value || undefined,
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-to-filter">{t("dashboardOrders.filters.toDate")}</Label>
              <Input
                id="order-to-filter"
                type="date"
                value={query.to ?? ""}
                onChange={(event) => {
                  setFilters({
                    to: event.target.value || undefined,
                  });
                }}
              />
            </div>
          </div>

          {briefUsersError ? (
            <div className="mt-3 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
              {briefUsersError}
            </div>
          ) : null}

          
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dashboardOrders.table.description")}</TableHead>
                <TableHead>{t("dashboardOrders.table.customer")}</TableHead>
                <TableHead>{t("dashboardOrders.table.status")}</TableHead>
                <TableHead>{t("dashboardOrders.table.createdAt")}</TableHead>
                <TableHead>{t("dashboardOrders.table.expectedDate")}</TableHead>
                <TableHead>{t("dashboardOrders.table.cost")}</TableHead>
                <TableHead>{t("dashboardOrders.table.employee")}</TableHead>
                <TableHead className="text-center">{t("dashboardOrders.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={`orders-skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center">
                    {t("dashboardOrders.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const effectiveStatus = order.isRejected ? "REJECTED" : order.isCancelled ? "CANCELLED" : order.status;
                  return (
                  <TableRow key={order._id}>
                    <TableCell>{order.description}</TableCell>
                    <TableCell>
                      {order.customer.fullName.firstName} {order.customer.fullName.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusColors[effectiveStatus] || statusColors.PENDING
                          }`}
                        >
                          {statusLabels[effectiveStatus] || effectiveStatus}
                        </span>
                        {order.stageCompletionRequests.some((request) => request.status === "PENDING" && request.stage === order.status) ? (
                          <p className="text-xs font-semibold text-[var(--secondary-500)]">{t("dashboardOrders.stageReviewPending")}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{dayjs(order.createdAt).format("YYYY-MM-DD")}</TableCell>
                    <TableCell>
                      {order.expectedFinishDate
                        ? dayjs(order.expectedFinishDate).format("YYYY-MM-DD")
                        : "-"}
                    </TableCell>
                    <TableCell>{order.totalPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      {order.employee
                        ? `${order.employee.fullName.firstName} ${order.employee.fullName.lastName}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/orders/${order._id}`)}
                          aria-label={t("dashboardOrders.aria.editOrder")}
                        >
                          <Icons.edit className="h-5 w-5 text-[var(--primary-300)]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(order)}
                          aria-label={t("dashboardOrders.aria.deleteOrder")}
                        >
                          <Icons.delete className="h-5 w-5 text-[var(--danger)]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboardOrders.deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("dashboardOrders.deleteDialog.description")}
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
