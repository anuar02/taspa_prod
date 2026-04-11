import Link from "next/link";

const mosaic = [
  "aspect-[3/4]", "aspect-square", "aspect-[2/3]",
  "aspect-[4/5]", "aspect-[3/4]", "aspect-square",
  "aspect-square", "aspect-[2/3]", "aspect-[4/5]",
  "aspect-[3/4]", "aspect-square", "aspect-[3/4]",
];

export default function SplashPage() {
  return (
    <main
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
      style={{ background: "linear-gradient(135deg, #3b0764 0%, #5B21B6 60%, #2e1065 100%)" }}
    >
      {/* photo mosaic */}
      <div className="pointer-events-none absolute inset-0 p-6 opacity-[0.1]">
        <div className="columns-3 gap-3 [&>*]:mb-3 sm:columns-4">
          {mosaic.map((aspect, i) => (
            <div key={i} className={`break-inside-avoid rounded-2xl bg-white ${aspect}`} />
          ))}
        </div>
      </div>

      {/* bottom vignette */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-3/4"
        style={{ background: "linear-gradient(to top, rgba(30,7,80,0.85) 0%, transparent 100%)" }}
      />

      {/* header */}
      <header className="relative z-10 px-8 pt-12">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/60">Taspa</span>
      </header>

      {/* content */}
      <div className="relative z-10 mt-auto px-8 pb-16">
        <div className="mb-10 max-w-sm space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
            Фото кеңістік
          </p>
          <h1 className="text-[3.25rem] font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
            Әр сурет —<br />бір тарих
          </h1>
          <p className="text-base leading-relaxed text-white/55">
            Табиғат, қала, портрет және өнер сәттерін қазақ тілінде бөлісіңіз.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-white px-8 text-sm font-bold text-primary transition hover:bg-white/90 active:translate-y-px sm:flex-none"
          >
            Тіркелу
          </Link>
          <Link
            href="/login"
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 active:translate-y-px sm:flex-none"
          >
            Кіру
          </Link>
        </div>
      </div>
    </main>
  );
}
