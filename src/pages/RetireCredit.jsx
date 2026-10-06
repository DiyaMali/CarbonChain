import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AlertCircle, Leaf, RefreshCw, Lock } from "lucide-react";
import { useCreditDetail } from "../hooks/useLedger";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { retireCredit } from "../services/ledgerService";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

function isValidAddress(addr) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export default function RetireCredit() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { credit, loading } = useCreditDetail(tokenId);
  const { account, isDemoMode } = useWallet();
  const { user } = useAuth();

  const [form, setForm] = useState({
    retireeName: "",
    onBehalfOfName: "",
    onBehalfOfWallet: "",
    message: "",
    reason: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const effectiveWallet = account || (isDemoMode && user?.walletAddress);
  const isOwner = credit && (credit.owner === effectiveWallet || credit.ownerUserId === user?.id);

  React.useEffect(() => { document.title = `Retire MCU ${tokenId} | CarbonChain`; }, [tokenId]);

  const validate = () => {
    const errs = {};
    if (!form.retireeName.trim()) errs.retireeName = "Retiree name is required.";
    if (!form.reason.trim()) errs.reason = "Reason for retirement is required.";
    if (form.onBehalfOfWallet.trim() && !isValidAddress(form.onBehalfOfWallet.trim())) {
      errs.onBehalfOfWallet = "Must be a valid 0x address or leave blank.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!effectiveWallet) { alert("Set up your wallet first."); return; }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await retireCredit(tokenId, effectiveWallet, {
        retireeName: form.retireeName.trim(),
        onBehalfOfName: form.onBehalfOfName.trim(),
        onBehalfOfWallet: form.onBehalfOfWallet.trim() || ZERO_ADDR,
        message: form.message.trim(),
        reason: form.reason.trim(),
      });
      navigate(`/certificate/${tokenId}`);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-charcoal-muted text-sm">Loading...</div>;
  }

  if (!credit) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-3">MCU not found</h1>
        <Link to="/my-credits" className="btn-outline-sm">Back to My Credits</Link>
      </div>
    );
  }

  if (credit.retired) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Lock className="w-10 h-10 text-charcoal-subtle mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-charcoal mb-2">Already Retired</h1>
        <p className="text-sm text-charcoal-muted mb-4">MCU {credit.id} is already retired and permanently locked.</p>
        <Link to={`/certificate/${credit.id}`} className="btn-outline-sm">View Certificate</Link>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-charcoal mb-2">Not your credit</h1>
        <p className="text-sm text-charcoal-muted mb-4">Only the owner of MCU {credit.id} can retire it.</p>
        <Link to="/my-credits" className="btn-outline-sm">Back to My Credits</Link>
      </div>
    );
  }

  if (credit.listed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-charcoal mb-2">Cancel listing first</h1>
        <p className="text-sm text-charcoal-muted mb-4">MCU {credit.id} is listed on the marketplace. Cancel the listing before retiring.</p>
        <Link to="/my-credits" className="btn-outline-sm">Go to My Credits</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded border border-red-200 bg-red-50 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-red-700 block mb-0.5">Irreversible Action</span>
          <h1 className="text-xl font-semibold text-charcoal">Retire MCU {credit.id}</h1>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 p-4 rounded bg-red-50 border border-red-200 text-red-900 text-xs leading-relaxed flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Retirement is permanent.</strong> This credit can never be sold or transferred again.
          The ledger block will be immutable. This action permanently offsets{" "}
          <strong>{credit.amount.toLocaleString("en-IN")} tCO2e</strong>.
        </div>
      </div>

      {/* Credit summary */}
      <div className="clean-card p-4 mb-6 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-charcoal">{credit.id}</span>
          <span className="text-charcoal-muted">{credit.amount.toLocaleString("en-IN")} tCO2e</span>
        </div>
        <div className="text-charcoal-muted mt-0.5">{credit.project?.name} &bull; {credit.project?.location}</div>
      </div>

      {submitError && (
        <div className="mb-5 p-3.5 rounded bg-red-50 border border-red-200 text-red-800 text-xs">{submitError}</div>
      )}

      <form onSubmit={handleSubmit} className="clean-card p-6 space-y-5">
        {/* Retiree name */}
        <div>
          <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">Retiree Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.retireeName}
            onChange={(e) => { setForm({ ...form, retireeName: e.target.value }); if (errors.retireeName) setErrors({ ...errors, retireeName: null }); }}
            placeholder={user?.organisation || user?.name || "Your organisation name"}
            className={`w-full px-3.5 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-forest ${errors.retireeName ? "border-red-400" : "border-gray-300"}`}
          />
          {errors.retireeName && <p className="text-xs text-red-600 mt-1">{errors.retireeName}</p>}
        </div>

        {/* On behalf of */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">On Behalf Of (optional)</label>
            <input
              type="text"
              value={form.onBehalfOfName}
              onChange={(e) => setForm({ ...form, onBehalfOfName: e.target.value })}
              placeholder="Client or project name"
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-forest"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">On Behalf Of Wallet (optional)</label>
            <input
              type="text"
              value={form.onBehalfOfWallet}
              onChange={(e) => { setForm({ ...form, onBehalfOfWallet: e.target.value }); if (errors.onBehalfOfWallet) setErrors({ ...errors, onBehalfOfWallet: null }); }}
              placeholder="0x... or leave blank"
              className={`w-full px-3.5 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-forest font-mono ${errors.onBehalfOfWallet ? "border-red-400" : "border-gray-300"}`}
            />
            {errors.onBehalfOfWallet && <p className="text-xs text-red-600 mt-1">{errors.onBehalfOfWallet}</p>}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">Reason for Retirement <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.reason}
            onChange={(e) => { setForm({ ...form, reason: e.target.value }); if (errors.reason) setErrors({ ...errors, reason: null }); }}
            placeholder="e.g. Voluntary Scope 3 emissions offset FY2025"
            className={`w-full px-3.5 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-forest ${errors.reason ? "border-red-400" : "border-gray-300"}`}
          />
          {errors.reason && <p className="text-xs text-red-600 mt-1">{errors.reason}</p>}
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">Public Message (optional)</label>
          <textarea
            rows="2"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="A statement that will appear on the retirement certificate..."
            className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <button type="submit" disabled={submitting} className="btn-outline w-full py-2.5 text-sm flex items-center justify-center gap-2">
            {submitting ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />Confirming retirement on ledger...</>
            ) : (
              <><Leaf className="w-4 h-4" />Confirm Retirement</>
            )}
          </button>
          <p className="text-[11px] text-charcoal-subtle text-center mt-2">This cannot be undone.</p>
        </div>
      </form>
    </div>
  );
}
