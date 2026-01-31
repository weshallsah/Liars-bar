/**
 * WalletButton - Presentational Component
 *
 * Pure UI component for displaying wallet connection status
 * No business logic - only receives data and emits events
 */

interface WalletButtonProps {
  // State
  isConnected: boolean;
  address?: string;
  balance?: number;
  showDropdown?: boolean;

  // Callbacks
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleDropdown: () => void;

  // UI Props
  className?: string;
}

export function WalletButton({
  isConnected,
  address,
  balance,
  showDropdown = false,
  onConnect,
  onDisconnect,
  onToggleDropdown,
  className = "",
}: WalletButtonProps) {
  // Helper for display (pure function, could also be in utils)
  const shortenAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full sm:rounded-lg bg-white text-black font-semibold text-xs sm:text-sm hover:bg-white/90 transition-colors ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span className="hidden xs:inline">Connect</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Desktop: Separate balance display */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-white font-semibold text-sm">
            {balance !== undefined ? balance.toFixed(2) : "0.00"}
          </span>
          <span className="text-white/50 text-sm">SOL</span>
        </div>

        {/* Wallet Pill Button - Compact on mobile, expanded on desktop */}
        <button
          onClick={onToggleDropdown}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-full sm:rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          {/* Mobile: Show compact pill with balance */}
          <span className="md:hidden text-white/80 text-xs sm:text-sm font-mono">
            {address && shortenAddress(address)}
            <span className="text-white/50 ml-1.5">|</span>
            <span className="text-amber-400 ml-1.5">
              {balance !== undefined ? balance.toFixed(1) : "0.0"}
            </span>
          </span>
          {/* Desktop: Show just address */}
          <span className="hidden md:inline text-white/80 text-sm font-mono">
            {address && shortenAddress(address)}
          </span>
          <svg
            className={`w-3 h-3 sm:w-4 sm:h-4 text-white/50 transition-transform flex-shrink-0 ${
              showDropdown ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={onToggleDropdown} />
            <div className="absolute right-0 top-full mt-2 z-50 w-48 py-1 rounded-lg bg-[#111827] border border-white/10 shadow-xl">
              {/* Mobile: Show full balance in dropdown */}
              <div className="md:hidden px-4 py-2 border-b border-white/10">
                <span className="text-white/50 text-xs">Balance</span>
                <div className="text-white font-semibold">
                  {balance !== undefined ? balance.toFixed(4) : "0.0000"} SOL
                </div>
              </div>
              <button
                onClick={onDisconnect}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="text-sm font-medium">Disconnect</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
