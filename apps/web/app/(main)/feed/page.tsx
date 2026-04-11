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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    async function loadInitial() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get<{ items: Photo[] }>("/photos", {
          params: { tab, page: 1, limit: 12 }
        });
        setItems(data.items, 1);
      } catch {
        setError("Лента жүктелмеді. Байланысты тексеріңіз.");
      } finally {
        setLoading(false);
      }
    }

    void loadInitial();
  }, [setItems, tab]);

  useEffect(() => {
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];

      if (!entry?.isIntersecting || loading || !hasMore) {
        return;
      }

      setLoading(true);
      const nextPage = page + 1;
      try {
        const { data } = await api.get<{ items: Photo[] }>("/photos", {
          params: { tab, page: nextPage, limit: 12 }
        });
        appendItems(data.items, nextPage);
      } catch {
        // silently stop paginating on error
      } finally {
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
