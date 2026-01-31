"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CharacterSelect, CHARACTERS } from "@/components/CharacterSelect";
import { CharacterPreview } from "@/components/CharacterPreview";
import { PlayerHand, TableCards } from "@/components/PlayerHand";
import { GameCard, CardBack, CardValue, getCardValueFromNumber } from "@/components/GameCard";
import { Pistol, AmmoIndicator } from "@/components/Pistol";
import { ActionLog, GameAction } from "@/components/ActionLog";
import { useTable } from "@/lib/solana/useTable";
import { useIncoRandom } from "@/lib/solana/useIncoRandom";

const CHARACTER_MAP: Record<string, { name: string; image: string; color: string }> = {
  bull: { name: "Bull", image: "/charactres/bull.png", color: "from-red-500 to-rose-600" },
  cat: { name: "Cat", image: "/charactres/cat.png", color: "from-violet-500 to-purple-600" },
  dog: { name: "Dog", image: "/charactres/dog.png", color: "from-amber-400 to-orange-500" },
  lion: { name: "Lion", image: "/charactres/lions.png", color: "from-yellow-400 to-amber-500" },
  pig: { name: "Pig", image: "/charactres/pig.png", color: "from-pink-400 to-rose-500" },
  rabbit: { name: "Rabbit", image: "/charactres/rabbit.png", color: "from-slate-300 to-slate-500" },
  wolf: { name: "Wolf", image: "/charactres/wolf.png", color: "from-slate-400 to-slate-600" },
};

function getPlayerPositions(playerCount: number, currentPlayerIndex: number) {
  const centerTop = 56.5;
  const centerLeft = 50;
  const radiusY = 13.5;
  const radiusX = 30;

  const positions: { top: number; left: number }[] = [];
  const angleStep = (2 * Math.PI) / playerCount;
  const startAngle = (3 * Math.PI) / 2;

  for (let i = 0; i < playerCount; i++) {
    const posIndex = (i - currentPlayerIndex + playerCount) % playerCount;
    const angle = startAngle + posIndex * angleStep;
    const top = centerTop - radiusY * Math.sin(angle);
    const left = centerLeft + radiusX * Math.cos(angle);
    positions.push({ top: Math.round(top), left: Math.round(left) });
  }

  return positions;
}

export default function TablePage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [previewCharacter, setPreviewCharacter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [showSquadDrawer, setShowSquadDrawer] = useState(false);

  const handleCopyTableId = async () => {
    await navigator.clipboard.writeText(tableId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const {
    tableData,
    isLoading,
    error,
    isPlayerInTable,
    takenCharacters,
    joinTable,
    isJoining,
    startRound,
    isStarting,
    canStart,
    gameState,
    quitTable,
    isQuitting,
    currentTurnPlayer,
    isMyTurn,
    playerCards,
    fetchPlayerCards,
    updateDecryptedCards,
    eventLog,
  } = useTable(tableId);

  // State for game actions
  const [isPlayingCards, setIsPlayingCards] = useState(false);
  const [isCallingLiar, setIsCallingLiar] = useState(false);

  // State for pistol mechanics
  // TODO: Replace with actual ammo data from Solana backend (player.ammo field)
  const [playerAmmo, setPlayerAmmo] = useState<Record<string, number>>({});
  const [pistolSpinning, setPistolSpinning] = useState(false);
  const [pistolFiring, setPistolFiring] = useState(false);

  // Action log state - Convert eventLog from useTable to GameAction format
  const [gameActions, setGameActions] = useState<GameAction[]>([]);

  // Inco decryption hook
  const { decryptMultiple } = useIncoRandom();

  // State for tracking if cards have been decrypted
  const [cardsDecrypted, setCardsDecrypted] = useState(false);
  const [isDecryptingCards, setIsDecryptingCards] = useState(false);

  // Fetch and decrypt player cards when game starts
  useEffect(() => {
    const loadAndDecryptCards = async () => {
      if (gameState !== "playing" || !isPlayerInTable || cardsDecrypted || isDecryptingCards) {
        return;
      }

      setIsDecryptingCards(true);

      try {
        // Fetch cards from player account
        const cards = await fetchPlayerCards();

        if (cards.length === 0) {
          console.log("No cards found for player");
          setIsDecryptingCards(false);
          return;
        }

        // Collect all handles to decrypt (both shape and value for each card)
        const handles: string[] = [];
        cards.forEach(card => {
          handles.push(card.valueHandle); // We mainly need value for gameplay
        });

        if (handles.length === 0) {
          setIsDecryptingCards(false);
          return;
        }

        console.log("Decrypting card values...", handles);

        // Decrypt all values
        const decrypted = await decryptMultiple(handles);

        if (decrypted) {
          // Map decrypted values back to cards
          const decryptedCards = cards.map((card, index) => ({
            index: card.index,
            shape: 0, // Shape not needed for display
            value: Number(decrypted[index]?.value ?? 0) % 3, // Mod 3 to get 0=Ace, 1=King, 2=Queen
          }));

          updateDecryptedCards(decryptedCards);
          setCardsDecrypted(true);
          console.log("Cards decrypted:", decryptedCards);
        }
      } catch (err) {
        console.error("Error loading/decrypting cards:", err);
      } finally {
        setIsDecryptingCards(false);
      }
    };

    loadAndDecryptCards();
  }, [gameState, isPlayerInTable, cardsDecrypted, fetchPlayerCards, decryptMultiple, updateDecryptedCards, isDecryptingCards]);

  // Reset decryption state when game state changes back to lobby
  useEffect(() => {
    if (gameState === "lobby") {
      setCardsDecrypted(false);
    }
  }, [gameState]);

  // Initialize player ammo when players join or game starts
  // TODO: Replace with actual ammo from Solana backend
  useEffect(() => {
    if (tableData?.players && tableData.players.length > 0) {
      setPlayerAmmo(prev => {
        const updated = { ...prev };
        tableData.players.forEach(player => {
          // Initialize with 6 ammo if not set, preserve existing if already set
          if (updated[player] === undefined) {
            updated[player] = 6;
          }
        });
        return updated;
      });
    }
  }, [tableData?.players]);

  // Convert eventLog to GameAction format
  useEffect(() => {
    const convertedActions: GameAction[] = eventLog.map((event, index) => {
      const playerName = event.player
        ? CHARACTER_MAP[tableData?.playerInfos.find(p => p.address === event.player)?.characterId || ""]?.name || `${event.player.slice(0, 4)}...${event.player.slice(-4)}`
        : "System";

      let actionType: GameAction["type"] = "round_start";
      let data: GameAction["data"] = {};

      if (event.type === "cardPlaced") {
        actionType = "place_cards";
        data = { cardCount: 1 }; // TODO: Get actual count from event
      } else if (event.type === "liarCalled") {
        actionType = "call_liar";
      } else if (event.type === "roundStarted") {
        actionType = "round_start";
      } else if (event.type === "tableTrun") {
        actionType = "turn_change";
      } else if (event.type === "playerEleminated") {
        actionType = "player_eliminated";
        data = { ammoLost: 1 };
      }

      return {
        id: `${event.timestamp}-${index}`,
        type: actionType,
        playerName,
        playerAddress: event.player,
        timestamp: event.timestamp,
        data,
      };
    });

    setGameActions(convertedActions);
  }, [eventLog, tableData?.playerInfos]);

  // Convert player cards to display format
  const getPlayerCardsForDisplay = () => {
    if (playerCards.length === 0) {
      // Return empty or loading state
      return [];
    }

    return playerCards.map(card => ({
      index: card.index,
      value: card.decryptedValue !== null
        ? getCardValueFromNumber(card.decryptedValue)
        : "unknown" as CardValue,
      isRevealed: card.decryptedValue !== null,
    }));
  };

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) {
        setBalance(null);
        return;
      }
      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  const handleLeaveTable = async () => {
    const success = await quitTable();
    if (success) {
      router.push("/");
    }
  };

  const currentPlayerIndex = tableData?.players.findIndex(
    (p) => p === publicKey?.toString()
  ) ?? 0;

  const playersWithCharacters = tableData?.playerInfos.filter(p => p.characterId) ?? [];
  const playerCount = playersWithCharacters.length;
  const positions = getPlayerPositions(Math.max(playerCount, 1), currentPlayerIndex >= 0 ? currentPlayerIndex : 0);

  const playersWithPositions = playersWithCharacters.map((playerInfo, index) => {
    const character = playerInfo.characterId ? CHARACTER_MAP[playerInfo.characterId] : null;
    const position = positions[index] || { top: 50, left: 50 };

    return {
      address: playerInfo.address,
      characterId: playerInfo.characterId,
      name: character?.name || "Unknown",
      image: character?.image || "/charactres/bull.png",
      color: character?.color || "from-gray-500 to-gray-700",
      top: position.top,
      left: position.left,
      isCurrentPlayer: playerInfo.address === publicKey?.toString(),
    };
  });

  const handleJoin = async () => {
    if (!selectedCharacter) return;
    const success = await joinTable(selectedCharacter);
    if (success) setSelectedCharacter(null);
  };

  const handleStartGame = async () => {
    await startRound();
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Error
  if (error && !tableData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-red-500 text-2xl">✕</span>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Table Not Found</h2>
          <p className="text-white/50 mb-6">{error}</p>
          <Link href="/" className="inline-block px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Character selection (pre-join view)
  if (!isPlayerInTable && tableData?.isOpen) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px]" />

        <div className="relative z-10 min-h-screen flex flex-col p-4 sm:p-6">
          {/* Header */}
          <div className="text-center pt-6 sm:pt-10 mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
              <span className="text-white/40 text-xs uppercase tracking-widest">Lobby</span>
              <span className="text-white/20">•</span>
              <button
                onClick={handleCopyTableId}
                className="text-white/60 hover:text-white transition text-xs font-mono flex items-center gap-1.5"
              >
                Room #{tableId.slice(0, 4).toUpperCase()}
                <span className="text-[10px]">{copied ? "✓" : "⧉"}</span>
              </button>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Join Table</h1>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white/60 text-sm">{playersWithCharacters.length}/5 players waiting</span>
            </div>
          </div>

          {/* Current Players in Lobby */}
          <div className="max-w-4xl mx-auto w-full mb-6 sm:mb-8">
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {[...Array(5)].map((_, slotIndex) => {
                const player = playersWithPositions[slotIndex];
                if (player) {
                  return (
                    <div
                      key={player.address}
                      className="relative bg-white/5 backdrop-blur rounded-xl p-2 sm:p-3 border border-white/10"
                    >
                      {slotIndex === 0 && (
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-amber-500 text-black text-[8px] font-bold uppercase rounded">
                          Host
                        </div>
                      )}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${player.color} p-0.5`}>
                          <div className="w-full h-full rounded-md bg-black/40 overflow-hidden">
                            <Image
                              src={player.image}
                              alt={player.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                        <p className="text-white/80 text-[10px] sm:text-xs font-medium mt-1 truncate w-full text-center">{player.name}</p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={`empty-${slotIndex}`}
                      className="relative bg-white/[0.02] rounded-xl p-2 sm:p-3 border border-dashed border-white/10"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center animate-pulse">
                          <span className="text-white/20 text-xs">?</span>
                        </div>
                        <p className="text-white/20 text-[10px] mt-1">Empty</p>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Wallet warning */}
          {!connected && (
            <div className="max-w-2xl mx-auto w-full mb-4 p-3 sm:p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-center">
              <p className="text-yellow-500 text-sm">Connect wallet to join the game</p>
            </div>
          )}

          {/* Character select card */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-8">
              <p className="text-white/60 text-sm mb-4 sm:mb-6 text-center uppercase tracking-wide">Choose Your Character</p>

              <CharacterSelect
                selectedCharacter={selectedCharacter}
                takenCharacters={takenCharacters}
                onSelect={setSelectedCharacter}
                disabled={!connected || isJoining}
              />

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={!selectedCharacter || !connected || isJoining}
                className="mt-6 sm:mt-8 w-full py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3"
              >
                {isJoining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <span className="text-lg">→</span>
                    Join{selectedCharacter && ` as ${CHARACTER_MAP[selectedCharacter]?.name}`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main game view
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Right Header - Account Info */}
      {connected && publicKey && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
          {/* Balance */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 px-4 py-2 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">◎</span>
            </div>
            <span className="text-white font-medium">
              {balance !== null ? balance.toFixed(3) : "..."} SOL
            </span>
          </div>

          {/* Account */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 px-4 py-2">
            <span className="text-white/60 font-mono text-sm">
              {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </span>
          </div>

          {/* Leave Button */}
          {isPlayerInTable && tableData?.isOpen && (
            <button
              onClick={handleLeaveTable}
              disabled={isQuitting}
              className="bg-red-500/10 hover:bg-red-500/20 backdrop-blur-xl rounded-xl border border-red-500/30 px-4 py-2 text-red-400 font-medium transition flex items-center gap-2 disabled:opacity-50"
            >
              {isQuitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <span>✕</span>
                  Leave
                </>
              )}
            </button>
          )}
        </div>
      )}

      {gameState === "lobby" ? (
        <div className="relative z-10 min-h-screen max-h-screen flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT SIDEBAR - Squad List (Desktop) */}
          <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col p-6 border-r border-white/10 overflow-y-auto overflow-x-hidden">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-white/60 text-xs uppercase tracking-widest font-semibold">Squad</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{playersWithCharacters.length}/5</span>
                <span className="text-white/40 text-sm">Players</span>
              </div>
            </div>

            {/* Player Slots - Vertical List */}
            <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
              {[...Array(5)].map((_, slotIndex) => {
                const player = playersWithPositions[slotIndex];
                const isHost = slotIndex === 0 && player;
                const isYou = player?.isCurrentPlayer;

                if (player) {
                  return (
                    <div
                      key={player.address}
                      className={`relative group glass-dark rounded-xl p-3 transition-all hover:bg-white/10 animate-slot-appear ${
                        isYou ? "ring-2 ring-amber-500/50" : ""
                      }`}
                      style={{ animationDelay: `${slotIndex * 100}ms` }}
                    >
                      {/* Badges */}
                      {isHost && (
                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[9px] font-bold uppercase rounded shadow-lg z-10">
                          Host
                        </div>
                      )}
                      {isYou && !isHost && (
                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-white text-black text-[9px] font-bold uppercase rounded shadow-lg z-10">
                          You
                        </div>
                      )}

                      <div className="flex items-center gap-2 w-full">
                        {/* Avatar */}
                        <div className={`relative flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${player.color} p-0.5`}>
                          <div className="w-full h-full rounded-md bg-black/40 overflow-hidden">
                            <Image
                              src={player.image}
                              alt={player.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Ready pulse ring */}
                          <div className="absolute inset-0 rounded-lg border-2 border-emerald-400/50 animate-ready-pulse" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-white font-semibold text-sm truncate">{player.name}</p>
                          <p className="text-white/40 text-xs font-mono truncate">
                            {player.address.slice(0, 4)}...{player.address.slice(-4)}
                          </p>
                        </div>

                        {/* Ready badge */}
                        <div className="flex items-center gap-1 px-1.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex-shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-emerald-400 text-[9px] font-bold uppercase whitespace-nowrap">Ready</span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <button
                      key={`empty-${slotIndex}`}
                      onClick={handleCopyTableId}
                      className="group w-full glass rounded-xl p-3 border-2 border-dashed border-white/10 hover:border-amber-500/30 transition-all animate-slot-appear"
                      style={{ animationDelay: `${slotIndex * 100}ms` }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {/* Empty avatar */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center animate-waiting-pulse">
                          <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 text-left overflow-hidden">
                          <p className="text-white/30 font-medium text-sm truncate">Empty Slot</p>
                          <p className="text-white/20 text-xs group-hover:text-amber-400/60 transition-colors truncate">
                            {copied ? "Link copied!" : "Copy invite link"}
                          </p>
                        </div>

                        {/* Icon */}
                        <svg className="w-4 h-4 flex-shrink-0 text-white/20 group-hover:text-amber-400/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </button>
                  );
                }
              })}
            </div>

            {/* Room ID at bottom */}
            <div className="mt-4 pt-4 border-t border-white/10 flex-shrink-0">
              <button
                onClick={handleCopyTableId}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <span className="text-white/40 text-xs uppercase tracking-wider whitespace-nowrap">Room ID</span>
                  <span className="text-white/80 text-xs font-mono truncate">#{tableId.slice(0, 8).toUpperCase()}</span>
                </div>
                <span className="text-white/40 group-hover:text-white text-xs flex-shrink-0">{copied ? "✓" : "⧉"}</span>
              </button>
            </div>
          </div>

          {/* MOBILE HEADER - Squad Drawer Toggle */}
          <div className="lg:hidden flex-shrink-0 sticky top-0 z-50 glass-dark border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowSquadDrawer(!showSquadDrawer)}
                className="flex items-center gap-3 flex-1"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-white font-semibold">Squad: {playersWithCharacters.length}/5</span>
                </div>
                <svg
                  className={`w-4 h-4 text-white/60 transition-transform ${showSquadDrawer ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={handleCopyTableId}
                className="text-white/60 hover:text-white transition text-xs font-mono flex items-center gap-1.5"
              >
                #{tableId.slice(0, 4).toUpperCase()}
                <span className="text-[10px]">{copied ? "✓" : "⧉"}</span>
              </button>
            </div>

            {/* Mobile Squad Drawer */}
            {showSquadDrawer && (
              <div className="mt-3 pb-2 space-y-2 max-h-[40vh] overflow-y-auto scrollbar-hide">
                {[...Array(5)].map((_, slotIndex) => {
                  const player = playersWithPositions[slotIndex];
                  const isYou = player?.isCurrentPlayer;

                  if (player) {
                    return (
                      <div
                        key={player.address}
                        className={`flex items-center gap-3 p-2 rounded-lg bg-white/5 ${
                          isYou ? "ring-1 ring-amber-500/50" : ""
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${player.color} p-0.5`}>
                          <div className="w-full h-full rounded-md bg-black/40 overflow-hidden">
                            <Image
                              src={player.image}
                              alt={player.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{player.name}</p>
                          <p className="text-white/40 text-xs font-mono">
                            {player.address.slice(0, 4)}...{player.address.slice(-4)}
                          </p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                    );
                  } else {
                    return (
                      <button
                        key={`empty-${slotIndex}`}
                        onClick={handleCopyTableId}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-dashed border-white/10"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                          <span className="text-white/20 text-xs">?</span>
                        </div>
                        <p className="text-white/30 text-sm">Empty - Copy invite link</p>
                      </button>
                    );
                  }
                })}
              </div>
            )}
          </div>

          {/* RIGHT MAIN AREA - Hero Preview + Carousel + Actions */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Table ID Header - Prominent Display */}
            <div className="flex-shrink-0 border-b border-white/10 bg-gradient-to-r from-black/50 via-black/30 to-black/50 backdrop-blur-sm">
              <div className="max-w-5xl mx-auto px-6 py-4 md:py-5">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {/* Lobby Label */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Waiting Lobby</span>
                  </div>

                  {/* Table ID Card */}
                  <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
                    <div className="flex flex-col items-start">
                      <span className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Room Code</span>
                      <span className="text-white font-bold text-lg font-mono tracking-wide">
                        {tableId.slice(0, 4).toUpperCase()}-{tableId.slice(4, 8).toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyTableId}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 transition-all group"
                    >
                      {copied ? (
                        <>
                          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-emerald-400 text-sm font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-amber-400 group-hover:text-amber-300 text-sm font-semibold transition-colors">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Share hint */}
                  <span className="text-white/30 text-xs hidden md:block">Share this code with friends</span>
                </div>
              </div>
            </div>

            {/* Hero Preview Area */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-8 overflow-y-auto">
              <div className="w-full max-w-3xl">
                <CharacterPreview
                character={
                  previewCharacter
                    ? CHARACTERS.find(c => c.id === previewCharacter) || null
                    : playersWithPositions.find(p => p.isCurrentPlayer)?.characterId
                      ? CHARACTERS.find(c => c.id === playersWithPositions.find(p => p.isCurrentPlayer)?.characterId) || null
                      : null
                }
                />
              </div>
            </div>

            {/* Character Carousel + Actions - Fixed at bottom */}
            {isPlayerInTable && (
              <div className="flex-shrink-0 border-t border-white/10 glass-dark p-4 md:p-6">
                <div className="max-w-5xl mx-auto">
                  {/* Section Label */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white/60 text-xs uppercase tracking-wide font-semibold">Select Character</p>
                    <p className="text-white/40 text-xs hidden sm:block">Scroll or click to preview</p>
                  </div>

                  {/* Character Carousel with Snap Scrolling */}
                  <div
                    className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 md:-mx-6 md:px-6 mb-6 scrollbar-hide"
                    style={{
                      scrollSnapType: "x mandatory",
                      scrollPaddingLeft: "1rem",
                      scrollPaddingRight: "1rem",
                      WebkitOverflowScrolling: "touch"
                    }}
                  >
                    {CHARACTERS.map((char) => {
                      const isTaken = takenCharacters.includes(char.id);
                      const isMyCharacter = playersWithPositions.find(p => p.isCurrentPlayer)?.characterId === char.id;
                      const isPreviewing = previewCharacter === char.id;

                      return (
                        <button
                          key={char.id}
                          disabled={isTaken && !isMyCharacter}
                          onMouseEnter={() => !isTaken && setPreviewCharacter(char.id)}
                          onMouseLeave={() => setPreviewCharacter(null)}
                          onClick={() => !isTaken && setPreviewCharacter(char.id)}
                          className={`relative flex-shrink-0 w-24 md:w-28 rounded-xl p-3 transition-all ${
                            isMyCharacter
                              ? `bg-gradient-to-br ${char.color} ring-2 ring-white shadow-xl scale-105`
                              : isPreviewing
                                ? `bg-gradient-to-br ${char.color} scale-105 opacity-80`
                                : isTaken
                                  ? "bg-white/5 opacity-30 cursor-not-allowed grayscale"
                                  : "bg-white/5 hover:bg-white/10 hover:scale-105"
                          }`}
                          style={{ scrollSnapAlign: "start" }}
                        >
                          {/* Taken overlay */}
                          {isTaken && !isMyCharacter && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl z-10">
                              <span className="text-red-400 font-bold text-xs">TAKEN</span>
                            </div>
                          )}

                          {/* Selected checkmark */}
                          {isMyCharacter && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg z-20 animate-ready-pulse">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}

                          {/* Character image */}
                          <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${char.color} p-0.5 mb-2`}>
                            <div className="w-full h-full rounded-md bg-black/40 overflow-hidden">
                              <Image
                                src={char.image}
                                alt={char.name}
                                width={96}
                                height={96}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>

                          {/* Character name */}
                          <span className={`block text-xs font-semibold text-center truncate ${
                            isMyCharacter ? "text-white" : "text-white/70"
                          }`}>
                            {char.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Action Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Player count */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-white font-bold">{playersWithCharacters.length}/5</span>
                        <span className="text-white/40 text-sm">Players</span>
                      </div>
                      {playersWithCharacters.length < 2 && (
                        <span className="text-amber-400/80 text-xs">• Need {2 - playersWithCharacters.length} more</span>
                      )}
                    </div>

                    {/* Start button */}
                    {canStart ? (
                      <button
                        onClick={handleStartGame}
                        disabled={isStarting}
                        className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isStarting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Starting Game...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xl">▶</span>
                            <span>START</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full sm:w-auto px-8 py-3.5 bg-white/10 text-white/40 font-medium rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white/40 rounded-full animate-spin" />
                        <span className="text-sm">Waiting for Players...</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Active game - Russian Roulette Style */
        <div className="relative z-10 min-h-screen flex flex-col lg:flex-row" style={{ background: "radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 100%)" }}>
          {/* Dark gritty background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-900/5 rounded-full blur-[150px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gray-900/20 rounded-full blur-[120px]" />
          </div>

          {/* Main game area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Game header - Round & Pot */}
            <div className="flex-shrink-0 flex justify-center items-center gap-4 pt-4 pb-3 px-4 relative z-50">
              {/* Round counter */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{
                background: "linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%)",
                border: "1px solid rgba(107, 114, 128, 0.3)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
              }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--danger-red)" }} />
                <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Round</span>
                <span className="text-white text-lg font-black">4</span>
              </div>

              {/* Pot */}
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg" style={{
                background: "linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(161, 98, 7, 0.15) 100%)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                boxShadow: "0 0 20px rgba(245, 158, 11, 0.2)"
              }}>
                <span className="text-amber-400/80 text-xs font-bold uppercase">Pot:</span>
                <span className="text-amber-400 text-xl font-black tracking-tight">500</span>
                <span className="text-amber-400/60 text-xs font-semibold">SOL</span>
              </div>

              {/* Table cards count */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                <span className="text-white/40 text-xs">Stake:</span>
                <span className="text-white font-bold">{tableData?.cardsOnTableCount ?? 0}</span>
                <span className="text-white/40 text-xs">cards</span>
              </div>
            </div>

            {/* Main game area - DESKTOP & MOBILE */}
            <div className="flex-1 flex items-center justify-center relative px-4 py-6">
              {/* Dark poker table background */}
              <div className="absolute inset-0" style={{ perspective: "1200px" }}>
                <div className="absolute inset-x-0 bottom-0 h-[50%]" style={{ transform: "rotateX(45deg)" }}>
                  <div className="w-full h-full rounded-[50%]" style={{
                    background: "radial-gradient(ellipse at center, #1F2937 0%, #111827 50%, #0a0a0a 100%)",
                    boxShadow: "inset 0 -20px 40px rgba(0,0,0,0.8), 0 10px 50px rgba(0,0,0,0.5)",
                    border: "2px solid rgba(75, 85, 99, 0.3)"
                  }} />
                </div>
              </div>

              {/* CENTER: TABLE CARD - The main focus */}
              <div className="absolute top-[30%] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg" style={{
                  background: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 0 20px rgba(0,0,0,0.8)"
                }}>
                  <span className="text-white/60 text-xs uppercase tracking-widest font-bold">Table Card</span>
                </div>

                {/* Large table card display */}
                <div style={{
                  transform: "scale(1.2)",
                  filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.9))"
                }}>
                  <GameCard
                    value={getCardValueFromNumber(tableData?.tableCard ?? 0)}
                    isRevealed={true}
                    isSmall={false}
                  />
                </div>

                {/* Cards on table (stake pile) below the table card */}
                <div className="mt-2">
                  <TableCards count={tableData?.cardsOnTableCount ?? 0} />
                </div>
              </div>

              {/* Players around the table with PISTOLS */}
              {playersWithPositions.map((player) => {
                const isCurrentTurn = currentTurnPlayer === player.address;
                const ammo = playerAmmo[player.address] ?? 6;
                const isOut = ammo === 0;

                return (
                  <div
                    key={player.address}
                    className="absolute z-20 hidden lg:flex"
                    style={{
                      top: `${player.top}%`,
                      left: `${player.left}%`,
                      transform: "translate(-50%, -50%)",
                      opacity: isOut ? 0.3 : 1,
                      filter: isOut ? "grayscale(1)" : "none"
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {/* Turn indicator */}
                      {isCurrentTurn && !isOut && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg animate-danger-pulse" style={{
                          background: "linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(153, 27, 27, 0.3) 100%)",
                          border: "1px solid rgba(220, 38, 38, 0.5)",
                          boxShadow: "0 0 15px rgba(220, 38, 38, 0.3)"
                        }}>
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-red-400 text-xs font-black uppercase tracking-wider">Active</span>
                        </div>
                      )}

                      {/* Avatar with gritty border */}
                      <div className="relative p-1 rounded-xl transition-all duration-200" style={{
                        background: isCurrentTurn
                          ? "linear-gradient(135deg, rgba(220, 38, 38, 0.6) 0%, rgba(153, 27, 27, 0.4) 100%)"
                          : player.isCurrentPlayer
                            ? "linear-gradient(135deg, rgba(245, 158, 11, 0.5) 0%, rgba(217, 119, 6, 0.3) 100%)"
                            : "rgba(31, 41, 55, 0.6)",
                        boxShadow: isCurrentTurn ? "0 0 25px rgba(220, 38, 38, 0.5)" : "0 4px 12px rgba(0,0,0,0.6)",
                        border: "2px solid rgba(75, 85, 99, 0.4)"
                      }}>
                        <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${player.color} p-0.5`}>
                          <div className="w-full h-full rounded-md bg-black/50 overflow-hidden">
                            <Image
                              src={player.image}
                              alt={player.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>

                        {/* YOU badge */}
                        {player.isCurrentPlayer && (
                          <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded text-[9px] font-black" style={{
                            background: "linear-gradient(135deg, #FCD34D, #F59E0B)",
                            color: "#000",
                            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.5)"
                          }}>
                            YOU
                          </div>
                        )}

                        {/* ELIMINATED badge */}
                        {isOut && (
                          <div className="absolute inset-0 rounded-xl flex items-center justify-center" style={{
                            background: "rgba(0,0,0,0.8)"
                          }}>
                            <span className="text-red-500 font-black text-xs">OUT</span>
                          </div>
                        )}
                      </div>

                      {/* Name with ammo bullets */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="px-3 py-1 rounded-lg text-xs font-bold" style={{
                          background: isCurrentTurn ? "rgba(220, 38, 38, 0.2)" : "rgba(0,0,0,0.7)",
                          border: `1px solid ${isCurrentTurn ? "rgba(220, 38, 38, 0.4)" : "rgba(255,255,255,0.15)"}`,
                          color: isCurrentTurn ? "#FCA5A5" : "white"
                        }}>
                          {player.name}
                        </div>

                        {/* Ammo bullets - prominent display */}
                        <div className="flex items-center gap-1 px-2 py-1 rounded" style={{
                          background: "rgba(0,0,0,0.8)",
                          border: "1px solid rgba(255, 215, 0, 0.2)"
                        }}>
                          <AmmoIndicator ammo={ammo} maxAmmo={6} size="medium" showCount />
                        </div>
                      </div>

                      {/* Small pistol icon for each player */}
                      <div className="mt-1">
                        <Pistol ammo={ammo} maxAmmo={6} size="small" />
                      </div>

                      {/* Opponent cards */}
                      {!player.isCurrentPlayer && !isOut && (
                        <div className="mt-2">
                          <CardBack count={5} isSmall />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Mobile: Players displayed as horizontal strip at top */}
              <div className="lg:hidden absolute top-4 left-0 right-0 z-20 px-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {playersWithPositions.map((player) => {
                    const isCurrentTurn = currentTurnPlayer === player.address;
                    const ammo = playerAmmo[player.address] ?? 6;
                    const isOut = ammo === 0;

                    return (
                      <div
                        key={player.address}
                        className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg" style={{
                          background: isCurrentTurn
                            ? "rgba(220, 38, 38, 0.2)"
                            : "rgba(0,0,0,0.6)",
                          border: `1px solid ${isCurrentTurn ? "rgba(220, 38, 38, 0.5)" : "rgba(255,255,255,0.1)"}`,
                          opacity: isOut ? 0.4 : 1,
                          minWidth: "70px"
                        }}
                      >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${player.color} p-0.5 relative`}>
                          <div className="w-full h-full rounded-md bg-black/40 overflow-hidden">
                            <Image
                              src={player.image}
                              alt={player.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {player.isCurrentPlayer && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{
                              background: "#F59E0B"
                            }} />
                          )}
                        </div>

                        {/* Name */}
                        <span className="text-[9px] font-bold text-white/80 truncate max-w-[60px]">
                          {player.name}
                        </span>

                        {/* Ammo */}
                        <AmmoIndicator ammo={ammo} maxAmmo={6} size="small" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Log - Desktop Only */}
          <div className="hidden lg:flex w-80 flex-col p-4">
            <ActionLog actions={gameActions} maxVisible={12} className="h-full" />
          </div>

          {/* Player's hand at bottom with Pistol and actions */}
          {isPlayerInTable && (
            <div className="fixed bottom-0 left-0 right-0 z-40 flex">
              {/* Pistol - Desktop Only - MORE PROMINENT */}
              <div className="hidden lg:flex flex-col items-center justify-center w-72 p-6 gap-3" style={{
                background: "linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 100%)",
                borderTop: "1px solid rgba(75, 85, 99, 0.3)",
                borderRight: "1px solid rgba(75, 85, 99, 0.2)"
              }}>
                <div className="text-center">
                  <span className="text-white/40 text-xs uppercase tracking-widest font-bold block mb-1">Your Weapon</span>
                  <span className="text-red-400 text-[10px] uppercase font-semibold">Pull the trigger carefully...</span>
                </div>
                <Pistol
                  ammo={playerAmmo[publicKey?.toString() || ""] ?? 6}
                  maxAmmo={6}
                  isSpinning={pistolSpinning}
                  isFiring={pistolFiring}
                  size="large"
                />
                <div className="text-center px-4 py-2 rounded-lg" style={{
                  background: "rgba(220, 38, 38, 0.1)",
                  border: "1px solid rgba(220, 38, 38, 0.3)"
                }}>
                  <span className="text-red-400/80 text-[10px] font-semibold">
                    {playerAmmo[publicKey?.toString() || ""] ?? 6} bullets remaining
                  </span>
                </div>
              </div>

              {/* Player Hand */}
              <div className="flex-1">
                <PlayerHand
                  cards={getPlayerCardsForDisplay()}
                  tableCard={tableData?.tableCard ?? 0}
                  isMyTurn={isMyTurn ?? false}
                  tableCardsCount={tableData?.cardsOnTableCount ?? 0}
                  onPlayCards={async (indices) => {
                    console.log("Playing cards at indices:", indices);
                    setIsPlayingCards(true);
                    try {
                      // TODO: Implement placeCards transaction
                      // The indices array contains zero-based positions of selected cards
                      // e.g., [0, 2, 4] means playing cards at positions 0, 2, and 4
                    } finally {
                      setIsPlayingCards(false);
                    }
                  }}
                  onCallLiar={async () => {
                    console.log("Calling Liar!");
                    setIsCallingLiar(true);
                    setPistolSpinning(true);
                    try {
                      // TODO: Implement callLiar transaction
                      // Simulate pistol spin and fire
                      setTimeout(() => {
                        setPistolSpinning(false);
                        setPistolFiring(true);
                        setTimeout(() => setPistolFiring(false), 500);
                      }, 600);
                    } finally {
                      setIsCallingLiar(false);
                    }
                  }}
                  isPlaying={isPlayingCards}
                  isCallingLiar={isCallingLiar}
                  disabled={isDecryptingCards}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
