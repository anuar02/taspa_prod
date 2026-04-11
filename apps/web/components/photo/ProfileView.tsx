"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Check, Grid3X3, Bookmark, Pencil, X, UserCheck, UserPlus } from "lucide-react";
import axios from "axios";

import { api } from "@/lib/api";
import { Photo, UserProfile } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { PhotoGrid } from "@/components/photo/PhotoGrid";

// ─── avatar palette (matches CommentSection) ─────────────────────────────────
const PALETTES = [
  { bg: "bg-violet-100", text: "text-violet-700", cover: "from-violet-500 to-violet-900" },
  { bg: "bg-amber-100",  text: "text-amber-700",  cover: "from-amber-400  to-amber-800"  },
  { bg: "bg-emerald-100",text: "text-emerald-700",cover: "from-emerald-500 to-emerald-900"},
  { bg: "bg-sky-100",    text: "text-sky-700",    cover: "from-sky-400    to-sky-900"    },
  { bg: "bg-rose-100",   text: "text-rose-700",   cover: "from-rose-500   to-rose-900"   },
];

function palette(username: string) {
  return PALETTES[username.charCodeAt(0) % PALETTES.length];
}

// ─── skeleton ─────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-0">
      <div className="skeleton h-36 rounded-2xl" />
      <div className="px-5 pb-6 pt-14">
        <div className="skeleton mb-2 h-5 w-36 rounded-full" />
        <div className="skeleton mb-4 h-3 w-24 rounded-full" />
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton mt-2 h-3 w-3/4 rounded-full" />
        <div className="mt-5 flex gap-6">
          {[1,2,3].map(i => <div key={i} className="skeleton h-10 w-16 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

// ─── stat chip ────────────────────────────────────────────────────────────────
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg font-bold text-text">{value}</span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export function ProfileView({ username }: { username: string }) {
  const authUser = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const isOwn = authUser?.username === username;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Photo[]>([]);
  const [saved, setSaved] = useState<Photo[]>([]);
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const [following, setFollowing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [togglingFollow, setTogglingFollow] = useState(false);
  const [loadError, setLoadError] = useState("");

  // edit mode state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoadingProfile(true);
        setLoadError("");
        const [{ data: profileData }, { data: postsData }] = await Promise.all([
          api.get<{ item: UserProfile }>(`/users/${username}`),
          api.get<{ items: Photo[] }>(`/users/${username}/photos`),
        ]);
        setProfile(profileData.item);
        setPosts(postsData.items);
        if (isOwn) {
          const { data: savedData } = await api.get<{ items: Photo[] }>("/photos/saved");
          setSaved(savedData.items);
        }
      } catch {
        setLoadError("Профиль жүктелмеді");
      } finally {
        setLoadingProfile(false);
      }
    }
    void load();
  }, [isOwn, username]);

  const items = useMemo(
    () => (tab === "saved" && isOwn ? saved : posts),
    [tab, isOwn, saved, posts]
  );

  // ── avatar file pick ───────────────────────────────────────────────────────
  function handleAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function startEdit() {
    if (!profile) return;
    setEditName(profile.displayName);
    setEditBio(profile.bio ?? "");
    setAvatarPreview(profile.avatarUrl ?? "");
    setAvatarFile(null);
    setSaveError("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview("");
    setSaveError("");
  }

  async function handleSave() {
    if (!profile) return;
    try {
      setSaving(true);
      setSaveError("");

      let finalAvatarUrl = profile.avatarUrl ?? "";

      if (avatarFile) {
        const form = new FormData();
        form.append("avatar", avatarFile);
        const { data } = await api.post<{ avatarUrl: string }>("/users/me/avatar", form);
        finalAvatarUrl = data.avatarUrl;
      }

      const { data } = await api.patch<{ item: UserProfile }>("/users/me", {
        displayName: editName.trim(),
        bio: editBio.trim(),
        avatarUrl: finalAvatarUrl,
      });

      setProfile(data.item);
      updateUser({
        displayName: data.item.displayName,
        avatarUrl: data.item.avatarUrl,
      });
      setEditing(false);
      setAvatarFile(null);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Сақтау мүмкін болмады"
        : "Сақтау мүмкін болмады";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleFollow() {
    if (!profile || !authUser || isOwn) return;
    try {
      setTogglingFollow(true);
      const next = !following;
      setFollowing(next);
      setProfile({ ...profile, followersCount: profile.followersCount + (next ? 1 : -1) });
      await api.post(`/users/${username}/follow`);
    } catch {
      setFollowing((v) => !v);
      setProfile(profile);
    } finally {
      setTogglingFollow(false);
    }
  }

  // ── render states ──────────────────────────────────────────────────────────
  if (loadingProfile) return <ProfileSkeleton />;

  if (loadError || !profile) {
    return (
      <div className="mt-20 text-center">
        <p className="text-base font-semibold text-text">{loadError || "Профиль табылмады"}</p>
      </div>
    );
  }

  const pal = palette(profile.username);
  const avatarSrc = editing ? avatarPreview || profile.avatarUrl : profile.avatarUrl;

  return (
    <div className="space-y-6">
      {/* ── header card ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">

        {/* cover */}
        <div className={`h-36 bg-gradient-to-br ${pal.cover} sm:h-44`} />

        {/* avatar + actions row */}
        <div className="flex items-end justify-between px-5 -mt-10">
          {/* avatar */}
          <div className="relative">
            <div className={`h-20 w-20 overflow-hidden rounded-2xl border-[3px] border-surface shadow-card ${!avatarSrc ? `${pal.bg} flex items-center justify-center` : ""}`}>
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={profile.displayName}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className={`text-2xl font-bold ${pal.text}`}>
                  {profile.displayName[0]?.toUpperCase()}
                </span>
              )}
            </div>
            {/* upload overlay — only in edit mode */}
            {editing && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 transition hover:bg-black/55"
                >
                  <Camera size={18} className="text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarPick}
                />
              </>
            )}
          </div>

          {/* action buttons */}
          <div className="flex items-center gap-2">
            {isOwn ? (
              !editing ? (
                <>
                  <button
                    type="button"
                    onClick={startEdit}
                    aria-label="Профильді өңдеу"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text transition hover:bg-bg active:translate-y-px"
                  >
                    <Pencil size={15} />
                  </button>
                </>
              ) : null
            ) : (
              <button
                type="button"
                onClick={handleFollow}
                disabled={togglingFollow}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-4 text-xs font-semibold transition active:translate-y-px disabled:opacity-50 ${
                  following
                    ? "border border-border text-text hover:bg-bg"
                    : "bg-primary text-white hover:bg-primary-light"
                }`}
              >
                {following
                  ? <><UserCheck size={13} /> Жазылдым</>
                  : <><UserPlus size={13} /> Жазылу</>
                }
              </button>
            )}
          </div>
        </div>

        {/* name + bio */}
        <div className="px-5 pb-5 pt-3 space-y-1.5">
          {editing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-base font-bold text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Аты-жөні"
            />
          ) : (
            <h1 className="text-xl font-bold text-text">{profile.displayName}</h1>
          )}
          <p className="text-sm text-muted">@{profile.username}</p>

          {editing ? (
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              placeholder="Өзіңіз туралы жазыңыз..."
              className="mt-2 w-full resize-none rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted/50"
            />
          ) : profile.bio ? (
            <p className="mt-1 text-sm leading-relaxed text-muted">{profile.bio}</p>
          ) : isOwn ? (
            <button
              type="button"
              onClick={startEdit}
              className="mt-1 text-sm text-primary/70 hover:text-primary"
            >
              + Био қосыңыз
            </button>
          ) : null}

          {editing ? (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-border/70 bg-bg px-3 py-2.5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  Профильді өңдеу
                </p>
                <div className="flex items-center gap-2">
                  <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      aria-label="Өзгерістерді болдырмау"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-white hover:text-text disabled:opacity-50 active:translate-y-px"
                  >
                    <X size={15} />
                  </button>
                  <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      aria-label="Өзгерістерді сақтау"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary-light disabled:opacity-50 active:translate-y-px"
                  >
                    <Check size={15} />
                  </button>
                </div>
              </div>
          ) : null}

          {saveError ? (
            <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
              {saveError}
            </p>
          ) : null}

          {/* stats */}
          <div className="flex gap-6 pt-4 border-t border-border/60 mt-4">
            <Stat value={profile.postsCount} label="Пост" />
            <Stat value={profile.followersCount} label="Жазылушы" />
            <Stat value={profile.followingCount} label="Жазылым" />
          </div>
        </div>
      </div>

      {/* ── tabs ────────────────────────────────────────────────────────── */}
      {isOwn && (
        <div className="flex gap-1 rounded-xl bg-surface p-1 shadow-card">
          <button
            type="button"
            onClick={() => setTab("posts")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
              tab === "posts"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            <Grid3X3 size={15} />
            Посттар
          </button>
          <button
            type="button"
            onClick={() => setTab("saved")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
              tab === "saved"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            <Bookmark size={15} />
            Сақталған
          </button>
        </div>
      )}

      {/* ── grid ────────────────────────────────────────────────────────── */}
      {items.length > 0 ? (
        <PhotoGrid items={items} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          {tab === "saved"
            ? <Bookmark size={32} strokeWidth={1.5} className="text-border" />
            : <Grid3X3 size={32} strokeWidth={1.5} className="text-border" />
          }
          <p className="text-sm font-semibold text-text">
            {tab === "saved" ? "Сақталған жоқ" : "Пост жоқ"}
          </p>
          <p className="text-xs text-muted">
            {tab === "saved"
              ? "Ұнаған фотоларды кейінге сақтаңыз"
              : isOwn
                ? "Алғашқы фотоңызды жүктеңіз"
                : "Бұл пайдаланушы әлі фото жарияламаған"
            }
          </p>
        </div>
      )}
    </div>
  );
}
