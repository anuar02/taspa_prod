"use client";

import { create } from "zustand";

import { Photo, UserProfile } from "@/lib/types";

const STALE_MS = 3 * 60 * 1000;

type ProfileEntry = {
  profile: UserProfile;
  posts: Photo[];
  fetchedAt: number;
};

type ProfileStore = {
  cache: Record<string, ProfileEntry>;
  setEntry: (username: string, profile: UserProfile, posts: Photo[]) => void;
  isStale: (username: string) => boolean;
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
  cache: {},
  setEntry: (username, profile, posts) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [username]: { profile, posts, fetchedAt: Date.now() },
      },
    })),
  isStale: (username) => {
    const entry = get().cache[username];
    if (!entry) return true;
    return Date.now() - entry.fetchedAt > STALE_MS;
  },
}));
