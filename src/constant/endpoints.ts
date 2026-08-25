const FALLBACK_API_BASE_URL = "https://tracking-back-tyyq.vercel.app/api";

export const API_BASE_URL =
  process.env.NEXT_API_BASE_URL ??
  process.env.API_BASE_URL ??
  FALLBACK_API_BASE_URL;

export const AUTH_TOKEN_COOKIE = "hospital_auth_token";
export const AUTH_REFRESH_TOKEN_COOKIE = "hospital_refresh_token";
export const AUTH_ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
export const AUTH_REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
// Backward-compatible alias used by older server-cookie helpers.
export const AUTH_COOKIE_MAX_AGE = AUTH_ACCESS_COOKIE_MAX_AGE;

export const APP_AUTH_ENDPOINTS = {
  session: "/api/auth/session",
  refresh: "/api/auth/refresh",
} as const;

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    refresh: "/auth/refresh",
    me: "/auth/me",
  },
  users: {
    list: "/users",
    brief: "/users/brief",
    byId: (id: string) => `/users/${id}`,
  },
  roles: {
    list: "/roles",
    byId: (id: string) => `/roles/${id}`,
  },
  rawMaterials: {
    list: "/raw-materials",
    available: "/raw-materials/available",
    byId: (id: string) => `/raw-materials/${id}`,
  },
  expenses: {
    list: "/expenses",
    byId: (id: string) => `/expenses/${id}`,
  },
  dashboard: {
    finance: "/dashboard/finance",
    monthlyStats: "/dashboard/monthly-stats",
    summary: "/dashboard/summary",
  },
  orders: {
    list: "/orders",
    byId: (id: string) => `/orders/${id}`,
    my: "/orders/my",
    myById: (id: string) => `/orders/my/${id}`,
    assigned: "/orders/assigned",
    assignedById: (id: string) => `/orders/assigned/${id}`,
    assignment: (id: string) => `/orders/${id}/assignment`,
    status: (id: string) => `/orders/${id}/status`,
  },
} as const;
