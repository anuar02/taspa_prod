import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-10">
      <div className="mb-10 space-y-3 pt-10">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">Кіру</p>
        <h1 className="text-3xl font-semibold text-text">Қайта қош келдіңіз</h1>
      </div>
      <LoginForm />
    </main>
  );
}
