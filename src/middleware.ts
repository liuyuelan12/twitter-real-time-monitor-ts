import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("session")?.value;
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect /admin (but not /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("admin_session")?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", request.url));
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if ((payload as any).role !== "admin") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
