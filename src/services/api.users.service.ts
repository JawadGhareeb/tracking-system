import { API_ENDPOINTS } from "@/constant/endpoints";
import { apiClient } from "@/services/api-client";
import {
  ICreateUserPayload,
  IPagination,
  IUserBrief,
  IUpdateUserPayload,
  IUser,
  IUsersResponse,
} from "@/types";

interface IUserListQuery {
  page?: number;
  perPage?: number;
  minSalary?: number;
  maxSalary?: number;
  orderByAlpha?: 0 | 1;
}

interface IUserBriefResponse {
  users?: IUserBrief[];
}

function normalizeBriefUsersResponse(response: IUserBriefResponse): IUserBrief[] {
  if (!Array.isArray(response?.users)) {
    return [];
  }

  return response.users
    .filter((user) => user && typeof user._id === "string" && typeof user.name === "string")
    .map((user) => ({
      _id: user._id,
      name: user.name,
    }));
}

export const usersApiService = {
  getAll(query?: IUserListQuery) {
    return apiClient.get<IUsersResponse>(API_ENDPOINTS.users.list, {
      query: query as Record<string, string | number | undefined> | undefined,
    });
  },

  async getBrief() {
    const response = await apiClient.get<IUserBriefResponse>(API_ENDPOINTS.users.brief);

    return {
      users: normalizeBriefUsersResponse(response),
    };
  },

  getById(id: string) {
    return apiClient.get<IUser>(API_ENDPOINTS.users.byId(id));
  },

  create(payload: ICreateUserPayload) {
    return apiClient.post<IUser, ICreateUserPayload>(API_ENDPOINTS.users.list, {
      body: payload,
    });
  },

  update(id: string, payload: IUpdateUserPayload) {
    return apiClient.put<IUser, IUpdateUserPayload>(API_ENDPOINTS.users.byId(id), {
      body: payload,
    });
  },

  remove(id: string) {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.users.byId(id));
  },

  async toggleIsActive(user: IUser) {
    return usersApiService.update(user._id, {
      isActive: !user.isActive,
    });
  },
};

export const emptyUsersResponse: IUsersResponse = {
  users: [],
  pagination: {
    page: 1,
    perPage: 10,
    count: 0,
    documentCount: 0,
  } satisfies IPagination,
};
