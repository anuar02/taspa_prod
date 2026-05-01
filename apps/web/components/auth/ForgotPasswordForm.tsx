"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

import { api } from "@/lib/api";

type FormValues = { email: string };

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = handleSubmit(async (values) => {
    try {
      setError("");
      await api.post("/auth/forgot-password", { email: values.email });
      setSent(true);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Қате орын алды"
        : "Қате орын алды";
      setError(message);
    }
  });

  if (sent) {
    return (
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
            <Mail size={24} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-text">
              Хатты тексеріңіз
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              <span className="font-semibold text-text">{getValues("email")}</span>{" "}
              мекенжайына құпиясөзді қалпына келтіру сілтемесін жібердік.
              Спам қалтасын да тексеруді ұмытпаңыз.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface px-4 py-3.5 text-sm text-muted">
          Хат келмесе,{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-medium text-primary hover:underline"
          >
            қайта жіберіңіз
          </button>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-text"
        >
          <ArrowLeft size={15} />
          Кіру бетіне оралу
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-text"
        >
          <ArrowLeft size={15} />
          Кіру бетіне оралу
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Құпиясөзді ұмыттыңыз ба?
          </h1>
          <p className="text-sm leading-relaxed text-muted">
            Тіркелген email енгізіңіз — сілтеме жібереміз
          </p>
        </div>
      </div>

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

        {error ? (
          <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light active:-translate-y-px disabled:opacity-60"
        >
          {isSubmitting ? "Жіберілуде..." : "Сілтеме жіберу"}
        </button>
      </form>
    </div>
  );
}
