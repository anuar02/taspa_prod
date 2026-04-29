"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Lock, MessageCircle } from "lucide-react";

import { Photo } from "@/lib/types";

export function ProfileMediaGrid({ items }: { items: Photo[] }) {
  return (
    <div className="grid grid-cols-3 gap-px bg-border">
      {items.map((photo, index) => (
        <Link
          key={photo._id}
          href={`/photo/${photo._id}`}
          className="group relative block aspect-square overflow-hidden bg-surface"
        >
          <Image
            src={photo.thumbnailUrl || photo.imageUrl}
            alt={photo.caption || "Фото"}
            fill
            className="object-cover transition duration-200 group-hover:scale-[1.04] group-hover:brightness-90"
            sizes="(max-width: 768px) 33vw, 25vw"
            priority={index < 9}
          />
          {photo.isPrivate && (
            <div className="absolute left-1.5 top-1.5 rounded-full bg-black/50 p-1 text-white backdrop-blur-sm">
              <Lock size={11} />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/35" />
          <div className="absolute inset-0 hidden items-center justify-center gap-4 text-sm font-semibold text-white opacity-0 transition group-hover:flex group-hover:opacity-100">
            <span className="inline-flex items-center gap-1.5">
              <Heart size={16} className="fill-white text-white" />
              {photo.likesCount}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle size={16} />
              {photo.commentsCount}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
