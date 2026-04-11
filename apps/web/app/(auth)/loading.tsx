export default function AuthLoading() {
  return (
    <div className="min-h-[100dvh] lg:flex">
      <div className="hidden lg:block lg:w-[45%] bg-[linear-gradient(135deg,#3b0764_0%,#5B21B6_50%,#2e1065_100%)]" />
      <div className="flex min-h-[100dvh] flex-1 items-center justify-center bg-bg px-6 py-12">
        <div className="w-full max-w-sm rounded-[28px] bg-white/84 p-6 shadow-[0_20px_70px_rgba(28,25,23,0.08)] backdrop-blur-sm sm:p-8">
          <div className="skeleton mb-8 h-3 w-16 rounded-full" />
          <div className="skeleton mb-3 h-10 w-48 rounded-2xl" />
          <div className="skeleton mb-8 h-4 w-40 rounded-full" />
          <div className="space-y-3">
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
