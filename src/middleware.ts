import { NextRequest, NextResponse } from "next/server";
import { AUTH_REFRESH_TOKEN_COOKIE, AUTH_TOKEN_COOKIE } from "@/constant/endpoints";

const PROTECTED_PREFIXES = ["/dashboard", "/employees", "/customers", "/orders", "/roles", "/raw-materials", "/my-orders", "/account", "/employee"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const needsAuth = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (needsAuth) {
    const hasAccessToken = Boolean(request.cookies.get(AUTH_TOKEN_COOKIE)?.value);
    const hasRefreshToken = Boolean(request.cookies.get(AUTH_REFRESH_TOKEN_COOKIE)?.value);
    if (!hasAccessToken && !hasRefreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
