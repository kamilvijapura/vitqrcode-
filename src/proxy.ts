import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, verifyUserToken, ADMIN_COOKIE, USER_COOKIE } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ── Admin route protection ── */
  if (pathname.startsWith("/admin")) {
    // Allow login page through
    if (pathname === "/admin/login") return NextResponse.next();

    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    const session = await verifyAdminToken(token);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    // Forward session info to server components via request headers
    const res = NextResponse.next();
    res.headers.set("x-admin-id", String(session.adminId));
    res.headers.set("x-admin-email", session.email);
    res.headers.set("x-admin-name", session.name);
    return res;
  }

  /* ── Consumer (app) route protection ── */
  if (pathname.startsWith("/app")) {
    // Allow login page through
    if (pathname === "/app/login") return NextResponse.next();

    const token = req.cookies.get(USER_COOKIE)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/app/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    const session = await verifyUserToken(token);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/app/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    // Forward session info to server components
    const res = NextResponse.next();
    res.headers.set("x-user-id", String(session.userId));
    res.headers.set("x-user-name", session.name);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/app/:path*"],
};
