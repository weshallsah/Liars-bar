"use client";

export function PokerTable() {
  return (
    <div className="relative w-full h-full">
      {/* Table shadow */}
      <div className="absolute inset-x-8 inset-y-12 bg-black/70 rounded-[50%] blur-3xl" />

      {/* Table outer rim (rich mahogany wood) */}
      <div className="absolute inset-4 sm:inset-8 rounded-[50%] bg-gradient-to-b from-amber-950 via-yellow-950 to-amber-950 shadow-2xl border-[6px] border-yellow-900/60">
        {/* Wood grain texture - horizontal */}
        <div className="absolute inset-0 rounded-[50%] opacity-40 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(139,69,19,0.4)_3px,rgba(139,69,19,0.4)_6px)]" />

        {/* Wood grain texture - vertical streaks */}
        <div className="absolute inset-0 rounded-[50%] opacity-25 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(101,67,33,0.5)_8px,rgba(101,67,33,0.5)_10px,transparent_10px,transparent_20px)]" />

        {/* Wood knots/imperfections */}
        <div className="absolute inset-0 rounded-[50%] opacity-30 bg-[radial-gradient(ellipse_8px_12px_at_20%_30%,rgba(70,40,10,0.6)_0%,transparent_100%),radial-gradient(ellipse_6px_10px_at_75%_70%,rgba(70,40,10,0.5)_0%,transparent_100%),radial-gradient(ellipse_10px_8px_at_85%_25%,rgba(70,40,10,0.4)_0%,transparent_100%)]" />

        {/* Inner carved edge */}
        <div className="absolute inset-3 sm:inset-4 rounded-[50%] bg-gradient-to-b from-yellow-900/80 to-amber-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
          {/* Secondary wood grain */}
          <div className="absolute inset-0 rounded-[50%] opacity-30 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(139,69,19,0.3)_2px,rgba(139,69,19,0.3)_4px)]" />

          {/* Gold/brass inlay trim */}
          <div className="absolute inset-2 sm:inset-3 rounded-[50%] ring-1 ring-yellow-600/50 shadow-[0_0_8px_rgba(212,175,55,0.2)]">
            {/* Inner wood border */}
            <div className="absolute inset-1 rounded-[50%] bg-gradient-to-b from-amber-900 via-yellow-950 to-amber-950">
              {/* More wood grain */}
              <div className="absolute inset-0 rounded-[50%] opacity-35 bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,rgba(101,67,33,0.4)_4px,rgba(101,67,33,0.4)_6px)]" />

              {/* Table center (wooden surface) */}
              <div className="absolute inset-3 sm:inset-4 rounded-[50%] bg-gradient-to-br from-amber-900 via-yellow-800 to-amber-900 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
                {/* Wood grain texture */}
                <div className="absolute inset-0 rounded-[50%] opacity-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(139,69,19,0.4)_2px,rgba(139,69,19,0.4)_4px)]" />

                {/* Vertical wood streaks */}
                <div className="absolute inset-0 rounded-[50%] opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(101,67,33,0.5)_6px,rgba(101,67,33,0.5)_8px,transparent_8px,transparent_15px)]" />

                {/* Wood knots */}
                <div className="absolute inset-0 rounded-[50%] opacity-40 bg-[radial-gradient(ellipse_6px_8px_at_35%_45%,rgba(70,40,10,0.6)_0%,transparent_100%),radial-gradient(ellipse_5px_7px_at_65%_55%,rgba(70,40,10,0.5)_0%,transparent_100%)]" />

                {/* Vignette */}
                <div className="absolute inset-0 rounded-[50%] shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Brass decorative studs around rim */}
        <div className="absolute inset-0 rounded-[50%] opacity-50 bg-[radial-gradient(circle_4px_at_50%_2%,rgba(212,175,55,0.8)_0%,transparent_100%),radial-gradient(circle_4px_at_50%_98%,rgba(212,175,55,0.8)_0%,transparent_100%),radial-gradient(circle_4px_at_2%_50%,rgba(212,175,55,0.7)_0%,transparent_100%),radial-gradient(circle_4px_at_98%_50%,rgba(212,175,55,0.7)_0%,transparent_100%),radial-gradient(circle_3px_at_15%_15%,rgba(212,175,55,0.5)_0%,transparent_100%),radial-gradient(circle_3px_at_85%_15%,rgba(212,175,55,0.5)_0%,transparent_100%),radial-gradient(circle_3px_at_15%_85%,rgba(212,175,55,0.5)_0%,transparent_100%),radial-gradient(circle_3px_at_85%_85%,rgba(212,175,55,0.5)_0%,transparent_100%)]" />
      </div>

      {/* Warm vintage overlay */}
      <div className="absolute inset-0 rounded-[50%] bg-orange-900/5 pointer-events-none mix-blend-overlay" />
    </div>
  );
}
