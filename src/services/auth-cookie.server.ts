import { cookies } from "next/headers";
import {
  AUTH_ACCESS_COOKIE_MAX_AGE,
  AUTH_REFRESH_COOKIE_MAX_AGE,
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/constant/endpoints";

function positiveMaxAge(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && Number(value) > 0 ? Math.floor(Number(value)) : fallback;
}

function baseCookieOptions() {
  return {
    path: "/" as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function getServerAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? null;
}

export async function getServerRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_REFRESH_TOKEN_COOKIE)?.value ?? null;
}

export async function setServerAuthTokens(
  accessToken: string,
  refreshToken: string,
  accessTokenExpiresIn?: number,
  refreshTokenExpiresIn?: number
): Promise<void> {
  const cookieStore = await cookies();
  const refreshMaxAge = positiveMaxAge(refreshTokenExpiresIn, AUTH_REFRESH_COOKIE_MAX_AGE);
  // Keep the access cookie for the session lifetime. JWT exp is still enforced by
  // the backend; keeping the expired value lets the client transparently refresh it.
  const accessMaxAge = Math.max(
    positiveMaxAge(accessTokenExpiresIn, AUTH_ACCESS_COOKIE_MAX_AGE),
    refreshMaxAge
  );

  cookieStore.set(AUTH_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions(),
    maxAge: accessMaxAge,
    httpOnly: false,
  });
  cookieStore.set(AUTH_REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    maxAge: refreshMaxAge,
    httpOnly: true,
  });
}

export async function clearServerAuthTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_TOKEN_COOKIE, "", {
    ...baseCookieOptions(),
    maxAge: 0,
    httpOnly: false,
  });
  cookieStore.set(AUTH_REFRESH_TOKEN_COOKIE, "", {
    ...baseCookieOptions(),
    maxAge: 0,
    httpOnly: true,
  });
}

// Backward-compatible helpers for legacy server actions.
export async function setServerAuthToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_TOKEN_COOKIE, token, {
    ...baseCookieOptions(),
    maxAge: AUTH_ACCESS_COOKIE_MAX_AGE,
    httpOnly: false,
  });
}

export async function clearServerAuthToken(): Promise<void> {
  await clearServerAuthTokens();
}
