# Architecture & Code Organization

## Overview

This document outlines the separation of concerns between UI and business logic in the Liar's Bet application.

## Folder Structure

```
liers-bet/
├── app/                      # Next.js pages (routing only)
│   ├── page.tsx             # Home page (thin wrapper)
│   └── table/
│       └── [tableId]/
│           └── page.tsx     # Table page (thin wrapper)
├── components/
│   ├── ui/                  # Pure UI components (presentational)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── features/            # Feature-specific components
│   │   ├── lobby/
│   │   │   ├── LobbyView.tsx          # UI only
│   │   │   ├── LobbyContainer.tsx     # Logic connector
│   │   │   └── PlayerSlot.tsx         # UI only
│   │   ├── game/
│   │   │   ├── GameView.tsx           # UI only
│   │   │   ├── GameContainer.tsx      # Logic connector
│   │   │   └── PlayerHand.tsx         # Already exists
│   │   └── wallet/
│   │       ├── WalletButton.tsx       # UI only
│   │       └── WalletContainer.tsx    # Logic connector
│   └── layout/              # Layout components
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/
│   ├── hooks/               # Custom hooks (business logic)
│   │   ├── useWalletBalance.ts
│   │   ├── useLobbyState.ts
│   │   ├── useGameState.ts
│   │   └── solana/
│   │       ├── useCreateTable.ts      # Already exists
│   │       ├── useTable.ts            # Already exists
│   │       └── useIncoRandom.ts       # Already exists
│   ├── services/            # Business logic services
│   │   ├── gameService.ts
│   │   ├── playerService.ts
│   │   └── cardService.ts
│   ├── utils/               # Pure utility functions
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   └── calculations.ts
│   └── types/               # TypeScript types
│       ├── game.ts
│       ├── player.ts
│       └── table.ts
└── constants/               # App constants
    └── game.ts
```

## Separation Principles

### 1. Presentational Components (UI)

**Location**: `components/ui/` and `components/features/*/`

**Purpose**: Pure display logic, no business logic

**Characteristics**:
- Receive data via props
- Emit events via callbacks
- No direct API calls or state management
- No Solana/blockchain logic
- Reusable and testable

**Example**:
```tsx
// components/features/lobby/PlayerSlot.tsx
interface PlayerSlotProps {
  player?: {
    name: string;
    image: string;
    address: string;
  };
  isHost?: boolean;
  isYou?: boolean;
  isEmpty?: boolean;
  onCopyInvite?: () => void;
}

export function PlayerSlot({ player, isHost, isYou, isEmpty, onCopyInvite }: PlayerSlotProps) {
  // Only UI logic here
  return (
    <div className="player-slot">
      {/* Pure UI rendering */}
    </div>
  );
}
```

### 2. Container Components

**Location**: `components/features/*/**Container.tsx`

**Purpose**: Connect UI to business logic

**Characteristics**:
- Use custom hooks for data/logic
- Transform data for UI components
- Handle user interactions
- Minimal UI rendering

**Example**:
```tsx
// components/features/lobby/LobbyContainer.tsx
export function LobbyContainer({ tableId }: { tableId: string }) {
  // Business logic hooks
  const { players, isHost } = useLobbyState(tableId);
  const { copyTableId, copied } = useClipboard();

  // Data transformation
  const playersWithInfo = useMemo(() =>
    transformPlayersForDisplay(players),
    [players]
  );

  // Event handlers
  const handleCopyInvite = () => copyTableId(tableId);

  // Render presentational component
  return (
    <LobbyView
      players={playersWithInfo}
      isHost={isHost}
      onCopyInvite={handleCopyInvite}
      copied={copied}
    />
  );
}
```

### 3. Custom Hooks

**Location**: `lib/hooks/`

**Purpose**: Encapsulate business logic and state

**Characteristics**:
- Manage state
- Handle side effects
- Call services/APIs
- Return data and functions
- Reusable across components

**Example**:
```tsx
// lib/hooks/useWalletBalance.ts
export function useWalletBalance() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  return { balance, isLoading: balance === null };
}
```

### 4. Services

**Location**: `lib/services/`

**Purpose**: Pure business logic functions

**Characteristics**:
- No React hooks
- No component logic
- Testable pure functions
- Single responsibility

**Example**:
```typescript
// lib/services/playerService.ts
export const playerService = {
  transformPlayersForDisplay(
    players: string[],
    playerInfos: PlayerInfo[],
    currentPlayerAddress?: string
  ): DisplayPlayer[] {
    return players.map((address, index) => {
      const info = playerInfos.find(p => p.address === address);
      const character = info?.characterId ? CHARACTER_MAP[info.characterId] : null;

      return {
        address,
        name: character?.name || `Player ${index + 1}`,
        image: character?.image || DEFAULT_IMAGE,
        color: character?.color || DEFAULT_COLOR,
        isCurrentPlayer: address === currentPlayerAddress,
        isHost: index === 0,
      };
    });
  },

  calculatePlayerPositions(
    playerCount: number,
    currentPlayerIndex: number
  ): Position[] {
    // Position calculation logic
    const positions: Position[] = [];
    // ... calculations
    return positions;
  },
};
```

### 5. Utilities

**Location**: `lib/utils/`

**Purpose**: Helper functions

**Characteristics**:
- Pure functions
- No side effects
- Single purpose
- Highly reusable

**Example**:
```typescript
// lib/utils/formatting.ts
export const formatters = {
  shortenAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  },

  formatBalance(balance: number, decimals = 2): string {
    return balance.toFixed(decimals);
  },

  formatTableId(tableId: string): string {
    return `${tableId.slice(0, 4).toUpperCase()}-${tableId.slice(4, 8).toUpperCase()}`;
  },
};
```

## Benefits of This Architecture

### 1. **Testability**
- Pure functions easy to test
- Components can be tested in isolation
- Mock hooks for testing containers

### 2. **Reusability**
- UI components reusable across pages
- Hooks shareable between features
- Services usable anywhere

### 3. **Maintainability**
- Clear separation of concerns
- Easy to locate code
- Changes isolated to specific layers

### 4. **Type Safety**
- TypeScript types in one place
- Consistent interfaces
- Better IDE support

### 5. **Performance**
- Memoization easier to implement
- Selective re-renders
- Code splitting friendly

## Migration Strategy

### Phase 1: Extract Services & Utils
1. Create utility functions
2. Move pure logic to services
3. Add TypeScript types

### Phase 2: Create Custom Hooks
1. Extract state management from components
2. Create hooks for repeated logic
3. Move API calls to hooks

### Phase 3: Refactor Components
1. Create presentational components
2. Build container components
3. Update page components to use containers

### Phase 4: Optimize
1. Add memoization
2. Implement code splitting
3. Performance testing

## Examples

See the following files for concrete examples:
- `lib/hooks/useWalletBalance.example.ts`
- `lib/services/playerService.example.ts`
- `components/features/lobby/LobbyContainer.example.tsx`
- `components/features/lobby/LobbyView.example.tsx`

## Best Practices

1. **Keep components small** - Single responsibility
2. **Prop drilling** - Use context for deep props
3. **Memoization** - Use `useMemo` and `useCallback` wisely
4. **Type everything** - Full TypeScript coverage
5. **Error boundaries** - Handle errors gracefully
6. **Loading states** - Always show feedback
7. **Accessibility** - ARIA labels and keyboard support

## Resources

- [React Design Patterns](https://reactpatterns.com/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Next.js Best Practices](https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts)
