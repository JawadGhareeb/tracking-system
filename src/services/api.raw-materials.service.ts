import { API_ENDPOINTS } from "@/constant/endpoints";
import { apiClient } from "@/services/api-client";
import { IRawMaterial, IRawMaterialPayload, IRawMaterialsResponse } from "@/types";

export const rawMaterialsApiService = {
  getAll(availability?: "available" | "unavailable") {
    return apiClient.get<IRawMaterialsResponse>(API_ENDPOINTS.rawMaterials.list, { query: availability ? { availability } : undefined });
  },
  getAvailable() {
    return apiClient.get<{ items: IRawMaterial[] }>(API_ENDPOINTS.rawMaterials.available);
  },
  create(payload: IRawMaterialPayload) {
    return apiClient.post<IRawMaterial, IRawMaterialPayload>(API_ENDPOINTS.rawMaterials.list, { body: payload });
  },
  update(id: string, payload: Partial<IRawMaterialPayload>) {
    return apiClient.put<IRawMaterial, Partial<IRawMaterialPayload>>(API_ENDPOINTS.rawMaterials.byId(id), { body: payload });
  },
  remove(id: string) {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.rawMaterials.byId(id));
  },
};
