import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Leaf,
  AlertCircle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  ArrowRight,
  Info,
  X
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import {
  getHoldings,
  getHolding,
  getAllCredits,
  requestRetirement,
  DEMO_WALLETS
} from "../services/ledgerService";

function isValidAddress(addr) {
  if (!addr) return true;
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

import { useToast } from "../context/ToastContext";

export default function RetireCredit() {
  const { holdingId, tokenId } = useParams();
  const id = holdingId || tokenId;
  const navigate = useNavigate();

  const { account } = useWallet();
  const { user } = useAuth();
  const toast = useToast();

  const [holding, setHolding] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state per spec §11
  const [quantity, setQuantity] = useState("1");
  const [retireeName, setRetireeName] = useState("Ironbridge Steel and Cement Ltd");
  const [onBehalfOfName, setOnBehalfOfName] = useState("");
  const [onBehalfOfWallet, setOnBehalfOfWallet] = useState("");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("Scope 1/2 corporate decarbonization and ESG compliance");

  const [errors, setErrors] = useState({});
  const [confirmStep, setConfirmStep] = useState(null); // null | 'wallet' | 'ledger'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);

  const effectiveWallet = account || user?.walletAddress || DEMO_WALLETS.buyer;

  useEffect(() => {
    document.title = "Request Retirement | CarbonChain";
    loadTarget();
  }, [id, effectiveWallet]);

  const loadTarget = () => {
    setLoading(true);
    const allHoldings = getHoldings();
    // Look up by holding id, project id, or credit id
    let found = allHoldings.find((h) => h.id === id || h.projectId === id || h.paymentReference === id);
    if (!found) {
      // Fallback search across credits
      const allCreds = getAllCredits();
      const cred = allCreds.find((c) => c.id === id || c.projectId === id);
      if (cred) {
        found = {
          id: `hold_${cred.id}`,
          projectId: cred.projectId,
          projectName: cred.project?.name || "Carbon Offset Project",
          projectType: cred.project?.projectType || "Clean Energy",
          availableQty: cred.amount || 100,
          purchasedQty: cred.amount || 100,
          pendingRetirementQty: 0,
          retiredQty: 0,
          serialRange: `CCI-${cred.projectId}-000001 to 000100`,
          pricePerTonnePaid: cred.pricePerTonne || 450,
        };
      }
    }

    if (found) {
      setHolding(found);
      setQuantity(String(Math.min(10, found.availableQty || 1)));
    }
    setLoading(false);
  };

  const validate = () => {
    const errs = {};
    const qtyNum = Number(quantity);
    if (!qtyNum || isNaN(qtyNum) || qtyNum <= 0 || !Number.isInteger(qtyNum)) {
      errs.quantity = "Must be a whole positive number of tonnes (minimum 1).";
    } else if (holding && qtyNum > (holding.availableQty || 0)) {
      errs.quantity = `Cannot exceed available balance of ${holding.availableQty || 0} tCO2e.`;
    }

    if (!retireeName.trim()) {
      errs.retireeName = "Beneficiary / Retiree organisation name is required.";
    }

    if (!reason.trim()) {
      errs.reason = "Reason for retirement is required.";
    }

    if (onBehalfOfWallet.trim() && !isValidAddress(onBehalfOfWallet.trim())) {
      errs.onBehalfOfWallet = "Must be a valid 0x Ethereum address (40 hexadecimal characters) or left blank.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!holding) return;

    setIsSubmitting(true);
    try {
      // Step 1: Confirm in your wallet (~1.2s)
      setConfirmStep("wallet");
      await new Promise((r) => setTimeout(r, 1200));

      // Step 2: Confirming on ledger (~1.2s)
      setConfirmStep("ledger");
      await new Promise((r) => setTimeout(r, 1200));

      await requestRetirement(holding.id, effectiveWallet, {
        quantity: Number(quantity),
        retireeName: retireeName.trim(),
        onBehalfOfName: onBehalfOfName.trim(),
        onBehalfOfWallet: onBehalfOfWallet.trim(),
        message: message.trim(),
        reason: reason.trim(),
      });

      // Green popup per spec §11
      setSuccessNotice({
        qty: Number(quantity),
        projectName: holding.projectName,
      });
      toast.success(`Retirement requested for ${Number(quantity).toLocaleString("en-IN")} tCO2e. Awaiting verifier approval.`);
    } catch (err) {
      alert("Error submitting retirement request: " + err.message);
    } finally {
      setIsSubmitting(false);
      setConfirmStep(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-charcoal-muted text-xs">
        Loading holding details...
      </div>
    );
  }

  if (!holding) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center clean-card p-8">
        <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-charcoal mb-1">Holding Not Found</h2>
        <p className="text-xs text-charcoal-muted mb-4">
          The requested carbon credit holding could not be located in your portfolio.
        </p>
        <Link to="/my-credits" className="btn-outline-sm">
          Return to My Credits
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Green Success Popup Modal per spec §11 */}
      {successNotice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full p-6 shadow-2xl border border-gray-200 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-700 mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-charcoal mb-1">
              Retirement Request Sent to Verifier
            </h3>
            <p className="text-xs text-charcoal-muted mb-4 leading-relaxed">
              Your request to retire <strong>{successNotice.qty.toLocaleString("en-IN")} tCO2e</strong> of "{successNotice.projectName}" has been recorded on the ledger. You will be notified once the Verification Authority (Diya Mali) approves the certificate.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/my-credits?tab=requests")}
                className="px-4 py-2 rounded border border-forest text-forest hover:bg-forest/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                Track in My Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link to="/my-credits" className="text-xs text-charcoal-subtle hover:text-forest">
            &larr; Back to My Credits
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-charcoal">Request Credit Retirement</h1>
        <p className="text-sm text-charcoal-muted mt-1">
          Submit carbon credits for permanent retirement and official certificate issuance.
        </p>
      </div>

      {/* Holding Summary Card per spec §11 */}
      <div className="clean-card p-4 mb-6">
        <div className="text-xs font-mono uppercase tracking-wider text-forest font-semibold mb-1">
          Holding Summary
        </div>
        <h3 className="text-base font-semibold text-charcoal">{holding.projectName}</h3>
        <p className="text-xs text-charcoal-muted mt-0.5">
          Type: {holding.projectType || "Carbon Offset"} &bull; Serials: {holding.serialRange || "CCI-Allocated"}
        </p>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs font-mono">
          <div>
            <span className="text-[11px] text-charcoal-subtle block font-sans">Purchased</span>
            <strong>{(holding.purchasedQty || 0).toLocaleString("en-IN")} tCO2e</strong>
          </div>
          <div>
            <span className="text-[11px] text-emerald-800 block font-sans">Available to Retire</span>
            <strong className="text-emerald-800 text-sm">{(holding.availableQty || 0).toLocaleString("en-IN")} tCO2e</strong>
          </div>
          <div>
            <span className="text-[11px] text-amber-800 block font-sans">Currently Pending</span>
            <strong className="text-amber-800">{(holding.pendingRetirementQty || 0).toLocaleString("en-IN")} tCO2e</strong>
          </div>
        </div>
      </div>

      {/* Warning Notice per spec §11 */}
      <div className="mb-6 p-3.5 rounded border border-amber-200 bg-amber-50/70 text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Retirement is permanent once approved by a verifier.</strong>
          <p className="text-[11px] text-amber-800 mt-0.5">
            Retired credits are permanently locked on the CarbonChain Ledger and can never be resold, transferred, or relisted. Direct retirement without verifier authorization is strictly prohibited.
          </p>
        </div>
      </div>

      {/* Retirement Request Form */}
      <form onSubmit={handleSubmit} className="clean-card p-6 space-y-4">
        {/* Quantity */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-charcoal">
              Quantity to Retire (tCO2e) <span className="text-rose-600">*</span>
            </label>
            <span className="text-[11px] text-charcoal-muted font-mono">
              Available: {(holding.availableQty || 0).toLocaleString("en-IN")} tCO2e
            </span>
          </div>
          <input
            type="number"
            min="1"
            max={holding.availableQty || 1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:outline-none focus:border-forest font-mono text-charcoal"
          />
          {errors.quantity && <p className="text-[11px] text-rose-600 mt-1">{errors.quantity}</p>}
        </div>

        {/* Beneficiary / Retiree Name */}
        <div>
          <label className="text-xs font-semibold text-charcoal block mb-1">
            Beneficiary Organisation Name <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            value={retireeName}
            onChange={(e) => setRetireeName(e.target.value)}
            placeholder="e.g. Ironbridge Steel and Cement Ltd"
            className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:outline-none focus:border-forest text-charcoal"
          />
          {errors.retireeName && <p className="text-[11px] text-rose-600 mt-1">{errors.retireeName}</p>}
        </div>

        {/* On Behalf Of Name */}
        <div>
          <label className="text-xs font-semibold text-charcoal block mb-1">
            On Behalf Of Name <span className="text-charcoal-subtle font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={onBehalfOfName}
            onChange={(e) => setOnBehalfOfName(e.target.value)}
            placeholder="e.g. Subsidiary company, specific manufacturing facility, or client"
            className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:outline-none focus:border-forest text-charcoal"
          />
        </div>

        {/* On Behalf Of Wallet */}
        <div>
          <label className="text-xs font-semibold text-charcoal block mb-1">
            On Behalf Of Wallet Address <span className="text-charcoal-subtle font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={onBehalfOfWallet}
            onChange={(e) => setOnBehalfOfWallet(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:outline-none focus:border-forest font-mono text-charcoal"
          />
          {errors.onBehalfOfWallet && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.onBehalfOfWallet}</p>
          )}
        </div>

        {/* Reason for Retirement */}
        <div>
          <label className="text-xs font-semibold text-charcoal block mb-1">
            Reason for Retirement <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Scope 1/2 GHG reporting compliance, corporate ESG target"
            className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:outline-none focus:border-forest text-charcoal"
          />
          {errors.reason && <p className="text-[11px] text-rose-600 mt-1">{errors.reason}</p>}
        </div>

        {/* Message with 200 char counter per spec §11 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-charcoal">
              Retirement Statement / Dedication Note
            </label>
            <span className="text-[11px] text-charcoal-subtle font-mono">
              {message.length}/200
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={200}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a public dedication note to appear on the verified certificate..."
            className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:outline-none focus:border-forest text-charcoal"
          />
        </div>

        {/* Confirmation State Banners */}
        {confirmStep === "wallet" && (
          <div className="p-3.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
            <div>
              <strong>Confirm in your wallet</strong>
              <div className="text-[11px] text-amber-800">Signing retirement request authorization...</div>
            </div>
          </div>
        )}

        {confirmStep === "ledger" && (
          <div className="p-3.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0" />
            <div>
              <strong>Confirming on ledger...</strong>
              <div className="text-[11px] text-emerald-800">Recording RETIREMENT_REQUESTED block and locking credits...</div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
          <Link to="/my-credits" className="btn-neutral-outline text-xs px-3 py-2">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || (holding.availableQty || 0) <= 0}
            className="px-4 py-2 rounded border border-forest text-forest hover:bg-forest/5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Submitting Request..." : "Submit Retirement Request"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
