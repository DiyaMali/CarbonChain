import React from "react";
import { isContractConfigured } from "../config/contract";

/**
 * Shown on public pages when the real on-chain contract is not yet set up.
 * Hidden in CarbonChain Ledger mode (USE_DEMO_LEDGER=true).
 * Never uses the word "demo" or "simulated" in user-facing copy.
 */
export default function PlaceholderBanner() {
  if (isContractConfigured()) return null;

  return (
    <div className="bg-forest-light border-b border-forest/20 px-4 py-2 text-forest text-xs no-print">
      <div className="max-w-7xl mx-auto flex items-center gap-2">
        <span className="font-semibold">CarbonChain Ledger:</span>
        <span>SHA-256 hash-chained, tamper-evident records. On-chain settlement requires a deployed contract address.</span>
      </div>
    </div>
  );
}
