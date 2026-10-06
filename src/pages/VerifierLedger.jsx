import React from "react";
import { useAuth } from "../context/AuthContext";
import { isVerifierUser } from "../services/roleService";
import LedgerBlock from "./LedgerBlock";

/**
 * Verifier Ledger page  -  wraps the existing LedgerBlock/Transactions page.
 * Mounted at /verifier/ledger (verifier only).
 */
export default function VerifierLedger() {
  return (
    <div className="p-0">
      <LedgerBlock />
    </div>
  );
}
