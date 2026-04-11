"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, House, PlusSquare, Search, Settings, User } from "lucide-react";
import clsx from "clsx";

import { useAuthStore } from "@/store/authStore";

const baseItems = [
  { href: "/feed", label: "Басты бет", icon: House },
  { href: "/search", label: "Іздеу", icon: Search },
  { href: "/upload", label: "Жүктеу", icon: PlusSquare },
  { href: "/saved", label: "Сақталған", icon: Bookmark },
  { href: "/profile", label: "Профиль", icon: User }
];

export function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const profileHref = user ? `/profile/${user.username}` : "/login";

  const items = baseItems.map((item) =>
    item.href === "/profile" ? { ...item, href: profileHref } : item
  );

  return (
    <div className="fixed bottom-4 left-1/2 z-30 w-[min(92vw,420px)] -translate-x-1/2 lg:hidden">
      <nav className="flex items-center justify-between rounded-full border border-white/60 bg-white/90 px-4 py-3 shadow-card backdrop-blur">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href) ?? false;

        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex min-w-0 flex-col items-center gap-1 text-[11px] font-medium",
              active ? "text-primary" : "text-muted"
            )}
          >
            <Icon size={18} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
      {user ? (
        <Link
          href={profileHref}
          className={clsx(
            "flex min-w-0 flex-col items-center gap-1 text-[11px] font-medium",
            pathname?.startsWith("/profile") ? "text-primary" : "text-muted"
          )}
          aria-label="Профиль баптаулары"
        >
          <Settings size={18} />
          <span className="truncate">Баптау</span>
        </Link>
      ) : null}
      </nav>
    </div>
  );
}
