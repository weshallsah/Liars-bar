"use client";

import { useState, useEffect } from "react";

interface PistolProps {
  ammo: number; // 0-6 bullets remaining
  maxAmmo?: number;
  isSpinning?: boolean;
  isFiring?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

export function Pistol({
  ammo,
  maxAmmo = 6,
  isSpinning = false,
  isFiring = false,
  size = "medium",
  className = "",
}: PistolProps) {
  const [showFlash, setShowFlash] = useState(false);

  // Trigger muzzle flash on firing
  useEffect(() => {
    if (isFiring) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isFiring]);

  // Size configurations
  const sizeConfig = {
    small: { width: 80, height: 60, chamber: 20, bullet: 4 },
    medium: { width: 120, height: 90, chamber: 28, bullet: 6 },
    large: { width: 160, height: 120, chamber: 36, bullet: 8 },
  };

  const config = sizeConfig[size];
  const chamberRadius = config.chamber;
  const bulletRadius = config.bullet;

  // Generate positions for chambers in a circle
  const getChamberPositions = () => {
    const positions = [];
    const angleStep = (2 * Math.PI) / maxAmmo;
    for (let i = 0; i < maxAmmo; i++) {
      const angle = angleStep * i - Math.PI / 2; // Start from top
      const x = Math.cos(angle) * (chamberRadius * 0.7);
      const y = Math.sin(angle) * (chamberRadius * 0.7);
      positions.push({ x, y, loaded: i < ammo });
    }
    return positions;
  };

  const chambers = getChamberPositions();

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: config.width, height: config.height }}>
      {/* Muzzle flash */}
      {showFlash && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            top: "30%",
            right: "-20%",
            width: "60%",
            height: "60%",
          }}
        >
          <div
            className="absolute inset-0 animate-ping"
            style={{
              background: "radial-gradient(circle, rgba(255,200,50,0.9) 0%, rgba(255,100,0,0.5) 30%, transparent 70%)",
              filter: "blur(4px)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,200,50,0.8) 20%, transparent 50%)",
              filter: "blur(2px)",
            }}
          />
        </div>
      )}

      {/* Pistol SVG */}
      <div className="relative" style={{ width: config.width, height: config.height }}>
        {/* Gun body */}
        <svg
          viewBox="0 0 160 120"
          className="absolute inset-0 w-full h-full"
          style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}
        >
          {/* Barrel */}
          <rect x="110" y="45" width="40" height="12" rx="2" fill="#2C3E50" />
          <rect x="140" y="47" width="10" height="8" rx="1" fill="#1A252F" />

          {/* Cylinder housing */}
          <circle cx="95" cy="51" r="22" fill="#34495E" stroke="#2C3E50" strokeWidth="2" />
          <circle cx="95" cy="51" r="18" fill="#4A5F7F" stroke="#2C3E50" strokeWidth="1" />

          {/* Grip */}
          <path
            d="M 75 55 Q 70 55 65 60 L 55 75 Q 50 80 52 85 L 60 90 Q 65 92 70 88 L 80 75 Q 85 70 85 65 Z"
            fill="#2C3E50"
            stroke="#1A252F"
            strokeWidth="2"
          />

          {/* Grip texture */}
          <path
            d="M 62 67 L 68 78 M 66 65 L 72 76 M 70 63 L 76 74"
            stroke="#1A252F"
            strokeWidth="1"
            strokeLinecap="round"
          />

          {/* Trigger */}
          <ellipse cx="75" cy="63" rx="4" ry="6" fill="#3A3A3A" stroke="#2C3E50" strokeWidth="1" />

          {/* Hammer */}
          <rect x="80" y="38" width="8" height="12" rx="2" fill="#2C3E50" />
          <circle cx="84" cy="38" r="3" fill="#1A252F" />

          {/* Frame details */}
          <path d="M 88 40 L 110 45" stroke="#1A252F" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Cylinder chambers */}
        <div
          className="absolute"
          style={{
            top: "42.5%",
            left: "59.5%",
            transform: isSpinning ? undefined : "translate(-50%, -50%)",
            animation: isSpinning ? "spin 0.6s ease-out" : undefined,
          }}
        >
          <div className="relative" style={{ width: chamberRadius * 2, height: chamberRadius * 2 }}>
            {chambers.map((chamber, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate(${chamber.x}px, ${chamber.y}px) translate(-50%, -50%)`,
                }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: bulletRadius * 2,
                    height: bulletRadius * 2,
                    background: chamber.loaded
                      ? "radial-gradient(circle, #FFD700 0%, #FFA500 100%)"
                      : "radial-gradient(circle, #1A252F 0%, #0D1117 100%)",
                    border: chamber.loaded ? "1px solid #FFA500" : "1px solid #2C3E50",
                    boxShadow: chamber.loaded ? "0 0 6px rgba(255,165,0,0.6)" : "inset 0 1px 3px rgba(0,0,0,0.5)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ammo count badge */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-xs font-bold"
        style={{
          background: ammo === 0 ? "rgba(239,68,68,0.2)" : "rgba(0,0,0,0.8)",
          border: ammo === 0 ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.2)",
          color: ammo === 0 ? "#EF4444" : "#FFF",
        }}
      >
        {ammo}/{maxAmmo}
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Ammo indicator component for player cards
interface AmmoIndicatorProps {
  ammo: number;
  maxAmmo?: number;
  size?: "small" | "medium";
  showCount?: boolean;
}

export function AmmoIndicator({
  ammo,
  maxAmmo = 6,
  size = "small",
  showCount = false,
}: AmmoIndicatorProps) {
  const bulletSize = size === "small" ? 6 : 8;
  const gap = size === "small" ? 2 : 3;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center" style={{ gap }}>
        {Array.from({ length: maxAmmo }).map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: bulletSize,
              height: bulletSize,
              background: i < ammo
                ? "radial-gradient(circle, #FFD700 0%, #FFA500 100%)"
                : "radial-gradient(circle, #374151 0%, #1F2937 100%)",
              border: i < ammo ? "1px solid #FFA500" : "1px solid #4B5563",
              boxShadow: i < ammo ? "0 0 4px rgba(255,165,0,0.4)" : "inset 0 1px 2px rgba(0,0,0,0.3)",
            }}
          />
        ))}
      </div>
      {showCount && (
        <span className="text-xs font-bold text-white/60 ml-1">
          {ammo}/{maxAmmo}
        </span>
      )}
    </div>
  );
}
