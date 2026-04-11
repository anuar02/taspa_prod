"use client";

import { useEffect, useRef, useState } from "react";

import { TopBar } from "@/components/layout/TopBar";
import { PhotoGrid } from "@/components/photo/PhotoGrid";
import { api } from "@/lib/api";
import { Photo } from "@/lib/types";
import { useFeedStore } from "@/store/feedStore";

const tabs = [
  { key: "all", label: "Барлығы" },
  { key: "popular", label: "Танымал" },
  { key: "following", label: "Ұйымшан" }
];

export default function FeedPage() {
  const { items, page, setItems, appendItems, hasMore } = useFeedStore();
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const requestedPagesRef = useRef<Set<string>>(new Set());
  const initialLoadKeyRef = useRef<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    loadedPagesRef.current = new Set();
    inFlightRef.current = false;
    requestedPagesRef.current = new Set();

    const initialKey = `${tab}-1`;

    if (initialLoadKeyRef.current === initialKey) {
      return;
    }

    initialLoadKeyRef.current = initialKey;
    requestedPagesRef.current.add(initialKey);

    async function loadInitial() {
      inFlightRef.current = true;
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get<{ items: Photo[] }>("/photos", {
          params: { tab, page: 1, limit: 12 }
        });
        setItems(data.items, 1);
        loadedPagesRef.current.add(1);
      } catch {
        setError("Лента жүктелмеді. Байланысты тексеріңіз.");
        requestedPagesRef.current.delete(initialKey);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    }

    void loadInitial();
  }, [setItems, tab]);

  useEffect(() => {
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      const nextPage = page + 1;
      const requestKey = `${tab}-${nextPage}`;

      if (
        !entry?.isIntersecting ||
        loading ||
        !hasMore ||
        inFlightRef.current ||
        loadedPagesRef.current.has(nextPage) ||
        requestedPagesRef.current.has(requestKey)
      ) {
        return;
      }

      requestedPagesRef.current.add(requestKey);
      inFlightRef.current = true;
      setLoading(true);
      try {
        const { data } = await api.get<{ items: Photo[] }>("/photos", {
          params: { tab, page: nextPage, limit: 12 }
        });
        appendItems(data.items, nextPage);
        loadedPagesRef.current.add(nextPage);
      } catch {
        requestedPagesRef.current.delete(requestKey);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [appendItems, hasMore, loading, page, tab]);

  return (
    <main>
      <TopBar title="Лента" subtitle="Соңғы фотолар мен танымал сәттер" />
      <div className="mb-5 flex gap-2 overflow-auto pb-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
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
      ) : loading && items.length === 0 ? (
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
          <PhotoGrid items={items} />
          <div ref={sentinelRef} className="py-8 text-center text-sm text-muted">
            {loading ? "Жүктелуде..." : hasMore ? "Көбірек көрсету" : items.length > 0 ? "Фото аяқталды" : ""}
          </div>
        </>
      )}
    </main>
  );
}
