"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { authApiService } from "@/services/api.auth.service";
import {
  clearAuthSession,
  persistAuthSession,
} from "@/services/auth-cookie";
import { useToast } from "@/components/ui/toast";
import { getUserDisplayName, normalizeUser } from "@/lib/normalize-api";
import { ILoginRequest, IRegisterRequest, IUser } from "@/types";

interface IAuthResult {
  success: boolean;
  error?: string;
  user?: IUser;
}

export function useAuth() {
  const { t } = useTranslation();
  const {
    success: showSuccessToast,
    error: showErrorToast,
    info: showInfoToast,
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<IUser | null>(null);

  const login = useCallback(async (credentials: ILoginRequest): Promise<IAuthResult> => {
    setIsLoading(true);
    try {
      const response = await authApiService.login(credentials);
      const normalizedUser = normalizeUser(response.user);
      await persistAuthSession(response);
      setProfile(normalizedUser);
      showSuccessToast({
        title: t("notifications.auth.loginSuccessTitle"),
        description: t("notifications.auth.welcome", {
          name: getUserDisplayName(normalizedUser),
        }),
      });
      return {
        success: true,
        user: normalizedUser,
      };
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : t("notifications.auth.loginFailed");
      showErrorToast({
        title: t("notifications.auth.loginErrorTitle"),
        description: message,
      });
      return {
        success: false,
        error: message,
      };
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast, showSuccessToast, t]);

  const register = useCallback(async (payload: IRegisterRequest): Promise<IAuthResult> => {
    setIsLoading(true);
    try {
      const response = await authApiService.register(payload);
      const normalizedUser = normalizeUser(response.user);
      await persistAuthSession(response);
      setProfile(normalizedUser);
      showSuccessToast({
        title: t("notifications.auth.registerSuccessTitle"),
        description: t("notifications.auth.welcome", {
          name: getUserDisplayName(normalizedUser),
        }),
      });
      return {
        success: true,
        user: normalizedUser,
      };
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : t("notifications.auth.registerFailed");
      showErrorToast({
        title: t("notifications.auth.registerErrorTitle"),
        description: message,
      });
      return {
        success: false,
        error: message,
      };
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast, showSuccessToast, t]);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await authApiService.me();
      setProfile(currentUser);
      return currentUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    void clearAuthSession();
    setProfile(null);
    showInfoToast({
      title: t("notifications.auth.logoutTitle"),
      description: t("notifications.auth.logoutDescription"),
    });
  }, [showInfoToast, t]);

  return {
    isLoading,
    profile,
    login,
    register,
    logout,
    fetchProfile,
  };
}
