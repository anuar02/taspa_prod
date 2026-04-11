"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { Photo, UserProfile } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { PhotoGrid } from "@/components/photo/PhotoGrid";

export function ProfileView({ username }: { username: string }) {
  const user = useAuthStore((state) => state.user);
  const isOwnProfile = user?.username === username;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Photo[]>([]);
  const [saved, setSaved] = useState<Photo[]>([]);
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [togglingFollow, setTogglingFollow] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const [{ data: profileData }, { data: postsData }] = await Promise.all([
          api.get<{ item: UserProfile }>(`/users/${username}`),
          api.get<{ items: Photo[] }>(`/users/${username}/photos`)
        ]);

        setProfile(profileData.item);
        setPosts(postsData.items);

        if (isOwnProfile) {
          const { data: savedData } = await api.get<{ items: Photo[] }>("/photos/saved");
          setSaved(savedData.items);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [isOwnProfile, username]);

  const items = useMemo(() => {
    if (tab === "saved" && isOwnProfile) {
      return saved;
    }

    return posts;
  }, [isOwnProfile, posts, saved, tab]);

  async function handleFollow() {
    if (!profile || !user || isOwnProfile) {
      return;
    }

    try {
      setTogglingFollow(true);
      const nextFollowing = !following;
      setFollowing(nextFollowing);
      setProfile({
        ...profile,
        followersCount: profile.followersCount + (nextFollowing ? 1 : -1)
      });
      await api.post(`/users/${username}/follow`);
    } catch (error) {
      console.error(error);
      setFollowing((value) => !value);
      setProfile(profile);
    } finally {
      setTogglingFollow(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Профиль жүктелуде...</p>;
  }

  if (!profile) {
    return <p className="text-sm text-danger">Профиль табылмады.</p>;
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] bg-white p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">@{profile.username}</p>
            <h1 className="mt-3 text-3xl font-semibold text-text">{profile.displayName}</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              {profile.bio || "Бұл қолданушы әзірге био қоспаған."}
            </p>
          </div>
          {!isOwnProfile ? (
            <Button variant="secondary" disabled={togglingFollow} onClick={handleFollow}>
              {following ? "Жазылдым" : "Жазылу"}
            </Button>
          ) : null}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-3xl bg-surface px-3 py-4">
            <p className="text-xl font-semibold text-text">{profile.postsCount}</p>
            <p className="text-xs text-muted">Posts</p>
          </div>
          <div className="rounded-3xl bg-surface px-3 py-4">
            <p className="text-xl font-semibold text-text">{profile.followersCount}</p>
            <p className="text-xs text-muted">Followers</p>
          </div>
          <div className="rounded-3xl bg-surface px-3 py-4">
            <p className="text-xl font-semibold text-text">{profile.followingCount}</p>
            <p className="text-xs text-muted">Following</p>
          </div>
        </div>
      </section>

      {isOwnProfile ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("posts")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === "posts" ? "bg-primary text-white" : "bg-white text-muted shadow-card"
            }`}
          >
            Посттар
          </button>
          <button
            type="button"
            onClick={() => setTab("saved")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === "saved" ? "bg-primary text-white" : "bg-white text-muted shadow-card"
            }`}
          >
            Сақталған
          </button>
        </div>
      ) : null}

      {items.length > 0 ? (
        <PhotoGrid items={items} />
      ) : (
        <p className="text-sm text-muted">
          {tab === "saved" ? "Сақталған фотолар әлі жоқ." : "Бұл қолданушы әлі фото жүктемеген."}
        </p>
      )}
    </main>
  );
}
