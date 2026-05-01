"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PhotoDetail } from "@/components/photo/PhotoDetail";
import { api } from "@/lib/api";
import { Photo } from "@/lib/types";

function PhotoDetailSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="skeleton aspect-[4/5] rounded-[32px] lg:h-[calc(100vh-7rem)] lg:min-h-[640px] lg:aspect-auto" />
      <div className="mt-5 space-y-5 lg:mt-0">
        <div className="space-y-2">
          <div className="skeleton h-5 w-40 rounded-full" />
          <div className="skeleton h-4 w-24 rounded-full" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-10 w-20 rounded-full" />
          <div className="skeleton h-10 w-20 rounded-full" />
          <div className="skeleton h-10 w-28 rounded-full" />
        </div>
        <div className="skeleton h-32 rounded-[28px]" />
        <div className="skeleton h-80 rounded-[28px]" />
      </div>
    </div>
  );
}

export default function PhotoPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadPhoto() {
      if (!id) {
        setError("Фото табылмады");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const { data } = await api.get<{ item: Photo }>(`/photos/${id}`);
        if (alive) setPhoto(data.item);
      } catch {
        if (alive) setError("Фотоны ашу мүмкін болмады");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadPhoto();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main>
        <PhotoDetailSkeleton />
      </main>
    );
  }

  if (error || !photo) {
    return (
      <main>
        <div className="mx-auto mt-20 max-w-md rounded-[28px] border border-border bg-white p-8 text-center shadow-card">
          <p className="text-lg font-semibold text-text">{error || "Фото табылмады"}</p>
          <p className="mt-2 text-sm text-muted">Фото өшірілген немесе сізде көруге рұқсат жоқ.</p>
          <Link
            href="/feed"
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-light"
          >
            Лентаға оралу
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <PhotoDetail photo={photo} />
    </main>
  );
}
