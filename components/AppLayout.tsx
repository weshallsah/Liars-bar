"use client";

import { ReactNode } from "react";
import { WalletStatus } from "./WalletStatus";

interface Props {
  children: ReactNode;
}

export function AppLayout({ children }: Props) {
  return (
    <>
      {children}
      <WalletStatus />
    </>
  );
}
