"use client";

import * as React from "react";

export type User = {
  sub: string;
  email?: string;
  emailVerified?: boolean;
};

export type UserContextValue = {
  /**
   * Public mode (now): null.
   * Future: populated via AWS Cognito (JWT/session) + email verification state.
   */
  user: User | null;
  /**
   * Future: trigger a refresh after login/logout/verification.
   */
  refreshUser: () => Promise<void>;
};

const UserContext = React.createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const refreshUser = React.useCallback(async () => {
    // Public dashboard today; Cognito later.
    return;
  }, []);

  const value = React.useMemo<UserContextValue>(
    () => ({
      user: null,
      refreshUser,
    }),
    [refreshUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider />");
  return ctx;
}


