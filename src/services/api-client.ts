import { API_BASE_URL, APP_AUTH_ENDPOINTS } from "@/constant/endpoints";
import { clearAuthSession, getAuthTokenCookie } from "@/services/auth-cookie";
import i18n from "@/lib/i18n";

type QueryValue = string | number | boolean | null | undefined;

type TokenResolver = () => string | null | Promise<string | null>;

interface IRefreshResponse {
  accessToken?: string;
  code?: string;
}

type RefreshResult =
  | { status: "refreshed"; accessToken: string }
  | { status: "expired" }
  | { status: "unavailable" };

let refreshPromise: Promise<RefreshResult> | null = null;

async function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async (): Promise<RefreshResult> => {
    const language = i18n.resolvedLanguage?.toLowerCase().startsWith("en") ? "en" : "ar";
    let response: Response;
    try {
      response = await fetch(APP_AUTH_ENDPOINTS.refresh, {
        method: "POST",
        headers: { "Accept-Language": language },
        cache: "no-store",
      });
    } catch {
      return { status: "unavailable" };
    }

    let data: IRefreshResponse = {};
    try {
      data = (await response.json()) as IRefreshResponse;
    } catch {
      // Fall through to status handling.
    }

    if (response.ok && data.accessToken) {
      return { status: "refreshed", accessToken: data.accessToken };
    }

    if (response.status === 401 || data.code === "SESSION_EXPIRED") {
      await clearAuthSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
        window.location.assign("/login");
      }
      return { status: "expired" };
    }

    return { status: "unavailable" };
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

interface IRequestOptions<TBody = unknown>
  extends Omit<RequestInit, "method" | "body" | "headers"> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: HeadersInit;
  query?: Record<string, QueryValue>;
  body?: TBody;
  auth?: boolean;
  token?: string | null;
}

function buildRequestUrl(
  endpoint: string,
  query?: Record<string, QueryValue>
): string {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(`${API_BASE_URL}${normalizedEndpoint}`);

  if (!query) {
    return url.toString();
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function toApiError(response: Response): Promise<Error> {
  let message = i18n.t("apiErrors.requestFailed", { status: response.status });

  try {
    const data = (await response.json()) as { message?: string };
    if (data?.message) {
      message = data.message;
    }
  } catch {
    // تجاهل فشل تحليل الاستجابة والاحتفاظ بالرسالة الافتراضية.
  }

  return new Error(message);
}

export function createApiClient(tokenResolver?: TokenResolver) {
  async function request<TResponse, TBody = unknown>(
    endpoint: string,
    options: IRequestOptions<TBody> = {},
    hasRetriedAfterRefresh = false
  ): Promise<TResponse> {
    const {
      method = "GET",
      headers,
      query,
      body,
      auth = true,
      token,
      ...rest
    } = options;

    const resolvedToken =
      token ?? (tokenResolver ? await tokenResolver() : getAuthTokenCookie());

    const requestHeaders = new Headers(headers);
    const language = i18n.resolvedLanguage?.toLowerCase().startsWith("en") ? "en" : "ar";
    requestHeaders.set("Accept-Language", language);

    if (auth && resolvedToken) {
      requestHeaders.set("Authorization", `Bearer ${resolvedToken}`);
    }

    const shouldSendBody = body !== undefined && body !== null;
    const payload = shouldSendBody
      ? isFormData(body)
        ? body
        : JSON.stringify(body)
      : undefined;

    if (shouldSendBody && !isFormData(body) && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const response = await fetch(buildRequestUrl(endpoint, query), {
      method,
      headers: requestHeaders,
      body: payload,
      cache: "no-store",
      ...rest,
    });

    if (response.status === 401 && auth && !hasRetriedAfterRefresh && token === undefined) {
      const refreshResult = await refreshAccessToken();
      if (refreshResult.status === "refreshed") {
        return request<TResponse, TBody>(
          endpoint,
          { ...options, token: refreshResult.accessToken },
          true
        );
      }
      if (refreshResult.status === "expired") {
        throw new Error(i18n.t("apiErrors.sessionExpired"));
      }
      throw new Error(i18n.t("apiErrors.refreshUnavailable"));
    }

    if (!response.ok) {
      throw await toApiError(response);
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  }

  return {
    get: <TResponse>(
      endpoint: string,
      options?: Omit<IRequestOptions, "method" | "body">
    ) => request<TResponse>(endpoint, { ...options, method: "GET" }),

    post: <TResponse, TBody = unknown>(
      endpoint: string,
      options?: Omit<IRequestOptions<TBody>, "method">
    ) => request<TResponse, TBody>(endpoint, { ...options, method: "POST" }),

    put: <TResponse, TBody = unknown>(
      endpoint: string,
      options?: Omit<IRequestOptions<TBody>, "method">
    ) => request<TResponse, TBody>(endpoint, { ...options, method: "PUT" }),

    patch: <TResponse, TBody = unknown>(
      endpoint: string,
      options?: Omit<IRequestOptions<TBody>, "method">
    ) => request<TResponse, TBody>(endpoint, { ...options, method: "PATCH" }),

    delete: <TResponse>(
      endpoint: string,
      options?: Omit<IRequestOptions, "method" | "body">
    ) => request<TResponse>(endpoint, { ...options, method: "DELETE" }),
  };
}

export const apiClient = createApiClient();
