"use client";

export function PokerTable() {
  return (
    <div className="relative w-full max-w-xl mx-auto aspect-[16/9]">
      {/* Table shadow */}
      <div className="absolute inset-x-8 inset-y-12 bg-black/40 rounded-[50%] blur-2xl" />

      {/* Table outer rim (wood) */}
      <div className="absolute inset-4 sm:inset-8 rounded-[50%] bg-gradient-to-b from-amber-900 via-amber-800 to-amber-950 shadow-2xl">
        {/* Table inner rim */}
        <div className="absolute inset-3 sm:inset-4 rounded-[50%] bg-gradient-to-b from-amber-950 to-amber-900">
          {/* Table felt (green surface) */}
          <div className="absolute inset-2 sm:inset-3 rounded-[50%] bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-800 shadow-inner">
            {/* Felt texture overlay */}
            <div className="absolute inset-0 rounded-[50%] opacity-30 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />

            {/* Center logo/decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-emerald-900/50 flex items-center justify-center border-2 border-emerald-600/30">
                <span className="text-3xl sm:text-5xl opacity-60">🎭</span>
              </div>
              <p className="text-emerald-400/40 text-xs sm:text-sm font-semibold mt-2 tracking-widest uppercase">
                Liar&apos;s Bar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
