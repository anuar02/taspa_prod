"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Bookmark } from "lucide-react";
import { useState } from "react";

import { Photo } from "@/lib/types";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function PhotoCard({ photo }: { photo: Photo }) {
  const user = useAuthStore((state) => state.user);
  const [likesCount, setLikesCount] = useState(photo.likesCount);
  const [liked, setLiked] = useState(Boolean(user?._id && photo.likes?.includes(user._id)));
  const [saved, setSaved] = useState(Boolean(user?._id && photo.saves?.includes(user._id)));
  const [pendingAction, setPendingAction] = useState<"like" | "save" | null>(null);

  async function handleLike() {
    if (!user?._id || pendingAction) {
      return;
    }

    const nextLiked = !liked;
    setPendingAction("like");
    setLiked(nextLiked);
    setLikesCount((count) => count + (nextLiked ? 1 : -1));

    try {
      const { data } = await api.post(`/photos/${photo._id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch (error) {
      console.error(error);
      setLiked(!nextLiked);
      setLikesCount((count) => count + (nextLiked ? -1 : 1));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSave() {
    if (!user?._id || pendingAction) {
      return;
    }

    const nextSaved = !saved;
    setPendingAction("save");
    setSaved(nextSaved);

    try {
      const { data } = await api.post(`/photos/${photo._id}/save`);
      setSaved(data.saved);
    } catch (error) {
      console.error(error);
      setSaved(!nextSaved);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <article className="mb-4 break-inside-avoid overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-card">
      <Link href={`/photo/${photo._id}`} className="block">
        <div className="relative aspect-[4/5] w-full bg-surface">
          <Image
            src={photo.thumbnailUrl || photo.imageUrl}
            alt={photo.caption || photo.author.displayName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-text">{photo.author.displayName}</p>
            <p className="text-xs text-muted">@{photo.author.username}</p>
          </div>
          <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-medium text-muted">
            {photo.category}
          </span>
        </div>
        {photo.caption ? <p className="text-sm text-text">{photo.caption}</p> : null}
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLike}
              disabled={pendingAction !== null}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                liked ? "bg-primary/10 text-primary" : "hover:bg-surface"
              }`}
            >
              <Heart size={14} className={liked ? "fill-current" : ""} />
              {likesCount}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pendingAction !== null}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                saved ? "bg-primary/10 text-primary" : "hover:bg-surface"
              }`}
            >
              <Bookmark size={14} className={saved ? "fill-current" : ""} />
              {saved ? "Сақталды" : "Сақтау"}
            </button>
          </div>
          {photo.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} />
              {photo.location}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
