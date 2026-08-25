import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_ACCESS_COOKIE_MAX_AGE,
  AUTH_REFRESH_COOKIE_MAX_AGE,
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/constant/endpoints";

interface ISessionPayload {
  accessToken?: unknown;
  refreshToken?: unknown;
  accessTokenExpiresIn?: unknown;
  refreshTokenExpiresIn?: unknown;
}

function positiveMaxAge(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : fallback;
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

export async function POST(request: NextRequest) {
  let body: ISessionPayload;
  try {
    body = (await request.json()) as ISessionPayload;
  } catch {
    return NextResponse.json({ message: "Invalid session payload" }, { status: 400 });
  }

  if (typeof body.accessToken !== "string" || typeof body.refreshToken !== "string") {
    return NextResponse.json({ message: "Access and refresh tokens are required" }, { status: 400 });
  }

  const refreshMaxAge = positiveMaxAge(body.refreshTokenExpiresIn, AUTH_REFRESH_COOKIE_MAX_AGE);
  const accessMaxAge = Math.max(
    positiveMaxAge(body.accessTokenExpiresIn, AUTH_ACCESS_COOKIE_MAX_AGE),
    refreshMaxAge
  );
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_TOKEN_COOKIE, body.accessToken, {
    ...cookieBase(),
    maxAge: accessMaxAge,
    httpOnly: false,
  });
  response.cookies.set(AUTH_REFRESH_TOKEN_COOKIE, body.refreshToken, {
    ...cookieBase(),
    maxAge: refreshMaxAge,
    httpOnly: true,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function DELETE() {
  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
