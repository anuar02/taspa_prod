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
    <aside className="fixed left-0 top-0 hidden h-full w-56 flex-col border-r border-border bg-surface lg:flex">
      {/* Logo */}
      <div className="px-6 py-7">
        <Link href="/splash">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Taspa</p>
          <p className="mt-0.5 text-[11px] text-muted">Әр сурет — бір тарих</p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-col px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/8 text-primary"
                  : "text-muted hover:bg-bg hover:text-text"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <Link
          href={profileHref}
          className="mx-3 mt-auto mb-4 flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-bg"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
            {user.displayName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{user.displayName}</p>
            <p className="truncate text-xs text-muted">@{user.username}</p>
          </div>
        </Link>
      )}
    </aside>
  );
}
