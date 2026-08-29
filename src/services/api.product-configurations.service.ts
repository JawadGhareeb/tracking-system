import { API_ENDPOINTS } from "@/constant/endpoints";
import { apiClient } from "@/services/api-client";
import { IProductConfiguration } from "@/types";

export const productConfigurationsApiService = {
  getAll() { return apiClient.get<{ items: IProductConfiguration[] }>(API_ENDPOINTS.productConfigurations.list); },
};
