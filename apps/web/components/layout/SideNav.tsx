"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, House, PlusSquare, Search, User } from "lucide-react";
import clsx from "clsx";

import { useAuthStore } from "@/store/authStore";

const items = [
  { href: "/feed", label: "Басты бет", icon: House },
  { href: "/search", label: "Іздеу", icon: Search },
  { href: "/upload", label: "Жүктеу", icon: PlusSquare },
  { href: "/saved", label: "Сақталған", icon: Bookmark },
  { href: "/profile", label: "Профиль", icon: User }
];

export function SideNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const profileHref = user ? `/profile/${user.username}` : "/login";

  const navItems = items.map((item) =>
    item.href === "/profile" ? { ...item, href: profileHref } : item
  );

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-56 flex-col border-r border-border bg-white px-3 py-6 lg:flex">
      {/* Logo */}
      <div className="mb-8 px-3">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Taspa</p>
        <p className="mt-1 text-xs text-muted">Әр сурет — бір тарих</p>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-surface hover:text-text"
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      {user && (
        <Link
          href={profileHref}
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-surface"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
            {user.displayName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text">{user.displayName}</p>
            <p className="truncate text-xs text-muted">@{user.username}</p>
          </div>
        </Link>
      )}
    </aside>
  );
}
