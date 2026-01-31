# Migration Guide

## How to Refactor Your Existing Code

This guide shows step-by-step how to refactor existing components to follow the new architecture.

## Example: Refactoring the Home Page

### Before (Mixed UI and Logic)

```tsx
// app/page.tsx - BEFORE
export default function Home() {
  const router = useRouter();
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [showJoinInput, setShowJoinInput] = useState(false);
  const [tableId, setTableId] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch balance
  useEffect(() => {
    if (!publicKey || !connected) return;

    const fetchBalance = async () => {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connected, connection]);

  const shortenAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div>
      {/* Lots of UI code mixed with logic */}
    </div>
  );
}
```

### After (Separated)

```tsx
// app/page.tsx - AFTER (thin wrapper)
import { HomeContainer } from "@/components/features/home/HomeContainer";

export default function Home() {
  return <HomeContainer />;
}
```

```tsx
// components/features/home/HomeContainer.tsx - Container
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateTable } from "@/lib/solana/useCreateTable";
import { useWalletBalance } from "@/lib/hooks/useWalletBalance";
import { HomeView } from "./HomeView";

export function HomeContainer() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { balance } = useWalletBalance();

  const { createTable, isLoading, error } = useCreateTable((tableId) => {
    router.push(`/table/${tableId}`);
  });

  const handleCreateTable = async () => {
    if (!connected) return;
    await createTable();
  };

  const handleJoinTable = (tableId: string) => {
    router.push(`/table/${tableId}`);
  };

  return (
    <HomeView
      isConnected={connected && !!publicKey}
      balance={balance}
      isCreating={isLoading}
      error={error}
      onCreateTable={handleCreateTable}
      onJoinTable={handleJoinTable}
    />
  );
}
```

```tsx
// components/features/home/HomeView.tsx - Presentational
import { useState } from "react";
import { WalletContainer } from "../wallet/WalletContainer";
import { shortenAddress, formatBalance } from "@/lib/utils/formatting";

interface HomeViewProps {
  isConnected: boolean;
  balance: number | null;
  isCreating: boolean;
  error: string | null;
  onCreateTable: () => void;
  onJoinTable: (tableId: string) => void;
}

export function HomeView({
  isConnected,
  balance,
  isCreating,
  error,
  onCreateTable,
  onJoinTable,
}: HomeViewProps) {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [tableId, setTableId] = useState("");

  const handleJoin = () => {
    if (!tableId.trim()) return;
    onJoinTable(tableId.trim());
  };

  return (
    <div className="min-h-screen bg-[#030712]">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-black font-black text-sm">LB</span>
          </div>
          <span className="text-white font-bold text-lg">Liar's Bar</span>
        </div>

        <WalletContainer />
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-3">
              Liar's Bar
            </h1>
            <p className="text-white/50">
              A game of deception and strategy
            </p>
          </div>

          {!showJoinInput ? (
            <div className="space-y-4">
              <button
                onClick={onCreateTable}
                disabled={!isConnected || isCreating}
                className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create Table"}
              </button>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-4 py-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-sm font-medium">OR</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                onClick={() => setShowJoinInput(true)}
                className="w-full py-4 px-6 rounded-xl font-semibold text-lg text-white border border-white/20 hover:bg-white/5"
              >
                Join Table
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                placeholder="Enter table ID..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />

              <div className="flex gap-3">
                <button
                  onClick={handleJoin}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-black"
                >
                  Join
                </button>
                <button
                  onClick={() => {
                    setShowJoinInput(false);
                    setTableId("");
                  }}
                  className="py-3 px-6 rounded-xl font-medium text-white/70 bg-white/5 border border-white/10"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```

## Step-by-Step Refactoring Process

### Step 1: Identify Logic to Extract

Look for:
- `useEffect` hooks doing data fetching
- Functions that transform data
- Complex calculations
- State management
- API calls

### Step 2: Create Utility Functions

Extract pure functions:

```typescript
// Before - in component
const shortenAddress = (address: string) =>
  `${address.slice(0, 4)}...${address.slice(-4)}`;

// After - in lib/utils/formatting.ts
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
```

### Step 3: Create Custom Hooks

Extract state and effects:

```typescript
// Before - in component
const [balance, setBalance] = useState<number | null>(null);

useEffect(() => {
  if (!publicKey) return;
  const fetchBalance = async () => {
    const bal = await connection.getBalance(publicKey);
    setBalance(bal / LAMPORTS_PER_SOL);
  };
  fetchBalance();
  const interval = setInterval(fetchBalance, 10000);
  return () => clearInterval(interval);
}, [publicKey, connection]);

// After - in lib/hooks/useWalletBalance.ts
export function useWalletBalance() {
  // ... hook implementation
  return { balance, isLoading, error };
}
```

### Step 4: Create Presentational Component

Extract UI:

```tsx
// Extract all JSX and props
interface HomeViewProps {
  isConnected: boolean;
  balance: number | null;
  onCreateTable: () => void;
  onJoinTable: (tableId: string) => void;
}

export function HomeView({ isConnected, balance, onCreateTable, onJoinTable }: HomeViewProps) {
  return <div>{/* UI only */}</div>;
}
```

### Step 5: Create Container Component

Connect logic to UI:

```tsx
export function HomeContainer() {
  // Use hooks
  const { balance } = useWalletBalance();
  const { createTable } = useCreateTable();

  // Transform data
  // Handle events

  // Render presentational component
  return <HomeView {...props} />;
}
```

### Step 6: Update Page Component

```tsx
// app/page.tsx
import { HomeContainer } from "@/components/features/home/HomeContainer";

export default function Home() {
  return <HomeContainer />;
}
```

## Common Patterns

### Pattern 1: Data Fetching

```typescript
// ❌ Don't do this in components
useEffect(() => {
  fetch('/api/data')
    .then(res => res.json())
    .then(setData);
}, []);

// ✅ Do this in a custom hook
export function useData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);
  return { data };
}
```

### Pattern 2: Event Handlers

```tsx
// ❌ Don't define complex logic inline
<button onClick={() => {
  const result = complexCalculation(data);
  if (result.valid) {
    setData(result.value);
    router.push('/next');
  }
}}>
  Click
</button>

// ✅ Define in container, pass to presentational
function Container() {
  const handleClick = () => {
    const result = complexCalculation(data);
    if (result.valid) {
      setData(result.value);
      router.push('/next');
    }
  };

  return <View onButtonClick={handleClick} />;
}
```

### Pattern 3: Data Transformation

```tsx
// ❌ Don't transform in render
function Component({ players }) {
  return (
    <div>
      {players.map(p => {
        const character = CHARACTER_MAP[p.characterId];
        return <PlayerCard name={character.name} />;
      })}
    </div>
  );
}

// ✅ Transform in container or service
function Container({ players }) {
  const displayPlayers = useMemo(() =>
    playerService.transformPlayersForDisplay(players),
    [players]
  );

  return <View players={displayPlayers} />;
}
```

## Testing Benefits

With separated code, testing becomes easier:

```typescript
// Test pure functions
describe('formatters', () => {
  it('shortens addresses correctly', () => {
    expect(shortenAddress('abcdefgh', 2)).toBe('ab...gh');
  });
});

// Test services
describe('playerService', () => {
  it('calculates positions correctly', () => {
    const positions = playerService.calculatePlayerPositions(4, 0);
    expect(positions).toHaveLength(4);
  });
});

// Test presentational components
describe('HomeView', () => {
  it('displays create button', () => {
    render(<HomeView isConnected={true} onCreateTable={() => {}} />);
    expect(screen.getByText('Create Table')).toBeInTheDocument();
  });
});
```

## Next Steps

1. Start with utility functions - easiest to extract
2. Move to custom hooks - extract state management
3. Create presentational components - extract UI
4. Build containers - connect everything
5. Update pages - use containers

## Questions?

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full architecture overview.
