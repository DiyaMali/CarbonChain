import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Layers,
  Leaf,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Award,
  AlertCircle,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  FileText
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import {
  getHoldings,
  getRetirementRequests,
  cancelRetirementRequest,
  resolveProjectImage,
  DEMO_WALLETS
} from "../services/ledgerService";

function formatINR(n) {
  if (n === null || n === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function MyCredits() {
  const { account } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("holdings"); // "holdings" | "requests" | "retired"
  const [holdings, setHoldings] = useState([]);
  const [retirementRequests, setRetirementRequests] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelNotice, setCancelNotice] = useState(null);

  const effectiveWallet = account || user?.walletAddress || DEMO_WALLETS.buyer;

  const loadData = () => {
    const userHoldings = getHoldings(effectiveWallet);
    const allRequests = getRetirementRequests();
    const userRequests = allRequests.filter(
      (r) =>
        (r.buyerWallet && effectiveWallet && r.buyerWallet.toLowerCase() === effectiveWallet.toLowerCase()) ||
        (r.buyerUserId && user?.id && r.buyerUserId === user.id) ||
        // Default seed association for buyer
        user?.id === "usr_ironbridge" ||
        effectiveWallet?.toLowerCase() === DEMO_WALLETS.buyer?.toLowerCase()
    );

    setHoldings(userHoldings);
    setRetirementRequests(userRequests);
  };

  useEffect(() => {
    document.title = "My Credits & Holdings | CarbonChain";
    loadData();

    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam && ["holdings", "requests", "retired"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [effectiveWallet, location.search]);

  // Overall metric totals computed from holdings per spec §10 & §65
  const totals = useMemo(() => {
    const purchased = holdings.reduce((s, h) => s + (h.purchasedQty || 0), 0);
    const available = holdings.reduce((s, h) => s + (h.availableQty || 0), 0);
    const pending = holdings.reduce((s, h) => s + (h.pendingRetirementQty || 0), 0);
    const retired = holdings.reduce((s, h) => s + (h.retiredQty || 0), 0);

    return { purchased, available, pending, retired };
  }, [holdings]);

  // Approved retirements for Retired tab
  const approvedRetirements = useMemo(() => {
    return retirementRequests.filter((r) => r.status === "Approved");
  }, [retirementRequests]);

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this retirement request? Locked credits will be returned to your available holding.")) {
      return;
    }
    setCancellingId(requestId);
    try {
      await cancelRetirementRequest(requestId, effectiveWallet);
      loadData();
      setCancelNotice("Retirement request cancelled. Credits returned to available balance.");
      setTimeout(() => setCancelNotice(null), 5000);
    } catch (err) {
      alert("Error cancelling request: " + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Cancellation Notice */}
      {cancelNotice && (
        <div className="mb-6 p-4 rounded border border-emerald-300 bg-emerald-50 text-emerald-950 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{cancelNotice}</span>
          </div>
          <button
            onClick={() => setCancelNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-forest font-medium">
              Carbon Portfolio &bull; Ironbridge Steel and Cement Ltd
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-charcoal">My Carbon Credits</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Manage purchased holdings, track verifier retirement authorizations, and access official certificates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/marketplace"
            className="btn-outline-sm flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Browse Marketplace</span>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards (§10 & §65) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="clean-card p-4">
          <div className="text-xs font-medium text-charcoal-subtle uppercase tracking-wider">
            Total Purchased
          </div>
          <div className="text-2xl font-semibold text-charcoal mt-1 font-mono">
            {totals.purchased.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1 font-mono">
            tCO2e acquired
          </div>
        </div>

        <div className="clean-card p-4">
          <div className="text-xs font-medium text-charcoal-subtle uppercase tracking-wider">
            Available to Retire
          </div>
          <div className="text-2xl font-semibold text-emerald-700 mt-1 font-mono">
            {totals.available.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1 font-mono">
            Ready for submission
          </div>
        </div>

        <div className="clean-card p-4">
          <div className="text-xs font-medium text-charcoal-subtle uppercase tracking-wider">
            Pending Retirement
          </div>
          <div className="text-2xl font-semibold text-amber-700 mt-1 font-mono">
            {totals.pending.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1 font-mono">
            Locked in verifier review
          </div>
        </div>

        <div className="clean-card p-4">
          <div className="text-xs font-medium text-charcoal-subtle uppercase tracking-wider">
            Permanently Retired
          </div>
          <div className="text-2xl font-semibold text-blue-700 mt-1 font-mono">
            {totals.retired.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-charcoal-muted mt-1 font-mono">
            Certified carbon offsets
          </div>
        </div>
      </div>

      {/* Tabs per spec §10: Holdings, Retirement requests, Retired */}
      <div className="clean-card p-1.5 mb-6 flex items-center gap-1 overflow-x-auto w-fit">
        <button
          onClick={() => setActiveTab("holdings")}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "holdings"
              ? "bg-forest/10 border border-forest text-forest font-semibold"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          Holdings ({holdings.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "requests"
              ? "bg-forest/10 border border-forest text-forest font-semibold"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          Retirement Requests ({retirementRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("retired")}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "retired"
              ? "bg-forest/10 border border-forest text-forest font-semibold"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          Retired & Certificates ({approvedRetirements.length})
        </button>
      </div>

      {/* TAB 1: HOLDINGS */}
      {activeTab === "holdings" && (
        <div className="space-y-4">
          {holdings.length === 0 ? (
            <div className="clean-card p-12 text-center">
              <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-charcoal mb-1">No Holdings Yet</h3>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto mb-4">
                Explore the marketplace to acquire verified carbon offset credits.
              </p>
              <Link to="/marketplace" className="btn-outline-sm">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {holdings.map((h) => {
                const canRetire = (h.availableQty || 0) > 0;
                return (
                  <div key={h.id} className="clean-card p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-charcoal-subtle">
                            {h.projectType || "Carbon Offset"}
                          </span>
                          <span className="text-[11px] font-mono text-gray-400">
                            Ref: {h.paymentReference || "PAY-2026"}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-charcoal">{h.projectName}</h3>
                        <p className="text-xs text-charcoal-muted font-mono mt-0.5">
                          Serials: {h.serialRange || "CCI-Allocated"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <Link
                          to={`/projects/${h.projectId}`}
                          className="btn-neutral-outline text-xs px-3 py-1.5"
                        >
                          View Project
                        </Link>
                        {canRetire ? (
                          <Link
                            to={`/retire/${h.id}`}
                            className="px-3 py-1.5 rounded border border-forest text-forest hover:bg-forest/5 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <Leaf className="w-3.5 h-3.5" />
                            <span>Request Retirement</span>
                          </Link>
                        ) : (
                          <span
                            className="px-3 py-1.5 rounded border border-gray-200 text-gray-400 text-xs font-medium bg-gray-50 cursor-not-allowed"
                            title="No credits currently available to request retirement"
                          >
                            Fully Locked / Retired
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 4-Metric Grid per spec §10 */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono text-xs">
                      <div className="p-2.5 rounded bg-gray-50/70 border border-gray-100">
                        <span className="text-[11px] text-charcoal-subtle block font-sans">Purchased</span>
                        <strong className="text-charcoal font-semibold text-sm">
                          {(h.purchasedQty || 0).toLocaleString("en-IN")} tCO2e
                        </strong>
                      </div>

                      <div className="p-2.5 rounded bg-emerald-50/50 border border-emerald-100">
                        <span className="text-[11px] text-emerald-800 block font-sans">Available</span>
                        <strong className="text-emerald-800 font-semibold text-sm">
                          {(h.availableQty || 0).toLocaleString("en-IN")} tCO2e
                        </strong>
                      </div>

                      <div className="p-2.5 rounded bg-amber-50/50 border border-amber-100">
                        <span className="text-[11px] text-amber-800 block font-sans">Pending Review</span>
                        <strong className="text-amber-800 font-semibold text-sm">
                          {(h.pendingRetirementQty || 0).toLocaleString("en-IN")} tCO2e
                        </strong>
                      </div>

                      <div className="p-2.5 rounded bg-blue-50/50 border border-blue-100">
                        <span className="text-[11px] text-blue-800 block font-sans">Retired</span>
                        <strong className="text-blue-800 font-semibold text-sm">
                          {(h.retiredQty || 0).toLocaleString("en-IN")} tCO2e
                        </strong>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between text-[11px] text-charcoal-muted">
                      <span>Total Invested: <strong className="text-charcoal">{formatINR(h.totalPaid)}</strong></span>
                      <span>Acquired on: {h.purchasedAt ? new Date(h.purchasedAt).toLocaleDateString("en-IN") : "Jan 2026"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RETIREMENT REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {retirementRequests.length === 0 ? (
            <div className="clean-card p-12 text-center">
              <Leaf className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-charcoal mb-1">No Retirement Requests</h3>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto mb-4">
                To retire credits permanently against your sustainability targets, submit a retirement request from your Holdings.
              </p>
            </div>
          ) : (
            <div className="clean-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-100 text-charcoal-subtle font-medium uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4">Beneficiary</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Notes / Rationale</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-charcoal">
                    {retirementRequests.map((req) => {
                      const isPending = req.status === "Requested";
                      const isApproved = req.status === "Approved";
                      const isRejected = req.status === "Rejected";

                      return (
                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                          {/* Project info */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-charcoal line-clamp-1">
                              {req.projectName}
                            </div>
                            <div className="font-mono text-[11px] text-charcoal-subtle">
                              Req ID: {req.id}
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-medium">
                            {(req.quantity || 0).toLocaleString("en-IN")} tCO2e
                          </td>

                          {/* Beneficiary */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-medium text-charcoal">{req.retireeName}</div>
                            {req.onBehalfOf && (
                              <div className="text-[11px] text-charcoal-subtle">on behalf of: {req.onBehalfOf}</div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Awaiting verifier approval
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Approved
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Rejected
                              </span>
                            )}
                            {req.status === "Cancelled" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-50 text-gray-700 border border-gray-200">
                                Cancelled
                              </span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="line-clamp-2 text-xs text-charcoal-muted">
                              {req.verifierNote || req.rejectionReason || req.reason || "Corporate decarbonization commitment."}
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleCancelRequest(req.id)}
                                disabled={cancellingId === req.id}
                                className="px-2.5 py-1 rounded border border-gray-300 text-charcoal-muted hover:text-rose-700 hover:border-rose-300 text-xs transition-colors cursor-pointer"
                              >
                                {cancellingId === req.id ? "Cancelling..." : "Cancel"}
                              </button>
                            )}
                            {isApproved && (
                              <Link
                                to={`/certificate/${req.approvalRef || req.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-forest text-forest hover:bg-forest/5 text-xs font-semibold transition-colors"
                              >
                                <Award className="w-3 h-3" />
                                <span>Certificate</span>
                              </Link>
                            )}
                            {isRejected && (
                              <span className="text-[11px] text-charcoal-subtle italic">Returned to balance</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RETIRED & CERTIFICATES */}
      {activeTab === "retired" && (
        <div className="space-y-4">
          {approvedRetirements.length === 0 ? (
            <div className="clean-card p-12 text-center">
              <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-charcoal mb-1">No Active Certificates</h3>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto mb-4">
                Approved retirements automatically generate permanent, auditable carbon offset certificates with public verification links.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedRetirements.map((ret) => (
                <div key={ret.id} className="clean-card p-5 border-l-4 border-l-forest flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-forest uppercase tracking-wider">
                        {ret.approvalRef || "RET-2026-CERT"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Permanently Locked
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-charcoal">{ret.projectName}</h3>
                    <p className="text-xs text-charcoal-muted mt-1">
                      Retired for: <strong>{ret.retireeName}</strong>
                    </p>
                    <p className="text-xs text-charcoal-muted font-mono mt-0.5">
                      Volume: <strong>{(ret.quantity || 0).toLocaleString("en-IN")} tCO2e</strong>
                    </p>

                    <div className="mt-3 p-2.5 rounded bg-gray-50 border border-gray-100 text-xs text-charcoal-muted">
                      <span className="text-[11px] font-medium text-charcoal block mb-0.5">Purpose / Declaration:</span>
                      <span className="italic">"{ret.reason || "Corporate science-based decarbonization targets."}"</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-charcoal-subtle font-mono">
                      Verified by Diya Mali (VVB)
                    </span>
                    <Link
                      to={`/certificate/${ret.approvalRef || ret.id}`}
                      className="px-3 py-1.5 rounded border border-forest text-forest hover:bg-forest/5 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>View Certificate</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
