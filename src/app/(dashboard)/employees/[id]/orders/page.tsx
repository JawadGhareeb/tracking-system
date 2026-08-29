"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { normalizeUser } from "@/lib/normalize-api";
import { useOrders } from "@/hook/use-orders";
import { usersApiService } from "@/services/api.users.service";
import { IUser, OrderListStatusFilter } from "@/types";

const statusColors: Record<string, string> = {
  PENDING: "bg-[var(--secondary-200)] text-[var(--secondary-500)]",
  CUTTING: "bg-[var(--primary-100)] text-[var(--primary-400)]",
  SEWING: "bg-[var(--primary-200)] text-[var(--primary-400)]",
  PRINTING: "bg-[var(--secondary-100)] text-[var(--secondary-500)]",
  PACKAGING: "bg-[var(--accent-100)] text-[var(--primary-400)]",
  STORAGE: "bg-[var(--white-100)] text-[var(--black-300)]",
  DELIVERY: "bg-[#ddf6e8] text-[#2b9b5c] dark:bg-emerald-950/70 dark:text-emerald-300",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
};

const statusValues: OrderListStatusFilter[] = [
  "PENDING",
  "CUTTING",
  "SEWING",
  "PRINTING",
  "PACKAGING",
  "STORAGE",
  "DELIVERY",
  "DELIVERED",
];

export default function EmployeeOrdersAdminPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const employeeId = String(params.id || "");
  const [employee, setEmployee] = useState<IUser | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const { orders, pagination, query, isLoading, error, setPage, setFilters } = useOrders({
    page: 1,
    perPage: 10,
    employeeId,
  });

  useEffect(() => {
    let active = true;
    setEmployeeLoading(true);
    setEmployeeError(null);

    usersApiService
      .getById(employeeId)
      .then((response) => {
        if (active) setEmployee(normalizeUser(response, employeeId));
      })
      .catch((requestError) => {
        if (!active) return;
        setEmployee(null);
        setEmployeeError(
          requestError instanceof Error
            ? requestError.message
            : t("dashboardUsers.employeeOrdersLoadFailed")
        );
      })
      .finally(() => {
        if (active) setEmployeeLoading(false);
      });

    return () => {
      active = false;
    };
  }, [employeeId, t]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(pagination.documentCount / Math.max(1, pagination.perPage))),
    [pagination.documentCount, pagination.perPage]
  );

  const employeeName = employee
    ? `${employee.fullName.firstName} ${employee.fullName.lastName}`.trim()
    : "";

  const statusLabels: Record<OrderListStatusFilter, string> = {
    PENDING: t("orderStatus.pending"),
    CUTTING: t("orderStatus.cutting"),
    SEWING: t("orderStatus.sewing"),
    PRINTING: t("orderStatus.printing"),
    PACKAGING: t("orderStatus.packaging"),
    STORAGE: t("orderStatus.storage"),
    DELIVERY: t("orderStatus.delivery"),
    DELIVERED: t("orderStatus.delivered", { defaultValue: "تم التسليم" }),
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 text-[var(--primary-300)]">
        <Icons.orders className="h-6 w-6" />
        <span className="text-sm font-semibold uppercase tracking-wide text-[var(--primary-400)]">
          {t("dashboardUsers.employeeOrdersBadge")}
        </span>
      </div>

      <div className="my-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          {employeeLoading ? (
            <Skeleton className="h-9 w-72" />
          ) : (
            <h1 className="text-3xl font-bold text-[var(--black-300)]">
              {t("dashboardUsers.employeeOrdersTitle", { name: employeeName || t("common.user") })}
            </h1>
          )}
          <p className="text-sm text-[var(--black-100)]">
            {t("dashboardUsers.employeeOrdersDescription")}
          </p>
        </div>
        <Link href="/employees">
          <Button variant="outline">{t("dashboardUsers.backToEmployees")}</Button>
        </Link>
      </div>

      {employeeError ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
          {employeeError}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_240px]">
        <Card>
          <CardContent className="flex items-center justify-between px-6 py-2">
            <div>
              <p className="text-sm font-semibold text-[var(--black-100)]">
                {t("dashboardUsers.totalAssignedOrders")}
              </p>
              <p className="mt-2 text-3xl font-bold text-[var(--black-300)]">
                {pagination.documentCount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--primary-100)] p-3 text-[var(--primary-400)]">
              <Icons.orders className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="employee-orders-status">{t("dashboardOrders.filters.status")}</Label>
          <Select
            value={query.status ?? "all"}
            onValueChange={(value) =>
              setFilters({
                status: value === "all" ? undefined : (value as OrderListStatusFilter),
              })
            }
          >
            <SelectTrigger id="employee-orders-status">
              <SelectValue placeholder={t("dashboardOrders.filters.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboardOrders.filters.allStatuses")}</SelectItem>
              {statusValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                <TableHead className="text-center">{t("dashboardOrders.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={`employee-orders-skeleton-${index}`}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><div className="flex justify-center"><Skeleton className="h-9 w-9 rounded-lg" /></div></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-[var(--black-200)]">
                    {t("dashboardUsers.employeeOrdersEmpty")}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium text-[var(--black-300)]">{order.description}</TableCell>
                    <TableCell>
                      {order.customer.fullName.firstName} {order.customer.fullName.lastName}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[order.status] || statusColors.PENDING}`}>
                        {statusLabels[order.status]}
                      </span>
                    </TableCell>
                    <TableCell>{dayjs(order.createdAt).format("YYYY-MM-DD")}</TableCell>
                    <TableCell>
                      {order.expectedFinishDate ? dayjs(order.expectedFinishDate).format("YYYY-MM-DD") : "-"}
                    </TableCell>
                    <TableCell>{order.totalPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/orders/${order._id}`)}
                          aria-label={t("dashboardUsers.aria.openAssignedOrder")}
                        >
                          <Icons.fileText className="h-5 w-5 text-[var(--primary-300)]" />
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

      {totalPages > 1 ? (
        <div className="mt-6">
          <Pagination>
            <PaginationContent className="flex-row-reverse gap-2">
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className={query.page === 1 ? "pointer-events-none opacity-50" : ""}
                  onClick={(event) => {
                    event.preventDefault();
                    if (query.page > 1) setPage(query.page - 1);
                  }}
                >
                  {t("common.previous")}
                </PaginationLink>
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={query.page === page}
                    onClick={(event) => {
                      event.preventDefault();
                      setPage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className={query.page === totalPages ? "pointer-events-none opacity-50" : ""}
                  onClick={(event) => {
                    event.preventDefault();
                    if (query.page < totalPages) setPage(query.page + 1);
                  }}
                >
                  {t("common.next")}
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
