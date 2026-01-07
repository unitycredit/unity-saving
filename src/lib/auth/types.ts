export type AuthUser = {
  sub: string;
  email?: string;
};

export type AuthSession = {
  user: AuthUser;
  // future: tokens, groups, etc.
};

/**
 * Future-proofing:
 * - Start with a "public" implementation (no auth).
 * - Later swap in a Cognito implementation that reads cookies/headers.
 */
export interface AuthProvider {
  getSession(req: Request): Promise<AuthSession | null>;
}


