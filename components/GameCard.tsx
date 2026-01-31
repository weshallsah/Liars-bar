"use client";

import { useState } from "react";

export type CardValue = "ace" | "king" | "queen" | "joker" | "unknown";

interface GameCardProps {
  value?: CardValue;
  isRevealed?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isSmall?: boolean;
  onClick?: () => void;
  className?: string;
}

const CARD_CONFIG: Record<CardValue, {
  symbol: string;
  name: string;
  color: string;
  glow: string;
}> = {
  ace: { symbol: "A", name: "ACE", color: "#F59E0B", glow: "rgba(245, 158, 11, 0.4)" },
  king: { symbol: "K", name: "KING", color: "#8B5CF6", glow: "rgba(139, 92, 246, 0.4)" },
  queen: { symbol: "Q", name: "QUEEN", color: "#EC4899", glow: "rgba(236, 72, 153, 0.4)" },
  joker: { symbol: "J", name: "JOKER", color: "#10B981", glow: "rgba(16, 185, 129, 0.4)" },
  unknown: { symbol: "?", name: "???", color: "#6B7280", glow: "rgba(107, 114, 128, 0.3)" },
};

export function GameCard({
  value = "unknown",
  isRevealed = false,
  isSelected = false,
  isDisabled = false,
  isSmall = false,
  onClick,
  className = "",
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = CARD_CONFIG[value];
  const showFace = isRevealed && value !== "unknown";

  // Sizes
  const width = isSmall ? 48 : 72;
  const height = isSmall ? 68 : 100;
  const symbolSize = isSmall ? 18 : 32;
  const cornerSize = isSmall ? 9 : 12;

  return (
    <div
      className={`relative select-none ${className}`}
      style={{
        width,
        height,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        transition: "transform 0.2s ease-out",
        transform: isSelected ? "translateY(-8px)" : isHovered && !isDisabled ? "translateY(-4px)" : "none",
      }}
      onClick={!isDisabled ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow for selected */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: `radial-gradient(ellipse at center, ${config.glow} 0%, transparent 70%)`,
            transform: "scale(1.4)",
            filter: "blur(12px)",
          }}
        />
      )}

      {/* Shadow */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: "rgba(0,0,0,0.5)",
          transform: `translateY(${isSelected ? 6 : 3}px)`,
          filter: "blur(8px)",
        }}
      />

      {/* Card */}
      <div
        className="relative w-full h-full rounded-lg overflow-hidden"
        style={{
          background: showFace
            ? "linear-gradient(135deg, #FAFAFA 0%, #F3F4F6 100%)"
            : "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
          boxShadow: isSelected
            ? `0 0 0 2px white, 0 0 20px ${config.glow}`
            : "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {showFace ? (
          /* Card face */
          <>
            {/* Border tint */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{ background: `linear-gradient(135deg, ${config.color}20 0%, transparent 50%)` }}
            />

            {/* Top-left corner */}
            <div className="absolute" style={{ top: 4, left: 6 }}>
              <span style={{ fontSize: cornerSize, fontWeight: 800, color: config.color }}>
                {config.symbol}
              </span>
            </div>

            {/* Bottom-right corner */}
            <div className="absolute rotate-180" style={{ bottom: 4, right: 6 }}>
              <span style={{ fontSize: cornerSize, fontWeight: 800, color: config.color }}>
                {config.symbol}
              </span>
            </div>

            {/* Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                style={{
                  fontSize: symbolSize,
                  fontWeight: 900,
                  color: config.color,
                  lineHeight: 1,
                }}
              >
                {config.symbol}
              </span>
              {!isSmall && (
                <span style={{ fontSize: 8, fontWeight: 700, color: config.color, marginTop: 2, letterSpacing: "0.1em" }}>
                  {config.name}
                </span>
              )}
            </div>

            {/* Shine */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)" }}
            />
          </>
        ) : (
          /* Card back */
          <>
            {/* Gold border */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.2) 0%, transparent 30%, transparent 70%, rgba(251,191,36,0.2) 100%)" }}
            />

            {/* Inner area */}
            <div className="absolute rounded" style={{ inset: 2, background: "linear-gradient(135deg, #1F2937 0%, #0F172A 100%)" }}>
              {/* Pattern */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(251,191,36,0.03) 6px, rgba(251,191,36,0.03) 12px)",
                }}
              />

              {/* Center diamond */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  style={{
                    width: isSmall ? 16 : 28,
                    height: isSmall ? 16 : 28,
                    transform: "rotate(45deg)",
                    background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 100%)",
                    border: "1px solid rgba(251,191,36,0.2)",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      transform: "rotate(-45deg)",
                      color: "rgba(251,191,36,0.5)",
                      fontWeight: 900,
                      fontSize: isSmall ? 6 : 9,
                    }}
                  >
                    LB
                  </span>
                </div>
              </div>
            </div>

            {/* Shine */}
            <div
              className="absolute inset-0 pointer-events-none rounded-lg"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)" }}
            />
          </>
        )}
      </div>
    </div>
  );
}

// Card back display for opponents
export function CardBack({ count = 1, isSmall = false }: { count?: number; isSmall?: boolean }) {
  const displayCount = Math.min(count, 5);

  return (
    <div className="flex items-center">
      {Array.from({ length: displayCount }).map((_, i) => (
        <div
          key={i}
          style={{
            marginLeft: i > 0 ? (isSmall ? -10 : -16) : 0,
            zIndex: i,
            transform: `rotate(${(i - (displayCount - 1) / 2) * 3}deg)`,
          }}
        >
          <GameCard isRevealed={false} isSmall={isSmall} />
        </div>
      ))}
      {count > 5 && (
        <span
          className="ml-1 px-1.5 py-0.5 rounded text-xs font-bold"
          style={{ background: "rgba(251,191,36,0.2)", color: "rgba(251,191,36,0.7)" }}
        >
          +{count - 5}
        </span>
      )}
    </div>
  );
}

// Helper function
export function getCardValueFromNumber(num: number): CardValue {
  switch (num) {
    case 0: return "ace";
    case 1: return "king";
    case 2: return "queen";
    default: return "unknown";
  }
}
