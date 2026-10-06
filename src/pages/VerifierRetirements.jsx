import React from "react";
import { Clock } from "lucide-react";

/**
 * Stub page for Retirement Requests — Phase 1 placeholder.
 * Full implementation: Phase 4 (verifier) and Phase 6 (retirement flow).
 */
export default function VerifierRetirements() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-lg font-semibold text-gray-900 mb-2">Retirement Requests</h1>
      <p className="text-sm text-gray-500 mb-6">
        Buyer retirement requests pending your review will appear here.
      </p>
      <div className="flex items-center gap-3 px-4 py-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>Full retirement review queue — implemented in Phase 6.</span>
      </div>
    </div>
  );
}
