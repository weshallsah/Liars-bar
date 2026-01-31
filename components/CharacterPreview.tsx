"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface CharacterPreviewProps {
  character: {
    id: string;
    name: string;
    image: string;
    color: string;
    stats: {
      power: number;
      speed: number;
      luck: number;
    };
    description: string;
  } | null;
}

export function CharacterPreview({ character }: CharacterPreviewProps) {
  const [animatedStats, setAnimatedStats] = useState({ power: 0, speed: 0, luck: 0 });

  // Animate stats when character changes
  useEffect(() => {
    if (!character) {
      return;
    }

    // Animate to target values with stagger
    const timer = setTimeout(() => {
      setAnimatedStats(character.stats);
    }, 100);

    return () => clearTimeout(timer);
  }, [character]);

  // Reset stats when no character
  useEffect(() => {
    if (!character) {
      setAnimatedStats({ power: 0, speed: 0, luck: 0 });
    }
  }, [character]);

  if (!character) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center animate-pulse">
            <svg className="w-16 h-16 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-white/40 text-sm">Select a character to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full py-4 animate-slot-appear overflow-hidden">
      {/* Large character image */}
      <div className="relative mb-4 md:mb-8 flex-shrink-0">
        {/* Glow background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${character.color} blur-3xl opacity-30 animate-glow-pulse`}
          style={{ transform: "scale(1.5)" }}
        />

        {/* Character container */}
        <div className={`relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-3xl bg-gradient-to-br ${character.color} p-1 shadow-2xl`}>
          <div className="w-full h-full rounded-[22px] bg-black/40 overflow-hidden flex items-center justify-center">
            <Image
              src={character.image}
              alt={character.name}
              width={256}
              height={256}
              className="w-full h-full object-contain drop-shadow-2xl animate-float"
              priority
            />
          </div>
        </div>

        {/* Floating rings */}
        <div className={`absolute inset-0 rounded-3xl border-2 border-white/20 animate-pulse-ring`} style={{ animationDelay: "0s" }} />
        <div className={`absolute inset-0 rounded-3xl border-2 border-white/10 animate-pulse-ring`} style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Character name */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 text-gradient-gold text-center px-4">
        {character.name.toUpperCase()}
      </h2>

      {/* Description */}
      <p className="text-white/50 text-xs sm:text-sm mb-4 md:mb-6 text-center px-4">{character.description}</p>

      {/* Animated stats */}
      <div className="w-full max-w-sm px-6 space-y-3 md:space-y-4 flex-shrink-0">
        {/* Power */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs uppercase tracking-wide font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
              </svg>
              Power
            </span>
            <span className="text-white font-bold text-sm">{character.stats.power}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${animatedStats.power}%` }}
            />
          </div>
        </div>

        {/* Speed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs uppercase tracking-wide font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              Speed
            </span>
            <span className="text-white font-bold text-sm">{character.stats.speed}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${animatedStats.speed}%`, transitionDelay: "100ms" }}
            />
          </div>
        </div>

        {/* Luck */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs uppercase tracking-wide font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Luck
            </span>
            <span className="text-white font-bold text-sm">{character.stats.luck}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${animatedStats.luck}%`, transitionDelay: "200ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
