function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={`mb-4 break-inside-avoid overflow-hidden rounded-[28px] border border-white/60 bg-white p-3 shadow-card ${
        tall ? "h-80" : "h-64"
      }`}
    >
      <div className="skeleton h-full w-full rounded-[22px]" />
    </div>
  );
}

export default function MainLoading() {
  return (
    <main>
      <div className="mb-6">
        <div className="skeleton mb-3 h-3 w-20 rounded-full" />
        <div className="skeleton h-10 w-56 rounded-2xl" />
      </div>
      <div className="mb-5 flex gap-2">
        <div className="skeleton h-10 w-24 rounded-full" />
        <div className="skeleton h-10 w-24 rounded-full" />
        <div className="skeleton h-10 w-24 rounded-full" />
      </div>
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 [@media(min-width:1800px)]:columns-7 [@media(min-width:2200px)]:columns-8">
        <SkeletonCard tall />
        <SkeletonCard />
        <SkeletonCard tall />
        <SkeletonCard />
        <SkeletonCard tall />
        <SkeletonCard />
        <SkeletonCard tall />
        <SkeletonCard />
      </div>
    </main>
  );
}
