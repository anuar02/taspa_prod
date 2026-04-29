"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";

const mosaic = [
  "aspect-[3/4]", "aspect-square", "aspect-[2/3]",
  "aspect-[4/5]", "aspect-[3/4]", "aspect-square",
  "aspect-square", "aspect-[2/3]", "aspect-[4/5]",
  "aspect-[3/4]", "aspect-square", "aspect-[3/4]",
];

type SplashPhoto = {
  id: string;
  imageUrl: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
};

export default function SplashPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<SplashPhoto[]>([]);

  useEffect(() => {
    const accessToken = window.localStorage.getItem("taspa.accessToken");

    if (accessToken) {
      router.replace("/feed");
      return;
    }

    const controller = new AbortController();

    api
      .get<{ items: SplashPhoto[] }>("/search/splash", {
        signal: controller.signal
      })
      .then((response) => {
        setPhotos(response.data.items.slice(0, mosaic.length));
      })
      .catch(() => {
        setPhotos([]);
      });

    return () => controller.abort();
  }, [router]);

  return (
    <main
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
      style={{ background: "linear-gradient(155deg, #4c0519 0%, #E11D48 55%, #9f1239 100%)" }}
    >
      {/* photo mosaic */}
      <div className="pointer-events-none absolute inset-0 p-6 opacity-[0.1]">
        <div className="columns-3 gap-3 [&>*]:mb-3 sm:columns-4">
          {mosaic.map((aspect, i) => {
            const photo = photos[i];

            return (
              <div
                key={i}
                className={`relative break-inside-avoid overflow-hidden rounded-2xl bg-white/20 ${aspect}`}
              >
                {photo ? (
                  <>
                    <Image
                      src={photo.imageUrl}
                      alt={photo.alt}
                      fill
                      priority={i < 4}
                      sizes="(min-width: 640px) 24vw, 32vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[#4c0519]/15" />
                  </>
                ) : (
                  <div className="h-full w-full bg-white" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* bottom vignette */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-3/4"
        style={{ background: "linear-gradient(to top, rgba(76,5,25,0.88) 0%, transparent 100%)" }}
      />

      {/* header */}
      <header className="relative z-10 px-8 pt-12">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/60">Taspa</span>
      </header>

      {/* content */}
      <div className="relative z-10 mt-auto px-8 pb-16">
        <div className="mb-10 max-w-sm space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
            Фото кеңістік
          </p>
          <h1 className="text-[3.25rem] font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
            Әр сурет —<br />бір тарих
          </h1>
          <p className="text-base leading-relaxed text-white/55">
            Табиғат, қала, портрет және өнер сәттерін қазақ тілінде бөлісіңіз.
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">
            Фон суреттері Pexels арқылы.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-white px-8 text-sm font-bold text-primary transition hover:bg-white/90 active:translate-y-px sm:flex-none"
          >
            Тіркелу
          </Link>
          <Link
            href="/login"
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 active:translate-y-px sm:flex-none"
          >
            Кіру
          </Link>
        </div>
      </div>
    </main>
  );
}
