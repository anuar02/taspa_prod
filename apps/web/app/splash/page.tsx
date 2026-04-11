import Link from "next/link";

import { Button } from "@/components/ui/Button";

export default function SplashPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-between px-6 py-10">
      <div className="space-y-6 pt-14">
        <div className="inline-flex rounded-full border border-primary/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
          Taspa
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-semibold leading-tight text-text">Әр сурет — бір тарих</h1>
          <p className="max-w-sm text-base leading-7 text-muted">
            Қолданушылар табиғат, қала, портрет және өнер сәттерін бөлісетін қазақ тілді фото кеңістік.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <Link href="/register" className="block">
          <Button className="w-full">Тіркелу</Button>
        </Link>
        <Link href="/login" className="block">
          <Button variant="secondary" className="w-full">Кіру</Button>
        </Link>
      </div>
    </main>
  );
}
