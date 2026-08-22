"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ordersApiService } from "@/services/api.orders.service";
import { useToast } from "@/components/ui/toast";
import { normalizeOrder } from "@/lib/normalize-api";
import {
  ICreateOrderPayload,
  IOrder,
  IUpdateOrderPayload,
  OrderListStatusFilter,
} from "@/types";

interface IOrdersQuery {
  page: number;
  perPage: number;
  status?: OrderListStatusFilter;
  userId?: string;
  from?: string;
  to?: string;
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeOrdersResponse(
  response: unknown,
  fallbackQuery: IOrdersQuery
) {
  const data = response as {
    orders?: IOrder[];
    pagination?: {
      page?: number;
      perPage?: number;
      count?: number;
      documentCount?: number;
    };
  };

  const orders = Array.isArray(data?.orders)
    ? data.orders.map((order, index) => normalizeOrder(order, `order-${index}`))
    : [];
  const page = toNumber(data?.pagination?.page, fallbackQuery.page);
  const perPage = toNumber(data?.pagination?.perPage, fallbackQuery.perPage);
  const count = toNumber(data?.pagination?.count, orders.length);
  const documentCount = toNumber(data?.pagination?.documentCount, count);

  return {
    orders,
    pagination: {
      page,
      perPage,
      count,
      documentCount,
    },
  };
}

const emptyPagination = {
  page: 1,
  perPage: 10,
  count: 0,
  documentCount: 0,
};

export function useOrders(initialQuery?: Partial<IOrdersQuery>) {
  const { t } = useTranslation();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [query, setQuery] = useState<IOrdersQuery>({
    page: initialQuery?.page ?? 1,
    perPage: initialQuery?.perPage ?? 10,
    status: initialQuery?.status,
    userId: initialQuery?.userId,
    from: initialQuery?.from,
    to: initialQuery?.to,
  });
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (nextQuery: IOrdersQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApiService.getAll(nextQuery);
      const normalized = normalizeOrdersResponse(response, nextQuery);
      setOrders(normalized.orders);
      setPagination(normalized.pagination);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : t("notifications.orders.loadFailed");
      setError(message);
      setOrders([]);
      setPagination(emptyPagination);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadOrders(query);
  }, [loadOrders, query]);

  const refetch = useCallback(async () => {
    await loadOrders(query);
  }, [loadOrders, query]);

  const createOrder = useCallback(
    async (payload: ICreateOrderPayload) => {
      setIsMutating(true);
      setError(null);
      try {
        const createdOrder = await ordersApiService.create(payload);
        const normalizedCreatedOrder = normalizeOrder(createdOrder);
        await loadOrders(query);
        showSuccessToast({
          title: t("notifications.orders.createSuccess"),
        });
        return normalizedCreatedOrder;
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : t("notifications.orders.createFailed");
        setError(message);
        showErrorToast({
          title: t("notifications.orders.createErrorTitle"),
          description: message,
        });
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [loadOrders, query, showErrorToast, showSuccessToast, t]
  );

  const updateOrder = useCallback(
    async (id: string, payload: IUpdateOrderPayload) => {
      setIsMutating(true);
      setError(null);
      try {
        const updatedOrder = await ordersApiService.update(id, payload);
        const normalizedUpdatedOrder = normalizeOrder(updatedOrder);
        await loadOrders(query);
        showSuccessToast({
          title: t("notifications.orders.updateSuccess"),
        });
        return normalizedUpdatedOrder;
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : t("notifications.orders.updateFailed");
        setError(message);
        showErrorToast({
          title: t("notifications.orders.updateErrorTitle"),
          description: message,
        });
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [loadOrders, query, showErrorToast, showSuccessToast, t]
  );

  const removeOrder = useCallback(
    async (id: string) => {
      setIsMutating(true);
      setError(null);
      try {
        await ordersApiService.remove(id);
        await loadOrders(query);
        showSuccessToast({
          title: t("notifications.orders.deleteSuccess"),
        });
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : t("notifications.orders.deleteFailed");
        setError(message);
        showErrorToast({
          title: t("notifications.orders.deleteErrorTitle"),
          description: message,
        });
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [loadOrders, query, showErrorToast, showSuccessToast, t]
  );

  const setPage = useCallback((page: number) => {
    setQuery((previous) => ({
      ...previous,
      page,
    }));
  }, []);

  const setPerPage = useCallback((perPage: number) => {
    setQuery((previous) => ({
      ...previous,
      perPage,
      page: 1,
    }));
  }, []);

  const setFilters = useCallback(
    (filters: Partial<Pick<IOrdersQuery, "status" | "userId" | "from" | "to">>) => {
      setQuery((previous) => ({
        ...previous,
        ...filters,
        page: 1,
      }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setQuery((previous) => ({
      page: 1,
      perPage: previous.perPage,
    }));
  }, []);

  return {
    orders,
    pagination,
    query,
    isLoading,
    isMutating,
    error,
    setPage,
    setPerPage,
    setFilters,
    clearFilters,
    refetch,
    createOrder,
    updateOrder,
    removeOrder,
  };
}
