"use client";

import { create } from "zustand";

type AuthUser = {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (payload: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  updateUser: (user: Partial<AuthUser>) => void;
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
  updateUser: (user) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...user } : null
    })),
  clearSession: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("taspa.accessToken");
      window.localStorage.removeItem("taspa.refreshToken");
    }

    set({ user: null, accessToken: null, refreshToken: null });
  }
}));
