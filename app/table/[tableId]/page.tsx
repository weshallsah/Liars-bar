"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { PokerTable } from "@/components/PokerTable";
import { useTable } from "@/lib/solana/useTable";

// Character definitions with colors
const CHARACTERS: Record<string, { name: string; image: string; color: string }> = {
  bull: { name: "Bull", image: "/charactres/bull.png", color: "from-red-600 to-red-900" },
  cat: { name: "Cat", image: "/charactres/cat.png", color: "from-purple-500 to-purple-800" },
  dog: { name: "Dog", image: "/charactres/dog.png", color: "from-amber-500 to-amber-800" },
  lion: { name: "Lion", image: "/charactres/lions.png", color: "from-yellow-500 to-orange-700" },
  pig: { name: "Pig", image: "/charactres/pig.png", color: "from-pink-400 to-pink-700" },
  rabbit: { name: "Rabbit", image: "/charactres/rabbit.png", color: "from-gray-300 to-gray-600" },
  wolf: { name: "Wolf", image: "/charactres/wolf.png", color: "from-slate-500 to-slate-800" },
};

// Calculate positions for N players equally spaced on an oval
// Reference: bottom center (270°) = top:70, left:50 | top center (90°) = top:43, left:50
// Center: top:56.5, left:50 | RadiusY:13.5 | RadiusX:32
function getPlayerPositions(playerCount: number, currentPlayerIndex: number) {
  const centerTop = 56.5;
  const centerLeft = 50;
  const radiusY = 13.5;
  const radiusX = 30;

  const positions: { top: number; left: number }[] = [];
  const angleStep = (2 * Math.PI) / playerCount;
  // Start from 270° (bottom) which is 3π/2 radians, current player always at bottom
  const startAngle = (3 * Math.PI) / 2;

  for (let i = 0; i < playerCount; i++) {
    // Calculate position index relative to current player (current player at index 0 = bottom)
    const posIndex = (i - currentPlayerIndex + playerCount) % playerCount;
    const angle = startAngle + posIndex * angleStep;

    const top = centerTop - radiusY * Math.sin(angle);
    const left = centerLeft + radiusX * Math.cos(angle);

    positions.push({ top: Math.round(top), left: Math.round(left) });
  }

  return positions;
}

export default function TablePage() {
  const params = useParams();
  const tableId = params.tableId as string;
  const { publicKey } = useWallet();
  const { tableData } = useTable(tableId);

  // Get current player index (the connected wallet's position)
  const currentPlayerIndex = tableData?.players.findIndex(
    (p) => p === publicKey?.toString()
  ) ?? 0;

  // Calculate positions based on number of players
  const playerCount = tableData?.playerInfos.length ?? 0;
  const positions = getPlayerPositions(playerCount, currentPlayerIndex);

  // Map players with their positions and character data
  const playersWithPositions = tableData?.playerInfos.map((playerInfo, index) => {
    const character = playerInfo.characterId ? CHARACTERS[playerInfo.characterId] : null;
    const position = positions[index] || { top: 50, left: 50 };

    return {
      address: playerInfo.address,
      characterId: playerInfo.characterId,
      name: character?.name || "Unknown",
      image: character?.image || "/charactres/bull.png",
      color: character?.color || "from-gray-500 to-gray-700",
      top: position.top,
      left: position.left,
      isCurrentPlayer: playerInfo.address === publicKey?.toString(),
    };
  }) ?? [];
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex relative overflow-hidden">
      {/* Bar Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Dark wood paneling walls */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/40 via-stone-950 to-stone-950" />

        {/* Wood panel texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 80px,
              rgba(139,69,19,0.3) 80px,
              rgba(139,69,19,0.3) 82px
            )`
          }}
        />

        {/* Horizontal wood trim */}
        <div className="absolute top-[30%] inset-x-0 h-2 bg-gradient-to-b from-amber-900/40 to-amber-950/40" />

        {/* Wainscoting effect on lower wall */}
        <div
          className="absolute bottom-0 inset-x-0 h-[35%] opacity-30"
          style={{
            background: `
              linear-gradient(to bottom, rgba(120,80,40,0.3) 0%, rgba(60,40,20,0.4) 100%),
              repeating-linear-gradient(
                90deg,
                transparent 0px,
                transparent 100px,
                rgba(80,50,20,0.4) 100px,
                rgba(80,50,20,0.4) 102px
              )
            `
          }}
        />

        {/* Baseboard */}
        <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-amber-950 to-amber-900/50" />

        {/* Ambient wall lights glow */}
        <div className="absolute top-[20%] left-[15%] w-32 h-48 bg-amber-500/10 blur-3xl rounded-full" />
        <div className="absolute top-[20%] right-[35%] w-32 h-48 bg-amber-500/10 blur-3xl rounded-full" />

        {/* Ceiling dark gradient */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />

        {/* Floor reflection/shadow */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Smoke/haze effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-900/5 to-transparent opacity-50" />

        {/* Decorative frames on wall */}
        <div className="absolute top-[12%] left-[8%] w-20 h-28 border-4 border-amber-900/30 rounded-sm bg-amber-950/20" />
        <div className="absolute top-[10%] left-[20%] w-16 h-20 border-4 border-amber-900/30 rounded-sm bg-amber-950/20" />

        {/* Bar shelf hints in background */}
        <div className="absolute top-[15%] right-[32%] w-40 h-1 bg-amber-800/20" />
        <div className="absolute top-[25%] right-[32%] w-40 h-1 bg-amber-800/20" />

        {/* Bottle silhouettes */}
        <div className="absolute top-[8%] right-[34%] w-4 h-12 bg-amber-900/20 rounded-t-full" />
        <div className="absolute top-[10%] right-[38%] w-3 h-10 bg-amber-900/15 rounded-t-full" />
        <div className="absolute top-[9%] right-[41%] w-4 h-11 bg-amber-900/20 rounded-t-full" />
        <div className="absolute top-[18%] right-[35%] w-3 h-10 bg-amber-900/15 rounded-t-full" />
        <div className="absolute top-[19%] right-[39%] w-4 h-9 bg-amber-900/20 rounded-t-full" />
      </div>

      {/* Left side - 70% */}
      <div className="w-[70%] h-screen flex items-end justify-center relative z-10" style={{ perspective: "1000px" }}>
        <div className="w-full h-[60%] mb-8" style={{ transform: "rotateX(65deg)" }}>
          <PokerTable />
        </div>

        {/* Players around the table - outside the tilted container */}
        {playersWithPositions.map((player) => (
          <div
            key={player.address}
            className="absolute z-20"
            style={{
              top: `${player.top}%`,
              left: `${player.left}%`,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${player.color} p-0.5 shadow-lg ${player.isCurrentPlayer ? "ring-2 ring-amber-400" : ""}`}>
                <div className="w-full h-full rounded-[10px] bg-black/40 flex items-center justify-center overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${player.color} opacity-30 blur-sm`} />
                  <Image
                    src={player.image}
                    alt={player.name}
                    width={64}
                    height={64}
                    className="relative z-10 w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${player.color} shadow-md`}>
                <span className="text-white text-xs font-semibold drop-shadow-sm">
                  {player.name}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right side - 30% */}
      <div className="w-[30%] bg-neutral-900/80 border-l border-amber-900/30 backdrop-blur-sm relative z-10">
      </div>
    </div>
  );
}
