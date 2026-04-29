"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Bookmark, Lock } from "lucide-react";
import { useState } from "react";

import { Photo } from "@/lib/types";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useSavedStore } from "@/store/savedStore";

export function PhotoCard({ photo, priority = false }: { photo: Photo; priority?: boolean }) {
  const user = useAuthStore((state) => state.user);
  const syncSavedItem = useSavedStore((state) => state.syncItem);
  const [likesCount, setLikesCount] = useState(photo.likesCount);
  const [liked, setLiked] = useState(Boolean(user?._id && photo.likes?.includes(user._id)));
  const [saved, setSaved] = useState(Boolean(user?._id && photo.saves?.includes(user._id)));
  const [pendingAction, setPendingAction] = useState<"like" | "save" | null>(null);

  async function handleLike() {
    if (!user?._id || pendingAction) return;
    const nextLiked = !liked;
    setPendingAction("like");
    setLiked(nextLiked);
    setLikesCount((c) => c + (nextLiked ? 1 : -1));
    try {
      const { data } = await api.post(`/photos/${photo._id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch {
      setLiked(!nextLiked);
      setLikesCount((c) => c + (nextLiked ? -1 : 1));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSave() {
    if (!user?._id || pendingAction) return;
    const previousSaves = photo.saves ?? [];
    const savesWithoutViewer = previousSaves.filter((id) => id !== user._id);
    const nextSaved = !saved;
    const optimisticPhoto = {
      ...photo,
      saves: nextSaved ? [...savesWithoutViewer, user._id] : savesWithoutViewer
    };

    setPendingAction("save");
    setSaved(nextSaved);
    syncSavedItem(optimisticPhoto, nextSaved);
    try {
      const { data } = await api.post(`/photos/${photo._id}/save`);
      const resolvedSaved = Boolean(data.saved);
      setSaved(resolvedSaved);
      syncSavedItem(
        {
          ...photo,
          saves: resolvedSaved ? [...savesWithoutViewer, user._id] : savesWithoutViewer
        },
        resolvedSaved
      );
    } catch {
      setSaved(!nextSaved);
      syncSavedItem(
        {
          ...photo,
          saves: previousSaves
        },
        !nextSaved
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <article className="photo-card mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-surface shadow-card">
      <Link href={`/photo/${photo._id}`} className="block">
        <div className="relative aspect-[4/5] w-full bg-bg">
          <Image
            src={photo.thumbnailUrl || photo.imageUrl}
            alt={photo.caption || photo.author.displayName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
          {photo.isPrivate && (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-white backdrop-blur-sm">
              <Lock size={11} />
              <span className="text-[10px] font-medium">Жеке</span>
            </div>
          )}
        </div>
      </Link>

      <div className="space-y-2.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{photo.author.displayName}</p>
            {photo.location ? (
              <p className="flex items-center gap-1 truncate text-xs text-muted">
                <MapPin size={10} />
                {photo.location}
              </p>
            ) : (
              <p className="truncate text-xs text-muted">@{photo.author.username}</p>
            )}
          </div>
          <span className="shrink-0 rounded-lg bg-bg px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            {photo.category}
          </span>
        </div>

        {photo.caption ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted">{photo.caption}</p>
        ) : null}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleLike}
            disabled={pendingAction !== null}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              liked ? "bg-primary/10 text-primary" : "text-muted hover:bg-bg"
            }`}
          >
            <Heart size={13} className={liked ? "fill-current" : ""} />
            {likesCount}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={pendingAction !== null}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              saved ? "bg-primary/10 text-primary" : "text-muted hover:bg-bg"
            }`}
          >
            <Bookmark size={13} className={saved ? "fill-current" : ""} />
            {saved ? "Сақталды" : "Сақтау"}
          </button>
        </div>
      </div>
    </article>
  );
}
