import { API_ENDPOINTS } from "@/constant/endpoints";
import { apiClient } from "@/services/api-client";
import { ILoginRequest, ILoginResponse, IRefreshTokenResponse, IRegisterRequest, IUser } from "@/types";

export const authApiService = {
  login(payload: ILoginRequest) {
    return apiClient.post<ILoginResponse, ILoginRequest>(API_ENDPOINTS.auth.login, {
      body: payload,
      auth: false,
    });
  },

  register(payload: IRegisterRequest) {
    return apiClient.post<ILoginResponse, IRegisterRequest>(API_ENDPOINTS.auth.register, {
      body: payload,
      auth: false,
    });
  },

  refresh(refreshToken: string) {
    return apiClient.post<IRefreshTokenResponse, { refreshToken: string }>(API_ENDPOINTS.auth.refresh, {
      body: { refreshToken },
      auth: false,
    });
  },

  me(token?: string | null) {
    return apiClient.get<IUser>(API_ENDPOINTS.auth.me, {
      token,
    });
  },
};
