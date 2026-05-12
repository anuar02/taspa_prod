"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search as SearchIcon, Sparkles, Users } from "lucide-react";

import { TopBar } from "@/components/layout/TopBar";
import { PhotoGrid } from "@/components/photo/PhotoGrid";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { Photo, UserProfile } from "@/lib/types";
import { useSearchStore } from "@/store/searchStore";

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

const categoryOptions = [
  { value: "all", label: "Барлық санат" },
  { value: "NATURE", label: "Табиғат" },
  { value: "PORTRAIT", label: "Портрет" },
  { value: "CITY", label: "Қала" },
  { value: "ART", label: "Өнер" },
  { value: "FOOD", label: "Тағам" },
  { value: "OTHER", label: "Басқа" }
];

const sortOptions = [
  { value: "newest", label: "Жаңа алдымен" },
  { value: "oldest", label: "Ескі алдымен" },
  { value: "mostLiked", label: "Көп like" },
  { value: "mostViewed", label: "Көп қаралым" }
];

const popularityOptions = [
  { value: "all", label: "Барлығы" },
  { value: "popular", label: "Тек танымал" }
];

function SearchMetaSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="skeleton h-40 rounded-[30px]" />
      ))}
    </div>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`skeleton mb-4 break-inside-avoid rounded-[28px] ${index % 2 === 0 ? "h-72" : "h-56"}`}
        />
      ))}
    </div>
  );
}

export default function SearchPage() {
  const { categories, trending, setMeta } = useSearchStore();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<(typeof searchModes)[number]["key"]>("photo");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [popularity, setPopularity] = useState("all");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const { isStale } = useSearchStore.getState();
    if (!isStale()) return;

    setMetaLoading(true);

    Promise.all([
      api.get<{ items: Category[] }>("/search/categories"),
      api.get<{ items: Trend[] }>("/search/trending"),
    ])
      .then(([{ data: cats }, { data: trends }]) => setMeta(cats.items, trends.items))
      .catch(() => {})
      .finally(() => setMetaLoading(false));
  }, [setMeta]);

  useEffect(() => {
    if (!query) {
      setPhotos([]);
      setUsers([]);
      setSearching(false);
      setSearchError("");
      return;
    }

    setSearching(true);
    setSearchError("");

    const timer = window.setTimeout(async () => {
      try {
        const { data } = await api.get<{ items: Photo[] | UserProfile[] }>("/search", {
          params: { q: query, type: mode, page: 1, category, sort, popularity },
        });

        if (mode === "user") {
          setUsers(data.items as UserProfile[]);
          setPhotos([]);
        } else {
          setPhotos(data.items as Photo[]);
          setUsers([]);
        }
      } catch {
        setSearchError("Іздеу нәтижелерін алу мүмкін болмады.");
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [category, mode, popularity, query, sort]);

  return (
    <main>
      <TopBar title="Іздеу" subtitle="Фото, автор және хэштег табу" />

      <section className="rounded-[32px] bg-white p-4 shadow-card sm:p-5">
        <div className="relative">
          <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Фото, тег немесе автор іздеу..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="bg-bg pl-11"
          />
        </div>
        <div className="mt-4 flex gap-2 overflow-auto pb-1">
          {searchModes.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === item.key ? "bg-primary text-white" : "bg-bg text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {mode !== "user" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">Санат</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">Сұрыптау</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase text-muted">Танымалдығы</span>
              <select
                value={popularity}
                onChange={(event) => setPopularity(event.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                {popularityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </section>

      {!query ? (
        <div className="mt-6 space-y-6">
          <section className="rounded-[32px] bg-white p-5 shadow-card sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h2 className="text-lg font-semibold text-text">Категориялар</h2>
            </div>

            {metaLoading && categories.length === 0 ? (
              <SearchMetaSkeleton />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => {
                      setMode("photo");
                      setQuery(category.label);
                    }}
                    className="group relative h-40 overflow-hidden rounded-[30px] text-left"
                  >
                    {category.previewUrl ? (
                      <Image
                        src={category.previewUrl}
                        alt={category.label}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-200 via-orange-100 to-stone-100" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/70">
                        {category.key}
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">{category.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[32px] bg-white p-5 shadow-card sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Users size={16} className="text-primary" />
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
                  className="rounded-full bg-bg px-4 py-2 text-sm text-text transition hover:bg-primary hover:text-white"
                >
                  {item.tag} <span className="opacity-70">({item.count})</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-6">
          {searchError ? (
            <p className="rounded-[24px] border border-danger/15 bg-danger/5 px-4 py-3 text-sm text-danger">
              {searchError}
            </p>
          ) : searching ? (
            mode === "user" ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-[28px] bg-white p-5 shadow-card">
                    <div className="skeleton h-12 w-12 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-32 rounded-full" />
                      <div className="skeleton h-3 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <SearchResultSkeleton />
            )
          ) : mode === "user" ? (
            <div className="space-y-3">
              {users.map((user) => (
                <Link
                  key={user._id}
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-3 rounded-[28px] bg-white p-5 shadow-card transition hover:-translate-y-px hover:shadow-card-hover"
                >
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                    ) : (
                      user.displayName[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-text">{user.displayName}</p>
                    <p className="mt-1 text-sm text-muted">@{user.username}</p>
                    <p className="mt-3 text-xs text-muted">
                      {user.followersCount.toLocaleString()} жазылушы · {user.postsCount.toLocaleString()} пост
                    </p>
                  </div>
                </Link>
              ))}
              {users.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-border bg-white px-6 py-12 text-center shadow-card">
                  <p className="text-base font-semibold text-text">Нәтиже табылмады</p>
                  <p className="mt-2 text-sm text-muted">Басқа атауды немесе басқа режимді қолданып көріңіз.</p>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <PhotoGrid items={photos} />
              {photos.length === 0 ? (
                <div className="mt-8 rounded-[28px] border border-dashed border-border bg-white px-6 py-12 text-center shadow-card">
                  <p className="text-base font-semibold text-text">Нәтиже табылмады</p>
                  <p className="mt-2 text-sm text-muted">Іздеу сұрауын өзгертіп немесе тег арқылы қайта көріңіз.</p>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </main>
  );
}
