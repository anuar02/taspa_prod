"use client";

import { useEffect } from "react";

import { useNotificationStore } from "@/store/notificationStore";

export function NotificationTray() {
  const items = useNotificationStore((state) => state.items);
  const remove = useNotificationStore((state) => state.remove);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const timers = items.map((item) =>
      window.setTimeout(() => {
        remove(item.id);
      }, 4000)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [items, remove]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-40 flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl bg-text px-4 py-3 text-sm text-white shadow-card">
          {item.message}
        </div>
      ))}
    </div>
  );
}
