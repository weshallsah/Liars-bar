"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateTable } from "@/lib/solana/useCreateTable";

export default function Home() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [tableId, setTableId] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  const { createTable, isLoading: isCreating, error: createError } = useCreateTable(
    (createdTableId) => {
      // Navigate to the newly created table's lobby
      router.push(`/table/${createdTableId}`);
    }
  );

  const handleCreateTable = async () => {
    if (!connected || !publicKey) {
      alert("Please connect your wallet first");
      return;
    }
    await createTable();
  };

  const handleJoinTable = () => {
    if (!connected || !publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    if (!tableId.trim()) {
      setJoinError("Please enter a table ID");
      return;
    }

    // Show loading and navigate
    setIsNavigating(true);
    router.push(`/table/${tableId.trim()}`);
  };

  // Show full-screen loading overlay during create or navigation
  const showLoadingOverlay = isCreating || isNavigating;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
      {/* Full-screen Loading Overlay */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Animated cards */}
            <div className="flex gap-2 mb-8">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-12 h-16 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30"
                  style={{
                    animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
            {/* Loading spinner */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isCreating ? "Creating Table..." : "Joining Table..."}
          </h2>
          <p className="text-neutral-400 text-center max-w-md px-4">
            {isCreating
              ? "Please confirm the transaction in your wallet"
              : "Taking you to the game lobby"}
          </p>
          {/* Animated dots */}
          <div className="flex gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-amber-500"
                style={{
                  animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bar Background - matching the table page style */}
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

        {/* Ambient wall lights glow */}
        <div className="absolute top-[20%] left-[15%] w-32 h-48 bg-amber-500/10 blur-3xl rounded-full" />
        <div className="absolute top-[20%] right-[15%] w-32 h-48 bg-amber-500/10 blur-3xl rounded-full" />

        {/* Center spotlight effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />

        {/* Ceiling dark gradient */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />

        {/* Floor reflection/shadow */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Smoke/haze effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-900/5 to-transparent opacity-50" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 text-center">
        {/* Logo/Title */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent drop-shadow-2xl">
            Liar&apos;s Bar
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl">
            A game of deception and strategy
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            <span className="text-4xl">🎴</span>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          </div>
        </div>

        {/* Action Buttons */}
        {!showJoinInput ? (
          <div className="space-y-4">
            {/* Create Table Button */}
            <button
              onClick={handleCreateTable}
              disabled={isCreating || !connected}
              className="w-full group relative overflow-hidden px-8 py-6 bg-gradient-to-br from-amber-500 to-amber-600 text-black font-bold text-xl rounded-2xl shadow-2xl hover:shadow-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center gap-3">
                {isCreating ? (
                  <>
                    <div className="w-6 h-6 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Creating Table...</span>
                  </>
                ) : (
                  <>
                    <span>🎲</span>
                    <span>Create a Table</span>
                  </>
                )}
              </div>
            </button>

            {/* Join Table Button */}
            <button
              onClick={() => setShowJoinInput(true)}
              disabled={!connected}
              className="w-full group relative overflow-hidden px-8 py-6 bg-white/5 text-white font-bold text-xl rounded-2xl ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="relative flex items-center justify-center gap-3">
                <span>🚪</span>
                <span>Join a Table</span>
              </div>
            </button>

            {/* Wallet Connection Notice */}
            {!connected && (
              <div className="mt-6 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <p className="text-amber-400 text-sm">
                  Connect your wallet to start playing
                </p>
              </div>
            )}

            {/* Error Display */}
            {createError && (
              <div className="mt-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="text-red-400 text-sm">{createError}</p>
              </div>
            )}
          </div>
        ) : (
          /* Join Table Input */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-left">
              <label htmlFor="tableId" className="block text-white font-semibold mb-2">
                Enter Table ID
              </label>
              <input
                id="tableId"
                type="text"
                value={tableId}
                onChange={(e) => {
                  setTableId(e.target.value);
                  setJoinError("");
                }}
                placeholder="e.g., 4abc123..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleJoinTable();
                  }
                }}
              />
              {joinError && (
                <p className="mt-2 text-red-400 text-sm">{joinError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleJoinTable}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                Join Game
              </button>
              <button
                onClick={() => {
                  setShowJoinInput(false);
                  setTableId("");
                  setJoinError("");
                }}
                className="px-6 py-3 bg-white/5 text-white font-medium rounded-xl ring-1 ring-white/10 hover:bg-white/10 transition-all"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <p className="text-neutral-500 text-sm">
            Powered by Solana & Inco Network
          </p>
        </div>
      </div>
    </div>
  );
}
