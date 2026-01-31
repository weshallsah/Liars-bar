import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Custom hook to fetch and manage wallet balance
 *
 * Separates balance fetching logic from UI components
 *
 * @param refreshInterval - How often to refresh balance (ms). Default: 10000 (10s)
 * @returns Balance state and utilities
 */
export function useWalletBalance(refreshInterval = 10000) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey || !connected) {
      setBalance(null);
      setError(null);
      return;
    }

    const fetchBalance = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error("Error fetching balance:", err);
        setError("Failed to fetch balance");
        setBalance(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, refreshInterval);
    return () => clearInterval(interval);
  }, [publicKey, connected, connection, refreshInterval]);

  return {
    balance,
    isLoading,
    error,
    hasBalance: balance !== null && balance > 0,
    formattedBalance: balance !== null ? balance.toFixed(3) : "0.000",
  };
}
