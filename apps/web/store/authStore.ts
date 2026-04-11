"use client";

import { create } from "zustand";

type AuthUser = {
  _id: string;
  username: string;
  email: string;
  displayName: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (payload: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setSession: ({ user, accessToken, refreshToken }) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("taspa.accessToken", accessToken);
      window.localStorage.setItem("taspa.refreshToken", refreshToken);
    }

    set({ user, accessToken, refreshToken });
  },
  clearSession: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("taspa.accessToken");
      window.localStorage.removeItem("taspa.refreshToken");
    }

    set({ user: null, accessToken: null, refreshToken: null });
  }
}));
