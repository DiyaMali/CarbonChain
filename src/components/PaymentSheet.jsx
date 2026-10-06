import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Leaf,
  Layers,
  Coins,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { buyCredit, resolveProjectImage } from "../services/ledgerService";
import { shortenAddress } from "../utils/walletUtils";

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function PaymentSheet({ credit, project, onClose, onPurchased }) {
  const navigate = useNavigate();
  const { account, walletSession, inrBalance, openWalletModal } = useWallet();
  const { user } = useAuth();

  // Step state: "summary" | "confirm_wallet" | "confirming_ledger" | "success" | "error"
  const [step, setStep] = useState("summary");
  const [errorMessage, setErrorMessage] = useState("");
  const [completedBlock, setCompletedBlock] = useState(null);
  const [remainingBalance, setRemainingBalance] = useState(0);

  if (!credit) return null;

  const projectName = project?.name || credit.project?.name || credit.projectName || "Carbon Credit Project";
  const projectType = project?.type || project?.projectType || credit.project?.projectType || "Clean Energy";
  const tokenId = credit.id || `MCU-${credit.tokenId || "001"}`;
  const maxAvailable = Math.max(1, Number(credit.amount || 1));
  const pricePerTonne = Number(credit.pricePerTonne || Math.round(Number(credit.price || 0) / (maxAvailable || 1)));
  const sellerAddress = credit.owner || "0xA1b2c3D4e5f6A7b8C9d0e1F2a3B4c5D6e7F8a9b0";

  // Editable Quantity State
  const [quantity, setQuantity] = useState(() => Math.min(10, maxAvailable));
  const parsedQty = Math.max(1, Math.min(Number(quantity) || 1, maxAvailable));
  const totalPrice = parsedQty * pricePerTonne;

  const isOwner = account && sellerAddress.toLowerCase() === account.toLowerCase();
  const hasEnoughFunds = inrBalance >= totalPrice;

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, (Number(prev) || 1) - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(maxAvailable, (Number(prev) || 1) + 1));
  };

  const handleQuantityChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      setQuantity("");
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setQuantity(Math.max(1, Math.min(num, maxAvailable)));
    }
  };

  const handleQuantityBlur = () => {
    if (!quantity || Number(quantity) < 1) {
      setQuantity(1);
    } else if (Number(quantity) > maxAvailable) {
      setQuantity(maxAvailable);
    }
  };

  const presets = [1, 5, 10, 25, 50].filter((p) => p < maxAvailable);

  const handlePayClick = () => {
    if (!account) {
      openWalletModal();
      return;
    }
    if (isOwner) {
      setErrorMessage("You already own this carbon credit token.");
      setStep("error");
      return;
    }
    if (!hasEnoughFunds) {
      setErrorMessage(
        `Insufficient wallet balance. Required: ${formatINR(totalPrice)}, Available: ${formatINR(inrBalance)}.`
      );
      setStep("error");
      return;
    }
    setErrorMessage("");
    setStep("confirm_wallet");
  };

  const handleRejectInWallet = () => {
    setErrorMessage("Payment cancelled. No credits were transferred.");
    setStep("summary");
  };

  const handleConfirmInWallet = async () => {
    setStep("confirming_ledger");
    try {
      const result = await buyCredit(credit.id, account, user?.id, parsedQty);
      setCompletedBlock(result.block);
      setRemainingBalance(Math.max(0, inrBalance - totalPrice));
      setStep("success");
      if (typeof onPurchased === "function") {
        onPurchased(result);
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to finalize purchase on ledger.");
      setStep("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F2A1D]/45 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-[460px] rounded-t-2xl sm:rounded-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-[#FAFBF9]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#14532D]" />
            <h3 className="text-sm font-semibold text-[#0F2A1D]">
              {step === "summary" && "Order Summary & Payment"}
              {step === "confirm_wallet" && "Approve in your wallet"}
              {step === "confirming_ledger" && "Confirming on Ledger"}
              {step === "success" && "Purchase Complete"}
              {step === "error" && "Payment Notice"}
            </h3>
          </div>
          {step !== "confirming_ledger" && (
            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* STEP 1: ORDER SUMMARY & PAYMENT SELECTOR */}
        {step === "summary" && (
          <div className="p-5 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Project Summary Card */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl border border-stone-200/80 bg-stone-50/80">
              <img
                src={resolveProjectImage(project || credit.project || credit)}
                alt={projectName}
                className="w-12 h-12 rounded-lg object-cover shadow-xs border border-stone-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold truncate">
                  {projectType}
                </div>
                <h4 className="text-sm font-bold text-[#0F2A1D] leading-tight truncate">
                  {projectName}
                </h4>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  1 tCO2e • {formatINR(pricePerTonne)} / credit
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-[#14532D] border border-emerald-200">
                  {maxAvailable.toLocaleString("en-IN")} available
                </span>
              </div>
            </div>

            {/* Quantity Stepper Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-stone-700">
                  Quantity
                </label>
                <span className="text-[11px] text-stone-400">
                  Max: {maxAvailable.toLocaleString("en-IN")} tCO2e
                </span>
              </div>

              <div className="flex items-center border border-stone-300 rounded-lg px-2 py-1.5 bg-white shadow-xs focus-within:border-[#14532D] focus-within:ring-1 focus-within:ring-[#14532D]">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={handleDecrement}
                  disabled={parsedQty <= 1}
                  className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed rounded text-lg font-semibold transition"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxAvailable}
                  value={quantity}
                  onChange={handleQuantityChange}
                  onBlur={handleQuantityBlur}
                  className="w-20 text-center border-0 p-0 text-sm font-bold text-stone-900 focus:ring-0 appearance-none bg-transparent"
                />
                <span className="text-xs text-stone-400 font-medium px-2 border-l border-stone-200 select-none">
                  tCO2e
                </span>
                <div className="flex-1" />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={handleIncrement}
                  disabled={parsedQty >= maxAvailable}
                  className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed rounded text-lg font-semibold transition"
                >
                  +
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-medium text-stone-400 mr-1">Presets:</span>
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuantity(p)}
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border transition ${
                      parsedQty === p
                        ? "text-[#14532D] bg-emerald-50 border-emerald-300"
                        : "text-stone-600 bg-stone-100 hover:bg-emerald-50/50 border-stone-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setQuantity(maxAvailable)}
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border transition ${
                    parsedQty === maxAvailable
                      ? "text-[#14532D] bg-emerald-50 border-emerald-300"
                      : "text-stone-600 bg-stone-100 hover:bg-emerald-50/50 border-stone-200"
                  }`}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Total Price Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Total Price
              </label>
              <div className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 bg-stone-50/70 flex items-baseline justify-between shadow-xs">
                <div>
                  <span className="text-base font-extrabold text-[#0F2A1D] tracking-tight">
                    {formatINR(totalPrice)}
                  </span>
                  <span className="text-[11px] text-stone-500 block font-normal">
                    {parsedQty.toLocaleString("en-IN")} tCO2e × {formatINR(pricePerTonne)}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400 font-medium">
                  Includes platform fee
                </span>
              </div>
            </div>

            {/* Wallet Section */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-stone-700">
                Wallet
              </label>
              {account ? (
                <div className="w-full border border-stone-200 rounded-lg px-3.5 py-2.5 bg-white flex items-center justify-between text-xs font-mono text-stone-600 shadow-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span>{shortenAddress(account)}</span>
                  </span>
                  <div className="flex items-center gap-2 font-sans">
                    <span className="text-[11px] text-stone-500">
                      Balance: {formatINR(inrBalance)}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Connected
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 flex items-center justify-between">
                  <span className="text-xs text-amber-900 font-medium">No wallet connected</span>
                  <button
                    type="button"
                    onClick={() => openWalletModal()}
                    className="px-2.5 py-1 rounded-md border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-xs font-semibold"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>

            {/* Balance remainder preview */}
            {account && hasEnoughFunds && (
              <div className="text-[11px] text-stone-500 flex justify-between px-1">
                <span>Remaining balance after purchase:</span>
                <span className="font-mono font-semibold text-stone-800">
                  {formatINR(inrBalance - totalPrice)}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              {!account ? (
                <button
                  type="button"
                  onClick={() => openWalletModal()}
                  className="w-full py-2.5 px-4 rounded-md border border-[#14532D] bg-[#14532D] text-white hover:bg-[#0f4022] text-xs font-semibold transition-colors cursor-pointer text-center shadow-sm"
                >
                  Connect Wallet
                </button>
              ) : !hasEnoughFunds ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 rounded-md border border-red-300 bg-red-50 text-red-700 text-xs font-semibold cursor-not-allowed text-center"
                >
                  Insufficient wallet balance ({formatINR(totalPrice)} needed)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePayClick}
                  className="w-full py-2.5 px-4 rounded-md border border-[#14532D] bg-[#14532D] text-white hover:bg-[#0f4022] text-xs font-semibold transition-colors cursor-pointer text-center shadow-sm"
                >
                  Buy {parsedQty.toLocaleString("en-IN")} Credits ({formatINR(totalPrice)})
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: CONFIRM IN YOUR WALLET */}
        {step === "confirm_wallet" && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#14532D] text-white flex items-center justify-center font-bold text-xl mx-auto shadow-xs">
              {walletSession?.provider ? walletSession.provider[0].toUpperCase() : "M"}
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0F2A1D]">
                Confirm in your wallet
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Approve deduction of {formatINR(totalPrice)} to transfer {parsedQty.toLocaleString("en-IN")} tCO2e to your portfolio.
              </p>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500">Amount:</span>
                <span className="font-bold text-stone-900">{formatINR(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">To Seller:</span>
                <span className="text-stone-800">{shortenAddress(sellerAddress)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Token ID:</span>
                <span className="text-stone-800">{tokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Network:</span>
                <span className="text-emerald-700">Polygon Amoy / Local Hash Chain</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRejectInWallet}
                className="w-1/2 py-2 px-4 rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={handleConfirmInWallet}
                className="w-1/2 py-2 px-4 rounded-md border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMING ON LEDGER */}
        {step === "confirming_ledger" && (
          <div className="p-8 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#14532D] animate-spin mx-auto" />
            <div>
              <h3 className="text-base font-semibold text-[#0F2A1D]">
                Confirming on ledger...
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Deducting funds and appending block to hash chain
              </p>
            </div>
            <div className="text-[11px] font-mono text-stone-400">
              Generating tamper-evident SHA-256 block proof
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS SCREEN & RECEIPT */}
        {step === "success" && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto text-[#14532D]">
              <Check className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#0F2A1D]">
                Purchase complete!
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                You have successfully acquired <strong>{parsedQty.toLocaleString("en-IN")} tCO2e</strong> of verified carbon credits.
              </p>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Paid:</span>
                <span className="font-mono font-bold text-stone-900">{formatINR(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Remaining Balance:</span>
                <span className="font-mono font-bold text-[#14532D]">{formatINR(remainingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Token Serial:</span>
                <span className="font-mono text-stone-800">{tokenId}</span>
              </div>
              {completedBlock && (
                <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-xs">
                  <span className="text-stone-500 font-mono">Ledger Record:</span>
                  <Link
                    to={`/ledger/${completedBlock.index}`}
                    onClick={onClose}
                    className="text-[#14532D] underline font-semibold hover:no-underline inline-flex items-center gap-1 font-mono"
                  >
                    View Block #{completedBlock.index}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/my-credits");
                }}
                className="w-full sm:w-1/2 py-2 px-3 rounded-md border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                View my credits & history
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/retire/${credit.id}`);
                }}
                className="w-full sm:w-1/2 py-2 px-3 rounded-md border border-stone-300 text-stone-800 hover:bg-stone-50 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Leaf className="w-3.5 h-3.5 text-[#14532D]" />
                <span>Retire now</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: ERROR SCREEN */}
        {step === "error" && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900">
                Transaction Could Not Complete
              </h3>
              <p className="text-xs text-red-700 mt-1 max-w-sm mx-auto">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("summary")}
              className="py-2 px-4 rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors"
            >
              Back to Order Summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
