"use client";

import { create } from "zustand";

import { Photo } from "@/lib/types";

const STALE_MS = 5 * 60 * 1000;

type SavedStore = {
  items: Photo[];
  fetchedAt: number | null;
  isDirty: boolean;
  setItems: (items: Photo[]) => void;
  markDirty: () => void;
  syncItem: (photo: Photo, saved: boolean) => void;
  updateItem: (photoId: string, updater: (photo: Photo) => Photo) => void;
  removeItem: (photoId: string) => void;
  isStale: () => boolean;
};

export const useSavedStore = create<SavedStore>((set, get) => ({
  items: [],
  fetchedAt: null,
  isDirty: false,
  setItems: (items) => set({ items, fetchedAt: Date.now(), isDirty: false }),
  markDirty: () => set({ isDirty: true }),
  syncItem: (photo, saved) =>
    set((state) => {
      if (state.fetchedAt === null) {
        return { isDirty: true };
      }

      const nextItems = saved
        ? [photo, ...state.items.filter((item) => item._id !== photo._id)]
        : state.items.filter((item) => item._id !== photo._id);

      return {
        items: nextItems,
        fetchedAt: Date.now(),
        isDirty: false
      };
    }),
  updateItem: (photoId, updater) =>
    set((state) => ({
      items: state.items.map((item) => (item._id === photoId ? updater(item) : item))
    })),
  removeItem: (photoId) =>
    set((state) => ({
      items: state.items.filter((item) => item._id !== photoId)
    })),
  isStale: () => {
    const { fetchedAt, isDirty } = get();
    if (isDirty || fetchedAt === null) return true;
    return Date.now() - fetchedAt > STALE_MS;
  },
}));
