import React from "react";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, X } from "lucide-react";
import { EXPLORER } from "../config/contract";

export default function TxStatusModal({ txState, onClose }) {
  if (!txState || !txState.status || txState.status === "IDLE") {
    return null;
  }

  const { status, message, txHash, explorerUrl, errorType, switchNetwork } = txState;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-gray-200 rounded p-6 max-w-md w-full shadow-lg relative">
        {/* Close Button when finished */}
        {(status === "SUCCESS" || status === "ERROR") && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-charcoal p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Content per status */}
        {status === "WAITING_WALLET" && (
          <div className="text-center py-4 space-y-3">
            <Loader2 className="w-9 h-9 text-forest animate-spin mx-auto" />
            <h3 className="text-base font-semibold text-charcoal">
              Waiting for wallet confirmation
            </h3>
            <p className="text-xs text-charcoal-muted max-w-xs mx-auto">
              Please check your MetaMask prompt and confirm the transaction.
            </p>
          </div>
        )}

        {status === "CONFIRMING" && (
          <div className="text-center py-4 space-y-3">
            <Loader2 className="w-9 h-9 text-forest animate-spin mx-auto" />
            <h3 className="text-base font-semibold text-charcoal">
              Confirming on blockchain...
            </h3>
            <p className="text-xs text-charcoal-muted">
              Confirming on CarbonChain Network...
            </p>
            {txHash && (
              <div className="pt-2">
                <a
                  href={explorerUrl || `/ledger/0`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-forest hover:text-forest-hover underline underline-offset-2"
                >
                  <span>View transaction record</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {status === "SUCCESS" && (
          <div className="text-center py-4 space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-charcoal">
              Transaction Confirmed!
            </h3>
            <p className="text-xs text-charcoal-muted">
              {message || "The ledger state has been updated on CarbonChain Network."}
            </p>
            {txHash && (
              <div className="pt-1">
                <a
                  href={explorerUrl || `/ledger/0`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-forest hover:text-forest-hover underline underline-offset-2"
                >
                  <span>View transaction record</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
            <div className="pt-3">
              <button onClick={onClose} className="btn-outline w-full py-2 text-xs">
                Close
              </button>
            </div>
          </div>
        )}

        {status === "ERROR" && (
          <div className="text-center py-4 space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-charcoal">
              Transaction Not Completed
            </h3>
            <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded border border-red-100 max-w-sm mx-auto leading-relaxed">
              {message || "An error occurred while processing the transaction."}
            </p>
            {errorType === "WRONG_NETWORK" && switchNetwork && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    switchNetwork();
                    onClose();
                  }}
                  className="btn-outline w-full py-2 text-xs"
                >
                  Switch to CarbonChain Network
                </button>
              </div>
            )}
            <div className="pt-2">
              <button onClick={onClose} className="btn-neutral-outline w-full py-2 text-xs">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
