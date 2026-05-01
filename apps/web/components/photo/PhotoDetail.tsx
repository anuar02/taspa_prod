"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Bookmark, Heart, Lock, MapPin, MessageCircle, Share2, Trash2, X } from "lucide-react";

import { api } from "@/lib/api";
import { Photo } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { useSavedStore } from "@/store/savedStore";
import { useFeedStore } from "@/store/feedStore";
import { useProfileStore } from "@/store/profileStore";
import { CommentSection } from "@/components/photo/CommentSection";

export function PhotoDetail({ photo }: { photo: Photo }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const syncSavedItem = useSavedStore((state) => state.syncItem);
  const removeSavedItem = useSavedStore((state) => state.removeItem);
  const updateSavedItem = useSavedStore((state) => state.updateItem);
  const updateFeedPhoto = useFeedStore((state) => state.updatePhoto);
  const removeFeedPhoto = useFeedStore((state) => state.removePhoto);
  const updateProfilePhoto = useProfileStore((state) => state.updatePhoto);
  const removeProfilePhoto = useProfileStore((state) => state.removePhoto);
  const [liked, setLiked] = useState(Boolean(user?._id && photo.likes?.includes(user._id)));
  const [saved, setSaved] = useState(Boolean(user?._id && photo.saves?.includes(user._id)));
  const [likesCount, setLikesCount] = useState(photo.likesCount);
  const [commentsCount, setCommentsCount] = useState(photo.commentsCount ?? 0);
  const [pending, setPending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function syncCommentsCount(count: number) {
    const nextCount = Math.max(0, Number.isFinite(count) ? count : commentsCount);
    setCommentsCount(nextCount);
    updateFeedPhoto(photo._id, (item) => ({ ...item, commentsCount: nextCount }));
    updateSavedItem(photo._id, (item) => ({ ...item, commentsCount: nextCount }));
    updateProfilePhoto(photo.author.username, photo._id, (item) => ({ ...item, commentsCount: nextCount }));
  }

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
      updateFeedPhoto(photo._id, (item) => ({
        ...item,
        likesCount: data.likesCount,
        likes: user?._id
          ? data.liked
            ? [...(item.likes ?? []).filter((id) => id !== user._id), user._id]
            : (item.likes ?? []).filter((id) => id !== user._id)
          : item.likes
      }));
      updateSavedItem(photo._id, (item) => ({
        ...item,
        likesCount: data.likesCount,
        likes: user?._id
          ? data.liked
            ? [...(item.likes ?? []).filter((id) => id !== user._id), user._id]
            : (item.likes ?? []).filter((id) => id !== user._id)
          : item.likes
      }));
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
      const resolvedSaves = resolvedSaved ? [...savesWithoutViewer, user._id] : savesWithoutViewer;
      setSaved(resolvedSaved);
      syncSavedItem(
        {
          ...photo,
          likesCount,
          commentsCount,
          saves: resolvedSaves
        },
        resolvedSaved
      );
      updateFeedPhoto(photo._id, (item) => ({
        ...item,
        saves: resolvedSaved
          ? [...(item.saves ?? []).filter((id) => id !== user._id), user._id]
          : (item.saves ?? []).filter((id) => id !== user._id)
      }));
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

  async function handleDeletePhoto() {
    if (!user?._id || deletingPhoto || photo.author._id !== user._id) return;

    try {
      setDeletingPhoto(true);
      setDeleteError("");
      await api.delete(`/photos/${photo._id}`);
      removeFeedPhoto(photo._id);
      removeSavedItem(photo._id);
      removeProfilePhoto(photo.author.username, photo._id);
      router.replace(`/profile/${photo.author.username}`);
      router.refresh();
    } catch {
      setDeleteError("Фотоны өшіру мүмкін болмады. Қайталап көріңіз.");
    } finally {
      setDeletingPhoto(false);
    }
  }

  return (
    <>
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
            <MessageCircle size={16} /> {commentsCount}
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
          {photo.author._id === user?._id ? (
            <Button
              variant="secondary"
              className="gap-2 text-danger hover:bg-danger/10"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deletingPhoto}
            >
              <Trash2 size={16} />
            </Button>
          ) : null}
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

        <CommentSection
          photoId={photo._id}
          photoAuthorId={photo.author._id}
          commentsCount={commentsCount}
          onCountChange={syncCommentsCount}
        />
      </div>
    </section>
    {deleteDialogOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-photo-title"
      >
        <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-card">
          <div className="flex items-start justify-between gap-4 border-b border-border/70 p-5">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 id="delete-photo-title" className="text-base font-semibold text-text">
                  Фотоны өшіру
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted">
                  Бұл фото профильден, лентадан және сақталғандардан жойылады.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!deletingPhoto) {
                  setDeleteDialogOpen(false);
                  setDeleteError("");
                }
              }}
              disabled={deletingPhoto}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-bg hover:text-text disabled:opacity-40"
              aria-label="Жабу"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-bg">
              <Image
                src={photo.thumbnailUrl || photo.imageUrl}
                alt={photo.caption || photo.author.displayName}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 28rem"
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-text">
              Өшіргеннен кейін фотоны қалпына келтіру мүмкін емес.
            </p>
            {deleteError ? (
              <p className="mt-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
                {deleteError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-bg/50 p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteError("");
              }}
              disabled={deletingPhoto}
            >
              Болдырмау
            </Button>
            <Button
              type="button"
              className="gap-2 bg-danger text-white hover:bg-danger/90"
              onClick={handleDeletePhoto}
              disabled={deletingPhoto}
            >
              <Trash2 size={16} />
              {deletingPhoto ? "Өшірілуде..." : "Фотоны өшіру"}
            </Button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
