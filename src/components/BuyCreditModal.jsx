import React, { useState } from "react";
import { X, ShoppingBag, AlertCircle, ExternalLink, CheckCircle2, ShieldAlert } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { getWriteContract } from "../lib/contract";
import { runContractWrite } from "../lib/tx";
import { shortenAddress, formatCO2 } from "../lib/format";
import TxStatusModal from "./TxStatusModal";

export default function BuyCreditModal({ credit, feePercent, onClose, onPurchased }) {
  const walletContext = useWallet();
  const { account, connectWallet } = walletContext;

  const [txState, setTxState] = useState({ status: "IDLE" });
  const [criticalError, setCriticalError] = useState(null);

  if (!credit) return null;

  const isSeller = Boolean(
    account && credit.owner && credit.owner.toLowerCase() === account.toLowerCase()
  );

  const handleConfirmPurchase = async () => {
    if (!account) {
      connectWallet();
      return;
    }

    if (isSeller) {
      alert("You cannot purchase a credit that you already own.");
      return;
    }

    try {
      await runContractWrite(
        async (signer) => {
          const contract = getWriteContract(signer);
          return await contract.buyCredit(BigInt(credit.tokenId), {
            value: credit.priceWei,
          });
        },
        walletContext,
        {
          onStatusChange: setTxState,
          onSuccess: async () => {
            if (onPurchased) {
              await onPurchased();
            }
          },
        }
      );
    } catch (err) {
      const msg = err?.message || String(err || "");
      // Detect specific ERC721 error as mandated
      if (
        msg.includes("ERC721InsufficientApproval") ||
        msg.includes("ERC721IncorrectOwner")
      ) {
        console.error("CRITICAL CONTRACT ERROR during buyCredit:", err);
        setCriticalError({
          reason: msg,
          raw: err,
        });
      }
    }
  };

  return (
    <>
      <TxStatusModal
        txState={txState}
        onClose={() => {
          setTxState({ status: "IDLE" });
          if (txState.status === "SUCCESS") {
            onClose();
          }
        }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
        <div className="bg-white border border-gray-200 rounded p-6 max-w-md w-full shadow-lg relative space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded border border-forest/30 bg-cream text-forest flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-charcoal">
                  Confirm Credit Purchase
                </h3>
                <span className="text-[11px] text-charcoal-muted">Token #{credit.tokenId}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-charcoal p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Critical Error Alert if triggered */}
          {criticalError && (
            <div className="p-4 rounded bg-red-50 border border-red-300 text-xs text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-red-700">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Contract Ownership / Approval Revert Reported</span>
              </div>
              <p className="leading-relaxed">
                The smart contract returned an unexpected ERC-721 restriction:
              </p>
              <code className="block bg-white p-2 rounded border border-red-200 font-mono text-[11px] text-red-800 break-all">
                {criticalError.reason}
              </code>
              <p className="text-[11px] text-red-700">
                As instructed, the transaction flow has been stopped and reported.
              </p>
            </div>
          )}

          {/* Purchase Details */}
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-cream-light rounded border border-gray-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Project Name:</span>
                <span className="font-semibold text-charcoal text-right max-w-[200px] truncate">
                  {credit.projectName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Certified Volume:</span>
                <span className="font-mono font-semibold text-charcoal">
                  {formatCO2(credit.amount)} tCO2e
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Seller (Current Owner):</span>
                <span className="font-mono text-charcoal">
                  {shortenAddress(credit.owner, 6)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className="text-charcoal-muted">Platform Fee:</span>
                <span className="text-charcoal-muted font-medium">
                  {feePercent}% (included in total)
                </span>
              </div>
            </div>

            {/* Total Price Display */}
            <div className="p-3.5 bg-forest-light/40 border border-forest/20 rounded flex items-center justify-between">
              <div>
                <span className="text-[11px] text-forest block uppercase tracking-wider font-semibold">
                  Total Price
                </span>
                <span className="text-xs text-charcoal-muted">
                  ~{credit.pricePerTonnePol} POL / tonne
                </span>
              </div>
              <span className="text-2xl font-semibold font-mono text-forest">
                {credit.pricePol} POL
              </span>
            </div>
          </div>

          {/* Seller / Wallet warnings */}
          {isSeller && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>You are the current owner of this credit token and cannot buy it from yourself.</span>
            </div>
          )}

          {!account && (
            <div className="p-3 rounded bg-cream border border-gray-200 text-xs text-charcoal flex items-center justify-between gap-3">
              <span>Connect your MetaMask wallet to complete this purchase.</span>
              <button onClick={connectWallet} className="btn-outline-sm whitespace-nowrap">
                Connect Wallet
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 text-xs">
            <button onClick={onClose} className="btn-neutral-outline py-2 px-3">
              Cancel
            </button>
            <button
              onClick={handleConfirmPurchase}
              disabled={isSeller || !account}
              className="btn-outline py-2 px-4 font-semibold"
            >
              Confirm Purchase ({credit.pricePol} POL)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
