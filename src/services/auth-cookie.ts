import {
  APP_AUTH_ENDPOINTS,
  AUTH_ACCESS_COOKIE_MAX_AGE,
  AUTH_TOKEN_COOKIE,
} from "@/constant/endpoints";
import { IAuthTokenBundle } from "@/types";

export function getAuthTokenCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const tokenCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${AUTH_TOKEN_COOKIE}=`));

  if (!tokenCookie) {
    return null;
  }

  const token = tokenCookie.split("=")[1];
  return token ? decodeURIComponent(token) : null;
}

export function setAuthTokenCookie(token: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(
    token
  )}; Path=/; Max-Age=${AUTH_ACCESS_COOKIE_MAX_AGE}; SameSite=Lax${secureFlag}`;
}

export function removeAuthTokenCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const data = (await response.json()) as { message?: string };
    return typeof data?.message === "string" ? data.message : null;
  } catch {
    return null;
  }
}

export async function persistAuthSession(tokens: IAuthTokenBundle): Promise<void> {
  const response = await fetch(APP_AUTH_ENDPOINTS.session, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: tokens.accessToken || tokens.token,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresIn: tokens.accessTokenExpiresIn,
      refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error((await readErrorMessage(response)) || "Unable to persist auth session");
  }
}

export async function clearAuthSession(): Promise<void> {
  removeAuthTokenCookie();
  try {
    await fetch(APP_AUTH_ENDPOINTS.session, {
      method: "DELETE",
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // The access cookie is already cleared locally. The server cookie will be
    // cleared on the next successful session request if this transient call fails.
  }
}
