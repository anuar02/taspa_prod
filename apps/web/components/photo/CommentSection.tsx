"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, MessageCircle, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { Comment } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

// ─── helpers ────────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-orange-100 text-orange-700",
];

function avatarPalette(username: string) {
  return AVATAR_PALETTES[username.charCodeAt(0) % AVATAR_PALETTES.length];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "жаңа ғана";
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} сағ`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} күн`;
  return new Date(dateStr).toLocaleDateString("kk-KZ", { day: "numeric", month: "short" });
}

// ─── skeleton ───────────────────────────────────────────────────────────────

function CommentSkeleton() {
  return (
    <div className="flex gap-3 py-3">
      <div className="skeleton h-8 w-8 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton h-3 w-3/4 rounded-full" />
      </div>
    </div>
  );
}

// ─── avatar ─────────────────────────────────────────────────────────────────

function Avatar({ name, username, size = "md" }: { name: string; username: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm";
  return (
    <div className={`${dim} ${avatarPalette(username)} flex shrink-0 items-center justify-center rounded-xl font-bold`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function CommentSection({
  photoId,
  photoAuthorId,
  commentsCount,
  onCountChange
}: {
  photoId: string;
  photoAuthorId?: string;
  commentsCount: number;
  onCountChange?: (count: number) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function resolveCount(value: unknown, fallback: number) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get<{ items: Comment[] }>(`/comments/photo/${photoId}`, {
          params: { page: 1, limit: 20 },
        });
        setComments(data.items);
      } catch {
        setError("Пікірлерді жүктеу мүмкін болмады");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [photoId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    try {
      setSubmitting(true);
      setError("");
      const { data } = await api.post<{ item: Comment; commentsCount?: number }>(`/comments/photo/${photoId}`, {
        text: text.trim(),
      });
      setComments((prev) => [data.item, ...prev]);
      onCountChange?.(resolveCount(data.commentsCount, commentsCount + 1));
      setText("");
      inputRef.current?.focus();
    } catch {
      setError("Пікір жіберілмеді");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (deletingId) return;

    const previousComments = comments;
    const nextComments = comments.filter((comment) => comment._id !== commentId);

    try {
      setDeletingId(commentId);
      setError("");
      setComments(nextComments);
      onCountChange?.(Math.max(0, commentsCount - 1));

      const { data } = await api.delete<{ commentsCount?: number }>(`/comments/${commentId}`);
      onCountChange?.(resolveCount(data.commentsCount, Math.max(0, commentsCount - 1)));
    } catch {
      setComments(previousComments);
      onCountChange?.(commentsCount);
      setError("Пікірді өшіру мүмкін болмады");
    } finally {
      setDeletingId(null);
    }
  }

  const count = resolveCount(commentsCount, comments.length);

  return (
    <div className="overflow-hidden rounded-[28px] border border-border/70 bg-white shadow-card">
      {/* header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <MessageCircle size={15} className="text-primary" />
          <span className="text-sm font-semibold text-text">Пікірлер</span>
        </div>
        <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-semibold text-muted">
          {count}
        </span>
      </div>

      {/* comment list */}
      <div className="min-h-0 flex-1 px-4">
        {loading ? (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageCircle size={28} strokeWidth={1.5} className="text-border" />
            <p className="text-sm font-medium text-text">Пікірлер жоқ</p>
            <p className="text-xs text-muted">Алғашқы пікірді жазыңыз</p>
          </div>
        ) : (
          comments.map((comment, i) => {
            const canDelete = Boolean(
              user?._id && (user._id === comment.author._id || user._id === photoAuthorId)
            );

            return (
            <article
              key={comment._id}
              className={`group flex gap-3 py-4 ${i < comments.length - 1 ? "border-b border-border/50" : ""}`}
            >
              <Avatar name={comment.author.displayName} username={comment.author.username} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${comment.author.username}`}
                      className="block truncate text-sm font-semibold text-text hover:text-primary"
                    >
                      {comment.author.displayName}
                    </Link>
                    <span className="text-[11px] text-muted">{timeAgo(comment.createdAt)}</span>
                  </div>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete(comment._id)}
                      disabled={deletingId === comment._id}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted opacity-70 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100 disabled:opacity-30"
                      aria-label="Пікірді өшіру"
                      title="Пікірді өшіру"
                    >
                      <Trash2 size={13} />
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-text">{comment.text}</p>
              </div>
            </article>
          );
          })
        )}
      </div>

      {/* error */}
      {error ? (
        <p className="mx-4 mt-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}

      {/* input */}
      <div className="mt-3 border-t border-border/60 bg-bg/50 p-4">
        {user ? (
          <form onSubmit={handleSubmit} className="flex gap-2.5">
            <Avatar name={user.displayName} username={user.username} size="sm" />
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Пікір жазыңыз..."
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit(e as unknown as FormEvent);
                  }
                }}
                disabled={submitting}
                className="w-full resize-none overflow-hidden rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text outline-none transition placeholder:text-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-light disabled:opacity-30 active:translate-y-px"
            >
              <ArrowUp size={15} strokeWidth={2.5} />
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="block rounded-xl border border-border bg-bg px-4 py-3 text-center text-sm text-muted transition hover:border-primary hover:text-primary"
          >
            Пікір қалдыру үшін кіріңіз
          </Link>
        )}
      </div>
    </div>
  );
}
