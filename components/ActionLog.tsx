"use client";

import { useEffect, useRef } from "react";

export interface GameAction {
  id: string;
  type: "place_cards" | "call_liar" | "liar_wrong" | "liar_correct" | "player_eliminated" | "round_start" | "turn_change";
  playerName: string;
  playerAddress?: string;
  timestamp: number;
  data?: {
    cardCount?: number;
    targetPlayer?: string;
    targetPlayerName?: string;
    ammoLost?: number;
  };
}

interface ActionLogProps {
  actions: GameAction[];
  maxVisible?: number;
  className?: string;
}

export function ActionLog({ actions, maxVisible = 8, className = "" }: ActionLogProps) {
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new actions arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [actions]);

  const getActionDisplay = (action: GameAction) => {
    const shortName = action.playerName;
    const shortTarget = action.data?.targetPlayerName || "";

    switch (action.type) {
      case "place_cards":
        return {
          icon: "🃏",
          text: `${shortName} placed ${action.data?.cardCount || 0} card${action.data?.cardCount !== 1 ? "s" : ""}`,
          color: "rgba(59, 130, 246, 0.8)", // blue
          bgColor: "rgba(59, 130, 246, 0.1)",
        };

      case "call_liar":
        return {
          icon: "⚠️",
          text: `${shortName} called LIAR on ${shortTarget}!`,
          color: "rgba(239, 68, 68, 0.9)", // red
          bgColor: "rgba(239, 68, 68, 0.15)",
        };

      case "liar_correct":
        return {
          icon: "✓",
          text: `${shortName} was right! ${shortTarget} was lying!`,
          color: "rgba(34, 197, 94, 0.9)", // green
          bgColor: "rgba(34, 197, 94, 0.15)",
        };

      case "liar_wrong":
        return {
          icon: "✗",
          text: `${shortName} was wrong! ${shortTarget} wasn't lying!`,
          color: "rgba(239, 68, 68, 0.9)", // red
          bgColor: "rgba(239, 68, 68, 0.15)",
        };

      case "player_eliminated":
        return {
          icon: "💀",
          text: `${shortName} was eliminated! (Lost ${action.data?.ammoLost || 1} life)`,
          color: "rgba(156, 163, 175, 0.9)", // gray
          bgColor: "rgba(156, 163, 175, 0.1)",
        };

      case "round_start":
        return {
          icon: "🎲",
          text: `New round started!`,
          color: "rgba(168, 85, 247, 0.9)", // purple
          bgColor: "rgba(168, 85, 247, 0.1)",
        };

      case "turn_change":
        return {
          icon: "➤",
          text: `${shortName}'s turn`,
          color: "rgba(251, 191, 36, 0.8)", // amber
          bgColor: "rgba(251, 191, 36, 0.1)",
        };

      default:
        return {
          icon: "•",
          text: "Unknown action",
          color: "rgba(156, 163, 175, 0.6)",
          bgColor: "rgba(156, 163, 175, 0.05)",
        };
    }
  };

  const displayActions = actions.slice(-maxVisible);

  return (
    <div
      className={`flex flex-col h-full ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)",
        borderRadius: "12px",
        border: "1px solid rgba(75, 85, 99, 0.4)",
        backdropFilter: "blur(10px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.5)"
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5" style={{
        borderBottom: "1px solid rgba(75, 85, 99, 0.3)",
        background: "rgba(0,0,0,0.4)"
      }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" style={{
            boxShadow: "0 0 8px rgba(220, 38, 38, 0.6)"
          }} />
          <span className="text-white/90 text-xs font-black uppercase tracking-widest">Game Log</span>
        </div>
        <span className="text-white/40 text-[10px] font-semibold">{actions.length} events</span>
      </div>

      {/* Actions list */}
      <div ref={logRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide px-2 py-2 space-y-1">
        {displayActions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-white/30 text-xs">No actions yet</span>
          </div>
        ) : (
          displayActions.map((action, index) => {
            const display = getActionDisplay(action);
            const isRecent = index === displayActions.length - 1;

            return (
              <div
                key={action.id}
                className="group flex items-start gap-2 px-2 py-1.5 rounded-lg transition-all animate-slide-in"
                style={{
                  background: isRecent ? display.bgColor : "transparent",
                  border: `1px solid ${isRecent ? display.color + "40" : "transparent"}`,
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Icon */}
                <span className="text-xs flex-shrink-0" style={{ filter: "grayscale(0.2)" }}>
                  {display.icon}
                </span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs leading-tight break-words"
                    style={{
                      color: isRecent ? display.color : "rgba(255,255,255,0.6)",
                      fontWeight: isRecent ? 600 : 400,
                    }}
                  >
                    {display.text}
                  </p>

                  {/* Timestamp */}
                  <span className="text-[10px] text-white/30">
                    {new Date(action.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Compact action log for mobile
interface CompactActionLogProps {
  latestAction?: GameAction | null;
  className?: string;
}

export function CompactActionLog({ latestAction, className = "" }: CompactActionLogProps) {
  if (!latestAction) {
    return (
      <div
        className={`px-3 py-2 rounded-lg flex items-center gap-2 ${className}`}
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
        <span className="text-white/40 text-xs">Waiting for action...</span>
      </div>
    );
  }

  const getActionDisplay = (action: GameAction) => {
    const shortName = action.playerName;

    switch (action.type) {
      case "place_cards":
        return {
          icon: "🃏",
          text: `${shortName} played ${action.data?.cardCount || 0} card${action.data?.cardCount !== 1 ? "s" : ""}`,
          color: "#3B82F6",
        };
      case "call_liar":
        return {
          icon: "⚠️",
          text: `${shortName} called LIAR!`,
          color: "#EF4444",
        };
      case "turn_change":
        return {
          icon: "➤",
          text: `${shortName}'s turn`,
          color: "#FBB836",
        };
      default:
        return {
          icon: "•",
          text: "Game event",
          color: "#9CA3AF",
        };
    }
  };

  const display = getActionDisplay(latestAction);

  return (
    <div
      className={`px-3 py-2 rounded-lg flex items-center gap-2 animate-slide-in ${className}`}
      style={{
        background: `${display.color}20`,
        border: `1px solid ${display.color}40`,
      }}
    >
      <span className="text-sm">{display.icon}</span>
      <span className="text-xs font-medium flex-1 truncate" style={{ color: display.color }}>
        {display.text}
      </span>
    </div>
  );
}
