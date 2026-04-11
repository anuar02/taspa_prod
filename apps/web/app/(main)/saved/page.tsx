"use client";

import { useEffect, useState } from "react";

import { TopBar } from "@/components/layout/TopBar";
import { PhotoGrid } from "@/components/photo/PhotoGrid";
import { api } from "@/lib/api";
import { Photo } from "@/lib/types";

export default function SavedPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items: Photo[] }>("/photos/saved")
      .then(({ data }) => setPhotos(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <TopBar title="Сақталған" subtitle="Кейін көру үшін қалдырылған фотолар" />
      {loading ? (
        <p className="text-sm text-muted">Жүктелуде...</p>
      ) : photos.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg font-semibold text-text">Сақталған фотолар жоқ</p>
          <p className="mt-2 text-sm text-muted">Фотоны сақтау үшін жүрек белгісін басыңыз</p>
        </div>
      ) : (
        <PhotoGrid items={photos} />
      )}
    </main>
  );
}
