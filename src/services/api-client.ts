import { API_BASE_URL } from "@/constant/endpoints";
import { getAuthTokenCookie } from "@/services/auth-cookie";

type QueryValue = string | number | boolean | null | undefined;

type TokenResolver = () => string | null | Promise<string | null>;

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
  let message = `فشل تنفيذ الطلب. رمز الحالة: ${response.status}`;

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
    options: IRequestOptions<TBody> = {}
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
