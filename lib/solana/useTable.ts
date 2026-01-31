import { useCallback, useState, useEffect, useRef } from "react";
import {
  useConnection,
  useWallet,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
  Transaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { IDL } from "./idl";
import { useTableSubscription, GameEvent } from "./useTableSubscription";
import { PROGRAM_ID, INCO_LIGHTNING_PROGRAM_ID } from "./config";
import { EncryptedCard, euint128ToHandle } from "./incoTypes";

export interface PlayerInfo {
  address: string;
  characterId: string | null;
  isEliminated?: boolean;
  cardCount?: number;
}

// Encrypted card from on-chain
export interface PlayerCard {
  index: number;
  shapeHandle: string;
  valueHandle: string;
  // Decrypted values (null if not yet decrypted)
  decryptedShape: number | null;
  decryptedValue: number | null;
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
  cardsOnTableCount: number;
  suffleTrun: number;
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
  const [isShuffling, setIsShuffling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game state tracking
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<string | null>(
    null,
  );
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [eventLog, setEventLog] = useState<GameEventLog[]>([]);

  // Player cards state
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);
  const [isFetchingCards, setIsFetchingCards] = useState(false);

  // Derive table PDA
  const getTableAddress = useCallback(() => {
    if (!tableIdString || tableIdString.trim() === "") {
      throw new Error("Table ID is required");
    }
    const tableId = new BN(tableIdString);
    const [tableAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("table"), tableId.toArrayLike(Buffer, "le", 16)],
      PROGRAM_ID,
    );
    return tableAddress;
  }, [tableIdString]);

  // Track if initial fetch is done for the current wallet
  const initialFetchDone = useRef(false);
  const lastWalletKey = useRef<string | null>(null);

  // Ref to track if shuffle is in progress (avoids stale closure issues)
  const isShufflingRef = useRef(false);

  // Fetch table data
  const fetchTable = useCallback(
    async (isInitialFetch = false) => {
      if (!tableIdString || tableIdString.trim() === "") {
        return;
      }
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

        const table = await (program.account as any).liarsTable.fetch(
          tableAddress,
        );
        const playerAddresses = table.players.map((p: PublicKey) =>
          p.toString(),
        );

        // Fetch character IDs from on-chain player accounts
        const tableId = new BN(tableIdString);
        const playerInfos: PlayerInfo[] = await Promise.all(
          playerAddresses.map(async (address: string) => {
            try {
              // Derive player PDA
              const [playerPDA] = PublicKey.findProgramAddressSync(
                [
                  Buffer.from("player"),
                  tableId.toArrayLike(Buffer, "le", 16),
                  new PublicKey(address).toBuffer(),
                ],
                PROGRAM_ID,
              );

              // Fetch player account
              const playerAccount = await (program.account as any).player.fetch(
                playerPDA,
              );
              return {
                address,
                characterId: playerAccount.characterId || null,
              };
            } catch {
              // Player account might not exist yet (table creator before joining)
              return {
                address,
                characterId: null,
              };
            }
          }),
        );

        const newTableData = {
          tableId: table.tableId.toString(),
          players: playerAddresses,
          playerInfos,
          isOpen: table.isOpen,
          tableCard: table.tableCard,
          trunToPlay: table.trunToPlay,
          cardsOnTableCount: table.cardsOnTable?.length ?? 0,
          suffleTrun: table.suffleTrun ?? 0,
        };
        console.log("Setting new table data:", newTableData);
        setTableData(newTableData);

        // Update game state based on table status
        if (table.isOpen) {
          setGameState("lobby");
        } else if (playerAddresses.length > 0) {
          setGameState("playing");
          // Set current turn player from table data
          if (
            table.trunToPlay >= 0 &&
            table.trunToPlay < playerAddresses.length
          ) {
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
    },
    [connection, anchorWallet, tableIdString, getTableAddress],
  );

  // Join table with character selection
  const joinTable = useCallback(
    async (characterId: string): Promise<boolean> => {
      if (!tableIdString || tableIdString.trim() === "") {
        setError("Table ID is required");
        return false;
      }
      if (!publicKey || !anchorWallet || !sendTransaction) {
        setError("Wallet not connected");
        return false;
      }

      if (!characterId) {
        setError("Please select a character");
        return false;
      }

      // Check if character is already taken
      const takenCharacters =
        tableData?.playerInfos
          .filter((p) => p.characterId !== null)
          .map((p) => p.characterId) || [];

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
            tableId.toArrayLike(Buffer, "le", 16),
            publicKey.toBuffer(),
          ],
          PROGRAM_ID,
        );

        console.log("Joining table with ID:", tableId.toString());
        console.log("Character ID:", characterId);
        console.log("Table Address:", tableAddress.toString());
        console.log("Player Address:", playerAddress.toString());
        console.log("Signer:", publicKey.toString());

        // Build compute budget instructions for better network priority
        const computeUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({
          units: 200_000,
        });
        const computeUnitPrice = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 50000,
        });

        // Build the transaction using the same pattern as other functions
        const txBuilder = program.methods
          .joinTable(tableId, characterId)
          .accounts({
            signer: publicKey,
            table: tableAddress,
            player: playerAddress,
            systemProgram: SystemProgram.programId,
            incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
          } as any)
          .preInstructions([computeUnitLimit, computeUnitPrice]);

        const transaction: Transaction = await txBuilder.transaction();
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        console.log("Sending transaction...");
        const tx = await sendTransaction(transaction, connection, {
          skipPreflight: true,
          maxRetries: 5,
        });

        console.log("Transaction sent:", tx);

        await connection.confirmTransaction(
          {
            signature: tx,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed",
        );

        console.log("Successfully joined table!");

        // Wait for on-chain state to update
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Fetch updated table data
        await fetchTable();
        return true;
      } catch (err: any) {
        console.error("Error joining table:", err);

        // Extract detailed error information
        let errorMessage = "Failed to join table";

        if (err.logs) {
          console.error("Transaction logs:", err.logs);
          errorMessage += `\n\nLogs:\n${err.logs.join("\n")}`;
        }

        if (err.message) {
          errorMessage = err.message;
        }

        // Check for specific error patterns
        if (err.message?.includes("0x1")) {
          errorMessage = "Insufficient funds for transaction";
        } else if (err.message?.includes("0x0")) {
          errorMessage = "Transaction failed - check program state";
        }

        console.error("Final error message:", errorMessage);
        setError(errorMessage);
        return false;
      } finally {
        setIsJoining(false);
      }
    },
    [
      connection,
      publicKey,
      anchorWallet,
      sendTransaction,
      tableIdString,
      getTableAddress,
      fetchTable,
      tableData,
    ],
  );

  // Start round
  const startRound = useCallback(async (): Promise<boolean> => {
    if (!tableIdString || tableIdString.trim() === "") {
      setError("Table ID is required");
      return false;
    }
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
          tableId.toArrayLike(Buffer, "le", 16),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID,
      );

      // Build compute budget instructions with higher priority fee
      const computeUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000,
      });
      const computeUnitPrice = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000, // Increased for better network priority
      });

      const txBuilder = (program.methods as any)
        .startRound(tableId)
        .accounts({
          signer: publicKey,
          table: tableAddress,
          player: playerAddress,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .preInstructions([computeUnitLimit, computeUnitPrice]);

      const transaction: Transaction = await txBuilder.transaction();
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const tx = await sendTransaction(transaction, connection, {
        skipPreflight: true,
        maxRetries: 5,
      });

      await connection.confirmTransaction(
        {
          signature: tx,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      );

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
  }, [
    connection,
    publicKey,
    anchorWallet,
    sendTransaction,
    tableIdString,
    getTableAddress,
    fetchTable,
  ]);

  // Quit table
  const quitTable = useCallback(async (): Promise<boolean> => {
    if (!tableIdString || tableIdString.trim() === "") {
      // If no tableId, just return true (nothing to quit)
      return true;
    }
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
          tableId.toArrayLike(Buffer, "le", 16),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID,
      );

      // Build compute budget instructions with higher priority fee
      const computeUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200_000,
      });
      const computeUnitPrice = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000, // Increased for better network priority
      });

      console.log("Building quitTable transaction...");

      const txBuilder = (program.methods as any)
        .quitTable(tableId)
        .accounts({
          signer: publicKey,
          table: tableAddress,
          player: playerAddress,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .preInstructions([computeUnitLimit, computeUnitPrice]);

      const transaction: Transaction = await txBuilder.transaction();
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const tx = await sendTransaction(transaction, connection, {
        skipPreflight: true,
        maxRetries: 5,
      });

      await connection.confirmTransaction(
        {
          signature: tx,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      );

      console.log("Quit table! Tx:", tx);
      return true;
    } catch (err: any) {
      console.error("Error quitting table:", err);
      setError(err.message || "Failed to quit table");
      return false;
    } finally {
      setIsQuitting(false);
    }
  }, [
    connection,
    publicKey,
    anchorWallet,
    sendTransaction,
    tableIdString,
    getTableAddress,
  ]);

  // Shuffle cards
  const shuffleCards = useCallback(async (): Promise<boolean> => {
    if (!tableIdString || tableIdString.trim() === "") {
      console.log("Cannot shuffle: table ID required");
      return false;
    }
    if (!publicKey || !anchorWallet || !sendTransaction) {
      console.log("Cannot shuffle: wallet not connected");
      return false;
    }

    // Prevent multiple simultaneous shuffle attempts (use ref to avoid stale closure)
    if (isShufflingRef.current) {
      console.log("Already shuffling, skipping...");
      return false;
    }

    isShufflingRef.current = true;
    setIsShuffling(true);

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
          tableId.toArrayLike(Buffer, "le", 16),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID,
      );

      // Build compute budget instructions with higher priority fee
      const computeUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000,
      });
      const computeUnitPrice = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000, // Increased for better network priority
      });

      console.log("Building shuffleCards transaction...");

      const txBuilder = (program.methods as any)
        .suffleCards(tableId)
        .accounts({
          signer: publicKey,
          table: tableAddress,
          player: playerAddress,
          systemProgram: SystemProgram.programId,
          incoLightningProgram: INCO_LIGHTNING_PROGRAM_ID,
        } as any)
        .preInstructions([computeUnitLimit, computeUnitPrice]);

      const transaction: Transaction = await txBuilder.transaction();

      // Get fresh blockhash right before sending
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const tx = await sendTransaction(transaction, connection, {
        skipPreflight: true, // Skip preflight to speed up
        maxRetries: 5,
      });

      console.log("Shuffle transaction sent:", tx);

      // Use a longer timeout for confirmation
      const confirmation = await connection.confirmTransaction(
        {
          signature: tx,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      );

      if (confirmation.value.err) {
        console.error("Shuffle transaction failed:", confirmation.value.err);
        return false;
      }

      console.log("Cards shuffled! Tx:", tx);
      await fetchTable(false);
      return true;
    } catch (err: any) {
      console.error("Error shuffling cards:", err);
      // If block height exceeded, the tx might still go through
      if (err.name === "TransactionExpiredBlockheightExceededError") {
        console.log(
          "Transaction may have succeeded despite timeout, refetching table...",
        );
        await fetchTable(false);
      }
      return false;
    } finally {
      isShufflingRef.current = false;
      setIsShuffling(false);
    }
  }, [
    connection,
    publicKey,
    anchorWallet,
    sendTransaction,
    tableIdString,
    getTableAddress,
    fetchTable,
  ]);

  // Fetch player's cards from their player account
  const fetchPlayerCards = useCallback(async (): Promise<PlayerCard[]> => {
    if (!tableIdString || !publicKey || !anchorWallet) {
      return [];
    }

    setIsFetchingCards(true);

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
      });
      const program = new Program(IDL as any, provider);

      const tableId = new BN(tableIdString);

      // Derive player PDA
      const [playerPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("player"),
          tableId.toArrayLike(Buffer, "le", 16),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID,
      );

      // Fetch player account
      const playerAccount = await (program.account as any).player.fetch(
        playerPDA,
      );

      if (!playerAccount.cards || playerAccount.cards.length === 0) {
        setPlayerCards([]);
        return [];
      }

      // Convert encrypted cards to PlayerCard format with handles
      const cards: PlayerCard[] = playerAccount.cards.map(
        (card: EncryptedCard, index: number) => ({
          index,
          shapeHandle: euint128ToHandle(card.shape),
          valueHandle: euint128ToHandle(card.value),
          decryptedShape: null,
          decryptedValue: null,
        }),
      );

      setPlayerCards(cards);
      return cards;
    } catch (err: any) {
      console.error("Error fetching player cards:", err);
      return [];
    } finally {
      setIsFetchingCards(false);
    }
  }, [connection, publicKey, anchorWallet, tableIdString]);

  // Update decrypted card values
  const updateDecryptedCards = useCallback(
    (decryptedValues: { index: number; shape: number; value: number }[]) => {
      setPlayerCards((prev) => {
        const updated = [...prev];
        for (const decrypted of decryptedValues) {
          if (updated[decrypted.index]) {
            updated[decrypted.index] = {
              ...updated[decrypted.index],
              decryptedShape: decrypted.shape,
              decryptedValue: decrypted.value,
            };
          }
        }
        return updated;
      });
    },
    [],
  );

  // Helper to add event to log
  const addEventLog = useCallback(
    (type: string, message: string, player?: string) => {
      setEventLog((prev) => [
        ...prev.slice(-49),
        {
          // Keep last 50 events
          type,
          player,
          timestamp: Date.now(),
          message,
        },
      ]);
    },
    [],
  );

  // Helper to get short address for display
  const shortenAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  // Handle WebSocket events
  const handleEvent = useCallback(
    (event: GameEvent) => {
      console.log("Received game event:", event);
      setLastEvent(event);

      // Check if this event is for our table
      if (event.data.tableId !== tableIdString) {
        return;
      }

      switch (event.type) {
        case "playerJoined": {
          const playerAddr = event.data.player;
          addEventLog(
            "playerJoined",
            `${shortenAddress(playerAddr)} joined the table`,
            playerAddr,
          );
          // Refetch to get updated player list
          fetchTable(false);
          break;
        }

        case "roundStarted": {
          setGameState("playing");
          addEventLog("roundStarted", "Round started!");
          // Fetch fresh table data, then check if we should shuffle
          fetchTable(false).then(() => {
            // Small delay to ensure state is updated
            setTimeout(async () => {
              // Re-fetch to get the latest suffleTrun
              if (!anchorWallet || !publicKey) return;
              try {
                const provider = new AnchorProvider(connection, anchorWallet, {
                  commitment: "confirmed",
                });
                const program = new Program(IDL as any, provider);
                const tableAddress = getTableAddress();
                const table = await (program.account as any).liarsTable.fetch(
                  tableAddress,
                );
                const playerAddresses = table.players.map((p: PublicKey) =>
                  p.toString(),
                );
                const myIndex = playerAddresses.findIndex(
                  (p: string) => p === publicKey.toString(),
                );

                console.log(
                  "Round started - suffleTrun:",
                  table.suffleTrun,
                  "myIndex:",
                  myIndex,
                );

                if (myIndex === table.suffleTrun) {
                  console.log("It's my turn to shuffle, triggering...");
                  shuffleCards();
                }
              } catch (err) {
                console.error("Error checking shuffle turn:", err);
              }
            }, 1000);
          });
          break;
        }

        case "tableTrun": {
          const playerAddr = event.data.player;
          setCurrentTurnPlayer(playerAddr);
          addEventLog(
            "tableTrun",
            `It's ${shortenAddress(playerAddr)}'s turn`,
            playerAddr,
          );
          fetchTable(false);
          break;
        }

        case "cardPlaced": {
          const playerAddr = event.data.player;
          addEventLog(
            "cardPlaced",
            `${shortenAddress(playerAddr)} placed a card`,
            playerAddr,
          );
          fetchTable(false);
          break;
        }

        case "liarCalled": {
          const callerAddr = event.data.caller;
          addEventLog(
            "liarCalled",
            `${shortenAddress(callerAddr)} called LIAR!`,
            callerAddr,
          );
          fetchTable(false);
          break;
        }

        case "playerEleminated": {
          const playerAddr = event.data.player;
          addEventLog(
            "playerEleminated",
            `${shortenAddress(playerAddr)} was eliminated!`,
            playerAddr,
          );
          fetchTable(false);
          break;
        }

        case "suffleCardsForPlayer": {
          const playerAddr = event.data.player;
          const nextAddr = event.data.next;
          addEventLog(
            "suffleCardsForPlayer",
            `Cards shuffled for ${shortenAddress(playerAddr)}, next: ${shortenAddress(nextAddr)}`,
            playerAddr,
          );
          setCurrentTurnPlayer(nextAddr);
          fetchTable(false);
          // If I'm the next player, trigger shuffle after a delay
          if (publicKey && nextAddr === publicKey.toString()) {
            console.log(
              "I'm the next player, triggering shuffle after delay...",
            );
            setTimeout(() => {
              shuffleCards();
            }, 1000);
          }
          break;
        }

        case "emptyBulletFired": {
          const playerAddr = event.data.player;
          addEventLog(
            "emptyBulletFired",
            `${shortenAddress(playerAddr)} fired an empty bullet - safe!`,
            playerAddr,
          );
          fetchTable(false);
          break;
        }

        default:
          // For any other events, just refetch
          fetchTable(false);
      }
    },
    [
      fetchTable,
      tableIdString,
      addEventLog,
      publicKey,
      shuffleCards,
      anchorWallet,
      connection,
      getTableAddress,
    ],
  );

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
    if (!tableIdString || tableIdString.trim() === "") {
      // No tableId, skip fetching
      setIsLoading(false);
      return;
    }
    if (!anchorWallet) {
      // Wait for wallet to be connected
      return;
    }

    const currentWalletKey = anchorWallet.publicKey.toString();

    // Fetch if this is the first fetch or wallet changed
    if (
      !initialFetchDone.current ||
      lastWalletKey.current !== currentWalletKey
    ) {
      initialFetchDone.current = true;
      lastWalletKey.current = currentWalletKey;
      fetchTable(true);
    }
  }, [fetchTable, anchorWallet, tableIdString]);

  const isPlayerInTable =
    publicKey && tableData?.players.includes(publicKey.toString());
  const canStart =
    isPlayerInTable &&
    tableData &&
    tableData.players.length >= 2 &&
    tableData.isOpen;

  // Check if it's the current user's turn
  const isMyTurn = publicKey && currentTurnPlayer === publicKey.toString();

  // Get list of taken character IDs
  const takenCharacters =
    tableData?.playerInfos
      .filter((p) => p.characterId !== null)
      .map((p) => p.characterId as string) || [];

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

    // Player cards
    playerCards,
    isFetchingCards,
    fetchPlayerCards,
    updateDecryptedCards,

    // Actions
    joinTable,
    startRound,
    quitTable,
    shuffleCards,
    fetchTable,

    // Action states
    isJoining,
    isStarting,
    isQuitting,
    isShuffling,
  };
}
