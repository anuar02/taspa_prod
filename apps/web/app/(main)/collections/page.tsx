"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FolderHeart, Plus } from "lucide-react";

import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Collection } from "@/lib/types";

export default function CollectionsPage() {
  const [items, setItems] = useState<Collection[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ items: Collection[] }>("/collections")
      .then(({ data }) => setItems(data.items))
      .catch(() => setError("Жинақтарды жүктеу мүмкін болмады."))
      .finally(() => setLoading(false));
  }, []);

  async function createCollection() {
    const nextTitle = title.trim();
    if (!nextTitle) return;

    try {
      setError("");
      const { data } = await api.post<{ item: Collection }>("/collections", { title: nextTitle });
      setItems((current) => [data.item, ...current]);
      setTitle("");
    } catch {
      setError("Жинақ құру мүмкін болмады.");
    }
  }

  return (
    <main>
      <TopBar title="Жинақтар" subtitle="Фотоларды альбомдарға бөліп сақтаңыз" />

      <section className="mb-6 rounded-[32px] bg-white p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Жаңа жинақ атауы"
            className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
          />
          <Button type="button" className="gap-2" onClick={createCollection} disabled={!title.trim()}>
            <Plus size={16} />
            Құру
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton h-56 rounded-[28px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-border bg-white px-6 py-12 text-center shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FolderHeart size={24} />
          </div>
          <p className="mt-4 text-lg font-semibold text-text">Жинақ жоқ</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Фото ашып, жинаққа қосу батырмасын басыңыз немесе осы жерден жаңа альбом құрыңыз.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((collection) => {
            const cover = collection.photos[0];

            return (
              <Link
                key={collection._id}
                href={`/collections/${collection._id}`}
                className="group overflow-hidden rounded-[28px] bg-white shadow-card transition hover:-translate-y-px hover:shadow-card-hover"
              >
                <div className="relative aspect-[16/10] bg-bg">
                  {cover ? (
                    <Image
                      src={cover.thumbnailUrl || cover.imageUrl}
                      alt={collection.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-primary">
                      <FolderHeart size={34} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-lg font-semibold text-text">{collection.title}</p>
                  <p className="mt-1 text-sm text-muted">{collection.photos.length} фото</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
