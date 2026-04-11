"use client";

import { create } from "zustand";

type NotificationItem = {
  id: string;
  message: string;
};

type NotificationState = {
  items: NotificationItem[];
  push: (item: NotificationItem) => void;
  remove: (id: string) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  push: (item) =>
    set((state) => ({
      items: [item, ...state.items].slice(0, 3)
    })),
  remove: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id)
    }))
}));
