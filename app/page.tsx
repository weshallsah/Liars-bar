"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateTable } from "@/lib/solana/useCreateTable";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { connected } = useWallet();

  // Callback for when table is created via event
  const handleTableCreated = useCallback((tableId: string) => {
    console.log("Table created event received, redirecting to:", tableId);
    router.push(`/table/${tableId}`);
  }, [router]);

  const { createTable, isLoading, error } = useCreateTable(handleTableCreated);

  const handleCreateTable = async () => {
    await createTable();
    // Navigation is now handled by the event callback
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-3xl">
          {/* Logo/Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <span className="text-4xl">🎭</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight mb-4">
            <span className="text-white">Liar&apos;s</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Bar
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl text-neutral-400 mb-12 max-w-lg mx-auto leading-relaxed">
            The ultimate game of deception. Bluff your way to victory or get caught and face the consequences.
          </p>

          {/* Game action buttons */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCreateTable}
                disabled={isLoading || !connected}
                className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <>
                    Create Table
                    <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">
                      +
                    </span>
                  </>
                )}
              </button>
              <Link
                href="/join"
                className="px-8 py-4 bg-white/5 text-white font-semibold rounded-xl border border-white/10 transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5"
              >
                Join Table
              </Link>
            </div>

            {/* Helper text when not connected */}
            {!connected && (
              <p className="text-neutral-500 text-sm">
                Connect your wallet to start playing
              </p>
            )}

            {/* Error message */}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
