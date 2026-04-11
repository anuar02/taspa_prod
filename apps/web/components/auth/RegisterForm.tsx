"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type FormValues = {
  displayName: string;
  username: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text">{label}</label>
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10";

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = handleSubmit(async ({ acceptedTerms, ...values }) => {
    if (!acceptedTerms) {
      setError("Шарттармен келісу қажет");
      return;
    }

    try {
      setError("");
      const { data } = await api.post("/auth/register", values);
      setSession(data);
      router.push("/feed");
    } catch (submitError) {
      const message = axios.isAxiosError(submitError)
        ? submitError.response?.data?.message ?? "Тіркелу сәтсіз аяқталды"
        : "Тіркелу сәтсіз аяқталды";
      setError(message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Аты-жөні" error={errors.displayName ? "Аты-жөні қажет" : undefined}>
          <input
            placeholder="Айгерім Бекова"
            autoComplete="name"
            {...register("displayName", { required: true })}
            className={inputClass}
          />
        </Field>
        <Field label="Пайдаланушы аты" error={errors.username ? "Username қажет" : undefined}>
          <input
            placeholder="aigerim"
            autoComplete="username"
            {...register("username", { required: true })}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Email" error={errors.email ? "Email қажет" : undefined}>
        <input
          type="email"
          placeholder="siz@example.com"
          autoComplete="email"
          {...register("email", { required: true })}
          className={inputClass}
        />
      </Field>

      <Field
        label="Құпиясөз"
        error={errors.password ? "Кемі 8 таңба болуы керек" : undefined}
      >
        <input
          type="password"
          placeholder="Кемінде 8 таңба"
          autoComplete="new-password"
          {...register("password", { required: true, minLength: 8 })}
          className={inputClass}
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition hover:bg-white">
        <input
          type="checkbox"
          {...register("acceptedTerms", { required: true })}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span className="text-sm text-muted">
          <span className="text-text">Қолданушы шарттарымен</span> келісемін
        </span>
      </label>

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
        {isSubmitting ? "Жасалуда..." : "Аккаунт жасау"}
      </button>
    </form>
  );
}
