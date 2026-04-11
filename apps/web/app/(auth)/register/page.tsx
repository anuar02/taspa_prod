import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-10">
      <div className="mb-10 space-y-3 pt-10">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">Тіркелу</p>
        <h1 className="text-3xl font-semibold text-text">Жаңа TASPA парақшасы</h1>
      </div>
      <RegisterForm />
    </main>
  );
}
