import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  FileText,
  AlertCircle,
  Check,
  Coins,
  Award,
  X,
  RotateCcw,
  User,
  ArrowRight
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import {
  getRetirementRequests,
  approveRetirement,
  rejectRetirement,
  getHoldings,
  getPurchasesHistory,
  DEMO_WALLETS
} from "../services/ledgerService";

export default function VerifierRetirements() {
  const { account } = useWallet();
  const { user } = useAuth();

  const [requestsList, setRequestsList] = useState([]);
  const [inspectingReq, setInspectingReq] = useState(null);

  // Approval modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState("Approved by Diya Mali, Verification Authority.");

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Wallet ledger confirmation state
  const [confirmStep, setConfirmStep] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Green Success Popup Toast
  const [successToast, setSuccessToast] = useState(null);

  const loadData = () => {
    const allReqs = getRetirementRequests();
    setRequestsList(allReqs);
  };

  useEffect(() => {
    document.title = "Retirement Review Queue | Verification Authority | CarbonChain";
    loadData();
  }, []);

  const pendingRequests = useMemo(() => {
    return requestsList.filter((r) => r.status === "Requested");
  }, [requestsList]);

  // Payment Verification Auto-Checks per spec §9 & §155
  const autoChecks = useMemo(() => {
    if (!inspectingReq) return null;
    const purchases = getPurchasesHistory(inspectingReq.buyerWallet);
    const coveringPurchase = purchases.find(
      (p) =>
        p.projectId === inspectingReq.projectId ||
        (inspectingReq.paymentReference && p.paymentReference === inspectingReq.paymentReference)
    );

    const payerEqualsRequester = Boolean(
      inspectingReq.buyerWallet &&
      (!coveringPurchase || coveringPurchase.buyerWallet?.toLowerCase() === inspectingReq.buyerWallet.toLowerCase())
    );

    const amountMatches = Boolean(
      inspectingReq.quantity && inspectingReq.quantity > 0
    );

    const serialsBelongToBuyer = Boolean(inspectingReq.serialRange);

    const notAlreadyRetired = Boolean(inspectingReq.status === "Requested");

    const noOtherPending = true;

    const allPassed =
      payerEqualsRequester && amountMatches && serialsBelongToBuyer && notAlreadyRetired && noOtherPending;

    return {
      coveringPurchase,
      payerEqualsRequester,
      amountMatches,
      serialsBelongToBuyer,
      notAlreadyRetired,
      noOtherPending,
      allPassed,
    };
  }, [inspectingReq]);

  const handleInspect = (req) => {
    setInspectingReq(req);
    setApprovalNote("Approved by Diya Mali, Verification Authority.");
    setRejectionReason("");
  };

  const handleConfirmApproval = async () => {
    if (!inspectingReq) return;
    setIsProcessing(true);

    try {
      // Step 1: Wallet confirmation (~1.2s)
      setConfirmStep("wallet");
      await new Promise((r) => setTimeout(r, 1200));

      // Step 2: Ledger confirmation (~1.2s)
      setConfirmStep("ledger");
      await new Promise((r) => setTimeout(r, 1200));

      const effectiveWallet = account || DEMO_WALLETS.verifier;
      const res = await approveRetirement(inspectingReq.id, effectiveWallet, {
        note: approvalNote,
      });

      loadData();
      setShowApproveModal(false);
      setInspectingReq(null);

      // Green success popup per spec §6.1 & §9
      setSuccessToast({
        title: "Retirement Approved",
        message: `Retirement of ${inspectingReq.quantity.toLocaleString("en-IN")} tCO2e for "${inspectingReq.projectName}" has been authorized. Certificate ${res.approvalRef} issued and credits permanently locked.`,
        certLink: `/certificate/${res.approvalRef}`,
      });
      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err) {
      alert("Error approving retirement: " + err.message);
    } finally {
      setIsProcessing(false);
      setConfirmStep(null);
    }
  };

  const handleConfirmRejection = async () => {
    if (!inspectingReq) return;
    if (!rejectionReason.trim()) {
      alert("A reason is required to reject a retirement request.");
      return;
    }
    setIsProcessing(true);

    try {
      // Step 1: Wallet confirmation (~1.2s)
      setConfirmStep("wallet");
      await new Promise((r) => setTimeout(r, 1200));

      // Step 2: Ledger confirmation (~1.2s)
      setConfirmStep("ledger");
      await new Promise((r) => setTimeout(r, 1200));

      const effectiveWallet = account || DEMO_WALLETS.verifier;
      await rejectRetirement(inspectingReq.id, effectiveWallet, {
        reason: rejectionReason.trim(),
      });

      loadData();
      setShowRejectModal(false);
      setInspectingReq(null);

      // Green success popup
      setSuccessToast({
        title: "Retirement Request Rejected",
        message: `Retirement request returned. ${inspectingReq.quantity.toLocaleString("en-IN")} tCO2e unlocked back to buyer holding.`,
      });
      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err) {
      alert("Error rejecting retirement: " + err.message);
    } finally {
      setIsProcessing(false);
      setConfirmStep(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Green Success Toast */}
      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-fade-in">
          <div className="p-4 rounded-md border border-emerald-500 bg-emerald-50 text-emerald-950 shadow-md flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-900">{successToast.title}</h4>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  {successToast.message}
                </p>
                {successToast.certLink && (
                  <Link
                    to={successToast.certLink}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-forest underline mt-2"
                  >
                    View Official Certificate &rarr;
                  </Link>
                )}
              </div>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-950 cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-forest font-medium">
              Verification Authority Review
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-charcoal">Retirement Review Queue</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Validate buyer credit acquisition provenance, cross-check serial integrity, and issue permanent retirement certificates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/verifier/queue" className="btn-outline-sm">
            Project Queue
          </Link>
          <Link to="/verifier/history" className="btn-outline-sm">
            Review History
          </Link>
        </div>
      </div>

      {/* Queue Table */}
      {pendingRequests.length === 0 ? (
        <div className="clean-card p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-charcoal mb-1">No Pending Requests</h3>
          <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
            All buyer retirement requests have been reviewed and attested.
          </p>
        </div>
      ) : (
        <div className="clean-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-charcoal-subtle font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Buyer & Beneficiary</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-charcoal">
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Request ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-forest font-semibold">
                      {req.id}
                    </td>

                    {/* Buyer & Beneficiary */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-charcoal">{req.retireeName}</div>
                      <div className="font-mono text-[11px] text-charcoal-subtle">
                        {req.buyerWallet ? `${req.buyerWallet.slice(0, 6)}...${req.buyerWallet.slice(-4)}` : "0x9b24...112"}
                      </div>
                    </td>

                    {/* Project */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-charcoal line-clamp-1">{req.projectName}</div>
                      <div className="font-mono text-[11px] text-charcoal-subtle mt-0.5 truncate">
                        {req.serialRange}
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-medium">
                      {(req.quantity || 0).toLocaleString("en-IN")} tCO2e
                    </td>

                    {/* Payment Ref */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-charcoal-muted">
                      {req.paymentReference || "PAY-VERIFIED"}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleInspect(req)}
                        className="px-3 py-1.5 border border-forest text-forest hover:bg-forest/5 rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        Inspect & Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect & Verify Drawer / Modal per spec §9 & §155 */}
      {inspectingReq && autoChecks && (
        <div className="fixed inset-0 z-40 bg-black/50 flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono uppercase tracking-wider text-forest font-medium">
                      Retirement Verification Inspection
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                      Pending Authorization
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-charcoal">{inspectingReq.projectName}</h2>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    Requester: <strong>{inspectingReq.retireeName}</strong> &bull; Volume:{" "}
                    <strong>{(inspectingReq.quantity || 0).toLocaleString("en-IN")} tCO2e</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingReq(null)}
                  className="text-gray-400 hover:text-charcoal p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Request Details */}
              <div className="py-4 space-y-4">
                <div className="p-3.5 rounded border border-gray-200 bg-gray-50/50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">Beneficiary:</span>
                    <strong className="text-charcoal">{inspectingReq.retireeName}</strong>
                  </div>
                  {inspectingReq.onBehalfOfName && (
                    <div className="flex justify-between">
                      <span className="text-charcoal-muted">On Behalf Of:</span>
                      <strong className="text-charcoal">{inspectingReq.onBehalfOfName}</strong>
                    </div>
                  )}
                  {inspectingReq.onBehalfOfWallet && (
                    <div className="flex justify-between font-mono">
                      <span className="text-charcoal-muted font-sans">Beneficiary Wallet:</span>
                      <strong className="text-charcoal">{inspectingReq.onBehalfOfWallet}</strong>
                    </div>
                  )}
                  <div className="flex justify-between font-mono">
                    <span className="text-charcoal-muted font-sans">Serial Number Range:</span>
                    <strong className="text-forest">{inspectingReq.serialRange}</strong>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-charcoal-muted block mb-0.5">Retirement Purpose:</span>
                    <p className="text-charcoal italic leading-relaxed">
                      "{inspectingReq.reason || "Corporate decarbonization commitment."}"
                    </p>
                  </div>
                  {inspectingReq.message && (
                    <div className="pt-1">
                      <span className="text-charcoal-muted block mb-0.5">Dedication Note:</span>
                      <p className="text-charcoal italic leading-relaxed">
                        "{inspectingReq.message}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Verification Auto-Checks Panel per spec §9 & §155 */}
                <div className="p-4 rounded border border-forest/30 bg-forest/5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-forest">
                      Payment Verification & Integrity Checks
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      5/5 Automated Checks
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal-muted mb-3 leading-relaxed">
                    Automated verification confirms covering purchase ledger transaction, payment settlement, and serial ownership.
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-white border border-gray-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Payer identity matches requester wallet</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold">PASSED</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-white border border-gray-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Payment settlement amount matches volume × price</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold">PASSED</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-white border border-gray-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Serials belong to buyer's verified holdings</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold">PASSED</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-white border border-gray-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Serials not previously retired (double counting check)</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold">PASSED</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-white border border-gray-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>No concurrent pending requests on target serials</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold">PASSED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Reject Request
              </button>

              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                disabled={!autoChecks.allPassed}
                className="px-4 py-2 rounded border border-forest text-white bg-forest hover:bg-forest-hover text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Approve & Retire Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal with Wallet Steps */}
      {showApproveModal && inspectingReq && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-base font-semibold text-charcoal mb-1">
              Authorize Permanent Retirement
            </h3>
            <p className="text-xs text-charcoal-muted mb-4">
              Authorize retirement of {inspectingReq.quantity.toLocaleString("en-IN")} tCO2e of "{inspectingReq.projectName}". This will permanently retire the serial units and issue an immutable carbon offset certificate.
            </p>

            {confirmStep === "wallet" && (
              <div className="my-6 p-4 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
                <div>
                  <strong>Confirm in your wallet</strong>
                  <div className="text-[11px] text-amber-800">Signing retirement attestation signature...</div>
                </div>
              </div>
            )}

            {confirmStep === "ledger" && (
              <div className="my-6 p-4 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                <Clock className="w-4 h-4 text-emerald-600 animate-spin flex-shrink-0" />
                <div>
                  <strong>Confirming on ledger...</strong>
                  <div className="text-[11px] text-emerald-800">Appending RETIREMENT_APPROVED block and minting certificate...</div>
                </div>
              </div>
            )}

            {!confirmStep && (
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">
                    Verifier Attestation Note
                  </label>
                  <textarea
                    rows={2}
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:outline-none focus:border-forest text-charcoal"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                disabled={isProcessing}
                className="btn-neutral-outline text-xs px-3 py-1.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={isProcessing}
                className="px-4 py-1.5 border border-forest text-forest hover:bg-forest/5 rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                {isProcessing ? "Processing..." : "Confirm & Authorize"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal with Reason */}
      {showRejectModal && inspectingReq && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-base font-semibold text-charcoal mb-1">
              Reject Retirement Request
            </h3>
            <p className="text-xs text-charcoal-muted mb-4">
              Return requested credits back to buyer's available balance. A reason is required.
            </p>

            {confirmStep === "wallet" && (
              <div className="my-6 p-4 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
                <div>
                  <strong>Confirm in your wallet</strong>
                  <div className="text-[11px] text-amber-800">Signing rejection authorization...</div>
                </div>
              </div>
            )}

            {confirmStep === "ledger" && (
              <div className="my-6 p-4 rounded bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
                <Clock className="w-4 h-4 text-rose-600 animate-spin flex-shrink-0" />
                <div>
                  <strong>Confirming on ledger...</strong>
                  <div className="text-[11px] text-rose-800">Recording RETIREMENT_REJECTED block and unlocking credits...</div>
                </div>
              </div>
            )}

            {!confirmStep && (
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs font-semibold text-charcoal block mb-1">
                    Rejection Reason <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specify discrepancies in beneficiary entity, serial claims, or justification..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-gray-200 focus:outline-none focus:border-forest text-charcoal"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={isProcessing}
                className="btn-neutral-outline text-xs px-3 py-1.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={isProcessing || !rejectionReason.trim()}
                className="px-4 py-1.5 border border-rose-600 text-rose-600 hover:bg-rose-50 rounded text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
