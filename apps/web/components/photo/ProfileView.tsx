"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  Camera,
  Check,
  Grid3X3,
  Lock,
  LogOut,
  Settings,
  UserCheck,
  UserPlus,
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

import { ProfileConnectionKind, ProfileConnectionsDialog } from "@/components/photo/ProfileConnectionsDialog";
import { ProfileMediaGrid } from "@/components/photo/ProfileMediaGrid";
import { ProfileSkeleton } from "@/components/photo/ProfileSkeleton";
import { api } from "@/lib/api";
import { Photo, UserProfile } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { useSavedStore } from "@/store/savedStore";

type ProfileTab = "posts" | "saved" | "private";
type ConnectionState = Record<ProfileConnectionKind, { items: UserProfile[]; fetched: boolean }>;

function createConnectionState(): ConnectionState {
  return {
    followers: { items: [], fetched: false },
    following: { items: [], fetched: false },
  };
}

function AvatarCircle({
  src,
  name,
  size,
  editing,
  onPickClick,
}: {
  src?: string;
  name: string;
  size: number;
  editing: boolean;
  onPickClick?: () => void;
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="overflow-hidden rounded-full border border-border/40 bg-surface"
        style={{ width: size, height: size }}
      >
        {src ? (
          <Image src={src} alt={name} width={size} height={size} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
            <span className="font-bold text-primary" style={{ fontSize: size * 0.35 }}>
              {name[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      {editing && onPickClick ? (
        <button
          type="button"
          onClick={onPickClick}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35 transition hover:bg-black/50"
        >
          <Camera size={size * 0.2} className="text-white" />
        </button>
      ) : null}
    </div>
  );
}

function ProfileStatButton({
  value,
  label,
  stacked = false,
  onClick,
}: {
  value: number;
  label: string;
  stacked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl transition hover:bg-white/70 ${
        stacked ? "flex flex-col items-center gap-0.5 px-2 py-1.5" : "inline-flex items-baseline gap-1 px-2 py-1"
      }`}
    >
      <span className={`font-bold text-text transition group-hover:text-primary ${stacked ? "text-base" : "text-sm"}`}>
        {value.toLocaleString()}
      </span>
      <span className={`text-text/70 transition group-hover:text-primary/80 ${stacked ? "text-[12px]" : "text-sm"}`}>
        {label}
      </span>
    </button>
  );
}

export function ProfileView({ username }: { username: string }) {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const isOwn = authUser?.username === username;

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const { items: savedItems, setItems: setSavedItems } = useSavedStore();
  const { setEntry } = useProfileStore();

  const [profile, setProfile] = useState<UserProfile | null>(
    () => useProfileStore.getState().cache[username]?.profile ?? null
  );
  const [posts, setPosts] = useState<Photo[]>(
    () => useProfileStore.getState().cache[username]?.posts ?? []
  );
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [following, setFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [connectionsTab, setConnectionsTab] = useState<ProfileConnectionKind>("followers");
  const [connections, setConnections] = useState<ConnectionState>(createConnectionState);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cached = useProfileStore.getState().cache[username];
    setProfile(cached?.profile ?? null);
    setPosts(cached?.posts ?? []);
    setTab("posts");
    setLoadError("");
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview("");
    setConnections(createConnectionState());
    setConnectionsError("");
    setConnectionsOpen(false);
  }, [username]);

  useEffect(() => {
    const { isStale, cache } = useProfileStore.getState();
    const cached = cache[username];

    if (!isStale(username) && cached) {
      return;
    }

    async function load() {
      try {
        setLoadError("");
        const [{ data: profileData }, { data: postsData }] = await Promise.all([
          api.get<{ item: UserProfile }>(`/users/${username}`),
          api.get<{ items: Photo[] }>(`/users/${username}/photos`),
        ]);

        setProfile(profileData.item);
        setPosts(postsData.items);
        setEntry(username, profileData.item, postsData.items);

        if (isOwn) {
          const { isStale: isSavedStale } = useSavedStore.getState();
          if (isSavedStale()) {
            const { data: savedData } = await api.get<{ items: Photo[] }>("/photos/saved");
            setSavedItems(savedData.items);
          }
        }
      } catch {
        setLoadError("Профиль жүктелмеді");
      }
    }

    void load();
  }, [isOwn, setEntry, setSavedItems, username]);

  useEffect(() => {
    if (!profile || isOwn) {
      setFollowing(false);
      return;
    }

    setFollowing(Boolean(authUser?.following?.includes(profile._id)));
  }, [authUser, isOwn, profile]);

  useEffect(() => {
    if (!avatarPreview.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (!connectionsOpen || connections[connectionsTab].fetched) {
      return;
    }

    let active = true;
    setConnectionsLoading(true);
    setConnectionsError("");

    api
      .get<{ items: UserProfile[] }>(`/users/${username}/${connectionsTab}`)
      .then(({ data }) => {
        if (!active) return;

        setConnections((state) => ({
          ...state,
          [connectionsTab]: {
            items: data.items,
            fetched: true,
          },
        }));
      })
      .catch(() => {
        if (!active) return;
        setConnectionsError("Тізімді дәл қазір алу мүмкін болмады.");
      })
      .finally(() => {
        if (!active) return;
        setConnectionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [connections, connectionsOpen, connectionsTab, username]);

  const items = useMemo(() => {
    if (tab === "saved" && isOwn) return savedItems;
    if (tab === "private" && isOwn) return posts.filter((p) => p.isPrivate);
    return posts.filter((p) => !p.isPrivate);
  }, [isOwn, posts, savedItems, tab]);

  function handleAvatarPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview("");
    setSaveError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openConnections(kind: ProfileConnectionKind) {
    setConnectionsTab(kind);
    setConnectionsOpen(true);
    setConnectionsError("");
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
      setEntry(username, data.item, posts);
      updateUser({
        displayName: data.item.displayName,
        avatarUrl: data.item.avatarUrl,
        bio: data.item.bio,
      });
      setEditing(false);
      setAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setSaveError(
        axios.isAxiosError(error)
          ? (error.response?.data?.message ?? "Сақтау мүмкін болмады")
          : "Сақтау мүмкін болмады"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleFollow() {
    if (!profile || !authUser || isOwn) return;

    const previousProfile = profile;
    const previousFollowingIds = authUser.following ?? [];
    const previousFollowingCount = authUser.followingCount ?? previousFollowingIds.length;
    const nextFollowing = !following;
    const nextFollowingIds = nextFollowing
      ? [...new Set([...previousFollowingIds, profile._id])]
      : previousFollowingIds.filter((id) => id !== profile._id);
    const nextProfile = {
      ...profile,
      followersCount: Math.max(0, profile.followersCount + (nextFollowing ? 1 : -1)),
    };

    try {
      setTogglingFollow(true);
      setFollowing(nextFollowing);
      setProfile(nextProfile);
      setEntry(username, nextProfile, posts);
      updateUser({
        following: nextFollowingIds,
        followingCount: Math.max(0, previousFollowingCount + (nextFollowing ? 1 : -1)),
      });

      const { data } = await api.post<{ following: boolean }>(`/users/${username}/follow`);

      if (data.following !== nextFollowing) {
        const resolvedIds = data.following
          ? [...new Set([...previousFollowingIds, profile._id])]
          : previousFollowingIds.filter((id) => id !== profile._id);
        const resolvedProfile = {
          ...previousProfile,
          followersCount: Math.max(0, previousProfile.followersCount + (data.following ? 1 : -1)),
        };

        setFollowing(data.following);
        setProfile(resolvedProfile);
        setEntry(username, resolvedProfile, posts);
        updateUser({
          following: resolvedIds,
          followingCount: Math.max(0, previousFollowingCount + (data.following ? 1 : -1)),
        });
      }
    } catch {
      setFollowing(!nextFollowing);
      setProfile(previousProfile);
      setEntry(username, previousProfile, posts);
      updateUser({
        following: previousFollowingIds,
        followingCount: previousFollowingCount,
      });
    } finally {
      setTogglingFollow(false);
    }
  }

  if (!profile && !loadError) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <div className="mt-16 rounded-[32px] border border-danger/15 bg-white px-6 py-12 text-center shadow-card">
        <p className="text-base font-semibold text-text">{loadError || "Профиль табылмады"}</p>
        <p className="mt-2 text-sm text-muted">Бетті жаңартып көріңіз немесе басқа профильді ашыңыз.</p>
      </div>
    );
  }

  const avatarSrc = editing ? (avatarPreview || profile.avatarUrl) : profile.avatarUrl;
  const btnOutline =
    "flex items-center justify-center gap-1.5 rounded-lg border border-border bg-white font-semibold text-text transition hover:bg-bg disabled:opacity-50 active:scale-[0.98]";
  const btnPrimary =
    "flex items-center justify-center gap-1.5 rounded-lg bg-primary font-semibold text-white transition hover:bg-primary-light disabled:opacity-50 active:scale-[0.98]";

  return (
    <div className="-mx-4 sm:-mx-6 lg:mx-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarPick}
      />

      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="text-base font-bold text-text">{profile.username}</h1>
          {isOwn && !editing ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startEdit}
                aria-label="Баптаулар"
                className="rounded-full p-2 text-text transition hover:bg-border/60 active:scale-95"
              >
                <Settings size={20} />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Шығу"
                className="rounded-full p-2 text-muted transition hover:bg-border/60 hover:text-danger active:scale-95"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-4 px-4 sm:gap-8 sm:px-6">
          <AvatarCircle
            src={avatarSrc}
            name={profile.displayName}
            size={86}
            editing={editing}
            onPickClick={() => fileInputRef.current?.click()}
          />
          <div className="flex flex-1 justify-around">
            <ProfileStatButton value={profile.postsCount} label="посты" stacked onClick={() => setTab("posts")} />
            <ProfileStatButton
              value={profile.followersCount}
              label="жазылушы"
              stacked
              onClick={() => openConnections("followers")}
            />
            <ProfileStatButton
              value={profile.followingCount}
              label="жазылым"
              stacked
              onClick={() => openConnections("following")}
            />
          </div>
        </div>

        <div className="mt-3 px-4 sm:px-6">
          {editing ? (
            <input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              className="mb-1 w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-[13px] font-semibold text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Аты-жөні"
            />
          ) : (
            <p className="text-[13px] font-semibold text-text">{profile.displayName}</p>
          )}
          {editing ? (
            <textarea
              value={editBio}
              onChange={(event) => setEditBio(event.target.value)}
              rows={3}
              placeholder="Өзіңіз туралы жазыңыз..."
              className="mt-1 w-full resize-none rounded-lg border border-border bg-bg px-3 py-1.5 text-[13px] text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted/50"
            />
          ) : profile.bio ? (
            <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-snug text-text/80">{profile.bio}</p>
          ) : isOwn ? (
            <button type="button" onClick={startEdit} className="mt-1 text-[13px] text-primary">
              + Био қосыңыз
            </button>
          ) : null}
          {saveError ? (
            <p className="mt-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-1.5 text-xs text-danger">
              {saveError}
            </p>
          ) : null}
        </div>

        <div className="mt-3 flex gap-2 px-4 pb-4 sm:px-6">
          {isOwn ? (
            !editing ? (
              <button type="button" onClick={startEdit} className={`${btnOutline} flex-1 py-[7px] text-[13px]`}>
                Профильді өңдеу
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`${btnPrimary} flex-1 py-[7px] text-[13px]`}
                >
                  <Check size={14} />
                  {saving ? "Сақталуда..." : "Сақтау"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className={`${btnOutline} flex-1 py-[7px] text-[13px]`}
                >
                  Болдырмау
                </button>
              </>
            )
          ) : (
            <button
              type="button"
              onClick={handleFollow}
              disabled={togglingFollow}
              className={`${following ? btnOutline : btnPrimary} flex-1 py-[7px] text-[13px]`}
            >
              {following ? (
                <>
                  <UserCheck size={14} />
                  Жазылдым
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  Жазылу
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="mx-auto max-w-3xl py-10">
          <div className="flex items-start gap-14 rounded-[36px] bg-white px-10 py-8 shadow-card">
            <div className="shrink-0">
              <AvatarCircle
                src={avatarSrc}
                name={profile.displayName}
                size={132}
                editing={editing}
                onPickClick={() => fileInputRef.current?.click()}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-light text-text">{profile.username}</h1>
                {isOwn ? (
                  !editing ? (
                    <button
                      type="button"
                      onClick={startEdit}
                      aria-label="Баптаулар"
                      className="rounded-full p-1.5 text-text transition hover:bg-border/60 active:scale-95"
                    >
                      <Settings size={18} />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className={`${btnPrimary} px-5 py-1.5 text-sm`}
                      >
                        <Check size={14} />
                        {saving ? "Сақталуда..." : "Сақтау"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className={`${btnOutline} px-4 py-1.5 text-sm`}
                      >
                        Болдырмау
                      </button>
                    </>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={togglingFollow}
                    className={`${following ? btnOutline : btnPrimary} px-5 py-1.5 text-sm`}
                  >
                    {following ? (
                      <>
                        <UserCheck size={14} />
                        Жазылдым
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        Жазылу
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="mb-4 flex flex-wrap gap-3">
                <ProfileStatButton value={profile.postsCount} label="посты" onClick={() => setTab("posts")} />
                <ProfileStatButton
                  value={profile.followersCount}
                  label="жазылушы"
                  onClick={() => openConnections("followers")}
                />
                <ProfileStatButton
                  value={profile.followingCount}
                  label="жазылым"
                  onClick={() => openConnections("following")}
                />
              </div>

              <div className="space-y-1">
                {editing ? (
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className="w-full max-w-xs rounded-lg border border-border bg-bg px-3 py-1.5 text-sm font-semibold text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    placeholder="Аты-жөні"
                  />
                ) : (
                  <p className="text-sm font-semibold text-text">{profile.displayName}</p>
                )}
                {editing ? (
                  <textarea
                    value={editBio}
                    onChange={(event) => setEditBio(event.target.value)}
                    rows={3}
                    placeholder="Өзіңіз туралы жазыңыз..."
                    className="mt-1 w-full max-w-md resize-none rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-muted/50"
                  />
                ) : profile.bio ? (
                  <p className="max-w-xl whitespace-pre-wrap text-sm leading-snug text-text/80">{profile.bio}</p>
                ) : isOwn ? (
                  <button type="button" onClick={startEdit} className="text-sm text-primary">
                    + Био қосыңыз
                  </button>
                ) : null}
                {saveError ? (
                  <p className="mt-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-1.5 text-xs text-danger">
                    {saveError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center border-t border-border">
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={`flex min-w-[80px] items-center justify-center gap-2 py-[11px] text-xs font-semibold uppercase tracking-widest transition lg:min-w-[100px] ${
            tab === "posts" ? "-mt-px border-t border-text text-text" : "text-muted/60 hover:text-muted"
          }`}
        >
          <Grid3X3 size={14} strokeWidth={tab === "posts" ? 2.5 : 1.5} />
          <span className="hidden sm:inline">Посттар</span>
        </button>
        {isOwn ? (
          <>
            <button
              type="button"
              onClick={() => setTab("saved")}
              className={`flex min-w-[80px] items-center justify-center gap-2 py-[11px] text-xs font-semibold uppercase tracking-widest transition lg:min-w-[100px] ${
                tab === "saved" ? "-mt-px border-t border-text text-text" : "text-muted/60 hover:text-muted"
              }`}
            >
              <Bookmark size={14} strokeWidth={tab === "saved" ? 2.5 : 1.5} />
              <span className="hidden sm:inline">Сақталған</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("private")}
              className={`flex min-w-[80px] items-center justify-center gap-2 py-[11px] text-xs font-semibold uppercase tracking-widest transition lg:min-w-[100px] ${
                tab === "private" ? "-mt-px border-t border-text text-text" : "text-muted/60 hover:text-muted"
              }`}
            >
              <Lock size={14} strokeWidth={tab === "private" ? 2.5 : 1.5} />
              <span className="hidden sm:inline">Жеке</span>
            </button>
          </>
        ) : null}
      </div>

      {items.length > 0 ? (
        <ProfileMediaGrid items={items} />
      ) : (
        <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
          {tab === "saved" ? (
            <Bookmark size={48} strokeWidth={0.75} className="text-border" />
          ) : tab === "private" ? (
            <Lock size={48} strokeWidth={0.75} className="text-border" />
          ) : (
            <Grid3X3 size={48} strokeWidth={0.75} className="text-border" />
          )}
          <p className="text-sm font-semibold text-text">
            {tab === "saved" ? "Сақталған жоқ" : tab === "private" ? "Жеке фото жоқ" : "Пост жоқ"}
          </p>
          <p className="max-w-sm text-xs text-muted">
            {tab === "saved"
              ? "Ұнаған фотоларды кейінге сақтаңыз"
              : tab === "private"
                ? "Жеке деп белгіленген фотолар тек осында көрінеді"
                : isOwn
                  ? "Алғашқы фотоңызды жүктеп, профиліңізді толықтыра бастаңыз"
                  : "Бұл пайдаланушы әлі фото жарияламаған"}
          </p>
          {isOwn ? (
            <Link
              href={tab === "saved" ? "/feed" : "/upload"}
              className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-light"
            >
              {tab === "saved" ? "Лентаға оралу" : "Фото жүктеу"}
            </Link>
          ) : null}
        </div>
      )}

      <ProfileConnectionsDialog
        open={connectionsOpen}
        kind={connectionsTab}
        profile={profile}
        items={connections[connectionsTab].items}
        loading={connectionsLoading}
        error={connectionsError}
        viewer={authUser}
        onClose={() => setConnectionsOpen(false)}
        onKindChange={(kind) => {
          setConnectionsTab(kind);
          setConnectionsError("");
        }}
      />
    </div>
  );
}
