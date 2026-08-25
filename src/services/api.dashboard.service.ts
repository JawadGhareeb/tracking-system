import { API_ENDPOINTS } from "@/constant/endpoints";
import { apiClient } from "@/services/api-client";
import { IDashboardSummary, IFinanceSummary } from "@/types";

export const dashboardApiService = {
  getFinance(month?: string) {
    return apiClient.get<IFinanceSummary>(API_ENDPOINTS.dashboard.finance, { query: { month } });
  },
  getSummary() {
    return apiClient.get<IDashboardSummary>(API_ENDPOINTS.dashboard.summary);
  },
};
