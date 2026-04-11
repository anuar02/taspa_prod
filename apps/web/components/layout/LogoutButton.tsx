"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function LogoutButton({
  className,
  label,
  iconOnly = false,
  children
}: {
  className?: string;
  label?: string;
  iconOnly?: boolean;
  children?: ReactNode;
}) {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  async function handleLogout() {
    const refreshToken = window.localStorage.getItem("taspa.refreshToken");

    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.error(error);
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  return (
    <button type="button" onClick={handleLogout} className={className}>
      {children ?? (
        <>
          <LogOut size={16} />
          {!iconOnly ? <span>{label ?? "Шығу"}</span> : null}
        </>
      )}
    </button>
  );
}
