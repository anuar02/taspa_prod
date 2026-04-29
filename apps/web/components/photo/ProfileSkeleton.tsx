"use client";

export function ProfileSkeleton() {
  return (
    <div className="-mx-4 animate-pulse sm:-mx-6 lg:mx-0">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:hidden">
        <div className="skeleton h-5 w-28 rounded-full" />
        <div className="skeleton h-5 w-5 rounded-full" />
      </div>

      <div className="flex flex-col px-4 pb-6 sm:px-6 lg:flex-row lg:items-start lg:gap-16 lg:px-0 lg:pt-8">
        <div className="flex items-start gap-6 lg:shrink-0 lg:justify-center lg:pl-6 xl:pl-10">
          <div className="skeleton h-[86px] w-[86px] rounded-full lg:h-[150px] lg:w-[150px]" />
        </div>

        <div className="mt-3 flex-1 lg:mt-0">
          <div className="hidden lg:mb-5 lg:flex lg:items-center lg:gap-4">
            <div className="skeleton h-6 w-36 rounded-full" />
            <div className="skeleton h-9 w-28 rounded-lg" />
          </div>
          <div className="hidden lg:mb-5 lg:flex lg:gap-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="skeleton h-4 w-8 rounded-full" />
                <div className="skeleton h-4 w-16 rounded-full" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="skeleton h-3.5 w-32 rounded-full" />
            <div className="skeleton h-3 w-full rounded-full" />
            <div className="skeleton h-3 w-3/5 rounded-full" />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:hidden">
        <div className="flex justify-around py-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="skeleton h-5 w-10 rounded-full" />
              <div className="skeleton h-3 w-14 rounded-full" />
            </div>
          ))}
        </div>
        <div className="skeleton mb-4 h-8 w-full rounded-lg" />
      </div>

      <div className="flex border-t border-border">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-1 justify-center py-[11px]">
            <div className="skeleton h-5 w-5 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-px bg-border">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="skeleton aspect-square" />
        ))}
      </div>
    </div>
  );
}
