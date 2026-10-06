import React, { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FileText,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Download,
  Tag,
  Sliders,
  EyeOff,
  RotateCcw,
  Lock,
  AlertCircle,
  X,
  Send,
  Loader2,
  ExternalLink,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useAllProjects, useAllCredits } from "../hooks/useLedger";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import ProjectTypeIcon from "../components/ProjectTypeIcon";
import StatusBadge from "../components/StatusBadge";
import {
  resolveProjectImage,
  updateListingPrice,
  updateListingQuantity,
  unlistListing,
  relistListing,
  resubmitRejectedProject,
  getPurchasesHistory,
} from "../services/ledgerService";
import { isSellUser } from "../services/roleService";
import { useToast } from "../context/ToastContext";

const TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending review" },
  { id: "listed", label: "Listed" },
  { id: "rejected", label: "Rejected" },
  { id: "sold_out", label: "Sold out" },
  { id: "concluded", label: "Concluded" },
];

function formatINR(n) {
  if (n === null || n === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function MyProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "all";
  const [activeTab, setActiveTab] = useState(initialTab);

  const { account, isDemoMode } = useWallet();
  const { user } = useAuth();
  const toast = useToast();
  const { projects, loading, refetch } = useAllProjects();
  const { credits, refetch: refetchCredits } = useAllCredits();

  // Action Modals State
  const [editingPriceProj, setEditingPriceProj] = useState(null); // { proj, credit }
  const [newPrice, setNewPrice] = useState("");
  const [adjustingQtyProj, setAdjustingQtyProj] = useState(null); // { proj, credit }
  const [newQty, setNewQty] = useState("");
  const [resubmittingProj, setResubmittingProj] = useState(null); // proj
  const [resubmitFields, setResubmitFields] = useState({ description: "", estimatedCO2: "", methodology: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  React.useEffect(() => {
    document.title = "My Projects | CarbonChain";
  }, []);

  const effectiveWallet = account || (isDemoMode && user?.walletAddress);

  // Filter projects owned by the logged-in seller
  const myProjects = useMemo(() => {
    return projects.filter(
      (p) =>
        p.owner?.toLowerCase() === effectiveWallet?.toLowerCase() ||
        p.ownerUserId === user?.id ||
        (!effectiveWallet && p.ownerUserId === "usr_meridian")
    );
  }, [projects, effectiveWallet, user]);

  // Tab filtering
  const filteredProjects = useMemo(() => {
    return myProjects.filter((p) => {
      const s = p.status?.toLowerCase() || "";
      if (activeTab === "all") return true;
      if (activeTab === "pending") return s === "pending";
      if (activeTab === "listed") return s === "approved" || s === "listed";
      if (activeTab === "rejected") return s === "rejected";
      if (activeTab === "sold_out") return s === "sold out" || s === "sold_out";
      if (activeTab === "concluded" || activeTab === "completed") return s === "concluded" || s === "completed";
      return true;
    });
  }, [myProjects, activeTab]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: myProjects.length,
      pending: myProjects.filter((p) => p.status?.toLowerCase() === "pending").length,
      listed: myProjects.filter((p) => p.status?.toLowerCase() === "approved" || p.status?.toLowerCase() === "listed").length,
      rejected: myProjects.filter((p) => p.status?.toLowerCase() === "rejected").length,
      sold_out: myProjects.filter((p) => p.status?.toLowerCase() === "sold out" || p.status?.toLowerCase() === "sold_out").length,
      concluded: myProjects.filter((p) => p.status?.toLowerCase() === "concluded" || p.status?.toLowerCase() === "completed").length,
    };
  }, [myProjects]);

  // Handle Edit Price
  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!editingPriceProj?.credit) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateListingPrice(editingPriceProj.credit.id, effectiveWallet, newPrice);
      const msg = `Listing price updated to ₹${Number(newPrice).toLocaleString("en-IN")}/tCO2e.`;
      setActionSuccess(msg);
      toast?.success(msg);
      setEditingPriceProj(null);
      refetchCredits();
      refetch();
    } catch (err) {
      setActionError(err.message);
      toast?.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Adjust Quantity
  const handleSaveQty = async (e) => {
    e.preventDefault();
    if (!adjustingQtyProj?.credit) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateListingQuantity(adjustingQtyProj.credit.id, effectiveWallet, newQty);
      setActionSuccess(`Available quantity adjusted to ${Number(newQty).toLocaleString("en-IN")} tCO2e.`);
      setAdjustingQtyProj(null);
      refetchCredits();
      refetch();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Unlist
  const handleUnlist = async (creditId) => {
    if (!creditId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await unlistListing(creditId, effectiveWallet);
      setActionSuccess("Listing unlisted from marketplace.");
      refetchCredits();
      refetch();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Relist
  const handleRelist = async (creditId) => {
    if (!creditId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await relistListing(creditId, effectiveWallet);
      setActionSuccess("Listing restored to marketplace.");
      refetchCredits();
      refetch();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Resubmit Rejected Project per spec §4 & §6.2
  const handleResubmit = async (e) => {
    e.preventDefault();
    if (!resubmittingProj) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await resubmitRejectedProject(
        resubmittingProj.id,
        effectiveWallet,
        user?.id || "usr_meridian",
        resubmitFields
      );
      setActionSuccess(`Project revision submitted for verifier review.`);
      setResubmittingProj(null);
      refetch();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isSellUser(user)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-3">Seller Portal Only</h1>
        <p className="text-sm text-stone-500 mb-6">
          This portfolio is for selling organisations. Switch account or register as a project proponent.
        </p>
        <Link to="/marketplace" className="btn-outline">
          Go to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Action Success Banner ── */}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Action Error Banner ── */}
      {actionError && (
        <div className="mb-6 p-4 rounded border border-rose-300 bg-rose-50 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Edit Price Modal ── */}
      {editingPriceProj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="clean-card bg-white max-w-sm w-full p-6 shadow-xl border border-stone-200 rounded">
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Edit Listing Price</h3>
            <p className="text-xs text-stone-500 mb-4">{editingPriceProj.proj?.name}</p>
            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Price per tCO2e (₹)
                </label>
                <input
                  type="number"
                  min="10"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingPriceProj(null)}
                  className="btn-neutral-outline text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-outline text-xs px-4 py-1.5 flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Price"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Adjust Quantity Modal ── */}
      {adjustingQtyProj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="clean-card bg-white max-w-sm w-full p-6 shadow-xl border border-stone-200 rounded">
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Adjust Quantity to List</h3>
            <p className="text-xs text-stone-500 mb-4">{adjustingQtyProj.proj?.name}</p>
            <form onSubmit={handleSaveQty} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Available Quantity (Whole Tonnes tCO2e)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAdjustingQtyProj(null)}
                  className="btn-neutral-outline text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-outline text-xs px-4 py-1.5 flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Quantity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit & Resubmit Modal for Rejected Projects ── */}
      {resubmittingProj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="clean-card bg-white max-w-md w-full p-6 shadow-xl border border-stone-200 rounded">
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Edit &amp; Resubmit Revision</h3>
            <p className="text-xs text-stone-500 mb-2">Previous Rejection Reason:</p>
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 mb-4">
              {resubmittingProj.verifierNote || "Documents or telemetry missing."}
            </div>
            <form onSubmit={handleResubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Estimated Annual Credits (tCO2e)</label>
                <input
                  type="number"
                  value={resubmitFields.estimatedCO2}
                  onChange={(e) => setResubmitFields({ ...resubmitFields, estimatedCO2: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Methodology / Standard</label>
                <input
                  type="text"
                  value={resubmitFields.methodology}
                  onChange={(e) => setResubmitFields({ ...resubmitFields, methodology: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Revised Scope &amp; Notes</label>
                <textarea
                  rows={3}
                  value={resubmitFields.description}
                  onChange={(e) => setResubmitFields({ ...resubmitFields, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setResubmittingProj(null)}
                  className="btn-neutral-outline text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-outline text-xs px-4 py-1.5 flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Resubmit Revision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-stone-200 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#14532D] block mb-1">
            IPP Portfolio
          </span>
          <h1 className="text-2xl font-semibold text-stone-900">My Projects</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Manage your registered carbon projects, adjust market listings, and track verification decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { refetch(); refetchCredits(); }} className="btn-neutral-outline text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link to="/submit" className="btn-outline text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Submit Project
          </Link>
        </div>
      </div>

      {/* ── Tabs Bar per spec §6.2 ── */}
      <div className="flex items-center gap-1 border border-stone-200 rounded p-1 mb-6 bg-stone-50 overflow-x-auto w-fit">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchParams({ tab: tab.id });
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white text-[#14532D] border border-stone-200 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                }`}
              >
                {counts[tab.id] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Projects List ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-stone-100 rounded animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 rounded bg-stone-50/50">
          <FileText className="w-8 h-8 text-stone-400 mx-auto mb-3" />
          <p className="text-sm text-stone-600 mb-3">
            {myProjects.length === 0
              ? "You have not submitted any projects yet."
              : `No projects in "${TABS.find((t) => t.id === activeTab)?.label}".`}
          </p>
          {myProjects.length === 0 && (
            <Link to="/submit" className="btn-outline text-xs">
              Submit your first project
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((proj) => {
            const matchedCredit = credits.find(
              (c) => c.projectId === proj.id || c.projectId === proj.registryId
            );
            const isConcluded = proj.status?.toLowerCase() === "concluded" || proj.status?.toLowerCase() === "completed";
            const isRejected = proj.status?.toLowerCase() === "rejected";
            const isPending = proj.status?.toLowerCase() === "pending";
            const isListed = matchedCredit?.listed && !matchedCredit?.retired && !isConcluded;

            // Computed quantities
            const issuedQty = proj.verifiedAmount || proj.estimatedCO2 || 0;
            const pricePerTonne = matchedCredit?.pricePerTonne || proj.askingPrice || 0;

            // Historical sales for this project
            const salesHistory = getPurchasesHistory().filter(
              (p) => p.projectId === proj.id || p.projectId === proj.registryId
            );
            const soldQty = salesHistory.reduce((sum, p) => sum + (p.quantity || p.amount || 0), 0);
            const revenue = salesHistory.reduce((sum, p) => sum + (p.subtotal || p.price || 0), 0);
            const retiredQty = salesHistory.reduce((sum, p) => (p.retired ? sum + (p.quantity || 0) : sum), 0);
            const remainingQty = isConcluded ? 0 : Math.max(0, issuedQty - soldQty);

            return (
              <div
                key={proj.id}
                className="clean-card p-5 bg-white border border-stone-200 rounded hover:border-stone-300 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left: Image & Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <img
                      src={resolveProjectImage(proj)}
                      alt={proj.name}
                      className="w-24 h-24 object-cover rounded border border-stone-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/projects/${proj.slug || proj.id}`}
                          className="text-base font-semibold text-stone-900 hover:text-[#14532D] transition truncate"
                        >
                          {proj.name}
                        </Link>
                        <StatusBadge status={proj.status} />
                      </div>

                      <p className="text-xs text-stone-500 font-mono">
                        {proj.registryId || proj.id} • {proj.projectType} • {proj.location}
                      </p>

                      {/* Status Timeline / Reason Banner */}
                      {isPending && (
                        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 w-fit">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Submitted on {new Date(proj.submittedAt || Date.now()).toLocaleDateString("en-IN")} • Under verifier review</span>
                        </div>
                      )}

                      {isRejected && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
                          <span className="font-semibold">Review Returned:</span> {proj.verifierNote || "Revision requested by verification authority."}
                        </div>
                      )}

                      {isConcluded && (
                        <div className="flex items-center gap-2 text-xs text-stone-700 bg-stone-100 px-2.5 py-1.5 rounded border border-stone-200 w-fit font-medium">
                          <Lock className="w-3.5 h-3.5 text-stone-500" />
                          <span>This project is concluded and its credits are permanently retired.</span>
                        </div>
                      )}

                      {/* Metrics Row: Issued, Sold, Retired, Remaining */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                        <div>
                          <span className="text-stone-400 block text-[10px]">Issued</span>
                          <span className="font-mono font-medium text-stone-800">
                            {issuedQty.toLocaleString("en-IN")} tCO2e
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Sold</span>
                          <span className="font-mono font-medium text-stone-800">
                            {soldQty.toLocaleString("en-IN")} tCO2e
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Retired</span>
                          <span className="font-mono font-medium text-stone-800">
                            {retiredQty.toLocaleString("en-IN")} tCO2e
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Remaining</span>
                          <span className="font-mono font-medium text-emerald-800">
                            {remainingQty.toLocaleString("en-IN")} tCO2e
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-100">
                    <Link
                      to={`/projects/${proj.slug || proj.id}`}
                      className="btn-neutral-outline text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Page
                    </Link>

                    {/* Concluded State: Relisting, editing, price-changing and resubmitting blocked */}
                    {isConcluded ? (
                      <span className="text-[11px] font-mono text-stone-500 flex items-center gap-1 bg-stone-100 px-2 py-1 rounded border border-stone-200">
                        <Lock className="w-3 h-3 text-stone-400" />
                        Concluded
                      </span>
                    ) : (
                      <>
                        {/* Listed Actions */}
                        {matchedCredit && !isRejected && (
                          <div className="flex flex-wrap lg:flex-col gap-1.5 items-end">
                            <button
                              onClick={() => {
                                setEditingPriceProj({ proj, credit: matchedCredit });
                                setNewPrice(String(pricePerTonne));
                              }}
                              className="btn-outline text-xs px-2.5 py-1"
                            >
                              Edit price
                            </button>
                            <button
                              onClick={() => {
                                setAdjustingQtyProj({ proj, credit: matchedCredit });
                                setNewQty(String(matchedCredit.amount));
                              }}
                              className="btn-outline text-xs px-2.5 py-1"
                            >
                              Adjust quantity
                            </button>
                            {isListed ? (
                              <button
                                onClick={() => handleUnlist(matchedCredit.id)}
                                className="btn-neutral-outline text-xs px-2.5 py-1 text-stone-600"
                              >
                                Unlist
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRelist(matchedCredit.id)}
                                className="btn-outline text-xs px-2.5 py-1 text-emerald-800"
                              >
                                Relist
                              </button>
                            )}
                          </div>
                        )}

                        {/* Rejected Action */}
                        {isRejected && (
                          <button
                            onClick={() => {
                              setResubmittingProj(proj);
                              setResubmitFields({
                                description: proj.description || "",
                                estimatedCO2: String(proj.estimatedCO2 || ""),
                                methodology: proj.methodology || "",
                              });
                            }}
                            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 text-stone-900"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Edit and resubmit
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
