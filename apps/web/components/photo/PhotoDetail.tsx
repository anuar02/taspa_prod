"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Heart, Lock, MapPin, MessageCircle, Share2 } from "lucide-react";

import { api } from "@/lib/api";
import { Photo } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { useSavedStore } from "@/store/savedStore";

export function PhotoDetail({ photo, aside }: { photo: Photo; aside?: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const syncSavedItem = useSavedStore((state) => state.syncItem);
  const [liked, setLiked] = useState(Boolean(user?._id && photo.likes?.includes(user._id)));
  const [saved, setSaved] = useState(Boolean(user?._id && photo.saves?.includes(user._id)));
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

  async function handleSave() {
    if (!user?._id || pending) return;
    const previousSaves = photo.saves ?? [];
    const savesWithoutViewer = previousSaves.filter((id) => id !== user._id);
    const nextSaved = !saved;
    const optimisticPhoto = {
      ...photo,
      saves: nextSaved ? [...savesWithoutViewer, user._id] : savesWithoutViewer
    };

    setPending(true);
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
      setPending(false);
    }
  }

  return (
    <section className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
      {/* back button — mobile only */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-text transition hover:text-primary active:scale-95 lg:hidden"
      >
        <ArrowLeft size={18} />
        Артқа
      </button>

      <div className="min-w-0">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-surface shadow-card lg:h-[calc(100vh-7rem)] lg:max-h-[980px] lg:min-h-[640px] lg:aspect-auto">
          <Image
            src={photo.imageUrl}
            alt={photo.caption || photo.author.displayName}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 70vw"
          />
          {photo.isPrivate && (
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-white backdrop-blur-sm">
              <Lock size={13} />
              <span className="text-xs font-medium">Жеке фото</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 min-w-0 space-y-5 lg:mt-0 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto lg:pr-1">
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
          <Button
            variant="secondary"
            className={`gap-2 ${saved ? "bg-primary/10 text-primary" : ""}`}
            onClick={handleSave}
            disabled={!user || pending}
          >
            <Bookmark size={16} className={saved ? "fill-current" : ""} />
            {saved ? "Сақталды" : "Сақтау"}
          </Button>
          <Button variant="secondary" className="gap-2" onClick={handleShare}>
            <Share2 size={16} />
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
          <div className="flex items-center gap-2 rounded-[24px] bg-white px-4 py-3 text-sm text-muted shadow-card">
            <MapPin size={15} className="text-primary" />
            <span>{photo.location}</span>
          </div>
        ) : null}

        {aside ? <div>{aside}</div> : null}
      </div>
    </section>
  );
}
