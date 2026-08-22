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

function appendIfExists(formData: FormData, key: string, value?: string | number) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  formData.append(key, String(value));
}

function buildCreateOrderFormData(payload: ICreateOrderPayload): FormData {
  const formData = new FormData();

  formData.append("customer", payload.customer);
  formData.append("employee", payload.employee);
  formData.append("description", payload.description);
  appendIfExists(formData, "status", payload.status);
  formData.append("expectedFinishDate", payload.expectedFinishDate);
  formData.append("cost", String(payload.cost));
  formData.append("deliveryLocation", JSON.stringify(payload.deliveryLocation));

  if (payload.sizes?.length) {
    formData.append("sizes", JSON.stringify(payload.sizes));
  }

  if (payload.colors?.length) {
    formData.append("colors", JSON.stringify(payload.colors));
  }

  payload.images?.forEach((image) => {
    formData.append("images", image);
  });

  if (payload.employeeSignature) {
    formData.append("employeeSignature", payload.employeeSignature);
  }

  if (payload.customerSignature) {
    formData.append("customerSignature", payload.customerSignature);
  }

  return formData;
}

function buildUpdateOrderFormData(payload: IUpdateOrderPayload): FormData {
  const formData = new FormData();

  appendIfExists(formData, "description", payload.description);
  appendIfExists(formData, "status", payload.status);
  appendIfExists(formData, "expectedFinishDate", payload.expectedFinishDate);
  appendIfExists(formData, "cost", payload.cost);

  if (payload.sizes?.length) {
    formData.append("sizes", JSON.stringify(payload.sizes));
  }

  if (payload.colors?.length) {
    formData.append("colors", JSON.stringify(payload.colors));
  }

  if (payload.deliveryLocation) {
    formData.append("deliveryLocation", JSON.stringify(payload.deliveryLocation));
  }

  payload.images?.forEach((image) => {
    formData.append("images", image);
  });

  if (payload.employeeSignature) {
    formData.append("employeeSignature", payload.employeeSignature);
  }

  if (payload.customerSignature) {
    formData.append("customerSignature", payload.customerSignature);
  }

  return formData;
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
    return apiClient.post<IOrder, FormData>(API_ENDPOINTS.orders.list, {
      body: buildCreateOrderFormData(payload),
    });
  },

  update(id: string, payload: IUpdateOrderPayload) {
    return apiClient.put<IOrder, FormData>(API_ENDPOINTS.orders.byId(id), {
      body: buildUpdateOrderFormData(payload),
    });
  },

  remove(id: string) {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.orders.byId(id));
  },
};
