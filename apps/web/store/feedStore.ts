"use client";

import { create } from "zustand";

import { Photo } from "@/lib/types";

function uniquePhotos(items: Photo[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item._id)) {
      return false;
    }

    seen.add(item._id);
    return true;
  });
}

type FeedState = {
  items: Photo[];
  page: number;
  hasMore: boolean;
  setItems: (items: Photo[], page: number) => void;
  appendItems: (items: Photo[], page: number) => void;
};

export const useFeedStore = create<FeedState>((set) => ({
  items: [],
  page: 1,
  hasMore: true,
  setItems: (items, page) => set({ items: uniquePhotos(items), page, hasMore: items.length > 0 }),
  appendItems: (items, page) =>
    set((state) => ({
      items: uniquePhotos([...state.items, ...items]),
      page,
      hasMore: items.length > 0
    }))
}));
