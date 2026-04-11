import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text">Қайта оралдыңыз</h1>
        <p className="text-sm text-muted">
          Аккаунтыңыз жоқ па?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Тіркелу
          </Link>
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
