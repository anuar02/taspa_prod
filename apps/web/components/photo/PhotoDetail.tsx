"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Share2 } from "lucide-react";

import { api } from "@/lib/api";
import { Photo } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";

export function PhotoDetail({ photo, aside }: { photo: Photo; aside?: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const [liked, setLiked] = useState(Boolean(user?._id && photo.likes?.includes(user._id)));
  const [likesCount, setLikesCount] = useState(photo.likesCount);
  const [pending, setPending] = useState(false);

  async function handleLike() {
    if (!user?._id || pending) return;
    const next = !liked;
    setPending(true);
    setLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));
    try {
      const { data } = await api.post(`/photos/${photo._id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch {
      setLiked(!next);
      setLikesCount((c) => c + (next ? -1 : 1));
    } finally {
      setPending(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: photo.caption || "TASPA фото", url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  return (
    <section className="lg:flex lg:gap-8">
      {/* Image */}
      <div className="lg:flex-1">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-surface shadow-card">
          <Image src={photo.imageUrl} alt={photo.caption || photo.author.displayName} fill className="object-cover" />
        </div>
      </div>

      {/* Details panel */}
      <div className="mt-5 space-y-5 lg:mt-0 lg:w-80 lg:shrink-0">
        <div className="flex items-center justify-between">
          <Link href={`/profile/${photo.author.username}`}>
            <p className="text-lg font-semibold text-text hover:underline">{photo.author.displayName}</p>
            <p className="text-sm text-muted">@{photo.author.username}</p>
          </Link>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className={`gap-2 ${liked ? "bg-primary/10 text-primary" : ""}`}
            onClick={handleLike}
            disabled={!user || pending}
          >
            <Heart size={16} className={liked ? "fill-current" : ""} />
            {likesCount}
          </Button>
          <Button variant="secondary" className="gap-2 cursor-default">
            <MessageCircle size={16} /> {photo.commentsCount}
          </Button>
          <Button variant="secondary" className="gap-2" onClick={handleShare}>
            <Share2 size={16} /> Бөлісу
          </Button>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-card">
          <p className="text-sm leading-6 text-text">{photo.caption}</p>
          {photo.tags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {photo.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-primary">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {photo.location ? (
          <p className="text-sm text-muted">📍 {photo.location}</p>
        ) : null}

        {aside ? <div>{aside}</div> : null}
      </div>
    </section>
  );
}
