import { PublicKey } from "@solana/web3.js";

// Program IDs - Update these with your actual program IDs
// Using valid devnet placeholder addresses for now
export const PROGRAM_ID_STRING = "6wYATvBh3f8gPZGTTeRJ8Qs38S1XcjJCybHyfBCDRFhg"; // Replace with your actual program ID
export const INCO_LIGHTNING_PROGRAM_ID_STRING =
  "5sjEbPiqgZrYwR31ahR6Uk9wf5awoX61YGg7jExQSwaj"; // Replace with your actual Inco Lightning program ID

// Lazy initialization to avoid errors on import
let _programId: PublicKey | null = null;
let _incoLightningProgramId: PublicKey | null = null;

export const getProgramId = (): PublicKey => {
  if (!_programId) {
    _programId = new PublicKey(PROGRAM_ID_STRING);
  }
  return _programId;
};

export const getIncoLightningProgramId = (): PublicKey => {
  if (!_incoLightningProgramId) {
    _incoLightningProgramId = new PublicKey(INCO_LIGHTNING_PROGRAM_ID_STRING);
  }
  return _incoLightningProgramId;
};

// For backward compatibility
export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
export const INCO_LIGHTNING_PROGRAM_ID = new PublicKey(
  INCO_LIGHTNING_PROGRAM_ID_STRING,
);

// Solana cluster configuration
// Use environment variable with fallback to public endpoint
export const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";
export const SOLANA_WS_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_WS_ENDPOINT || "wss://api.devnet.solana.com";
