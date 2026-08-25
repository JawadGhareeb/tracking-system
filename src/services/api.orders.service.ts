import { API_ENDPOINTS } from "@/constant/endpoints";
import { apiClient } from "@/services/api-client";
import {
  ICreateOrderPayload,
  IOrder,
  IOrdersResponse,
  OrderListStatusFilter,
  IUpdateOrderPayload,
} from "@/types";

interface IOrderListQuery {
  page?: number;
  perPage?: number;
  status?: OrderListStatusFilter;
  employeeId?: string;
  userId?: string;
  from?: string;
  to?: string;
}

export const ordersApiService = {
  getAll(query?: IOrderListQuery) {
    return apiClient.get<IOrdersResponse>(API_ENDPOINTS.orders.list, {
      query: query as Record<string, string | number | undefined> | undefined,
    });
  },
  getById(id: string) {
    return apiClient.get<IOrder>(API_ENDPOINTS.orders.byId(id));
  },
  create(payload: ICreateOrderPayload) {
    return apiClient.post<IOrder, ICreateOrderPayload>(API_ENDPOINTS.orders.list, { body: payload });
  },
  update(id: string, payload: IUpdateOrderPayload) {
    return apiClient.put<IOrder, IUpdateOrderPayload>(API_ENDPOINTS.orders.byId(id), { body: payload });
  },
  remove(id: string) {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.orders.byId(id));
  },
};
