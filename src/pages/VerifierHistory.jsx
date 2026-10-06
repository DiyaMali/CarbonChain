import React from "react";
import { Clock } from "lucide-react";

/**
 * Stub page for Verifier Review History — Phase 1 placeholder.
 * Full implementation: Phase 4.
 */
export default function VerifierHistory() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-lg font-semibold text-gray-900 mb-2">Review History</h1>
      <p className="text-sm text-gray-500 mb-6">
        All past approvals and rejections with ledger links.
      </p>
      <div className="flex items-center gap-3 px-4 py-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>Full review history — implemented in Phase 4.</span>
      </div>
    </div>
  );
}
