"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  emptyUsersResponse,
  usersApiService,
} from "@/services/api.users.service";
import { useToast } from "@/components/ui/toast";
import { getUserDisplayName, normalizeUser } from "@/lib/normalize-api";
import { ICreateUserPayload, IUpdateUserPayload, IUser } from "@/types";

interface IUsersQuery {
  page: number;
  perPage: number;
  minSalary?: number;
  maxSalary?: number;
  orderByAlpha?: "asc" | "desc";
  roleGroup?: "employee" | "customer";
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeUsersResponse(
  response: unknown,
  fallbackQuery: IUsersQuery
) {
  const data = response as {
    users?: IUser[];
    pagination?: {
      page?: number;
      perPage?: number;
      count?: number;
      documentCount?: number;
    };
  };

  const users = Array.isArray(data?.users)
    ? data.users.map((user, index) => normalizeUser(user, `user-${index}`))
    : [];
  const page = toNumber(data?.pagination?.page, fallbackQuery.page);
  const perPage = toNumber(data?.pagination?.perPage, fallbackQuery.perPage);
  const count = toNumber(data?.pagination?.count, users.length);
  const documentCount = toNumber(data?.pagination?.documentCount, count);

  return {
    users,
    pagination: {
      page,
      perPage,
      count,
      documentCount,
    },
  };
}

export function useUsers(initialQuery?: Partial<IUsersQuery>) {
  const { t } = useTranslation();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [query, setQuery] = useState<IUsersQuery>({
    page: initialQuery?.page ?? 1,
    perPage: initialQuery?.perPage ?? 10,
    minSalary: initialQuery?.minSalary,
    maxSalary: initialQuery?.maxSalary,
    orderByAlpha: initialQuery?.orderByAlpha,
    roleGroup: initialQuery?.roleGroup,
  });
  const [data, setData] = useState(emptyUsersResponse);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async (nextQuery: IUsersQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await usersApiService.getAll(nextQuery);
      setData(normalizeUsersResponse(response, nextQuery));
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : t("notifications.users.loadFailed");
      setError(message);
      setData(emptyUsersResponse);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadUsers(query);
  }, [loadUsers, query]);

  const refetch = useCallback(async () => {
    await loadUsers(query);
  }, [loadUsers, query]);

  const createUser = useCallback(
    async (payload: ICreateUserPayload) => {
      setIsMutating(true);
      setError(null);
      try {
        const createdUser = await usersApiService.create(payload);
        const normalizedCreatedUser = normalizeUser(createdUser);
        await loadUsers(query);
        showSuccessToast({
          title: t("notifications.users.createSuccess"),
          description: getUserDisplayName(normalizedCreatedUser),
        });
        return normalizedCreatedUser;
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : t("notifications.users.createFailed");
        setError(message);
        showErrorToast({
          title: t("notifications.users.createErrorTitle"),
          description: message,
        });
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [loadUsers, query, showErrorToast, showSuccessToast, t]
  );

  const updateUser = useCallback(
    async (id: string, payload: IUpdateUserPayload) => {
      setIsMutating(true);
      setError(null);
      try {
        const updatedUser = await usersApiService.update(id, payload);
        const normalizedUpdatedUser = normalizeUser(updatedUser);
        await loadUsers(query);
        showSuccessToast({
          title: t("notifications.users.updateSuccess"),
          description: getUserDisplayName(normalizedUpdatedUser),
        });
        return normalizedUpdatedUser;
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : t("notifications.users.updateFailed");
        setError(message);
        showErrorToast({
          title: t("notifications.users.updateErrorTitle"),
          description: message,
        });
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [loadUsers, query, showErrorToast, showSuccessToast, t]
  );

  const removeUser = useCallback(
    async (id: string) => {
      setIsMutating(true);
      setError(null);
      try {
        await usersApiService.remove(id);
        await loadUsers(query);
        showSuccessToast({
          title: t("notifications.users.deleteSuccess"),
        });
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : t("notifications.users.deleteFailed");
        setError(message);
        showErrorToast({
          title: t("notifications.users.deleteErrorTitle"),
          description: message,
        });
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [loadUsers, query, showErrorToast, showSuccessToast, t]
  );

  const toggleUserActive = useCallback(
    async (user: IUser) => {
      setIsMutating(true);
      setError(null);
      try {
        const updatedUser = await usersApiService.toggleIsActive(user);
        const normalizedUpdatedUser = normalizeUser(updatedUser);
        await loadUsers(query);
        showSuccessToast({
          title: normalizedUpdatedUser.isActive
            ? t("notifications.users.activated")
            : t("notifications.users.deactivated"),
          description: getUserDisplayName(normalizedUpdatedUser),
        });
        return normalizedUpdatedUser;
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : t("notifications.users.statusUpdateFailed");
        setError(message);
        showErrorToast({
          title: t("notifications.users.statusUpdateErrorTitle"),
          description: message,
        });
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [loadUsers, query, showErrorToast, showSuccessToast, t]
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
    (
      filters: Partial<Pick<IUsersQuery, "minSalary" | "maxSalary" | "orderByAlpha">>
    ) => {
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
      roleGroup: previous.roleGroup,
    }));
  }, []);

  return {
    users: data.users,
    pagination: data.pagination,
    query,
    isLoading,
    isMutating,
    error,
    setPage,
    setPerPage,
    setFilters,
    clearFilters,
    refetch,
    createUser,
    updateUser,
    removeUser,
    toggleUserActive,
  };
}
