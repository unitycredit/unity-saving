export const COGNITO_ID_TOKEN_COOKIE = "cognito_id_token";
export const COGNITO_ACCESS_TOKEN_COOKIE = "cognito_access_token";

function base64UrlToBase64(input: string) {
  return input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
}

function decodeBase64(base64: string) {
  // atob is available in browsers + Edge runtime. In Node.js, prefer Buffer.
  if (typeof atob === "function") return atob(base64);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof Buffer !== "undefined") return Buffer.from(base64, "base64").toString("utf8");
  return "";
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  const payloadPart = parts[1]!;

  const json = decodeBase64(base64UrlToBase64(payloadPart));
  return safeJsonParse<Record<string, unknown>>(json);
}

export function getJwtExpSeconds(jwt: string): number | null {
  const payload = getJwtPayload(jwt);
  const exp = payload?.exp;
  return typeof exp === "number" ? exp : null;
}

export function isJwtExpired(jwt: string, nowMs = Date.now()): boolean {
  const expSeconds = getJwtExpSeconds(jwt);
  if (!expSeconds) return true;
  return expSeconds * 1000 <= nowMs;
}

export function getCookieFromString(cookieString: string, name: string): string | undefined {
  const parts = cookieString.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(eq + 1));
  }
  return undefined;
}


