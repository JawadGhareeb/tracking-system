import { NextRequest, NextResponse } from "next/server";
import {
  API_BASE_URL,
  API_ENDPOINTS,
  AUTH_ACCESS_COOKIE_MAX_AGE,
  AUTH_REFRESH_COOKIE_MAX_AGE,
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/constant/endpoints";
import { IRefreshTokenResponse } from "@/types";

function positiveMaxAge(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && Number(value) > 0 ? Math.floor(Number(value)) : fallback;
}

function cookieBase() {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.set(AUTH_TOKEN_COOKIE, "", { ...cookieBase(), maxAge: 0, httpOnly: false });
  response.cookies.set(AUTH_REFRESH_TOKEN_COOKIE, "", { ...cookieBase(), maxAge: 0, httpOnly: true });
}

function backendUrl(endpoint: string) {
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalized}`;
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(AUTH_REFRESH_TOKEN_COOKIE)?.value;
  const language = request.headers.get("accept-language")?.toLowerCase().startsWith("en") ? "en" : "ar";

  if (!refreshToken) {
    const response = NextResponse.json({ code: "SESSION_EXPIRED" }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl(API_ENDPOINTS.auth.refresh), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": language,
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ code: "REFRESH_UNAVAILABLE" }, { status: 503 });
  }

  let data: Partial<IRefreshTokenResponse> & { message?: string } = {};
  try {
    data = (await backendResponse.json()) as Partial<IRefreshTokenResponse> & { message?: string };
  } catch {
    // Keep the structured fallback below.
  }

  if (!backendResponse.ok) {
    const sessionExpired = backendResponse.status >= 400 && backendResponse.status < 500;
    const response = NextResponse.json(
      {
        code: sessionExpired ? "SESSION_EXPIRED" : "REFRESH_UNAVAILABLE",
        ...(data.message ? { message: data.message } : {}),
      },
      { status: sessionExpired ? 401 : 503 }
    );
    if (sessionExpired) clearSessionCookies(response);
    return response;
  }

  if (!data.accessToken || !data.refreshToken) {
    return NextResponse.json({ code: "REFRESH_UNAVAILABLE" }, { status: 503 });
  }

  const refreshMaxAge = positiveMaxAge(data.refreshTokenExpiresIn, AUTH_REFRESH_COOKIE_MAX_AGE);
  const accessMaxAge = Math.max(
    positiveMaxAge(data.accessTokenExpiresIn, AUTH_ACCESS_COOKIE_MAX_AGE),
    refreshMaxAge
  );
  const response = NextResponse.json({ accessToken: data.accessToken, user: data.user });
  response.cookies.set(AUTH_TOKEN_COOKIE, data.accessToken, {
    ...cookieBase(),
    maxAge: accessMaxAge,
    httpOnly: false,
  });
  response.cookies.set(AUTH_REFRESH_TOKEN_COOKIE, data.refreshToken, {
    ...cookieBase(),
    maxAge: refreshMaxAge,
    httpOnly: true,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
