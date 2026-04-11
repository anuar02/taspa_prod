"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { TopBar } from "@/components/layout/TopBar";
import { PhotoGrid } from "@/components/photo/PhotoGrid";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { Photo, UserProfile } from "@/lib/types";

type Category = {
  key: string;
  label: string;
  previewUrl: string;
};

type Trend = {
  tag: string;
  count: number;
};

const searchModes = [
  { key: "photo", label: "Фото" },
  { key: "user", label: "Пайдаланушы" },
  { key: "tag", label: "Тег" }
] as const;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<(typeof searchModes)[number]["key"]>("photo");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trending, setTrending] = useState<Trend[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    void api.get<{ items: Category[] }>("/search/categories").then(({ data }) => setCategories(data.items));
    void api.get<{ items: Trend[] }>("/search/trending").then(({ data }) => setTrending(data.items));
  }, []);

  useEffect(() => {
    if (!query) {
      setPhotos([]);
      setUsers([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await api.get<{ items: Photo[] | UserProfile[] }>("/search", {
          params: { q: query, type: mode, page: 1 }
        });

        if (mode === "user") {
          setUsers(data.items as UserProfile[]);
          setPhotos([]);
        } else {
          setPhotos(data.items as Photo[]);
          setUsers([]);
        }
      } catch {
        // silently ignore search errors
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [mode, query]);

  return (
    <main>
      <TopBar title="Іздеу" subtitle="Фото, автор және хэштег табу" />
      <Input placeholder="Іздеу..." value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="mt-4 flex gap-2 overflow-auto pb-2">
        {searchModes.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMode(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              mode === item.key ? "bg-primary text-white" : "bg-white text-muted shadow-card"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {!query ? (
        <div className="mt-6 space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">Категориялар</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <div key={category.key} className="rounded-[28px] bg-white p-5 shadow-card">
                  <p className="text-xs uppercase tracking-[0.25em] text-primary">{category.key}</p>
                  <p className="mt-3 text-lg font-semibold text-text">{category.label}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">Трендтегі тегтер</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trending.map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => {
                    setMode("tag");
                    setQuery(item.tag);
                  }}
                  className="rounded-full bg-white px-4 py-2 text-sm text-text shadow-card"
                >
                  {item.tag} <span className="text-muted">({item.count})</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-6">
          {searching ? (
            <p className="text-sm text-muted">Іздеу жүргізілуде...</p>
          ) : mode === "user" ? (
            <div className="space-y-3">
              {users.map((user) => (
                <Link
                  key={user._id}
                  href={`/profile/${user.username}`}
                  className="block rounded-[28px] bg-white p-5 shadow-card"
                >
                  <p className="text-lg font-semibold text-text">{user.displayName}</p>
                  <p className="mt-1 text-sm text-muted">@{user.username}</p>
                  <p className="mt-3 text-xs text-muted">
                    {user.followersCount} followers · {user.postsCount} posts
                  </p>
                </Link>
              ))}
              {users.length === 0 ? <p className="text-sm text-muted">Нәтиже табылмады.</p> : null}
            </div>
          ) : (
            <>
              <PhotoGrid items={photos} />
              {photos.length === 0 ? <p className="text-sm text-muted">Нәтиже табылмады.</p> : null}
            </>
          )}
        </div>
      )}
    </main>
  );
}
