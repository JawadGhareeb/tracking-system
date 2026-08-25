import { API_ENDPOINTS } from "@/constant/endpoints";
import { apiClient } from "@/services/api-client";
import { IExpense, IExpensePayload, IExpensesResponse } from "@/types";

export const expensesApiService = {
  getAll(month?: string) {
    return apiClient.get<IExpensesResponse>(API_ENDPOINTS.expenses.list, { query: { page: 1, perPage: 100, month } });
  },
  create(payload: IExpensePayload) {
    return apiClient.post<IExpense, IExpensePayload>(API_ENDPOINTS.expenses.list, { body: payload });
  },
  update(id: string, payload: Partial<IExpensePayload>) {
    return apiClient.put<IExpense, Partial<IExpensePayload>>(API_ENDPOINTS.expenses.byId(id), { body: payload });
  },
  remove(id: string) {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.expenses.byId(id));
  },
};
