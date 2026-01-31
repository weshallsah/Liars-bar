/**
 * WalletContainer - Container Component
 *
 * Connects presentational component to business logic
 * Manages state, handles events, transforms data
 */

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWalletBalance } from "@/lib/hooks/useWalletBalance";
import { WalletButton } from "./WalletButton";

interface WalletContainerProps {
  className?: string;
}

export function WalletContainer({ className }: WalletContainerProps) {
  // Business logic hooks
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { balance } = useWalletBalance();

  // UI state
  const [showDropdown, setShowDropdown] = useState(false);

  // Event handlers
  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  const handleToggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  // Render presentational component with all props
  return (
    <WalletButton
      isConnected={connected && !!publicKey}
      address={publicKey?.toString()}
      balance={balance ?? undefined}
      showDropdown={showDropdown}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      onToggleDropdown={handleToggleDropdown}
      className={className}
    />
  );
}
