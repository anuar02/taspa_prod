"use client";

import { FormEvent, useEffect, useState } from "react";

import { api } from "@/lib/api";
import { Comment } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CommentSection({ photoId, commentsCount }: { photoId: string; commentsCount: number }) {
  const user = useAuthStore((state) => state.user);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadComments() {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get<{ items: Comment[] }>(`/comments/photo/${photoId}`, {
          params: { page: 1, limit: 20 }
        });
        setComments(data.items);
      } catch (loadError) {
        console.error(loadError);
        setError("Пікірлерді жүктеу мүмкін болмады");
      } finally {
        setLoading(false);
      }
    }

    void loadComments();
  }, [photoId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!text.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const { data } = await api.post<{ item: Comment }>(`/comments/photo/${photoId}`, {
        text: text.trim()
      });
      setComments((current) => [data.item, ...current]);
      setText("");
    } catch (submitError) {
      console.error(submitError);
      setError("Пікір жіберу сәтсіз аяқталды");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Пікірлер</h2>
        <span className="text-sm text-muted">{comments.length || commentsCount} пікір</span>
      </div>
      <form onSubmit={handleSubmit} className="mb-5 flex gap-3">
        <Input
          placeholder={user ? "Пікір қалдыру..." : "Пікір қалдыру үшін кіріңіз"}
          value={text}
          disabled={!user || submitting}
          onChange={(event) => setText(event.target.value)}
        />
        <Button type="submit" disabled={!user || submitting || !text.trim()}>
          {submitting ? "Жіберілуде..." : "Жіберу"}
        </Button>
      </form>
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {loading ? <p className="text-sm text-muted">Пікірлер жүктелуде...</p> : null}
      {!loading && comments.length === 0 ? (
        <p className="text-sm text-muted">Әзірге пікір жоқ. Алғашқы пікірді жазыңыз.</p>
      ) : null}
      <div className="space-y-4">
        {comments.map((comment) => (
          <article key={comment._id} className="rounded-3xl bg-surface px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">{comment.author.displayName}</p>
                <p className="text-xs text-muted">@{comment.author.username}</p>
              </div>
              <span className="text-xs text-muted">
                {new Date(comment.createdAt).toLocaleDateString("kk-KZ")}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-text">{comment.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
