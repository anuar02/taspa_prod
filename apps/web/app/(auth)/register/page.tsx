import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text">Аккаунт жасаңыз</h1>
        <p className="text-sm text-muted">
          Аккаунтыңыз бар ма?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Кіру
          </Link>
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
