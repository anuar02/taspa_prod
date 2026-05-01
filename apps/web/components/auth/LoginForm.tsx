"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type FormValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();

  const onSubmit = handleSubmit(async (values) => {
    try {
      setError("");
      const { data } = await api.post("/auth/login", values);
      setSession(data);
      router.push("/feed");
    } catch (submitError) {
      const message = axios.isAxiosError(submitError)
        ? submitError.response?.data?.message ?? "Кіру сәтсіз аяқталды"
        : "Кіру сәтсіз аяқталды";
      setError(message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-text">Email</label>
        <input
          type="email"
          autoComplete="email"
          placeholder="siz@example.com"
          {...register("email", { required: true })}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-text">Құпиясөз</label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Ұмыттыңыз ба?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password", { required: true })}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 pr-11 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-text"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60"
      >
        {isSubmitting ? "Жүктелуде..." : "Кіру"}
      </button>
    </form>
  );
}
