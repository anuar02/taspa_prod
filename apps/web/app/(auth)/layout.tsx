import Link from "next/link";

const mosaic = [
  "aspect-[3/4]", "aspect-square", "aspect-[2/3]",
  "aspect-square", "aspect-[4/5]", "aspect-[3/4]",
  "aspect-[2/3]", "aspect-square", "aspect-[3/4]",
  "aspect-[4/5]", "aspect-square", "aspect-[2/3]",
];

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:px-12 lg:py-12" style={{ background: "linear-gradient(135deg, #3b0764 0%, #5B21B6 50%, #2e1065 100%)" }}>
      {/* mosaic */}
      <div className="pointer-events-none absolute inset-0 p-10 opacity-[0.1]">
        <div className="columns-3 gap-3 [&>*]:mb-3">
          {mosaic.map((aspect, i) => (
            <div key={i} className={`break-inside-avoid rounded-2xl bg-white ${aspect}`} />
          ))}
        </div>
      </div>

      {/* top logo */}
      <div className="relative z-10">
        <Link href="/splash">
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-white backdrop-blur-sm">
            Taspa
          </span>
        </Link>
      </div>

      {/* headline */}
      <div className="relative z-10 space-y-3">
        <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white">
          Әр сурет —<br />бір тарих
        </h1>
        <p className="max-w-[260px] text-sm leading-relaxed text-white/60">
          Табиғат, қала, портрет және өнер сәттерін қазақ тілінде бөлісіңіз.
        </p>
      </div>

      {/* footer */}
      <p className="relative z-10 text-xs text-white/30">© 2025 Taspa</p>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] lg:flex">
      <BrandPanel />
      <div className="flex min-h-[100dvh] flex-1 flex-col items-center justify-center bg-bg px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/splash" className="mb-8 block lg:hidden">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Taspa</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
