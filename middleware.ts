import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/login",
});

export const config = {
  matcher: [
    // Match all paths except static files, images, favicon, login page, and auth API
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
