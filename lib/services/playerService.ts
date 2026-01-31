/**
 * Player Service
 *
 * Pure business logic for player-related operations
 * No React hooks, no UI logic - just data transformations
 */

interface Position {
  top: number;
  left: number;
}

interface PlayerInfo {
  address: string;
  characterId: string;
}

interface DisplayPlayer {
  address: string;
  characterId: string;
  name: string;
  image: string;
  color: string;
  top: number;
  left: number;
  isCurrentPlayer: boolean;
  isHost: boolean;
}

// Character mapping (could be moved to constants)
const CHARACTER_MAP: Record<string, { name: string; image: string; color: string }> = {
  bull: { name: "Bull", image: "/charactres/bull.png", color: "from-red-500 to-rose-600" },
  cat: { name: "Cat", image: "/charactres/cat.png", color: "from-violet-500 to-purple-600" },
  dog: { name: "Dog", image: "/charactres/dog.png", color: "from-amber-400 to-orange-500" },
  lion: { name: "Lion", image: "/charactres/lions.png", color: "from-yellow-400 to-amber-500" },
  pig: { name: "Pig", image: "/charactres/pig.png", color: "from-pink-400 to-rose-500" },
  rabbit: { name: "Rabbit", image: "/charactres/rabbit.png", color: "from-slate-300 to-slate-500" },
  wolf: { name: "Wolf", image: "/charactres/wolf.png", color: "from-slate-400 to-slate-600" },
};

export const playerService = {
  /**
   * Calculate circular positions for players around a table
   * @param playerCount - Total number of players
   * @param currentPlayerIndex - Index of the current player (will be positioned at bottom)
   * @returns Array of positions with top and left percentages
   */
  calculatePlayerPositions(
    playerCount: number,
    currentPlayerIndex: number
  ): Position[] {
    // Table center and radius
    const centerTop = 56.5;
    const centerLeft = 50;
    const radiusY = 13.5;
    const radiusX = 30;

    const positions: Position[] = [];
    const angleStep = (2 * Math.PI) / playerCount;
    const startAngle = (3 * Math.PI) / 2; // Start at bottom

    for (let i = 0; i < playerCount; i++) {
      // Rotate positions so current player is at bottom
      const posIndex = (i - currentPlayerIndex + playerCount) % playerCount;
      const angle = startAngle + posIndex * angleStep;

      const top = centerTop - radiusY * Math.sin(angle);
      const left = centerLeft + radiusX * Math.cos(angle);

      positions.push({
        top: Math.round(top),
        left: Math.round(left),
      });
    }

    return positions;
  },

  /**
   * Transform raw player data into display-ready format
   * @param players - Array of player addresses
   * @param playerInfos - Array of player info with character data
   * @param currentPlayerAddress - Address of the current user
   * @returns Array of display-ready player objects with positions
   */
  transformPlayersForDisplay(
    players: string[],
    playerInfos: PlayerInfo[],
    currentPlayerAddress?: string
  ): DisplayPlayer[] {
    // Find current player index for position calculation
    const currentPlayerIndex = currentPlayerAddress
      ? players.findIndex((p) => p === currentPlayerAddress)
      : 0;

    // Calculate positions
    const positions = this.calculatePlayerPositions(
      playerInfos.length,
      Math.max(currentPlayerIndex, 0)
    );

    // Transform players with positions
    return playerInfos.map((playerInfo, index) => {
      const character = playerInfo.characterId
        ? CHARACTER_MAP[playerInfo.characterId]
        : null;
      const position = positions[index] || { top: 50, left: 50 };

      return {
        address: playerInfo.address,
        characterId: playerInfo.characterId,
        name: character?.name || "Unknown",
        image: character?.image || "/charactres/bull.png",
        color: character?.color || "from-gray-500 to-gray-700",
        top: position.top,
        left: position.left,
        isCurrentPlayer: playerInfo.address === currentPlayerAddress,
        isHost: index === 0, // First player is host
      };
    });
  },

  /**
   * Get character information by ID
   * @param characterId - Character ID
   * @returns Character information or null
   */
  getCharacterInfo(characterId: string) {
    return CHARACTER_MAP[characterId] || null;
  },

  /**
   * Check if a character is taken
   * @param characterId - Character ID to check
   * @param takenCharacters - Array of taken character IDs
   * @returns True if character is taken
   */
  isCharacterTaken(characterId: string, takenCharacters: string[]): boolean {
    return takenCharacters.includes(characterId);
  },

  /**
   * Get available characters
   * @param takenCharacters - Array of taken character IDs
   * @returns Array of available character IDs
   */
  getAvailableCharacters(takenCharacters: string[]): string[] {
    return Object.keys(CHARACTER_MAP).filter(
      (id) => !takenCharacters.includes(id)
    );
  },
};
