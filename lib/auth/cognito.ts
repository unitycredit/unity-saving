import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";

export function getCognitoConfig() {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const region = process.env.NEXT_PUBLIC_AWS_REGION;

  if (!userPoolId || !clientId || !region) {
    throw new Error(
      "Missing Cognito env vars. Set NEXT_PUBLIC_COGNITO_USER_POOL_ID, NEXT_PUBLIC_COGNITO_CLIENT_ID, NEXT_PUBLIC_AWS_REGION.",
    );
  }

  return { userPoolId, clientId, region };
}

export function getUserPool() {
  const { userPoolId, clientId } = getCognitoConfig();
  return new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId });
}

export async function signInWithCognito(username: string, password: string) {
  const pool = getUserPool();
  const user = new CognitoUser({ Username: username, Pool: pool });
  const authDetails = new AuthenticationDetails({
    Username: username,
    Password: password,
  });

  return await new Promise<{
    idToken: string;
    accessToken: string;
    refreshToken: string;
  }>((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        resolve({
          idToken: session.getIdToken().getJwtToken(),
          accessToken: session.getAccessToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
        });
      },
      onFailure: (err) => reject(err),
      // If you enable MFA/verification later, handle it here.
      newPasswordRequired: () => reject(new Error("New password required")),
      mfaRequired: () => reject(new Error("MFA required")),
      totpRequired: () => reject(new Error("TOTP required")),
    });
  });
}


