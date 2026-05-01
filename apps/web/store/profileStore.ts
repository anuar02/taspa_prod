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
  updatePhoto: (username: string, photoId: string, updater: (photo: Photo) => Photo) => void;
  removePhoto: (username: string, photoId: string) => void;
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
  updatePhoto: (username, photoId, updater) =>
    set((state) => {
      const entry = state.cache[username];

      if (!entry) {
        return state;
      }

      return {
        cache: {
          ...state.cache,
          [username]: {
            ...entry,
            posts: entry.posts.map((photo) => (photo._id === photoId ? updater(photo) : photo)),
            fetchedAt: Date.now(),
          },
        },
      };
    }),
  removePhoto: (username, photoId) =>
    set((state) => {
      const entry = state.cache[username];

      if (!entry) {
        return state;
      }

      return {
        cache: {
          ...state.cache,
          [username]: {
            ...entry,
            profile: {
              ...entry.profile,
              postsCount: Math.max(0, entry.profile.postsCount - 1),
            },
            posts: entry.posts.filter((photo) => photo._id !== photoId),
            fetchedAt: Date.now(),
          },
        },
      };
    }),
  isStale: (username) => {
    const entry = get().cache[username];
    if (!entry) return true;
    return Date.now() - entry.fetchedAt > STALE_MS;
  },
}));
