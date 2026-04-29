"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Users, X } from "lucide-react";
import clsx from "clsx";

import { UserProfile } from "@/lib/types";
import { AuthUser } from "@/store/authStore";

export type ProfileConnectionKind = "followers" | "following";

function AvatarBadge({ user }: { user: UserProfile }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-sm font-bold text-primary">
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
      ) : (
        user.displayName[0]?.toUpperCase()
      )}
    </div>
  );
}

export function ProfileConnectionsDialog({
  open,
  kind,
  profile,
  items,
  loading,
  error,
  viewer,
  onClose,
  onKindChange,
}: {
  open: boolean;
  kind: ProfileConnectionKind;
  profile: UserProfile;
  items: UserProfile[];
  loading: boolean;
  error: string;
  viewer: AuthUser | null;
  onClose: () => void;
  onKindChange: (kind: ProfileConnectionKind) => void;
}) {
  const followingIds = useMemo(() => new Set(viewer?.following ?? []), [viewer?.following]);
  const title = kind === "followers" ? "Жазылушылар" : "Жазылымдар";
  const count = kind === "followers" ? profile.followersCount : profile.followingCount;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40 p-3 backdrop-blur-sm lg:items-center lg:justify-center lg:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(82vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] bg-[#fcfbf8] shadow-[0_24px_80px_rgba(28,25,23,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/80 px-5 py-5 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">{title}</p>
            <h2 className="mt-2 text-2xl font-semibold text-text">
              {count.toLocaleString()} адам
            </h2>
            <p className="mt-1 text-sm text-muted">
              @{profile.username} профилімен байланысты тізім
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-white p-2 text-muted transition hover:text-text"
            aria-label="Жабу"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 border-b border-border/80 px-5 py-3 sm:px-6">
          {(["followers", "following"] as ProfileConnectionKind[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onKindChange(item)}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                kind === item ? "bg-primary text-white" : "bg-white text-muted shadow-card"
              )}
            >
              {item === "followers" ? "Жазылушылар" : "Жазылымдар"}
            </button>
          ))}
        </div>

        <div className="min-h-[280px] overflow-y-auto px-5 py-5 sm:px-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-[24px] bg-white p-4 shadow-card">
                  <div className="skeleton h-12 w-12 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-32 rounded-full" />
                    <div className="skeleton h-3 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-danger/15 bg-danger/5 px-5 py-6 text-center">
              <p className="text-sm font-semibold text-danger">Тізім жүктелмеді</p>
              <p className="mt-1 text-sm text-muted">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-border bg-white px-5 py-10 text-center">
              <Users size={34} strokeWidth={1.5} className="text-border" />
              <p className="text-base font-semibold text-text">
                {kind === "followers" ? "Жазылушылар әлі жоқ" : "Жазылымдар әлі жоқ"}
              </p>
              <p className="max-w-sm text-sm text-muted">
                Бұл тізім бос. Кейін бұл жерден пайдаланушыларды қарап шыға аласыз.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isViewer = viewer?._id === item._id;
                const isFollowing = followingIds.has(item._id);

                return (
                  <Link
                    key={item._id}
                    href={`/profile/${item.username}`}
                    onClick={onClose}
                    className="group flex items-center gap-3 rounded-[24px] bg-white p-4 shadow-card transition hover:-translate-y-px hover:shadow-card-hover"
                  >
                    <AvatarBadge user={item} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-text">{item.displayName}</p>
                        {isViewer ? (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                            Сіз
                          </span>
                        ) : isFollowing ? (
                          <span className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-medium text-muted">
                            Жазылған
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-muted">@{item.username}</p>
                      {item.bio ? (
                        <p className="mt-2 line-clamp-2 text-sm text-text/80">{item.bio}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted">
                        {item.followersCount.toLocaleString()} жазылушы · {item.postsCount.toLocaleString()} пост
                      </p>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-muted transition group-hover:text-primary" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
