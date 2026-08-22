"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { rolesApiService } from "@/services/api.roles.service";
import { useToast } from "@/components/ui/toast";
import { normalizeRole } from "@/lib/normalize-api";
import { ICreateRolePayload, IRole, IUpdateRolePayload } from "@/types";

function normalizeRolesResponse(response: unknown): IRole[] {
  const mapRoles = (roles: unknown[]) =>
    roles.map((role, index) => normalizeRole(role, `role-${index}`));

  if (Array.isArray(response)) {
    return mapRoles(response);
  }

  const data = response as {
    roles?: IRole[];
    data?: IRole[];
    items?: IRole[];
  };

  if (Array.isArray(data?.roles)) {
    return mapRoles(data.roles);
  }

  if (Array.isArray(data?.data)) {
    return mapRoles(data.data);
  }

  if (Array.isArray(data?.items)) {
    return mapRoles(data.items);
  }

  return [];
}

export function useRoles() {
  const { t } = useTranslation();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [roles, setRoles] = useState<IRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await rolesApiService.getAll();
      setRoles(normalizeRolesResponse(response));
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : t("notifications.roles.loadFailed");
      setError(message);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const createRole = useCallback(
    async (payload: ICreateRolePayload) => {
      setIsMutating(true);
      setError(null);
      try {
        const createdRole = await rolesApiService.create(payload);
        const normalizedCreatedRole = normalizeRole(createdRole);
        await loadRoles();
        showSuccessToast({
          title: t("notifications.roles.createSuccess"),
          description: normalizedCreatedRole.name,
        });
        return normalizedCreatedRole;
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : t("notifications.roles.createFailed");
        setError(message);
        showErrorToast({
          title: t("notifications.roles.createErrorTitle"),
          description: message,
        });
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [loadRoles, showErrorToast, showSuccessToast, t]
  );

  const updateRole = useCallback(
    async (id: string, payload: IUpdateRolePayload) => {
      setIsMutating(true);
      setError(null);
      try {
        const updatedRole = await rolesApiService.update(id, payload);
        const normalizedUpdatedRole = normalizeRole(updatedRole);
        await loadRoles();
        showSuccessToast({
          title: t("notifications.roles.updateSuccess"),
          description: normalizedUpdatedRole.name,
        });
        return normalizedUpdatedRole;
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : t("notifications.roles.updateFailed");
        setError(message);
        showErrorToast({
          title: t("notifications.roles.updateErrorTitle"),
          description: message,
        });
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [loadRoles, showErrorToast, showSuccessToast, t]
  );

  const removeRole = useCallback(
    async (id: string) => {
      setIsMutating(true);
      setError(null);
      try {
        await rolesApiService.remove(id);
        await loadRoles();
        showSuccessToast({
          title: t("notifications.roles.deleteSuccess"),
        });
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : t("notifications.roles.deleteFailed");
        setError(message);
        showErrorToast({
          title: t("notifications.roles.deleteErrorTitle"),
          description: message,
        });
        throw requestError;
      } finally {
        setIsMutating(false);
      }
    },
    [loadRoles, showErrorToast, showSuccessToast, t]
  );

  const getRoleById = useCallback(async (id: string) => {
    const role = await rolesApiService.getById(id);
    return normalizeRole(role, id);
  }, []);

  return {
    roles,
    isLoading,
    isMutating,
    error,
    refetch: loadRoles,
    getRoleById,
    createRole,
    updateRole,
    removeRole,
  };
}
