import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/gate", "/api/gate"];
const PUBLIC_PREFIXES = ["/_next/", "/favicon", "/generated/", "/icons/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // Check for access cookie
  const cookie = req.cookies.get("site_access");
  if (cookie?.value === "granted") {
    return NextResponse.next();
  }

  // Redirect to gate, preserving the original destination
  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|generated).*)",
  ],
};
