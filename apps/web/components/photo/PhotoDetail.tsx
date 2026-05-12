"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Bookmark, Flag, FolderPlus, Heart, Lock, MapPin, MessageCircle, Pencil, Trash2, X } from "lucide-react";

import { api } from "@/lib/api";
import { Collection, Photo } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { useSavedStore } from "@/store/savedStore";
import { useFeedStore } from "@/store/feedStore";
import { useProfileStore } from "@/store/profileStore";
import { CommentSection } from "@/components/photo/CommentSection";

const categories = [
  { key: "NATURE", label: "Табиғат" },
  { key: "PORTRAIT", label: "Портрет" },
  { key: "CITY", label: "Қала" },
  { key: "ART", label: "Өнер" },
  { key: "FOOD", label: "Тағам" },
  { key: "OTHER", label: "Басқа" }
] as const;

function normalizeTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

export function PhotoDetail({ photo }: { photo: Photo }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [item, setItem] = useState(photo);
  const syncSavedItem = useSavedStore((state) => state.syncItem);
  const removeSavedItem = useSavedStore((state) => state.removeItem);
  const updateSavedItem = useSavedStore((state) => state.updateItem);
  const updateFeedPhoto = useFeedStore((state) => state.updatePhoto);
  const removeFeedPhoto = useFeedStore((state) => state.removePhoto);
  const updateProfilePhoto = useProfileStore((state) => state.updatePhoto);
  const removeProfilePhoto = useProfileStore((state) => state.removePhoto);
  const [liked, setLiked] = useState(Boolean(user?._id && item.likes?.includes(user._id)));
  const [saved, setSaved] = useState(Boolean(user?._id && item.saves?.includes(user._id)));
  const [likesCount, setLikesCount] = useState(item.likesCount);
  const [commentsCount, setCommentsCount] = useState(item.commentsCount ?? 0);
  const [pending, setPending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editCaption, setEditCaption] = useState(photo.caption);
  const [editTags, setEditTags] = useState(photo.tags.join(", "));
  const [editCategory, setEditCategory] = useState(photo.category || "OTHER");
  const [editLocation, setEditLocation] = useState(photo.location || "");
  const [editPrivate, setEditPrivate] = useState(Boolean(photo.isPrivate));
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [collectionError, setCollectionError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSent, setReportSent] = useState(false);

  function syncCommentsCount(count: number) {
    const nextCount = Math.max(0, Number.isFinite(count) ? count : commentsCount);
    setCommentsCount(nextCount);
    updateFeedPhoto(item._id, (item) => ({ ...item, commentsCount: nextCount }));
    updateSavedItem(item._id, (item) => ({ ...item, commentsCount: nextCount }));
    updateProfilePhoto(item.author.username, item._id, (item) => ({ ...item, commentsCount: nextCount }));
  }

  async function handleLike() {
    if (!user?._id || pending) return;
    const next = !liked;
    setPending(true);
    setLiked(next);
    setLikesCount((c) => c + (next ? 1 : -1));
    try {
      const { data } = await api.post(`/photos/${item._id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
      updateFeedPhoto(item._id, (item) => ({
        ...item,
        likesCount: data.likesCount,
        likes: user?._id
          ? data.liked
            ? [...(item.likes ?? []).filter((id) => id !== user._id), user._id]
            : (item.likes ?? []).filter((id) => id !== user._id)
          : item.likes
      }));
      updateSavedItem(item._id, (item) => ({
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
      await navigator.share({ title: item.caption || "TASPA фото", url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  async function handleSave() {
    if (!user?._id || pending) return;
    const previousSaves = item.saves ?? [];
    const savesWithoutViewer = previousSaves.filter((id) => id !== user._id);
    const nextSaved = !saved;
    const optimisticPhoto = {
      ...item,
      saves: nextSaved ? [...savesWithoutViewer, user._id] : savesWithoutViewer
    };

    setPending(true);
    setSaved(nextSaved);
    syncSavedItem(optimisticPhoto, nextSaved);
    try {
      const { data } = await api.post(`/photos/${item._id}/save`);
      const resolvedSaved = Boolean(data.saved);
      const resolvedSaves = resolvedSaved ? [...savesWithoutViewer, user._id] : savesWithoutViewer;
      setSaved(resolvedSaved);
      syncSavedItem(
        {
          ...item,
          likesCount,
          commentsCount,
          saves: resolvedSaves
        },
        resolvedSaved
      );
      updateFeedPhoto(item._id, (item) => ({
        ...item,
        saves: resolvedSaved
          ? [...(item.saves ?? []).filter((id) => id !== user._id), user._id]
          : (item.saves ?? []).filter((id) => id !== user._id)
      }));
    } catch {
      setSaved(!nextSaved);
      syncSavedItem(
        {
          ...item,
          saves: previousSaves
        },
        !nextSaved
      );
    } finally {
      setPending(false);
    }
  }

  async function handleDeletePhoto() {
    if (!user?._id || deletingPhoto || item.author._id !== user._id) return;

    try {
      setDeletingPhoto(true);
      setDeleteError("");
      await api.delete(`/photos/${item._id}`);
      removeFeedPhoto(item._id);
      removeSavedItem(item._id);
      removeProfilePhoto(item.author.username, item._id);
      router.replace(`/profile/${item.author.username}`);
      router.refresh();
    } catch {
      setDeleteError("Фотоны өшіру мүмкін болмады. Қайталап көріңіз.");
    } finally {
      setDeletingPhoto(false);
    }
  }

  async function handleUpdatePhoto() {
    if (!user?._id || item.author._id !== user._id || savingEdit) return;

    try {
      setSavingEdit(true);
      setEditError("");
      const { data } = await api.patch<{ item: Photo }>(`/photos/${item._id}`, {
        caption: editCaption,
        tags: normalizeTags(editTags),
        category: editCategory,
        location: editLocation,
        isPrivate: editPrivate
      });
      const nextPhoto = data.item;
      setItem(nextPhoto);
      updateFeedPhoto(nextPhoto._id, () => nextPhoto);
      updateSavedItem(nextPhoto._id, () => nextPhoto);
      updateProfilePhoto(nextPhoto.author.username, nextPhoto._id, () => nextPhoto);
      setEditOpen(false);
    } catch {
      setEditError("Фото мәліметтерін сақтау мүмкін болмады.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function loadCollections() {
    try {
      setCollectionsLoading(true);
      setCollectionError("");
      const { data } = await api.get<{ items: Collection[] }>("/collections");
      setCollections(data.items);
    } catch {
      setCollectionError("Жинақтарды жүктеу мүмкін болмады.");
    } finally {
      setCollectionsLoading(false);
    }
  }

  async function handleCreateCollection() {
    const title = newCollectionTitle.trim();
    if (!title) return;

    try {
      setCollectionError("");
      const { data } = await api.post<{ item: Collection }>("/collections", { title });
      setCollections((items) => [data.item, ...items]);
      setNewCollectionTitle("");
    } catch {
      setCollectionError("Жаңа жинақ құру мүмкін болмады.");
    }
  }

  async function handleAddToCollection(collectionId: string) {
    try {
      setCollectionError("");
      await api.post(`/collections/${collectionId}/photos`, { photoId: item._id });
      setCollections((items) =>
        items.map((collection) =>
          collection._id === collectionId && !collection.photos.some((photo) => photo._id === item._id)
            ? { ...collection, photos: [item, ...collection.photos] }
            : collection
        )
      );
    } catch {
      setCollectionError("Фотоны жинаққа қосу мүмкін болмады.");
    }
  }

  async function handleReportPhoto() {
    if (!reportReason.trim() || reporting) return;

    try {
      setReporting(true);
      setReportError("");
      await api.post(`/reports/photos/${item._id}`, { reason: reportReason.trim() });
      setReportSent(true);
      setReportReason("");
    } catch {
      setReportError("Шағым жіберу мүмкін болмады.");
    } finally {
      setReporting(false);
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
            src={item.imageUrl}
            alt={item.caption || item.author.displayName}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 70vw"
          />
          {item.isPrivate && (
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-white backdrop-blur-sm">
              <Lock size={13} />
              <span className="text-xs font-medium">Жеке фото</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 min-w-0 space-y-5 lg:mt-0 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto lg:pr-1">
        <div className="flex items-center justify-between">
          <Link href={`/profile/${item.author.username}`}>
            <p className="text-lg font-semibold text-text hover:underline">{item.author.displayName}</p>
            <p className="text-sm text-muted">@{item.author.username}</p>
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
          </Button>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => {
              setCollectionOpen(true);
              void loadCollections();
            }}
            disabled={!user}
          >
            <FolderPlus size={16} />
          </Button>
          {item.author._id === user?._id ? (
            <>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => {
                  setEditCaption(item.caption);
                  setEditTags(item.tags.join(", "));
                  setEditCategory(item.category || "OTHER");
                  setEditLocation(item.location || "");
                  setEditPrivate(Boolean(item.isPrivate));
                  setEditError("");
                  setEditOpen(true);
                }}
              >
                <Pencil size={16} />
              </Button>
              <Button
                variant="secondary"
                className="gap-2 text-danger hover:bg-danger/10"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deletingPhoto}
              >
                <Trash2 size={16} />
              </Button>
            </>
          ) : user ? (
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => {
                setReportOpen(true);
                setReportSent(false);
                setReportError("");
              }}
            >
              <Flag size={16} />
            </Button>
          ) : null}
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-card">
          <p className="text-sm leading-6 text-text">{item.caption}</p>
          {item.tags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-primary">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {item.location ? (
          <div className="flex items-center gap-2 rounded-[24px] bg-white px-4 py-3 text-sm text-muted shadow-card">
            <MapPin size={15} className="text-primary" />
            <span>{item.location}</span>
          </div>
        ) : null}

        <CommentSection
          photoId={item._id}
          photoAuthorId={item.author._id}
          commentsCount={commentsCount}
          onCountChange={syncCommentsCount}
        />
      </div>
    </section>
    {collectionOpen ? (
      <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
        <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-card">
          <div className="flex items-start justify-between gap-4 border-b border-border/70 p-5">
            <div>
              <h2 className="text-base font-semibold text-text">Жинаққа қосу</h2>
              <p className="mt-1 text-sm text-muted">Фотоны альбомға сақтаңыз немесе жаңа жинақ құрыңыз.</p>
            </div>
            <button
              type="button"
              onClick={() => setCollectionOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-bg hover:text-text"
              aria-label="Жабу"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex gap-2">
              <input
                value={newCollectionTitle}
                onChange={(event) => setNewCollectionTitle(event.target.value)}
                placeholder="Жаңа жинақ атауы"
                className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
              <Button type="button" onClick={handleCreateCollection} disabled={!newCollectionTitle.trim()}>
                Құру
              </Button>
            </div>

            {collectionError ? (
              <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
                {collectionError}
              </p>
            ) : null}

            <div className="max-h-80 space-y-2 overflow-auto">
              {collectionsLoading ? (
                <p className="rounded-xl bg-bg px-4 py-3 text-sm text-muted">Жүктелуде...</p>
              ) : collections.length === 0 ? (
                <p className="rounded-xl bg-bg px-4 py-3 text-sm text-muted">Әзірге жинақ жоқ.</p>
              ) : (
                collections.map((collection) => {
                  const added = collection.photos.some((photo) => photo._id === item._id);

                  return (
                    <button
                      key={collection._id}
                      type="button"
                      onClick={() => handleAddToCollection(collection._id)}
                      disabled={added}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-left transition hover:border-primary disabled:bg-primary/5 disabled:text-primary"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-text">{collection.title}</span>
                        <span className="text-xs text-muted">{collection.photos.length} фото</span>
                      </span>
                      <span className="text-xs font-semibold">{added ? "Қосылды" : "Қосу"}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    ) : null}
    {reportOpen ? (
      <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
        <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-card">
          <div className="flex items-start justify-between gap-4 border-b border-border/70 p-5">
            <div>
              <h2 className="text-base font-semibold text-text">Фотоға шағым</h2>
              <p className="mt-1 text-sm text-muted">Себебін қысқаша жазыңыз. Админ қарап шығады.</p>
            </div>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              disabled={reporting}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-bg hover:text-text disabled:opacity-40"
              aria-label="Жабу"
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4 p-5">
            {reportSent ? (
              <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                Шағым жіберілді.
              </p>
            ) : (
              <>
                <textarea
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  rows={4}
                  placeholder="Мысалы: орынсыз контент, авторлық құқық, спам..."
                  className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                />
                {reportError ? (
                  <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
                    {reportError}
                  </p>
                ) : null}
                <Button type="button" className="w-full gap-2" onClick={handleReportPhoto} disabled={!reportReason.trim() || reporting}>
                  <Flag size={16} />
                  {reporting ? "Жіберілуде..." : "Шағым жіберу"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    ) : null}
    {editOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-photo-title"
      >
        <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-card">
          <div className="flex items-start justify-between gap-4 border-b border-border/70 p-5">
            <div>
              <h2 id="edit-photo-title" className="text-base font-semibold text-text">
                Фотоны өңдеу
              </h2>
              <p className="mt-1 text-sm text-muted">Сипаттама, тег, санат және көріну күйін өзгерту.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              disabled={savingEdit}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-bg hover:text-text disabled:opacity-40"
              aria-label="Жабу"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text">Сипаттама</span>
              <textarea
                value={editCaption}
                onChange={(event) => setEditCaption(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text">Тегтер</span>
              <input
                value={editTags}
                onChange={(event) => setEditTags(event.target.value)}
                placeholder="#табиғат, #қала"
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text">Санат</span>
                <select
                  value={editCategory}
                  onChange={(event) => setEditCategory(event.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                >
                  {categories.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text">Орын</span>
                <input
                  value={editLocation}
                  onChange={(event) => setEditLocation(event.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                />
              </label>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-bg px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-text">Жеке фото</span>
                <span className="text-xs text-muted">Қосылса, фото тек сізге көрінеді.</span>
              </span>
              <input
                type="checkbox"
                checked={editPrivate}
                onChange={(event) => setEditPrivate(event.target.checked)}
                className="h-5 w-5 accent-primary"
              />
            </label>

            {editError ? (
              <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
                {editError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-bg/50 p-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} disabled={savingEdit}>
              Болдырмау
            </Button>
            <Button type="button" className="gap-2" onClick={handleUpdatePhoto} disabled={savingEdit}>
              <Pencil size={16} />
              {savingEdit ? "Сақталуда..." : "Сақтау"}
            </Button>
          </div>
        </div>
      </div>
    ) : null}
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
                src={item.thumbnailUrl || item.imageUrl}
                alt={item.caption || item.author.displayName}
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
