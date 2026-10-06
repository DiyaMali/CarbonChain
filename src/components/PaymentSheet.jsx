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
  Wallet,
  Clock,
  Sparkles,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { buyCredit, resolveProjectImage, PLATFORM_FEE_PERCENT } from "../services/ledgerService";
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
  const toast = useToast();

  // Step state: "summary" | "confirm_wallet" | "confirming_ledger" | "success" | "error"
  const [step, setStep] = useState("summary");
  const [errorMessage, setErrorMessage] = useState("");
  const [purchaseResult, setPurchaseResult] = useState(null);

  if (!credit) return null;

  const projectName = project?.name || credit.project?.name || credit.projectName || "Carbon Credit Project";
  const projectType = project?.type || project?.projectType || credit.project?.projectType || "Clean Energy";
  const maxAvailable = Math.max(1, Number(credit.amount || 1));
  const pricePerTonne = Number(credit.pricePerTonne || Math.round(Number(credit.price || 0) / (maxAvailable || 1)));
  const sellerAddress = credit.owner || "0x7a89f3cd44921b72e90f14ba08d4841b91933ba4";

  // Editable Quantity State
  const [quantity, setQuantity] = useState(() => Math.min(10, maxAvailable));
  const parsedQty = Math.max(1, Math.min(Number(quantity) || 1, maxAvailable));

  // Pricing calculations per spec §5 & §100
  const subtotal = parsedQty * pricePerTonne;
  const platformFee = Math.round(subtotal * (PLATFORM_FEE_PERCENT || 0.01));
  const totalPayable = subtotal + platformFee;

  const isOwner = account && sellerAddress.toLowerCase() === account.toLowerCase();
  const hasEnoughFunds = inrBalance >= totalPayable;

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
      setErrorMessage("You cannot purchase credits that you have listed.");
      setStep("error");
      return;
    }
    if (!hasEnoughFunds) {
      setErrorMessage(
        `Insufficient wallet balance. Required: ${formatINR(totalPayable)}, Available: ${formatINR(inrBalance)}.`
      );
      setStep("error");
      return;
    }
    setErrorMessage("");
    setStep("confirm_wallet");
  };

  const handleRejectInWallet = () => {
    setErrorMessage("Payment cancelled by user. No funds or credits were transferred.");
    setStep("summary");
  };

  const handleConfirmInWallet = async () => {
    setStep("confirming_ledger");
    try {
      // 1.5s ledger confirmation step per spec §3.5
      await new Promise((r) => setTimeout(r, 1500));
      const result = await buyCredit(credit.id, account, user?.id || "usr_ironbridge", parsedQty);
      setPurchaseResult(result);
      setStep("success");
      toast.success(`Purchase completed. ${parsedQty.toLocaleString("en-IN")} tCO2e purchased.`);
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
      className="fixed inset-0 z-50 bg-[#0F2A1D]/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-[480px] rounded-t-2xl sm:rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#FAFBF9]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-forest" />
            <h3 className="text-sm font-semibold text-charcoal">
              {step === "summary" && "Order Summary & Payment"}
              {step === "confirm_wallet" && "Confirm in your wallet"}
              {step === "confirming_ledger" && "Confirming on ledger..."}
              {step === "success" && "Purchase Complete"}
              {step === "error" && "Payment Notice"}
            </h3>
          </div>
          {step !== "confirming_ledger" && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-charcoal p-1 rounded transition-colors cursor-pointer"
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
            <div className="flex items-center gap-3.5 p-3 rounded-lg border border-gray-200 bg-gray-50/70">
              <img
                src={resolveProjectImage(project || credit.project || credit)}
                alt={projectName}
                className="w-12 h-12 rounded object-cover border border-gray-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-charcoal-subtle font-medium truncate">
                  {projectType}
                </div>
                <h4 className="text-sm font-semibold text-charcoal leading-tight truncate">
                  {projectName}
                </h4>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  ₹{pricePerTonne.toLocaleString("en-IN")} / tCO2e
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                  {maxAvailable.toLocaleString("en-IN")} available
                </span>
              </div>
            </div>

            {/* Quantity Stepper Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-charcoal">
                  Quantity to Purchase
                </label>
                <span className="text-[11px] text-charcoal-muted font-mono">
                  Max: {maxAvailable.toLocaleString("en-IN")} tCO2e
                </span>
              </div>

              <div className="flex items-center border border-gray-300 rounded px-2 py-1.5 bg-white shadow-2xs focus-within:border-forest focus-within:ring-1 focus-within:ring-forest">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={handleDecrement}
                  disabled={parsedQty <= 1}
                  className="w-8 h-8 flex items-center justify-center text-charcoal-muted hover:text-charcoal hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded text-base font-semibold transition cursor-pointer"
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
                  className="w-24 text-center border-0 p-0 text-sm font-mono font-bold text-charcoal focus:ring-0 appearance-none bg-transparent"
                />
                <span className="text-xs text-charcoal-subtle font-medium px-2 border-l border-gray-200 select-none">
                  tCO2e
                </span>
                <div className="flex-1" />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={handleIncrement}
                  disabled={parsedQty >= maxAvailable}
                  className="w-8 h-8 flex items-center justify-center text-charcoal-muted hover:text-charcoal hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded text-base font-semibold transition cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-charcoal-subtle mr-1">Presets:</span>
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuantity(p)}
                    className={`px-2.5 py-0.5 text-xs font-mono font-semibold rounded border transition cursor-pointer ${
                      parsedQty === p
                        ? "text-forest bg-forest/10 border-forest"
                        : "text-charcoal-muted bg-gray-50 hover:bg-gray-100 border-gray-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setQuantity(maxAvailable)}
                  className={`px-2.5 py-0.5 text-xs font-mono font-semibold rounded border transition cursor-pointer ${
                    parsedQty === maxAvailable
                      ? "text-forest bg-forest/10 border-forest"
                      : "text-charcoal-muted bg-gray-50 hover:bg-gray-100 border-gray-200"
                  }`}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Live Pricing Breakdown per spec §5 & §100 */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-charcoal">
                Price Breakdown
              </label>
              <div className="w-full border border-gray-200 rounded p-3 bg-gray-50/60 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-charcoal-muted">
                  <span>Subtotal ({parsedQty} × ₹{pricePerTonne.toLocaleString("en-IN")}):</span>
                  <span className="font-semibold text-charcoal">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-charcoal-muted">
                  <span>Platform Fee (1%):</span>
                  <span className="font-semibold text-charcoal">{formatINR(platformFee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm text-charcoal font-bold">
                  <span>Total Payable:</span>
                  <span className="text-forest">{formatINR(totalPayable)}</span>
                </div>
              </div>
            </div>

            {/* Pay With Selector (Spec §3.5 & §79) */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-charcoal">
                Pay With
              </label>
              {account ? (
                <div className="space-y-2">
                  <div className="w-full border border-forest/40 rounded p-2.5 bg-forest/5 flex items-center justify-between text-xs font-mono text-charcoal">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <span className="font-semibold block">{shortenAddress(account)}</span>
                        <span className="text-[10px] text-charcoal-subtle font-sans">
                          Network: CarbonChain Network
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-sans">
                      <span className="text-[11px] text-charcoal-muted block">
                        Balance: {formatINR(inrBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Disabled row per spec §3.5: "Other payment methods, coming soon" */}
                  <div className="w-full border border-dashed border-gray-200 rounded p-2 text-center text-[11px] text-charcoal-subtle bg-gray-50/50">
                    Other payment methods &bull; Coming soon
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded border border-amber-300 bg-amber-50 flex items-center justify-between">
                  <span className="text-xs text-amber-900 font-medium">No wallet connected</span>
                  <button
                    type="button"
                    onClick={() => openWalletModal()}
                    className="btn-outline-sm"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {!account ? (
                <button
                  type="button"
                  onClick={() => openWalletModal()}
                  className="w-full py-2.5 px-4 rounded border border-forest text-forest hover:bg-forest/5 text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Connect wallet to pay
                </button>
              ) : !hasEnoughFunds ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 rounded border border-rose-300 bg-rose-50 text-rose-700 text-xs font-semibold cursor-not-allowed text-center"
                >
                  Insufficient wallet balance ({formatINR(totalPayable)} required)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePayClick}
                  className="w-full py-2.5 px-4 rounded border border-forest text-forest hover:bg-forest/5 text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Pay {formatINR(totalPayable)}
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: CONFIRM IN YOUR WALLET */}
        {step === "confirm_wallet" && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border border-forest text-forest flex items-center justify-center font-bold text-xl mx-auto">
              <Wallet className="w-6 h-6 text-forest" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-charcoal">
                Confirm in your wallet
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                Approve payment of {formatINR(totalPayable)} for {parsedQty.toLocaleString("en-IN")} tCO2e of carbon credits.
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded border border-gray-200 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Subtotal:</span>
                <span className="font-semibold text-charcoal">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Platform Fee (1%):</span>
                <span className="font-semibold text-charcoal">{formatINR(platformFee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold">
                <span className="text-charcoal">Total Payable:</span>
                <span className="text-forest">{formatINR(totalPayable)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-charcoal-muted">Network:</span>
                <span className="text-forest font-sans">CarbonChain Network</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRejectInWallet}
                className="btn-neutral-outline w-1/2 py-2 text-xs"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={handleConfirmInWallet}
                className="px-4 py-2 w-1/2 rounded border border-forest text-forest hover:bg-forest/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMING ON LEDGER */}
        {step === "confirming_ledger" && (
          <div className="p-8 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-forest animate-spin mx-auto" />
            <div>
              <h3 className="text-base font-semibold text-charcoal">
                Confirming on ledger...
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                Allocating FIFO serial numbers and recording PURCHASED block
              </p>
            </div>
            <div className="text-[11px] font-mono text-charcoal-subtle">
              SHA-256 tamper-evident hash chaining in progress
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS RECEIPT PER SPEC §10 */}
        {step === "success" && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto text-forest">
              <Check className="w-6 h-6 text-emerald-700" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-charcoal">
                Purchase Confirmed!
              </h3>
              <p className="text-xs text-charcoal-muted mt-1">
                Successfully acquired <strong>{parsedQty.toLocaleString("en-IN")} tCO2e</strong> of verified carbon credits.
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded border border-gray-200 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Payment Ref:</span>
                <span className="font-bold text-forest">
                  {purchaseResult?.block?.payload?.paymentReference || "PAY-2026-CONFIRMED"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Project:</span>
                <span className="font-sans font-medium text-charcoal truncate max-w-[200px]">
                  {projectName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Quantity:</span>
                <span className="font-bold text-charcoal">
                  {parsedQty.toLocaleString("en-IN")} tCO2e
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-muted">Serial Range:</span>
                <span className="text-charcoal font-semibold text-[11px] truncate max-w-[200px]">
                  {purchaseResult?.block?.payload?.serialRange || "CCI-Allocated"}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold">
                <span className="text-charcoal">Amount Paid:</span>
                <span className="text-forest">{formatINR(totalPayable)}</span>
              </div>
              {purchaseResult?.block && (
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                  <span className="text-charcoal-muted">Ledger Block:</span>
                  <Link
                    to={`/ledger/${purchaseResult.block.index}`}
                    onClick={onClose}
                    className="text-forest underline font-semibold hover:no-underline inline-flex items-center gap-1"
                  >
                    Block #{purchaseResult.block.index}
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
                className="w-full sm:w-1/2 py-2 px-3 rounded border border-forest text-forest hover:bg-forest/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                View my credits
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  // Open retirement request form
                  navigate("/my-credits?tab=holdings");
                }}
                className="w-full sm:w-1/2 py-2 px-3 rounded border border-gray-300 text-charcoal hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Leaf className="w-3.5 h-3.5 text-forest" />
                <span>Request retirement</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: ERROR SCREEN */}
        {step === "error" && (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-charcoal">
                Transaction Could Not Complete
              </h3>
              <p className="text-xs text-rose-700 mt-1 max-w-sm mx-auto">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep("summary")}
              className="btn-neutral-outline text-xs py-2 px-4"
            >
              Back to Order Summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
