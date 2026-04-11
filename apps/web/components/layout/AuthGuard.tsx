"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("taspa.accessToken");
    if (!token) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen">
        <div className="hidden h-screen w-56 border-r border-border bg-surface lg:fixed lg:left-0 lg:top-0 lg:block" />
        <div className="lg:ml-56">
          <div className="mx-auto max-w-[2200px] px-4 pb-28 pt-6 lg:px-8 lg:pb-8 2xl:px-10 [@media(min-width:1800px)]:px-12">
            <div className="mb-6">
              <div className="skeleton mb-3 h-3 w-20 rounded-full" />
              <div className="skeleton h-10 w-56 rounded-2xl" />
            </div>
            <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 [@media(min-width:1800px)]:columns-7 [@media(min-width:2200px)]:columns-8">
              <div className="skeleton mb-4 h-72 break-inside-avoid rounded-[28px]" />
              <div className="skeleton mb-4 h-56 break-inside-avoid rounded-[28px]" />
              <div className="skeleton mb-4 h-80 break-inside-avoid rounded-[28px]" />
              <div className="skeleton mb-4 h-60 break-inside-avoid rounded-[28px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
