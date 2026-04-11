"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import axios from "axios";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type FormValues = {
  displayName: string;
  username: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
};

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();

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
      <Input placeholder="Аты-жөні" {...register("displayName", { required: true })} />
      <Input placeholder="@username" {...register("username", { required: true })} />
      <Input placeholder="Email" type="email" {...register("email", { required: true })} />
      <Input
        placeholder="Құпиясөз"
        type="password"
        {...register("password", { required: true, minLength: 8 })}
      />
      <label className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-sm text-text">
        <input type="checkbox" {...register("acceptedTerms", { required: true })} />
        Шарттармен келісемін
      </label>
      {errors.password ? <p className="text-sm text-danger">Құпиясөз кемі 8 таңба болуы керек</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Жасақтау
      </Button>
      <p className="text-center text-sm text-muted">
        Аккаунтыңыз бар ма? <Link href="/login" className="text-primary">Кіру</Link>
      </p>
    </form>
  );
}
