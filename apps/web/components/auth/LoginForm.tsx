"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import axios from "axios";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
    <form onSubmit={onSubmit} className="space-y-4">
      <Input placeholder="Email" type="email" {...register("email", { required: true })} />
      <div className="relative">
        <Input
          placeholder="Құпиясөз"
          type={showPassword ? "text" : "password"}
          {...register("password", { required: true })}
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <div className="flex justify-end">
        <Link href="#" className="text-sm text-primary">
          Құпиясөзді ұмыттыңыз ба?
        </Link>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Кіру
      </Button>
    </form>
  );
}
