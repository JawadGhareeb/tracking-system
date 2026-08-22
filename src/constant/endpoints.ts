const FALLBACK_API_BASE_URL = "https://tracking-back-tyyq.vercel.app/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  FALLBACK_API_BASE_URL;

export const AUTH_TOKEN_COOKIE = "hospital_auth_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
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
  orders: {
    list: "/orders",
    byId: (id: string) => `/orders/${id}`,
  },
} as const;
