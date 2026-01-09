import { cookies } from "next/headers";

import { COGNITO_ID_TOKEN_COOKIE, getJwtPayload, isJwtExpired } from "@/lib/auth/cognitoCookies";

export type AwsUserIdentity = {
  userId: string;
  email?: string;
};

export function getAuthedUser(): AwsUserIdentity | null {
  const token = cookies().get(COGNITO_ID_TOKEN_COOKIE)?.value;
  if (!token) return null;
  if (isJwtExpired(token)) return null;

  const payload = getJwtPayload(token);
  if (!payload) return null;

  const sub = payload.sub;
  const email = payload.email;
  const userId = typeof sub === "string" && sub.trim() ? sub.trim() : typeof email === "string" ? email : "";
  if (!userId) return null;

  return { userId, email: typeof email === "string" ? email : undefined };
}


