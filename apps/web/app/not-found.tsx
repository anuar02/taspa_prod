import Link from "next/link";

import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="rounded-[32px] bg-white p-8 shadow-card">
        <p className="text-xs uppercase tracking-[0.35em] text-primary">404</p>
        <h1 className="mt-4 text-3xl font-semibold text-text">Бет табылмады</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          Сіз іздеген бет қолжетімсіз немесе адрес қате енгізілген.
        </p>
        <Link href="/feed" className="mt-6 block">
          <Button className="w-full">Лентаға оралу</Button>
        </Link>
      </div>
    </main>
  );
}
