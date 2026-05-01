"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

import { api } from "@/lib/api";

type FormValues = {
  password: string;
  confirmPassword: string;
};

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormValues>();

  const onSubmit = handleSubmit(async (values) => {
    if (values.password !== values.confirmPassword) {
      setError("Құпиясөздер сәйкес келмейді");
      return;
    }

    try {
      setError("");
      await api.post("/auth/reset-password", { token, password: values.password });
      setDone(true);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Қате орын алды"
        : "Қате орын алды";
      setError(message);
    }
  });

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">Сілтеме жарамсыз немесе мерзімі өткен.</p>
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          Жаңа сілтеме алу
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-text">Құпиясөз жаңартылды!</h2>
          <p className="text-sm text-muted">Енді жаңа құпиясөзбен кіре аласыз.</p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light"
        >
          Кіру
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text">Жаңа құпиясөз</h1>
        <p className="text-sm text-muted">Кемінде 8 символ болуы керек</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text">Жаңа құпиясөз</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("password", { required: true, minLength: 8 })}
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

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text">Құпиясөзді растаңыз</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("confirmPassword", { required: true })}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 pr-11 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-text"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
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
          {isSubmitting ? "Жүктелуде..." : "Сақтау"}
        </button>
      </form>
    </div>
  );
}
