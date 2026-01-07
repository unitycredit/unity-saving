"use client";

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
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

export function getCognitoUserPool() {
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

export async function signIn(params: { username: string; password: string }): Promise<CognitoTokens> {
  const { username, password } = params;
  const pool = getCognitoUserPool();

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

export async function signUp(params: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<{ userConfirmed: boolean }> {
  const { firstName, lastName, email, password } = params;
  const pool = getCognitoUserPool();

  const attributes = [
    new CognitoUserAttribute({ Name: "given_name", Value: firstName }),
    new CognitoUserAttribute({ Name: "family_name", Value: lastName }),
    new CognitoUserAttribute({ Name: "email", Value: email }),
  ];

  return await new Promise((resolve, reject) => {
    pool.signUp(email, password, attributes, [], (err, result) => {
      if (err) {
        reject(new Error(err.message || "Sign-up failed"));
        return;
      }
      resolve({ userConfirmed: Boolean(result?.userConfirmed) });
    });
  });
}

export async function confirmSignUp(params: { email: string; code: string }): Promise<void> {
  const { email, code } = params;
  const pool = getCognitoUserPool();
  const user = new CognitoUser({ Username: email, Pool: pool });
  await new Promise<void>((resolve, reject) => {
    user.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(new Error(err.message || "Confirmation failed"));
        return;
      }
      resolve();
    });
  });
}

export async function resendSignUpCode(params: { email: string }): Promise<void> {
  const { email } = params;
  const pool = getCognitoUserPool();
  const user = new CognitoUser({ Username: email, Pool: pool });
  await new Promise<void>((resolve, reject) => {
    user.resendConfirmationCode((err) => {
      if (err) {
        reject(new Error(err.message || "Resend failed"));
        return;
      }
      resolve();
    });
  });
}

export function setAuthCookies(tokens: Pick<CognitoTokens, "idToken" | "accessToken">) {
  const { idToken, accessToken } = tokens;

  const expSeconds = getJwtExpSeconds(idToken);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const maxAge = expSeconds ? Math.max(0, expSeconds - nowSeconds) : 60 * 60;

  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const common = `Path=/; Max-Age=${maxAge}; SameSite=Lax;${secure ? " Secure;" : ""}`;

  document.cookie = `${COGNITO_ID_TOKEN_COOKIE}=${encodeURIComponent(idToken)}; ${common}`;
  document.cookie = `${COGNITO_ACCESS_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}; ${common}`;
}

export function clearAuthCookies() {
  document.cookie = `${COGNITO_ID_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax;`;
  document.cookie = `${COGNITO_ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax;`;
}


