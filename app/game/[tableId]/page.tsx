"use client";

import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTable } from "@/lib/solana/useTable";

const CHARACTERS = [
  {
    id: "bull",
    name: "Bull",
    image: "/charactres/bull.png",
    color: "from-red-600 to-red-900",
  },
  {
    id: "cat",
    name: "Cat",
    image: "/charactres/cat.png",
    color: "from-purple-500 to-purple-800",
  },
  {
    id: "dog",
    name: "Dog",
    image: "/charactres/dog.png",
    color: "from-amber-500 to-amber-800",
  },
  {
    id: "lion",
    name: "Lion",
    image: "/charactres/lions.png",
    color: "from-yellow-500 to-orange-700",
  },
  {
    id: "pig",
    name: "Pig",
    image: "/charactres/pig.png",
    color: "from-pink-400 to-pink-700",
  },
  {
    id: "rabbit",
    name: "Rabbit",
    image: "/charactres/rabbit.png",
    color: "from-gray-300 to-gray-600",
  },
  {
    id: "wolf",
    name: "Wolf",
    image: "/charactres/wolf.png",
    color: "from-slate-500 to-slate-800",
  },
];

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const { publicKey } = useWallet();
  const { tableData, isLoading, error } = useTable(tableId);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getPlayerCharacter = (playerAddress: string) => {
    const playerInfo = tableData?.playerInfos.find(p => p.address === playerAddress);
    if (playerInfo?.characterId) {
      return CHARACTERS.find((c) => c.id === playerInfo.characterId) || CHARACTERS[0];
    }
    if (typeof window !== "undefined") {
      const charId = localStorage.getItem(`character-${tableId}-${playerAddress}`);
      return CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
    }
    return CHARACTERS[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 border-4 border-amber-500/20 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-neutral-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Game Not Found</h1>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-amber-500 text-black font-semibold rounded-xl"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Liar&apos;s Bar</h1>
            <p className="text-neutral-500 text-sm">
              Table: {shortenAddress(tableId)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <span className="text-emerald-400 text-sm font-medium">
                Game in Progress
              </span>
            </div>
          </div>
        </div>

        {/* Game Area Placeholder */}
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 flex items-center justify-center">
              <span className="text-5xl">🎴</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Game Started!
            </h2>
            <p className="text-neutral-400 mb-8">
              The game interface will be implemented here. Players can play cards, make claims, and call out liars!
            </p>

            {/* Players in game */}
            <div className="mb-8">
              <p className="text-neutral-500 text-sm mb-4">Players in game:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {tableData.players.map((player) => {
                  const char = getPlayerCharacter(player);
                  const isCurrentUser = publicKey?.toString() === player;
                  return (
                    <div
                      key={player}
                      className={`px-4 py-2 rounded-full ${
                        isCurrentUser
                          ? "bg-amber-500/20 border border-amber-500/40"
                          : "bg-white/5 border border-white/10"
                      }`}
                    >
                      <span className={isCurrentUser ? "text-amber-400" : "text-white"}>
                        {char.name}
                      </span>
                      <span className="text-neutral-500 text-xs ml-2">
                        {shortenAddress(player)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => router.push(`/table/${tableId}`)}
              className="px-6 py-3 bg-white/5 text-white font-medium rounded-xl ring-1 ring-white/10 hover:bg-white/10 transition-colors"
            >
              Back to Lobby
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
