"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bookmark, FolderHeart, Search } from "lucide-react";

import { TopBar } from "@/components/layout/TopBar";
import { PhotoGrid } from "@/components/photo/PhotoGrid";
import { api } from "@/lib/api";
import { Photo } from "@/lib/types";
import { useSavedStore } from "@/store/savedStore";

function SavedGridSkeleton() {
  return (
    <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 [@media(min-width:1800px)]:columns-7">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className={`skeleton mb-4 break-inside-avoid rounded-[28px] ${index % 2 === 0 ? "h-72" : "h-56"}`}
        />
      ))}
    </div>
  );
}

export default function SavedPage() {
  const { items, setItems, isStale } = useSavedStore();

  useEffect(() => {
    const { isStale: checkStale } = useSavedStore.getState();
    if (!checkStale()) return;

    api
      .get<{ items: Photo[] }>("/photos/saved")
      .then(({ data }) => setItems(data.items))
      .catch(() => {});
  }, [setItems]);

  const loading = items.length === 0 && isStale();

  return (
    <main>
      <TopBar title="Сақталған" subtitle="Кейін көру үшін қалдырылған фотолар" />

      <section className="mb-6 rounded-[32px] bg-white p-6 shadow-card">
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-3 w-24 rounded-full" />
            <div className="skeleton h-10 w-28 rounded-full" />
            <div className="skeleton h-4 w-full max-w-md rounded-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">Жеке жинақ</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-text">{items.length.toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted">
                Сіз кейін қайта оралғыңыз келген фотолар осында жиналады.
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-bg px-5 py-2.5 text-sm font-medium text-text transition hover:border-primary hover:text-primary"
            >
              <Search size={15} />
              Жаңа фото іздеу
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-bg px-5 py-2.5 text-sm font-medium text-text transition hover:border-primary hover:text-primary"
            >
              <FolderHeart size={15} />
              Жинақтар
            </Link>
          </div>
        )}
      </section>

      {loading ? (
        <SavedGridSkeleton />
      ) : items.length === 0 ? (
        <div className="mt-16 rounded-[32px] border border-dashed border-border bg-white px-6 py-12 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bookmark size={24} />
          </div>
          <p className="mt-4 text-lg font-semibold text-text">Сақталған фотолар жоқ</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Ұнаған кадрларды сақтау арқылы өзіңіздің шағын визуал кітапханаңызды жасаңыз.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/feed"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-light"
            >
              Лентаны ашу
            </Link>
            <Link
              href="/search"
              className="rounded-full border border-border bg-bg px-5 py-2.5 text-sm font-medium text-text transition hover:border-primary hover:text-primary"
            >
              Іздеуге өту
            </Link>
          </div>
        </div>
      ) : (
        <PhotoGrid items={items} />
      )}
    </main>
  );
}
