import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Creates an httpOnly session cookie from a Cognito token.
 * Middleware uses this cookie to protect routes.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { idToken?: string; redirectTo?: string }
    | null;

  const idToken = body?.idToken?.trim();
  if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

  const redirectTo = body?.redirectTo?.toString() || "/";
  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";

  res.cookies.set("unity_id_token", idToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });

  res.cookies.set("unity_redirect_to", redirectTo, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
  });

  return res;
}


