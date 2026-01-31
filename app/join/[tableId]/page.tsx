"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CharacterSelect, CHARACTERS } from "@/components/CharacterSelect";
import { CharacterPreview } from "@/components/CharacterPreview";
import { useTable } from "@/lib/solana/useTable";

const CHARACTER_MAP: Record<string, { name: string; image: string; color: string }> = {
  bull: { name: "Bull", image: "/charactres/bull.png", color: "from-red-500 to-rose-600" },
  cat: { name: "Cat", image: "/charactres/cat.png", color: "from-violet-500 to-purple-600" },
  dog: { name: "Dog", image: "/charactres/dog.png", color: "from-amber-400 to-orange-500" },
  lion: { name: "Lion", image: "/charactres/lions.png", color: "from-yellow-400 to-amber-500" },
  pig: { name: "Pig", image: "/charactres/pig.png", color: "from-pink-400 to-rose-500" },
  rabbit: { name: "Rabbit", image: "/charactres/rabbit.png", color: "from-slate-300 to-slate-500" },
  wolf: { name: "Wolf", image: "/charactres/wolf.png", color: "from-slate-400 to-slate-600" },
};

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [previewCharacter, setPreviewCharacter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

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
  } = useTable(tableId);

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
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  // Redirect to table page when game starts
  useEffect(() => {
    if (gameState === "playing") {
      router.push(`/table/${tableId}`);
    }
  }, [gameState, router, tableId]);

  const playersWithCharacters = tableData?.playerInfos.filter(p => p.characterId) ?? [];

  const playersWithPositions = playersWithCharacters.map((playerInfo, index) => {
    const character = playerInfo.characterId ? CHARACTER_MAP[playerInfo.characterId] : null;

    return {
      address: playerInfo.address,
      characterId: playerInfo.characterId,
      name: character?.name || "Unknown",
      image: character?.image || "/charactres/bull.png",
      color: character?.color || "from-gray-500 to-gray-700",
      isCurrentPlayer: playerInfo.address === publicKey?.toString(),
    };
  });

  const handleJoin = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    if (!selectedCharacter) return;
    console.log("Attempting to join table with character:", selectedCharacter);
    const success = await joinTable(selectedCharacter);
    console.log("Join result:", success);
    console.log("Current isPlayerInTable:", isPlayerInTable);
    console.log("Current tableData:", tableData);
    if (success) {
      setSelectedCharacter(null);
      console.log("Join successful, should transition to waiting lobby");
    } else {
      console.log("Join failed");
    }
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

  // Error - Table not found
  if (error && !tableData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-red-500 text-2xl">✕</span>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Table Not Found</h2>
          <p className="text-white/50 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="inline-block px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Character selection (pre-join view)
  console.log("Rendering check - isPlayerInTable:", isPlayerInTable, "isOpen:", tableData?.isOpen, "gameState:", gameState);
  if (!isPlayerInTable && tableData?.isOpen) {
    console.log("Showing character selection screen");
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px]" />

        {/* Top Right - Account Info */}
        {connected && publicKey && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 px-4 py-2 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">◎</span>
              </div>
              <span className="text-white font-medium">
                {balance !== null ? balance.toFixed(3) : "..."} SOL
              </span>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 px-4 py-2">
              <span className="text-white/60 font-mono text-sm">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </span>
            </div>
          </div>
        )}

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

  // Waiting lobby (after joining, before game starts)
  if (isPlayerInTable && gameState === "lobby") {
    console.log("Showing waiting lobby screen");
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        {/* Top Right - Account Info */}
        {connected && publicKey && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 px-4 py-2 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">◎</span>
              </div>
              <span className="text-white font-medium">
                {balance !== null ? balance.toFixed(3) : "..."} SOL
              </span>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 px-4 py-2">
              <span className="text-white/60 font-mono text-sm">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </span>
            </div>
          </div>
        )}

        <div className="relative z-10 min-h-screen flex flex-col p-6">
          {/* Table ID Header */}
          <div className="flex-shrink-0 border-b border-white/10 bg-gradient-to-r from-black/50 via-black/30 to-black/50 backdrop-blur-sm mb-6">
            <div className="max-w-5xl mx-auto px-6 py-4 md:py-5">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Waiting Lobby</span>
                </div>

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

                <span className="text-white/30 text-xs hidden md:block">Share this code with friends</span>
              </div>
            </div>
          </div>

          {/* Hero Preview Area */}
          <div className="flex-1 flex items-center justify-center mb-6">
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

          {/* Character Carousel + Actions */}
          <div className="flex-shrink-0 border-t border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/60 text-xs uppercase tracking-wide font-semibold">Your Character</p>
                <p className="text-white/40 text-xs hidden sm:block">Hover to preview</p>
              </div>

              {/* Character Carousel */}
              <div
                className="flex gap-3 overflow-x-auto pb-3 mb-6 scrollbar-hide"
                style={{
                  scrollSnapType: "x mandatory",
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
                      {isTaken && !isMyCharacter && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl z-10">
                          <span className="text-red-400 font-bold text-xs">TAKEN</span>
                        </div>
                      )}

                      {isMyCharacter && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg z-20">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

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
                        <span>START GAME</span>
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
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60">Loading...</p>
      </div>
    </div>
  );
}
