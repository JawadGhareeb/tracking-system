import { API_ENDPOINTS } from "@/constant/endpoints";
import { apiClient } from "@/services/api-client";
import { ExpenseCategory, IExpense, IExpensePayload, IExpensesResponse } from "@/types";

export interface IExpenseListQuery extends Record<string, string | number | boolean | null | undefined> {
  page?: number;
  perPage?: number;
  month?: string;
  category?: ExpenseCategory;
  search?: string;
}

export const expensesApiService = {
  getAll(query: IExpenseListQuery = {}) {
    return apiClient.get<IExpensesResponse>(API_ENDPOINTS.expenses.list, { query });
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
