"use client";

import { useEffect, useRef, useState } from "react";

import { TopBar } from "@/components/layout/TopBar";
import { PhotoGrid } from "@/components/photo/PhotoGrid";
import { api } from "@/lib/api";
import { Photo } from "@/lib/types";
import { useFeedStore, FeedTabKey } from "@/store/feedStore";

const TABS = [
  { key: "all" as FeedTabKey, label: "Барлығы" },
  { key: "popular" as FeedTabKey, label: "Танымал" },
  { key: "following" as FeedTabKey, label: "Ұйымшан" },
];

export default function FeedPage() {
  const { tabs: tabData, setTabItems, appendTabItems } = useFeedStore();
  const [tab, setTab] = useState<FeedTabKey>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);
  const requestedRef = useRef(new Set<string>());

  const current = tabData[tab];

  // Initial load / stale-while-revalidate per tab
  useEffect(() => {
    requestedRef.current = new Set();
    inFlightRef.current = false;

    const { tabs, isStale } = useFeedStore.getState();
    const snap = tabs[tab];

    // Fresh data — show immediately, no fetch needed
    if (!isStale(tab) && snap.items.length > 0) {
      setLoading(false);
      setError("");
      return;
    }

    const key = `${tab}-1`;
    requestedRef.current.add(key);

    const isBackground = snap.items.length > 0; // stale-while-revalidate

    async function load() {
      inFlightRef.current = true;
      if (!isBackground) setLoading(true);
      setError("");
      try {
        const { data } = await api.get<{ items: Photo[] }>("/photos", {
          params: { tab, page: 1, limit: 12 },
        });
        setTabItems(tab, data.items, 1);
      } catch {
        requestedRef.current.delete(key);
        if (!isBackground) setError("Лента жүктелмеді. Байланысты тексеріңіз.");
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    }

    void load();
  }, [tab, setTabItems]);

  // Infinite scroll sentinel
  useEffect(() => {
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      const { tabs: td } = useFeedStore.getState();
      const snap = td[tab];
      const nextPage = snap.page + 1;
      const key = `${tab}-${nextPage}`;

      if (
        !entry?.isIntersecting ||
        loading ||
        !snap.hasMore ||
        snap.items.length === 0 ||
        inFlightRef.current ||
        requestedRef.current.has(key)
      ) {
        return;
      }

      requestedRef.current.add(key);
      inFlightRef.current = true;
      setLoading(true);
      try {
        const { data } = await api.get<{ items: Photo[] }>("/photos", {
          params: { tab, page: nextPage, limit: 12 },
        });
        appendTabItems(tab, data.items, nextPage);
      } catch {
        requestedRef.current.delete(key);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [appendTabItems, current.hasMore, current.page, loading, tab]);

  function handleTabChange(key: FeedTabKey) {
    if (key === tab) return;
    setError("");
    setTab(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main>
      <TopBar title="Лента" subtitle="Соңғы фотолар мен танымал сәттер" />
      <div className="mb-5 flex gap-2 overflow-auto pb-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleTabChange(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === item.key ? "bg-primary text-white" : "bg-white text-muted shadow-card"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error ? (
        <p className="mt-8 text-center text-sm text-danger">{error}</p>
      ) : loading && current.items.length === 0 ? (
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 [@media(min-width:1800px)]:columns-7 [@media(min-width:2200px)]:columns-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className={`skeleton mb-4 break-inside-avoid rounded-[28px] ${index % 2 === 0 ? "h-80" : "h-60"}`}
            />
          ))}
        </div>
      ) : (
        <>
          <PhotoGrid items={current.items} />
          <div ref={sentinelRef} className="py-8 text-center text-sm text-muted">
            {loading
              ? "Жүктелуде..."
              : current.hasMore
                ? "Көбірек көрсету"
                : current.items.length > 0
                  ? "Фото аяқталды"
                  : ""}
          </div>
        </>
      )}
    </main>
  );
}
