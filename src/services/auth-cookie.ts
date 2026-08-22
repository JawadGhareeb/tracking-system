import { AUTH_COOKIE_MAX_AGE, AUTH_TOKEN_COOKIE } from "@/constant/endpoints";

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
  )}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax${secureFlag}`;
}

export function removeAuthTokenCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
