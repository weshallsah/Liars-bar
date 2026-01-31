"use client";

import { useState, useEffect, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { usePathname, useRouter } from "next/navigation";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useTable } from "@/lib/solana/useTable";

export function WalletStatus() {
  const pathname = usePathname();
  const router = useRouter();
  const isOnGamePage = pathname?.startsWith("/game/");
  const isOnTablePage = pathname?.startsWith("/table/");
  const isOnHomePage = pathname === "/";

  // Extract tableId from pathname if on game page
  const tableId = useMemo(() => {
    if (isOnGamePage && pathname) {
      const parts = pathname.split("/");
      return parts[2] || "";
    }
    return "";
  }, [isOnGamePage, pathname]);

  const { connection } = useConnection();
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Use table hook only when on game page with valid tableId
  // Pass empty string - useTable will handle it gracefully
  const { quitTable, isPlayerInTable } = useTable(tableId);

  useEffect(() => {
    let isMounted = true;

    async function fetchBalance() {
      if (!publicKey || !connected) {
        setBalance(null);
        return;
      }

      setIsLoading(true);
      try {
        const bal = await connection.getBalance(publicKey);
        if (isMounted) {
          setBalance(bal / LAMPORTS_PER_SOL);
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
        if (isMounted) {
          setBalance(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBalance();

    // Set up balance subscription for real-time updates
    let subscriptionId: number | undefined;
    if (publicKey && connected) {
      subscriptionId = connection.onAccountChange(
        publicKey,
        (accountInfo) => {
          if (isMounted) {
            setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
          }
        },
        "confirmed"
      );
    }

    return () => {
      isMounted = false;
      if (subscriptionId !== undefined) {
        connection.removeAccountChangeListener(subscriptionId);
      }
    };
  }, [publicKey, connected, connection]);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatBalance = (bal: number) => {
    return bal.toFixed(4);
  };

  const handleLeave = async () => {
    if (!isOnGamePage) return;

    setIsLeaving(true);
    try {
      // Only call quitTable if the player is in the table
      if (isPlayerInTable) {
        await quitTable();
      }
      router.push("/");
    } catch (error) {
      console.error("Error leaving table:", error);
      // Navigate anyway even if quit fails
      router.push("/");
    } finally {
      setIsLeaving(false);
    }
  };

  // Don't render on homepage or table pages - wallet is in the page header
  if (isOnTablePage || isOnHomePage) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {connected && publicKey ? (
        <div className="flex flex-col items-stretch gap-2 w-44">
          {/* Back to Home button - only on game pages */}
          {isOnGamePage && (
            <button
              onClick={handleLeave}
              disabled={isLeaving}
              className="group flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-red-500/10 backdrop-blur-xl border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/20 shadow-lg shadow-red-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLeaving ? (
                <svg className="animate-spin w-4 h-4 text-red-400" viewBox="0 0 24 24">
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
              ) : (
                <svg
                  className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              )}
              <span className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors">
                {isLeaving ? "Leaving..." : "Leave"}
              </span>
            </button>
          )}

          {/* Wallet card */}
          <div className="flex flex-col bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-lg shadow-black/20 overflow-hidden">
            {/* Balance section */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                {/* Connected indicator */}
                <div className="relative flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <div className="absolute w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-60" />
                </div>
                <span className="text-neutral-400 text-xs font-mono">
                  {shortenAddress(publicKey.toString())}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Balance */}
            <div className="flex items-center justify-center gap-1.5 px-4 py-3">
              <span className="text-white font-bold text-lg">
                {isLoading ? "..." : balance !== null ? formatBalance(balance) : "--"}
              </span>
              <span className="text-neutral-500 text-sm">SOL</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Disconnect button */}
            <button
              onClick={disconnect}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="text-xs font-medium">Disconnect</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setVisible(true)}
          className="flex items-center justify-center gap-2.5 h-11 px-5 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-xl rounded-xl border border-amber-400/20 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <svg
            className="w-5 h-5 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="text-black font-semibold">Connect Wallet</span>
        </button>
      )}
    </div>
  );
}
