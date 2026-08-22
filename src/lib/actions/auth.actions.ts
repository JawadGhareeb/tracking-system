"use server";

import { ILoginRequest } from "@/types";
import { authApiService } from "@/services/api.auth.service";
import {
  clearServerAuthToken,
  setServerAuthToken,
} from "@/services/auth-cookie.server";

export async function handleLogin(credentials: ILoginRequest) {
  try {
    const response = await authApiService.login(credentials);
    if (response.token) {
      await setServerAuthToken(response.token);
      return { success: true };
    }

    return {
      success: false,
      error: "بيانات تسجيل الدخول غير صحيحة",
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "حدث خطأ أثناء تسجيل الدخول",
    };
  }
}

export async function handelLogOut() {
  "use server";
  await clearServerAuthToken();
}
