"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import axios from "axios";

import { api } from "@/lib/api";

type Step = "email" | "code" | "password" | "done";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  }

  function errorFrom(err: unknown) {
    if (axios.isAxiosError(err) && err.code === "ECONNABORTED") {
      return "Сұраныс тым ұзақ орындалды. Кейінірек қайталап көріңіз";
    }

    return axios.isAxiosError(err) ? err.response?.data?.message ?? "Қате орын алды" : "Қате орын алды";
  }

  async function handleSendCode() {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email }, { timeout: 20_000 });
      // dev-only: backend returns the code when SMTP fails
      if (data.devResetCode) {
        setOtp(String(data.devResetCode).split(""));
      }
      setStep("code");
    } catch (err) {
      setError(errorFrom(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    const code = otp.join("");
    if (code.length < 4) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/verify-reset-code", { email, code });
      setResetToken(data.resetToken);
      setStep("password");
    } catch (err) {
      setError(errorFrom(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (password !== confirmPassword) {
      setError("Құпиясөздер сәйкес келмейді");
      return;
    }
    if (password.length < 8) {
      setError("Кемінде 8 символ болуы керек");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { token: resetToken, password });
      setStep("done");
    } catch (err) {
      setError(errorFrom(err));
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 1: Email ──────────────────────────────────── */
  if (step === "email") {
    return (
      <div className="space-y-8">
        <Link href="/login" className="inline-flex text-muted hover:text-text">
          <ArrowLeft size={20} />
        </Link>

        <div className="space-y-1.5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Taspa</p>
          <h1 className="text-2xl font-bold text-text">Құпиясөзді ұмыттыңыз ба?</h1>
          <p className="text-sm text-muted">
            Emailіңізді енгізіңіз, растау кодын жібереміз
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="email"
              autoComplete="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
              className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            onClick={handleSendCode}
            disabled={loading || !email}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60"
          >
            {loading ? "Жіберілуде..." : "Код жіберу"}
          </button>
        </div>
      </div>
    );
  }

  /* ── Step 2: OTP Code ───────────────────────────────── */
  if (step === "code") {
    return (
      <div className="space-y-8">
        <button onClick={() => { setOtp(["","","",""]); setError(""); setStep("email"); }} className="inline-flex text-muted hover:text-text">
          <ArrowLeft size={20} />
        </button>

        <div className="space-y-1.5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Taspa</p>
          <h1 className="text-2xl font-bold text-text">Кодты растаңыз</h1>
          <p className="text-sm text-muted">
            Растау кодын енгізіңіз, біз оны{" "}
            <span className="font-medium text-text">{email}</span> мекенжайына жібердік
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center gap-3">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="h-14 w-14 rounded-xl border border-border bg-surface text-center text-xl font-bold text-text outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
            ))}
          </div>

          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            onClick={handleVerifyCode}
            disabled={loading || otp.join("").length < 4}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60"
          >
            {loading ? "Тексерілуде..." : "Растау"}
          </button>
        </div>
      </div>
    );
  }

  /* ── Step 3: New Password ───────────────────────────── */
  if (step === "password") {
    return (
      <div className="space-y-8">
        <button onClick={() => { setOtp(["","","",""]); setError(""); setStep("code"); }} className="inline-flex text-muted hover:text-text">
          <ArrowLeft size={20} />
        </button>

        <div className="space-y-1.5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Taspa</p>
          <h1 className="text-2xl font-bold text-text">Жаңа құпиясөз</h1>
          <p className="text-sm text-muted">
            Жаңа құпиясөзді енгізіп, растаңыз
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Жаңа құпиясөз"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-11 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-text" tabIndex={-1}>
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Құпиясөзді растаңыз"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-11 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-text" tabIndex={-1}>
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60"
          >
            {loading ? "Жүктелуде..." : "Қалпына келтіру"}
          </button>
        </div>
      </div>
    );
  }

  /* ── Step 4: Confirmation ───────────────────────────── */
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div className="-mx-6 -mt-6 flex w-[calc(100%+3rem)] items-center justify-center rounded-t-[28px] bg-primary py-8 sm:-mx-8 sm:-mt-8 sm:w-[calc(100%+4rem)]">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white">Taspa</p>
      </div>

      <Image src="/images/airplane.png" alt="" width={140} height={140} priority />

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text">Растама</h2>
        <p className="text-sm text-muted max-w-[240px]">
          Құпиясөзіңіз өзгертілді. Жаңа құпиясөзбен кіріңіз.
        </p>
      </div>

      <button
        onClick={() => router.push("/login")}
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light"
      >
        Кіру
      </button>
    </div>
  );
}
