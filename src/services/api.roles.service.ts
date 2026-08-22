import { API_ENDPOINTS } from "@/constant/endpoints";
import { apiClient } from "@/services/api-client";
import { ICreateRolePayload, IRole, IUpdateRolePayload } from "@/types";

export const rolesApiService = {
  getAll() {
    return apiClient.get<IRole[]>(API_ENDPOINTS.roles.list);
  },

  getById(id: string) {
    return apiClient.get<IRole>(API_ENDPOINTS.roles.byId(id));
  },

  create(payload: ICreateRolePayload) {
    return apiClient.post<IRole, ICreateRolePayload>(API_ENDPOINTS.roles.list, {
      body: payload,
    });
  },

  update(id: string, payload: IUpdateRolePayload) {
    return apiClient.put<IRole, IUpdateRolePayload>(API_ENDPOINTS.roles.byId(id), {
      body: payload,
    });
  },

  remove(id: string) {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.roles.byId(id));
  },
};
