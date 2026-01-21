import { useCallback, useState, useEffect, useRef } from "react";
import {
  useConnection,
  useWallet,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, ComputeBudgetProgram, Transaction } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { IDL } from "./idl";
import { useTableSubscription, GameEvent } from "./useTableSubscription";
import { PROGRAM_ID, INCO_LIGHTNING_PROGRAM_ID } from "./config";

export interface PlayerInfo {
  address: string;
  characterId: string | null;
  isEliminated?: boolean;
}

export type GameState = "lobby" | "playing" | "ended";

export interface GameEventLog {
  type: string;
  player?: string;
  timestamp: number;
  message: string;
}

export interface TableData {
  tableId: string;
  players: string[];
  playerInfos: PlayerInfo[];
  isOpen: boolean;
  tableCard: number;
  trunToPlay: number;
}

export function useTable(tableIdString: string) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const anchorWallet = useAnchorWallet();
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game state tracking
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [eventLog, setEventLog] = useState<GameEventLog[]>([]);

  // Derive table PDA
  const getTableAddress = useCallback(() => {
    const tableId = new BN(tableIdString);
    const [tableAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("table"), tableId.toArrayLike(Buffer, "le", 8)],
      PROGRAM_ID
    );
    return tableAddress;
  }, [tableIdString]);

  // Track if initial fetch is done for the current wallet
  const initialFetchDone = useRef(false);
  const lastWalletKey = useRef<string | null>(null);

  // Fetch table data
  const fetchTable = useCallback(async (isInitialFetch = false) => {
    try {
      // Only show loading spinner on initial fetch
      if (isInitialFetch) {
        setIsLoading(true);
      }
      const tableAddress = getTableAddress();

      const accountInfo = await connection.getAccountInfo(tableAddress);
      if (!accountInfo) {
        setError("Table not found");
        setTableData(null);
        return;
      }

      // Helper to get character from localStorage
      const getPlayerCharacter = (playerAddress: string): string | null => {
        if (typeof window !== "undefined") {
          return localStorage.getItem(`character-${tableIdString}-${playerAddress}`);
        }
        return null;
      };

      // Create provider for decoding
      if (!anchorWallet) {
        // Wallet not connected yet - keep loading state to prevent showing character selection
        // The effect will re-run when anchorWallet becomes available
        return;
      }

      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
      });
      const program = new Program(IDL as any, provider);

      const table = await (program.account as any).liarsTable.fetch(tableAddress);
      const playerAddresses = table.players.map((p: PublicKey) => p.toString());

      setTableData({
        tableId: table.tableId.toString(),
        players: playerAddresses,
        playerInfos: playerAddresses.map((address: string) => ({
          address,
          characterId: getPlayerCharacter(address),
        })),
        isOpen: table.isOpen,
        tableCard: table.tableCard,
        trunToPlay: table.trunToPlay,
      });

      // Update game state based on table status
      if (table.isOpen) {
        setGameState("lobby");
      } else if (playerAddresses.length > 0) {
        setGameState("playing");
        // Set current turn player from table data
        if (table.trunToPlay >= 0 && table.trunToPlay < playerAddresses.length) {
          setCurrentTurnPlayer(playerAddresses[table.trunToPlay]);
        }
      }

      setError(null);
    } catch (err: any) {
      console.error("Error fetching table:", err);
      setError(err.message || "Failed to fetch table");
    } finally {
      if (isInitialFetch) {
        setIsLoading(false);
      }
    }
  }, [connection, anchorWallet, tableIdString, getTableAddress]);

  // Join table with character selection
  const joinTable = useCallback(async (characterId: string): Promise<boolean> => {
    if (!publicKey || !anchorWallet || !sendTransaction) {
      setError("Wallet not connected");
      return false;
    }

    if (!characterId) {
      setError("Please select a character");
      return false;
    }

    // Check if character is already taken
    const takenCharacters = tableData?.playerInfos
      .filter(p => p.characterId !== null)
      .map(p => p.characterId) || [];

    if (takenCharacters.includes(characterId)) {
      setError("This character is already taken by another player");
      return false;
    }

    setIsJoining(true);
    setError(null);

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
      });
      const program = new Program(IDL as any, provider);

      const tableId = new BN(tableIdString);
      const tableAddress = getTableAddress();

      // Derive player PDA
      const [playerAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player"),
          tableId.toArrayLike(Buffer, "le", 8),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID
      );

      // Build compute budget instructions
      const computeUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200_000,
      });
      const computeUnitPrice = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      });

      console.log("Building joinTable transaction...");
      console.log("Table ID:", tableId.toString());
      console.log("Character ID:", characterId);
      console.log("Table Address:", tableAddress.toString());
      console.log("Player Address:", playerAddress.toString());
      console.log("Signer:", publicKey.toString());

      const txBuilder = (program.methods as any)
        .joinTable(tableId, characterId)
        .accounts({
          signer: publicKey,
          table: tableAddress,
          players: playerAddress,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .preInstructions([computeUnitLimit, computeUnitPrice]);

      const transaction: Transaction = await txBuilder.transaction();
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Simulate first to get better error messages
      console.log("Simulating transaction...");
      try {
        const simResult = await connection.simulateTransaction(transaction);
        if (simResult.value.err) {
          console.error("Simulation error:", simResult.value.err);
          console.error("Simulation logs:", simResult.value.logs);
          throw new Error(`Simulation failed: ${JSON.stringify(simResult.value.err)}\nLogs: ${simResult.value.logs?.join('\n')}`);
        }
        console.log("Simulation successful");
      } catch (simErr: any) {
        console.error("Simulation failed:", simErr);
        throw simErr;
      }

      const tx = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction({
        signature: tx,
        blockhash,
        lastValidBlockHeight,
      }, "confirmed");

      // Store character selection in localStorage after successful join
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `character-${tableIdString}-${publicKey.toString()}`,
          characterId
        );
      }

      console.log("Joined table! Tx:", tx);
      await fetchTable();
      return true;
    } catch (err: any) {
      console.error("Error joining table:", err);
      setError(err.message || "Failed to join table");
      return false;
    } finally {
      setIsJoining(false);
    }
  }, [connection, publicKey, anchorWallet, sendTransaction, tableIdString, getTableAddress, fetchTable, tableData]);

  // Start round
  const startRound = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !anchorWallet || !sendTransaction) {
      setError("Wallet not connected");
      return false;
    }

    setIsStarting(true);
    setError(null);

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
      });
      const program = new Program(IDL as any, provider);

      const tableId = new BN(tableIdString);
      const tableAddress = getTableAddress();

      // Derive player PDA
      const [playerAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player"),
          tableId.toArrayLike(Buffer, "le", 8),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID
      );

      // Build compute budget instructions
      const computeUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000,
      });
      const computeUnitPrice = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      });

      const txBuilder = (program.methods as any)
        .startRound(tableId)
        .accounts({
          signer: publicKey,
          table: tableAddress,
          players: playerAddress,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .preInstructions([computeUnitLimit, computeUnitPrice]);

      const transaction: Transaction = await txBuilder.transaction();
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const tx = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction({
        signature: tx,
        blockhash,
        lastValidBlockHeight,
      }, "confirmed");

      console.log("Round started! Tx:", tx);
      await fetchTable();
      return true;
    } catch (err: any) {
      console.error("Error starting round:", err);
      setError(err.message || "Failed to start round");
      return false;
    } finally {
      setIsStarting(false);
    }
  }, [connection, publicKey, anchorWallet, sendTransaction, tableIdString, getTableAddress, fetchTable]);

  // Quit table
  const quitTable = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !anchorWallet || !sendTransaction) {
      setError("Wallet not connected");
      return false;
    }

    setIsQuitting(true);
    setError(null);

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
      });
      const program = new Program(IDL as any, provider);

      const tableId = new BN(tableIdString);
      const tableAddress = getTableAddress();

      // Derive player PDA
      const [playerAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player"),
          tableId.toArrayLike(Buffer, "le", 8),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID
      );

      // Build compute budget instructions
      const computeUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200_000,
      });
      const computeUnitPrice = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      });

      console.log("Building quitTable transaction...");

      const txBuilder = (program.methods as any)
        .quitTable(tableId)
        .accounts({
          signer: publicKey,
          table: tableAddress,
          players: playerAddress,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .preInstructions([computeUnitLimit, computeUnitPrice]);

      const transaction: Transaction = await txBuilder.transaction();
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const tx = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction({
        signature: tx,
        blockhash,
        lastValidBlockHeight,
      }, "confirmed");

      // Clear character selection from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(`character-${tableIdString}-${publicKey.toString()}`);
      }

      console.log("Quit table! Tx:", tx);
      return true;
    } catch (err: any) {
      console.error("Error quitting table:", err);
      setError(err.message || "Failed to quit table");
      return false;
    } finally {
      setIsQuitting(false);
    }
  }, [connection, publicKey, anchorWallet, sendTransaction, tableIdString, getTableAddress]);

  // Helper to add event to log
  const addEventLog = useCallback((type: string, message: string, player?: string) => {
    setEventLog(prev => [...prev.slice(-49), { // Keep last 50 events
      type,
      player,
      timestamp: Date.now(),
      message,
    }]);
  }, []);

  // Helper to get short address for display
  const shortenAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

  // Handle WebSocket events
  const handleEvent = useCallback((event: GameEvent) => {
    console.log("Received game event:", event);
    setLastEvent(event);

    // Check if this event is for our table
    if (event.data.tableId !== tableIdString) {
      return;
    }

    switch (event.type) {
      case "playerJoined": {
        const playerAddr = event.data.player;
        addEventLog("playerJoined", `${shortenAddress(playerAddr)} joined the table`, playerAddr);
        // Refetch to get updated player list
        fetchTable(false);
        break;
      }

      case "roundStarted": {
        setGameState("playing");
        addEventLog("roundStarted", "Round started!");
        fetchTable(false);
        break;
      }

      case "tableTrun": {
        const playerAddr = event.data.player;
        setCurrentTurnPlayer(playerAddr);
        addEventLog("tableTrun", `It's ${shortenAddress(playerAddr)}'s turn`, playerAddr);
        fetchTable(false);
        break;
      }

      case "cardPlaced": {
        const playerAddr = event.data.player;
        addEventLog("cardPlaced", `${shortenAddress(playerAddr)} placed a card`, playerAddr);
        fetchTable(false);
        break;
      }

      case "liarCalled": {
        const callerAddr = event.data.caller;
        addEventLog("liarCalled", `${shortenAddress(callerAddr)} called LIAR!`, callerAddr);
        fetchTable(false);
        break;
      }

      case "playerEleminated": {
        const playerAddr = event.data.player;
        addEventLog("playerEleminated", `${shortenAddress(playerAddr)} was eliminated!`, playerAddr);
        fetchTable(false);
        break;
      }

      case "suffleCardsForPlayer": {
        const playerAddr = event.data.player;
        const nextAddr = event.data.next;
        addEventLog("suffleCardsForPlayer", `Cards shuffled for ${shortenAddress(playerAddr)}, next: ${shortenAddress(nextAddr)}`, playerAddr);
        setCurrentTurnPlayer(nextAddr);
        fetchTable(false);
        break;
      }

      case "emptyBulletFired": {
        const playerAddr = event.data.player;
        addEventLog("emptyBulletFired", `${shortenAddress(playerAddr)} fired an empty bullet - safe!`, playerAddr);
        fetchTable(false);
        break;
      }

      default:
        // For any other events, just refetch
        fetchTable(false);
    }
  }, [fetchTable, tableIdString, addEventLog]);

  // Handle account changes via WebSocket
  const handleAccountChange = useCallback(() => {
    console.log("Table account changed, refetching...");
    fetchTable(false);
  }, [fetchTable]);

  // Subscribe to WebSocket events and account changes
  useTableSubscription({
    tableIdString,
    onEvent: handleEvent,
    onAccountChange: handleAccountChange,
  });

  // Fetch on mount and when wallet connects/changes
  useEffect(() => {
    if (!anchorWallet) {
      // Wait for wallet to be connected
      return;
    }

    const currentWalletKey = anchorWallet.publicKey.toString();

    // Fetch if this is the first fetch or wallet changed
    if (!initialFetchDone.current || lastWalletKey.current !== currentWalletKey) {
      initialFetchDone.current = true;
      lastWalletKey.current = currentWalletKey;
      fetchTable(true);
    }
  }, [fetchTable, anchorWallet]);

  const isPlayerInTable = publicKey && tableData?.players.includes(publicKey.toString());
  const canStart = isPlayerInTable && tableData && tableData.players.length >= 2 && tableData.isOpen;

  // Check if it's the current user's turn
  const isMyTurn = publicKey && currentTurnPlayer === publicKey.toString();

  // Get list of taken character IDs
  const takenCharacters = tableData?.playerInfos
    .filter(p => p.characterId !== null)
    .map(p => p.characterId as string) || [];

  return {
    // Table data
    tableData,
    isLoading,
    error,

    // Game state
    gameState,
    currentTurnPlayer,
    isMyTurn,
    lastEvent,
    eventLog,

    // Player state
    isPlayerInTable,
    canStart,
    takenCharacters,

    // Actions
    joinTable,
    startRound,
    quitTable,
    fetchTable,

    // Action states
    isJoining,
    isStarting,
    isQuitting,
  };
}
