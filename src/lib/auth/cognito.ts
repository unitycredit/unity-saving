"use client";

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";
import {
  COGNITO_ACCESS_TOKEN_COOKIE,
  COGNITO_ID_TOKEN_COOKIE,
  getJwtExpSeconds,
} from "@/lib/auth/cognitoCookies";

export type CognitoTokens = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAtSeconds: number | null;
};

function getUserPool() {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId) {
    throw new Error(
      "Missing Cognito env vars. Set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID in .env.local",
    );
  }
  return new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId });
}

function sessionToTokens(session: CognitoUserSession): CognitoTokens {
  const idToken = session.getIdToken().getJwtToken();
  const accessToken = session.getAccessToken().getJwtToken();
  const refreshToken = session.getRefreshToken().getToken();
  const expiresAtSeconds = getJwtExpSeconds(idToken);
  return { idToken, accessToken, refreshToken, expiresAtSeconds };
}

export async function cognitoSignIn(params: {
  username: string;
  password: string;
}): Promise<CognitoTokens> {
  const { username, password } = params;
  const pool = getUserPool();

  const cognitoUser = new CognitoUser({ Username: username, Pool: pool });
  const details = new AuthenticationDetails({ Username: username, Password: password });

  return await new Promise<CognitoTokens>((resolve, reject) => {
    cognitoUser.authenticateUser(details, {
      onSuccess: (session) => resolve(sessionToTokens(session)),
      onFailure: (err) => {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err && "message" in err
              ? String((err as { message?: unknown }).message ?? "Sign-in failed")
              : "Sign-in failed";
        reject(new Error(message));
      },
      newPasswordRequired: () => {
        reject(new Error("New password required (not implemented on this page)."));
      },
    });
  });
}

export function setCognitoTokenCookies(tokens: Pick<CognitoTokens, "idToken" | "accessToken">) {
  const { idToken, accessToken } = tokens;

  const expSeconds = getJwtExpSeconds(idToken);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const maxAge = expSeconds ? Math.max(0, expSeconds - nowSeconds) : 60 * 60;

  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const common = `Path=/; Max-Age=${maxAge}; SameSite=Lax;${secure ? " Secure;" : ""}`;

  document.cookie = `${COGNITO_ID_TOKEN_COOKIE}=${encodeURIComponent(idToken)}; ${common}`;
  document.cookie = `${COGNITO_ACCESS_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}; ${common}`;
}

export function clearCognitoTokenCookies() {
  document.cookie = `${COGNITO_ID_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax;`;
  document.cookie = `${COGNITO_ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax;`;
}


