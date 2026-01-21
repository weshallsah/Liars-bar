"use client";

import { PokerTable } from "@/components/PokerTable";

export default function TablePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="relative z-10 w-full px-4">
        <PokerTable />
      </div>
    </div>
  );
}
