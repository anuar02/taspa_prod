"use client";

import { create } from "zustand";

import { Photo } from "@/lib/types";

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
  setItems: (items, page) => set({ items, page, hasMore: items.length > 0 }),
  appendItems: (items, page) =>
    set((state) => ({
      items: [...state.items, ...items],
      page,
      hasMore: items.length > 0
    }))
}));
