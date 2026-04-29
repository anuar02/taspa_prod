"use client";

import { create } from "zustand";

type Category = {
  key: string;
  label: string;
  previewUrl: string;
};

type Trend = {
  tag: string;
  count: number;
};

const STALE_MS = 10 * 60 * 1000;

type SearchStore = {
  categories: Category[];
  trending: Trend[];
  fetchedAt: number | null;
  setMeta: (categories: Category[], trending: Trend[]) => void;
  isStale: () => boolean;
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  categories: [],
  trending: [],
  fetchedAt: null,
  setMeta: (categories, trending) => set({ categories, trending, fetchedAt: Date.now() }),
  isStale: () => {
    const { fetchedAt } = get();
    if (fetchedAt === null) return true;
    return Date.now() - fetchedAt > STALE_MS;
  },
}));
