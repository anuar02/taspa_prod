import Link from "next/link";

const mosaic = [
  {
    src: "https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-[3/4]"
  },
  {
    src: "https://images.pexels.com/photos/1852382/pexels-photo-1852382.jpeg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-square"
  },
  {
    src: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-[2/3]"
  },
  {
    src: "https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-square"
  },
  {
    src: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-[4/5]"
  },
  {
    src: "https://images.pexels.com/photos/936722/pexels-photo-936722.jpeg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-[3/4]"
  },
  {
    src: "https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-[2/3]"
  },
  {
    src: "https://images.pexels.com/photos/842571/pexels-photo-842571.jpeg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-square"
  },
  {
    src: "https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-[3/4]"
  },
  {
    src: "https://images.pexels.com/photos/1509534/pexels-photo-1509534.jpeg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-[4/5]"
  },
  {
    src: "https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-square"
  },
  {
    src: "https://images.pexels.com/photos/1173777/pexels-photo-1173777.jpeg?auto=compress&cs=tinysrgb&w=1200",
    aspect: "aspect-[2/3]"
  }
];

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:px-12 lg:py-12" style={{ background: "linear-gradient(135deg, #3b0764 0%, #5B21B6 50%, #2e1065 100%)" }}>
      {/* mosaic */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden p-10 opacity-[0.16]">
        <div className="auth-mosaic-scroll columns-3 gap-3 [&>*]:mb-3">
          {[...mosaic, ...mosaic].map((item, i) => (
            <div key={`${item.src}-${i}`} className={`relative break-inside-avoid overflow-hidden rounded-2xl ${item.aspect}`}>
              {/* Decorative auth mosaic: use plain img so a bad upstream image cannot crash the whole page. */}
              <img
                src={item.src}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading={i < 6 ? "eager" : "lazy"}
                decoding="async"
              />
              <div className="absolute inset-0 bg-white/8" />
            </div>
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
      <div className="relative flex min-h-[100dvh] flex-1 flex-col items-center justify-center overflow-hidden bg-bg px-6 py-12">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden"
          style={{ background: "linear-gradient(180deg, #f5f3ff 0%, #ede9fe 45%, #f8f7f4 100%)" }}
        >
          <div className="auth-mosaic-scroll columns-3 gap-2 p-4 opacity-[0.16] [&>*]:mb-2">
            {[...mosaic, ...mosaic].map((item, i) => (
              <div key={`mobile-${item.src}-${i}`} className={`relative break-inside-avoid overflow-hidden rounded-2xl ${item.aspect}`}>
                <img
                  src={item.src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={i < 6 ? "eager" : "lazy"}
                  decoding="async"
                />
                <div className="absolute inset-0 bg-white/12" />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f5f3ff] via-[#f5f3ff]/95 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#f8f7f4] via-[#f8f7f4]/96 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-sm rounded-[28px] bg-white/84 p-6 shadow-[0_20px_70px_rgba(28,25,23,0.08)] backdrop-blur-sm sm:p-8 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0">
          <Link href="/splash" className="mb-8 block lg:hidden">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Taspa</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
