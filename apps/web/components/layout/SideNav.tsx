"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, ChevronUp, House, LogOut, PlusSquare, Search, User } from "lucide-react";
import clsx from "clsx";

import { LogoutButton } from "@/components/layout/LogoutButton";
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
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const navItems = items.map((item) =>
    item.href === "/profile" ? { ...item, href: profileHref } : item
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-56 flex-col border-r border-border bg-surface lg:flex">
      {/* Logo */}
      <div className="px-6 py-7">
        <Link href="/feed">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Taspa</p>
          <p className="mt-0.5 text-[11px] text-muted">Әр сурет — бір тарих</p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-col px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href) ?? false;
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
        <div ref={dropdownRef} className="relative mx-3 mt-auto mb-4">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-bg"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-sm font-bold text-primary">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
              ) : (
                user.displayName?.[0]?.toUpperCase() ?? "U"
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-text">{user.displayName}</p>
              <p className="truncate text-xs text-muted">@{user.username}</p>
            </div>
            <ChevronUp size={16} className={clsx("text-muted transition-transform", !open && "rotate-180")} />
          </button>

          {open ? (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-border bg-white p-2 shadow-card">
              <LogoutButton className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-muted transition-colors hover:bg-bg hover:text-text">
                <LogOut size={16} />
                <span>Шығу</span>
              </LogoutButton>
            </div>
          ) : null}
        </div>
      )}
    </aside>
  );
}
