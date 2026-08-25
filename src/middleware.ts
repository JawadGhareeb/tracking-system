import { NextRequest, NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE } from "@/constant/endpoints";

const PROTECTED_PREFIXES = ["/dashboard", "/employees", "/orders", "/roles", "/raw-materials", "/expenses"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const needsAuth = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (needsAuth && !request.cookies.get(AUTH_TOKEN_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
