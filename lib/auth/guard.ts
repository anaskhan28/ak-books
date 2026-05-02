"use server";

import { auth } from "@/lib/auth/server";
import { AUTHORIZED_EMAILS } from "@/lib/auth/constants";

/**
 * Verifies the current user is authenticated and authorized.
 * Call this at the top of every mutation server action.
 * Throws if the session is missing or the user email is not in the allowlist.
 */
export async function requireAuth() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    throw new Error("Unauthorized: No active session");
  }

  if (
    !AUTHORIZED_EMAILS.some(
      (e) => e.toLowerCase() === session.user.email?.toLowerCase()
    )
  ) {
    throw new Error("Forbidden: User is not authorized");
  }

  return session;
}
