"use client";

import { create } from "zustand";

import { Photo } from "@/lib/types";

export type FeedTabKey = "all" | "popular" | "following";

type TabState = {
  items: Photo[];
  page: number;
  hasMore: boolean;
  fetchedAt: number | null;
};

const STALE_MS = 3 * 60 * 1000;

function uniquePhotos(items: Photo[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item._id)) return false;
    seen.add(item._id);
    return true;
  });
}

function emptyTab(): TabState {
  return { items: [], page: 1, hasMore: true, fetchedAt: null };
}

type FeedStore = {
  tabs: Record<FeedTabKey, TabState>;
  isStale: (tab: FeedTabKey) => boolean;
  setTabItems: (tab: FeedTabKey, items: Photo[], page: number) => void;
  appendTabItems: (tab: FeedTabKey, items: Photo[], page: number) => void;
};

export const useFeedStore = create<FeedStore>((set, get) => ({
  tabs: {
    all: emptyTab(),
    popular: emptyTab(),
    following: emptyTab(),
  },
  isStale: (tab) => {
    const { fetchedAt } = get().tabs[tab];
    if (fetchedAt === null) return true;
    return Date.now() - fetchedAt > STALE_MS;
  },
  setTabItems: (tab, items, page) =>
    set((state) => ({
      tabs: {
        ...state.tabs,
        [tab]: {
          items: uniquePhotos(items),
          page,
          hasMore: items.length > 0,
          fetchedAt: Date.now(),
        },
      },
    })),
  appendTabItems: (tab, items, page) =>
    set((state) => ({
      tabs: {
        ...state.tabs,
        [tab]: {
          items: uniquePhotos([...state.tabs[tab].items, ...items]),
          page,
          hasMore: items.length > 0,
          fetchedAt: state.tabs[tab].fetchedAt ?? Date.now(),
        },
      },
    })),
}));
