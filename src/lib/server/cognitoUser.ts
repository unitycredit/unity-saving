import { cookies } from "next/headers";

import { COGNITO_ID_TOKEN_COOKIE, getJwtPayload, isJwtExpired } from "@/lib/auth/cognitoCookies";

export type CognitoCookieUser = {
  userId: string; // stable id for per-user storage (sub/email)
};

export function getCognitoCookieUser(): CognitoCookieUser | null {
  const token = cookies().get(COGNITO_ID_TOKEN_COOKIE)?.value;
  if (!token) return null;
  if (isJwtExpired(token)) return null;

  const payload = getJwtPayload(token);
  const sub = payload?.sub;
  const email = payload?.email;

  const userId = typeof sub === "string" ? sub : typeof email === "string" ? email : null;
  if (!userId) return null;
  return { userId };
}


