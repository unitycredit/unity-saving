import type { AuthProvider, AuthSession } from "@/lib/auth/types";

/**
 * Public dashboard (current mode).
 * Swap this provider with a Cognito-backed implementation later.
 */
export const publicAuth: AuthProvider = {
  async getSession(_req: Request): Promise<AuthSession | null> {
    return null;
  },
};


