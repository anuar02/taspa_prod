"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { TopBar } from "@/components/layout/TopBar";
import { api } from "@/lib/api";
import { Collection, Photo } from "@/lib/types";

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    api
      .get<{ item: Collection }>(`/collections/${id}`)
      .then(({ data }) => setCollection(data.item))
      .catch(() => setError("Жинақты ашу мүмкін болмады."))
      .finally(() => setLoading(false));
  }, [id]);

  async function removePhoto(photoId: string) {
    try {
      await api.delete(`/collections/${id}/photos/${photoId}`);
      setCollection((current) =>
        current ? { ...current, photos: current.photos.filter((photo) => photo._id !== photoId) } : current
      );
    } catch {
      setError("Фотоны жинақтан алып тастау мүмкін болмады.");
    }
  }

  async function deleteCollection() {
    if (!window.confirm("Жинақты өшіру керек пе?")) return;

    try {
      await api.delete(`/collections/${id}`);
      router.replace("/collections");
    } catch {
      setError("Жинақты өшіру мүмкін болмады.");
    }
  }

  if (loading) {
    return (
      <main>
        <TopBar title="Жинақ" subtitle="Жүктелуде..." />
        <div className="skeleton h-72 rounded-[32px]" />
      </main>
    );
  }

  if (!collection) {
    return (
      <main>
        <TopBar title="Жинақ" subtitle={error || "Табылмады"} />
      </main>
    );
  }

  return (
    <main>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <TopBar title={collection.title} subtitle={`${collection.photos.length} фото`} />
        <button
          type="button"
          onClick={deleteCollection}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10"
        >
          <Trash2 size={16} />
          Жинақты өшіру
        </button>
      </div>

      {error ? <p className="mb-4 rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p> : null}

      {collection.photos.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-border bg-white px-6 py-12 text-center shadow-card">
          <p className="text-lg font-semibold text-text">Бұл жинақ бос</p>
          <Link href="/feed" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white">
            Фото табу
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {collection.photos.map((photo) => (
            <CollectionPhotoCard key={photo._id} photo={photo} onRemove={() => removePhoto(photo._id)} />
          ))}
        </div>
      )}
    </main>
  );
}

function CollectionPhotoCard({ onRemove, photo }: { onRemove: () => void; photo: Photo }) {
  return (
    <article className="overflow-hidden rounded-[28px] bg-white shadow-card">
      <Link href={`/photo/${photo._id}`} className="relative block aspect-[4/5] bg-bg">
        <Image
          src={photo.thumbnailUrl || photo.imageUrl}
          alt={photo.caption || photo.author.displayName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </Link>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-text">{photo.caption || "Сипаттама жоқ"}</p>
          <p className="mt-1 text-xs text-muted">@{photo.author.username}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-danger transition hover:bg-danger/10"
          aria-label="Жинақтан алып тастау"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
