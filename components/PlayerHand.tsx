"use client";

import { useState, useCallback } from "react";
import { GameCard, CardValue, getCardValueFromNumber } from "./GameCard";

interface Card {
  index: number;
  value: CardValue;
  isRevealed: boolean;
}

interface PlayerHandProps {
  cards: Card[];
  tableCard: number;
  isMyTurn: boolean;
  onPlayCards?: (selectedIndices: number[]) => void;
  onCallLiar?: () => void;
  tableCardsCount: number;
  isPlaying?: boolean;
  isCallingLiar?: boolean;
  disabled?: boolean;
}

const CARD_INFO: Record<string, { name: string; color: string; bg: string }> = {
  ace: { name: "ACES", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" },
  king: { name: "KINGS", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.15)" },
  queen: { name: "QUEENS", color: "#EC4899", bg: "rgba(236, 72, 153, 0.15)" },
  joker: { name: "JOKERS", color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" },
  unknown: { name: "CARDS", color: "#6B7280", bg: "rgba(107, 114, 128, 0.15)" },
};

export function PlayerHand({
  cards,
  tableCard,
  isMyTurn,
  onPlayCards,
  onCallLiar,
  tableCardsCount,
  isPlaying = false,
  isCallingLiar = false,
  disabled = false,
}: PlayerHandProps) {
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());

  const toggleCard = useCallback((index: number) => {
    if (disabled || !isMyTurn) return;
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else if (next.size < Math.min(4, cards.length)) {
        next.add(index);
      }
      return next;
    });
  }, [disabled, isMyTurn, cards.length]);

  const handlePlay = useCallback(() => {
    if (selectedCards.size === 0 || !onPlayCards) return;
    onPlayCards(Array.from(selectedCards).sort((a, b) => a - b));
    setSelectedCards(new Set());
  }, [selectedCards, onPlayCards]);

  const handleCallLiar = useCallback(() => {
    if (!onCallLiar || tableCardsCount === 0 || isCallingLiar) return;
    onCallLiar();
  }, [onCallLiar, tableCardsCount, isCallingLiar]);

  const cardType = getCardValueFromNumber(tableCard);
  const cardInfo = CARD_INFO[cardType];
  const canCallLiar = tableCardsCount > 0 && !isMyTurn && !isCallingLiar;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Container - Darker, grittier */}
      <div
        style={{
          background: "linear-gradient(to top, #000000 0%, rgba(10,10,10,0.98) 70%, rgba(0,0,0,0.8) 90%, transparent 100%)",
          paddingTop: "20px",
          borderTop: "1px solid rgba(75, 85, 99, 0.3)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.8)"
        }}
      >
        {/* Status bar - Gritty & Dangerous */}
        <div className="flex items-center justify-center gap-3 px-4 pb-3 flex-wrap">
          {/* Round card type */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${cardInfo.bg}, rgba(0,0,0,0.4))`,
              border: `1px solid ${cardInfo.color}40`,
              boxShadow: `0 0 15px ${cardInfo.color}20`
            }}
          >
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-sm font-black"
              style={{
                background: `linear-gradient(135deg, ${cardInfo.color}, ${cardInfo.color}CC)`,
                boxShadow: `0 2px 8px ${cardInfo.color}40`
              }}
            >
              {cardType === "ace" ? "A" : cardType === "king" ? "K" : cardType === "queen" ? "Q" : "?"}
            </div>
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: cardInfo.color }}>
              {cardInfo.name}
            </span>
          </div>

          {/* Turn status - More dramatic */}
          {isMyTurn ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg animate-danger-pulse" style={{
              background: "linear-gradient(135deg, rgba(220, 38, 38, 0.25), rgba(153, 27, 27, 0.25))",
              border: "1px solid rgba(220, 38, 38, 0.5)",
              boxShadow: "0 0 20px rgba(220, 38, 38, 0.3)"
            }}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-black uppercase tracking-wider">YOUR TURN</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{
              background: "rgba(31, 41, 55, 0.6)",
              border: "1px solid rgba(75, 85, 99, 0.3)"
            }}>
              <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
              <span className="text-gray-400 text-xs font-medium uppercase">Waiting...</span>
            </div>
          )}

          {/* Hand count */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.15)"
          }}>
            <span className="text-white/50 text-xs font-semibold">Hand:</span>
            <span className="text-white text-xs font-black">{cards.length}/5</span>
          </div>
        </div>

        {/* Cards area */}
        <div className="px-4 pb-2">
          {cards.length === 0 ? (
            <div className="text-center py-6 text-white/30 text-sm">No cards in hand</div>
          ) : (
            <div className="flex justify-center items-end py-2">
              {cards.map((card, i) => {
                const total = cards.length;
                const mid = (total - 1) / 2;
                const offset = i - mid;
                const isSelected = selectedCards.has(card.index);

                return (
                  <div
                    key={card.index}
                    className="relative"
                    style={{
                      marginLeft: i > 0 ? -24 : 0,
                      zIndex: isSelected ? 100 : i,
                      transform: `
                        translateY(${isSelected ? -12 : Math.abs(offset) * 4}px)
                        rotate(${offset * 4}deg)
                      `,
                      transition: "all 0.2s ease-out",
                    }}
                  >
                    {/* Index badge */}
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{
                        background: isSelected ? "#FCD34D" : "rgba(0,0,0,0.7)",
                        color: isSelected ? "#000" : "rgba(255,255,255,0.5)",
                        border: isSelected ? "none" : "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      {card.index}
                    </div>
                    <GameCard
                      value={card.value}
                      isRevealed={card.isRevealed}
                      isSelected={isSelected}
                      isDisabled={disabled || !isMyTurn}
                      isSmall
                      onClick={() => toggleCard(card.index)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile: Pistol Chamber Display */}
        <div className="lg:hidden flex justify-center pb-3">
          <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-lg" style={{
            background: "rgba(0,0,0,0.8)",
            border: "1px solid rgba(75, 85, 99, 0.4)"
          }}>
            <span className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Your Ammo</span>
            <div className="flex gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => {
                const loaded = i < (tableCardsCount % 7); // Mock ammo - replace with actual
                return (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: loaded
                        ? "radial-gradient(circle, #FFD700 0%, #FFA500 100%)"
                        : "radial-gradient(circle, #374151 0%, #1F2937 100%)",
                      border: loaded ? "1px solid #FFA500" : "1px solid #4B5563",
                      boxShadow: loaded ? "0 0 8px rgba(255,165,0,0.6)" : "inset 0 1px 2px rgba(0,0,0,0.5)"
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Action buttons - DRAMATIC & DANGEROUS */}
        <div className="flex justify-center items-center gap-3 px-4 pb-5">
          {/* LIAR button - HUGE, RED, DANGEROUS when not your turn */}
          {!isMyTurn && (
            <button
              onClick={handleCallLiar}
              disabled={!canCallLiar || disabled}
              className={`px-8 py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all ${
                canCallLiar && !disabled ? "animate-danger-pulse" : ""
              }`}
              style={{
                background: canCallLiar && !disabled
                  ? "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)"
                  : "rgba(31, 41, 55, 0.4)",
                border: canCallLiar && !disabled
                  ? "2px solid rgba(220, 38, 38, 0.8)"
                  : "1px solid rgba(75, 85, 99, 0.3)",
                color: canCallLiar && !disabled ? "#FFFFFF" : "rgba(255,255,255,0.25)",
                boxShadow: canCallLiar && !disabled
                  ? "0 0 30px rgba(220, 38, 38, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
                  : "none",
                cursor: canCallLiar && !disabled ? "pointer" : "not-allowed",
                textShadow: canCallLiar && !disabled ? "0 2px 4px rgba(0,0,0,0.5)" : "none",
                minWidth: "180px"
              }}
            >
              {isCallingLiar ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calling...
                </span>
              ) : (
                <>
                  ⚠️ CALL LIAR! ⚠️
                </>
              )}
            </button>
          )}

          {/* Play button - show when your turn */}
          {isMyTurn && cards.length > 0 && (
            <>
              <button
                onClick={handlePlay}
                disabled={selectedCards.size === 0 || isPlaying || disabled}
                className="px-8 py-4 rounded-xl font-black text-base uppercase tracking-wide transition-all"
                style={{
                  background: selectedCards.size > 0 && !isPlaying && !disabled
                    ? "linear-gradient(135deg, #F5F5F5 0%, #D1D5DB 100%)"
                    : "rgba(31, 41, 55, 0.5)",
                  border: selectedCards.size > 0 && !isPlaying && !disabled
                    ? "2px solid rgba(255,255,255,0.6)"
                    : "1px solid rgba(75, 85, 99, 0.3)",
                  color: selectedCards.size > 0 && !isPlaying && !disabled ? "#000000" : "rgba(255,255,255,0.25)",
                  boxShadow: selectedCards.size > 0 && !isPlaying && !disabled
                    ? "0 4px 25px rgba(255,255,255,0.3), inset 0 1px 0 rgba(255,255,255,0.5)"
                    : "none",
                  cursor: selectedCards.size > 0 && !isPlaying && !disabled ? "pointer" : "not-allowed",
                  textShadow: selectedCards.size > 0 && !isPlaying && !disabled ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
                  minWidth: "180px"
                }}
              >
                {isPlaying ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Playing...
                  </span>
                ) : selectedCards.size > 0 ? (
                  <>🃏 Place {selectedCards.size} Card{selectedCards.size !== 1 ? "s" : ""}</>
                ) : (
                  "Select Cards"
                )}
              </button>

              {selectedCards.size > 0 && (
                <button
                  onClick={() => setSelectedCards(new Set())}
                  disabled={isPlaying}
                  className="px-5 py-4 rounded-xl text-sm font-bold uppercase transition-all"
                  style={{
                    background: "rgba(31, 41, 55, 0.6)",
                    border: "1px solid rgba(75, 85, 99, 0.4)",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Clear
                </button>
              )}
            </>
          )}
        </div>

        {/* Selected indices display */}
        {selectedCards.size > 0 && isMyTurn && (
          <div className="text-center pb-3">
            <span className="text-white/40 text-xs">
              Indices: [{Array.from(selectedCards).sort((a, b) => a - b).join(", ")}]
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Table cards component
export function TableCards({ count }: { count: number }) {
  if (count === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-14 h-20 rounded-lg flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "2px dashed rgba(255,255,255,0.1)",
          }}
        >
          <span className="text-white/20 text-lg">?</span>
        </div>
        <span className="text-white/30 text-xs">Empty</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center">
        {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
          <div
            key={i}
            style={{
              marginLeft: i > 0 ? -20 : 0,
              transform: `rotate(${(i - (Math.min(count, 5) - 1) / 2) * 6}deg)`,
              zIndex: i,
            }}
          >
            <GameCard isRevealed={false} isSmall />
          </div>
        ))}
      </div>
      <div
        className="px-3 py-1 rounded-full text-xs font-medium"
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <span className="text-white">{count}</span>
        <span className="text-white/50 ml-1">card{count !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}
