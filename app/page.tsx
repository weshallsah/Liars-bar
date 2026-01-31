"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useCreateTable } from "@/lib/solana/useCreateTable";

export default function Home() {
  const router = useRouter();
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [showJoinInput, setShowJoinInput] = useState(false);
  const [tableId, setTableId] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { createTable, isLoading: isCreating, error: createError } = useCreateTable(
    (createdTableId) => {
      setIsRedirecting(true);
      router.push(`/join/${createdTableId}`);
    }
  );

  // Fetch balance
  useEffect(() => {
    if (!publicKey || !connected) {
      return;
    }

    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error("Error fetching balance:", err);
        setBalance(null);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connected, connection]);

  // Clear balance when wallet disconnects
  useEffect(() => {
    if (!publicKey || !connected) {
      setBalance(null);
    }
  }, [publicKey, connected]);

  const handleCreateTable = async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }
    await createTable();
  };

  const handleJoinTable = () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    if (!tableId.trim()) {
      setJoinError("Please enter a table ID");
      return;
    }

    setIsNavigating(true);
    router.push(`/join/${tableId.trim()}`);
  };

  const shortenAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

  const showLoadingOverlay = isCreating || isNavigating || isRedirecting;

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col safe-area-top safe-area-bottom touch-feedback">
      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-6" />
          <p className="text-white font-bold text-xl mb-2">
            {isCreating ? "Creating Table..." : isRedirecting ? "Redirecting to Lobby..." : "Joining Table..."}
          </p>
          <p className="text-white/50 text-sm">
            {isCreating ? "Confirm transaction in your wallet" : isRedirecting ? "Setting up your game room" : "Loading game"}
          </p>
        </div>
      )}

      {/* ========== HEADER ========== */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-black font-black text-sm">LB</span>
          </div>
          <span className="text-white font-bold text-lg hidden sm:block">Liar&apos;s Bar</span>
        </div>

        {/* Wallet Section */}
        <div className="relative">
          {connected && publicKey ? (
            <div className="flex items-center gap-2">
              {/* Desktop: Separate balance display */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-white font-semibold text-sm">
                  {balance !== null ? balance.toFixed(2) : "0.00"}
                </span>
                <span className="text-white/50 text-sm">SOL</span>
              </div>

              {/* Wallet Pill Button - Compact on mobile, expanded on desktop */}
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-full sm:rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                {/* Mobile: Show compact pill with balance */}
                <span className="md:hidden text-white/80 text-xs sm:text-sm font-mono">
                  {shortenAddress(publicKey.toString())}
                  <span className="text-white/50 ml-1.5">|</span>
                  <span className="text-amber-400 ml-1.5">
                    {balance !== null ? balance.toFixed(1) : "0.0"}
                  </span>
                </span>
                {/* Desktop: Show just address */}
                <span className="hidden md:inline text-white/80 text-sm font-mono">
                  {shortenAddress(publicKey.toString())}
                </span>
                <svg
                  className={`w-3 h-3 sm:w-4 sm:h-4 text-white/50 transition-transform flex-shrink-0 ${showDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-48 py-1 rounded-lg bg-[#111827] border border-white/10 shadow-xl">
                    {/* Mobile: Show full balance in dropdown */}
                    <div className="md:hidden px-4 py-2 border-b border-white/10">
                      <span className="text-white/50 text-xs">Balance</span>
                      <div className="text-white font-semibold">
                        {balance !== null ? balance.toFixed(4) : "0.0000"} SOL
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-sm font-medium">Disconnect</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setVisible(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full sm:rounded-lg bg-white text-black font-semibold text-xs sm:text-sm hover:bg-white/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden xs:inline">Connect</span>
              <span className="xs:hidden">Connect</span>
            </button>
          )}
        </div>
      </header>

      {/* ========== MAIN HERO ========== */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3">
              Liar&apos;s Bar
            </h1>
            <p className="text-white/50 text-sm sm:text-base">
              A game of deception and strategy
            </p>
          </div>

          {/* Action Buttons */}
          {!showJoinInput ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Create Table - Primary (Full width on mobile) */}
              <button
                onClick={handleCreateTable}
                disabled={isCreating}
                className="w-[90%] sm:w-full mx-auto block py-4 sm:py-4 px-6 rounded-xl font-semibold text-base sm:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  color: "#000",
                  boxShadow: "0 4px 20px rgba(245, 158, 11, 0.3)",
                }}
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Table"
                )}
              </button>
              <p className="text-center text-white/40 text-xs sm:text-sm">
                Start a new room and invite friends
              </p>

              {/* OR Separator */}
              <div className="flex items-center gap-4 py-2 sm:py-3">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-white/30 text-sm font-medium">OR</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {/* Join Table - Secondary (Full width on mobile) */}
              <button
                onClick={() => setShowJoinInput(true)}
                className="w-[90%] sm:w-full mx-auto block py-4 sm:py-4 px-6 rounded-xl font-semibold text-base sm:text-lg text-white transition-all hover:bg-white/5 active:scale-[0.98]"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                Join Table
              </button>
              <p className="text-center text-white/40 text-xs sm:text-sm">
                Enter a room code to join
              </p>

              {/* Error */}
              {createError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mt-4">
                  <p className="text-red-400 text-sm text-center">{createError}</p>
                </div>
              )}
            </div>
          ) : (
            /* Join Input View */
            <div className="w-[90%] sm:w-full mx-auto space-y-4">
              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-2">Table ID</label>
                <input
                  type="text"
                  value={tableId}
                  onChange={(e) => {
                    setTableId(e.target.value);
                    setJoinError("");
                  }}
                  placeholder="Enter table ID..."
                  className="w-full px-4 py-3.5 sm:py-3 rounded-xl bg-white/5 border border-white/10 text-white text-base placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleJoinTable()}
                  autoFocus
                />
                {joinError && (
                  <p className="text-red-400 text-xs sm:text-sm mt-2">{joinError}</p>
                )}
              </div>

              {/* Mobile: Stack buttons vertically, Desktop: Side by side */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleJoinTable}
                  className="flex-1 py-3.5 sm:py-3 px-4 rounded-xl font-semibold text-black transition-all active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  }}
                >
                  Join
                </button>
                <button
                  onClick={() => {
                    setShowJoinInput(false);
                    setTableId("");
                    setJoinError("");
                  }}
                  className="py-3.5 sm:py-3 px-6 rounded-xl font-medium text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors active:scale-[0.98]"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-white/5">
        {/* Left: Settings */}
        <button className="flex items-center gap-1.5 text-white/40 hover:text-white/60 transition-colors text-xs sm:text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden sm:inline">Settings</span>
        </button>

        {/* Center: Version info (hidden on very small screens) */}
        <span className="hidden xs:block text-white/20 text-xs">
          v1.0.0 Beta · Solana Devnet
        </span>

        {/* Right: Help */}
        <button className="flex items-center gap-1.5 text-white/40 hover:text-white/60 transition-colors text-xs sm:text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline">Help</span>
        </button>
      </footer>
    </div>
  );
}
