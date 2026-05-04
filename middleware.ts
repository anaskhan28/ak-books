import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  // Allow Server Actions to pass through (they are POST with Next-Action header)
  if (request.headers.get("next-action")) {
    return NextResponse.next();
  }

  // For all other routes, apply auth middleware
  return (auth.middleware({ loginUrl: "/login" }) as any)(request);
}

export const config = {
  matcher: [
    // Match all paths except static files, images, favicon, login page, and auth API
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
