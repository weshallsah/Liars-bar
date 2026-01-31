import { useCallback, useState } from "react";
import {
  useConnection,
  useWallet,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { IDL } from "./idl";
import { PROGRAM_ID, INCO_LIGHTNING_PROGRAM_ID } from "./config";

/**
 * Generate a random u128 table ID from UUID
 * This ID will be used with Inco's e_rand for random number generation
 */
function generateTableId(): BN {
  const uuid = crypto.randomUUID().replace(/-/g, "");
  // Use full 32 hex chars (16 bytes = 128 bits) for u128
  return new BN(uuid, 16);
}

/**
 * Hook for creating a new Liar's Bar game table
 * Uses Inco Lightning for encrypted random number generation
 */
export function useCreateTable(onTableCreated?: (tableId: string) => void) {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const anchorWallet = useAnchorWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTable = useCallback(async (): Promise<{
    tableId: BN;
    txSignature: string;
  } | null> => {
    if (!publicKey || !anchorWallet) {
      setError("Wallet not connected");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create provider
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
      });

      // Create program instance
      const program = new Program(IDL as any, provider);

      // Generate random table ID (this will be used with Inco's e_rand on-chain)
      const tableId = generateTableId();

      // Derive table PDA (using 16 bytes for u128)
      const [tableAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("table"), tableId.toArrayLike(Buffer, "le", 16)],
        PROGRAM_ID,
      );

      console.log("Creating table with ID:", tableId.toString());
      console.log("Table PDA:", tableAddress.toString());
      console.log("Program ID:", PROGRAM_ID.toString());
      console.log("Inco Lightning Program ID:", INCO_LIGHTNING_PROGRAM_ID.toString());

      // Build and send transaction
      // The Solana program will call Inco's e_rand internally via CPI
      const tx = await program.methods
        .createTable(tableId)
        .accounts({
          signer: publicKey,
          table: tableAddress,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .rpc();

      console.log("Transaction sent:", tx);
      console.log("Table created successfully!");

      // Call the callback if provided
      if (onTableCreated) {
        onTableCreated(tableId.toString());
      }

      setIsLoading(false);
      return { tableId, txSignature: tx };

    } catch (err: any) {
      console.error("Error creating table:", err);

      let errorMessage = "Failed to create table";

      // Check for wallet-specific errors
      if (err?.name === "WalletSignTransactionError" || err?.name === "WalletSendTransactionError") {
        if (err?.message?.includes("User rejected")) {
          errorMessage = "Transaction was rejected by user";
        } else {
          errorMessage = `Wallet error: ${err.message}`;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, [connection, publicKey, anchorWallet, sendTransaction, onTableCreated]);

  return {
    createTable,
    isLoading,
    error,
    isWalletConnected: connected && !!publicKey,
  };
}
