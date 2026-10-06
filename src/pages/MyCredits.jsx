import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layers,
  ShoppingBag,
  Leaf,
  RefreshCw,
  ExternalLink,
  Tag,
  X,
  Wallet,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Coins,
  History,
} from "lucide-react";
import { useAllCredits } from "../hooks/useLedger";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { listCredit, cancelListing, getPurchasesHistory } from "../services/ledgerService";
import ProjectTypeIcon from "../components/ProjectTypeIcon";

const TABS = ["Owned", "Purchases", "Listed", "Retired"];

function formatINR(n) {
  if (n === null || n === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function MyCredits() {
  const { account, isDemoMode, inrBalance, addDemoFunds } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { credits, loading, refetch } = useAllCredits();
  const [activeTab, setActiveTab] = useState("Owned");
  const [actionState, setActionState] = useState({});
  const [listModal, setListModal] = useState(null); // { creditId, amount }
  const [listPrice, setListPrice] = useState("");
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  useEffect(() => {
    document.title = "My Credits & Portfolio | CarbonChain";
  }, []);

  const effectiveWallet = account || (isDemoMode && user?.walletAddress);

  const myCredits = useMemo(() => {
    if (!effectiveWallet) return [];
    return credits.filter((c) => c.owner === effectiveWallet || c.ownerUserId === user?.id);
  }, [credits, effectiveWallet, user]);

  const owned = myCredits.filter((c) => !c.listed && !c.retired);
  const listed = myCredits.filter((c) => c.listed && !c.retired);
  const retired = myCredits.filter((c) => c.retired);

  // Load purchase history for this wallet
  useEffect(() => {
    if (effectiveWallet) {
      const history = getPurchasesHistory(effectiveWallet);
      setPurchaseHistory(history);
    }
  }, [effectiveWallet, credits]);

  const tabData = {
    Owned: owned,
    Purchases: purchaseHistory,
    Listed: listed,
    Retired: retired,
  };
  const displayed = tabData[activeTab] || [];

  const getState = (id) => actionState[id] || { loading: false, error: null };
  const setState = (id, patch) => setActionState((p) => ({ ...p, [id]: { ...getState(id), ...patch } }));

  const handleList = async () => {
    if (!listModal || !listPrice) return;
    const priceNum = Number(listPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid price per tonne.");
      return;
    }
    setState(listModal.creditId, { loading: true, error: null });
    try {
      await listCredit(listModal.creditId, effectiveWallet, {
        price: priceNum * listModal.amount,
        pricePerTonne: priceNum,
      });
      setListModal(null);
      setListPrice("");
      refetch();
    } catch (err) {
      setState(listModal.creditId, { loading: false, error: err.message });
    }
  };

  const handleCancelListing = async (creditId) => {
    setState(creditId, { loading: true, error: null });
    try {
      await cancelListing(creditId, effectiveWallet);
      refetch();
    } catch (err) {
      setState(creditId, { loading: false, error: err.message });
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-3">Please sign in</h1>
        <Link to="/login" className="btn-outline">
          Sign in
        </Link>
      </div>
    );
  }

  // Calculate portfolio totals
  const totalOwnedTonnes = owned.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalRetiredTonnes = retired.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalSpent = purchaseHistory.reduce((sum, p) => sum + (Number(p.pricePaid) || 0), 0) ||
    myCredits.reduce((sum, c) => sum + (Number(c.paidPrice || c.price) || 0), 0);

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* List Modal */}
      {listModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded p-6 max-w-sm w-full shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-charcoal">List MCU on Marketplace</h3>
              <button onClick={() => setListModal(null)} className="text-gray-400 hover:text-charcoal">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-charcoal-muted mb-4">
              Set a price per tCO2e. Total listing price will be calculated automatically.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1">
                Price per tCO2e (₹)
              </label>
              <input
                type="number"
                min="1"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                placeholder="e.g. 170"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-forest font-mono"
                autoFocus
              />
              {listPrice && Number(listPrice) > 0 && (
                <p className="text-[11px] text-charcoal-muted mt-1">
                  Total: {formatINR(Number(listPrice) * listModal.amount)} for {listModal.amount.toLocaleString("en-IN")} tCO2e
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleList} disabled={!listPrice} className="btn-outline flex-1 text-sm py-2">
                {getState(listModal.creditId).loading ? "Confirming..." : "List on marketplace"}
              </button>
              <button onClick={() => setListModal(null)} className="btn-neutral-outline text-sm py-2 px-4">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-200 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-forest block mb-1">MCU Portfolio &amp; History</span>
          <h1 className="text-2xl font-semibold text-charcoal">My Credits &amp; Purchases</h1>
          <p className="text-sm text-charcoal-muted mt-0.5">
            Track purchased project credits, remaining wallet funds, price paid per unit, and submit retirement requests.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Link to="/marketplace" className="btn-outline text-xs flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            Buy More MCUs
          </Link>
          <button onClick={refetch} className="btn-neutral-outline text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── TOP SUMMARY BAR: Wallet Balance & Portfolio Metrics ── */}
      {effectiveWallet && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Remaining Wallet Balance */}
          <div className="clean-card p-4 border-l-4 border-l-emerald-600 bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-charcoal-muted flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                Wallet Balance (Remaining)
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">
              ₹{Number(inrBalance || 0).toLocaleString("en-IN")}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] text-charcoal-subtle">Ready for credit purchases</span>
              <button
                type="button"
                onClick={() => addDemoFunds(100000)}
                className="text-[10px] font-bold text-forest hover:underline cursor-pointer"
              >
                + Add ₹1,00,000
              </button>
            </div>
          </div>

          {/* Card 2: Total Active Holdings */}
          <div className="clean-card p-4 border-l-4 border-l-forest bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-charcoal-muted flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-forest" />
                Active MCU Holdings
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-charcoal mt-1">
              {totalOwnedTonnes.toLocaleString("en-IN")}{" "}
              <span className="text-xs font-normal text-charcoal-muted font-sans">tCO2e</span>
            </div>
            <div className="text-[10px] text-charcoal-subtle mt-2 pt-2 border-t border-gray-100">
              {owned.length} active credit lot{owned.length !== 1 ? "s" : ""} available to retire
            </div>
          </div>

          {/* Card 3: Total Capital Spent / Invested */}
          <div className="clean-card p-4 border-l-4 border-l-stone-400 bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-charcoal-muted flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-stone-600" />
                Total Spent on MCUs
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-charcoal mt-1">
              {formatINR(totalSpent)}
            </div>
            <div className="text-[10px] text-charcoal-subtle mt-2 pt-2 border-t border-gray-100">
              Across all recorded purchases
            </div>
          </div>

          {/* Card 4: Retired Offset Impact */}
          <div className="clean-card p-4 border-l-4 border-l-teal-600 bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-charcoal-muted flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-teal-700" />
                Retired Offsets
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-teal-900 mt-1">
              {totalRetiredTonnes.toLocaleString("en-IN")}{" "}
              <span className="text-xs font-normal text-charcoal-muted font-sans">tCO2e</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] text-charcoal-subtle">Permanent claim</span>
              {retired.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("Retired")}
                  className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  View certificates &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border border-gray-200 rounded overflow-hidden mb-6 w-fit bg-white">
        {TABS.map((tab) => {
          const count = tabData[tab]?.length || 0;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                isActive ? "bg-forest text-white" : "bg-white text-charcoal-muted hover:bg-gray-50"
              }`}
            >
              <span>{tab === "Purchases" ? "Purchase History" : `${tab} Credits`}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-charcoal"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {!effectiveWallet ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded bg-white">
          <Layers className="w-8 h-8 text-charcoal-subtle mx-auto mb-3" />
          <p className="text-sm text-charcoal-muted mb-3">Connect your wallet to view your credits and purchase history.</p>
          <Link to="/connect-wallet" className="btn-outline-sm">
            Set up wallet
          </Link>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : activeTab === "Purchases" ? (
        /* ─── TAB 2: PURCHASE HISTORY ─── */
        purchaseHistory.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded bg-white">
            <History className="w-8 h-8 text-charcoal-subtle mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-charcoal mb-1">No Purchases Recorded Yet</h3>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto mb-4">
              When you purchase MCUs on any project page or marketplace, your complete order history, price paid, and retirement options will appear here.
            </p>
            <Link to="/marketplace" className="btn-outline text-xs">
              Browse &amp; Buy MCUs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-charcoal-muted font-mono flex items-center justify-between pb-2 px-1">
              <span>Showing {purchaseHistory.length} recorded project purchase{purchaseHistory.length !== 1 ? "s" : ""}</span>
              <span>Deducted from connected wallet</span>
            </div>

            {purchaseHistory.map((item) => {
              const matchedCredit = credits.find((c) => c.id === item.creditId);
              const isAlreadyRetired = matchedCredit?.retired;

              return (
                <div key={item.id || item.creditId} className="clean-card p-5 bg-white border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <ProjectTypeIcon type={item.projectType} size="sm" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-charcoal">{item.projectName}</h3>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                          {item.creditId}
                        </span>
                        {isAlreadyRetired && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                            Retired
                          </span>
                        )}
                      </div>

                      {/* Explicit details on how much they paid for each */}
                      <div className="flex items-center gap-3 text-xs text-charcoal-muted mt-1.5 flex-wrap">
                        <span className="font-medium text-forest">
                          {item.amount?.toLocaleString("en-IN")} tCO2e
                        </span>
                        <span>&bull;</span>
                        <span className="font-mono font-semibold text-stone-900 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200">
                          Paid: ₹{item.pricePerTonnePaid?.toLocaleString("en-IN")}/tCO2e
                        </span>
                        <span>&bull;</span>
                        <span className="font-mono font-bold text-stone-900">
                          Total: {formatINR(item.pricePaid)}
                        </span>
                      </div>

                      {/* Transaction info */}
                      <div className="flex items-center gap-3 text-[11px] text-charcoal-subtle mt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.purchasedAt ? new Date(item.purchasedAt).toLocaleString("en-IN") : "Recently"}
                        </span>
                        {item.blockIndex !== undefined && (
                          <>
                            <span>&bull;</span>
                            <Link to={`/ledger/${item.blockIndex}`} className="text-forest hover:underline flex items-center gap-0.5 font-mono">
                              Block #{item.blockIndex}
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <Link
                      to={`/credit/${item.creditId}`}
                      className="btn-neutral-outline text-xs py-1.5 px-3"
                    >
                      Credit Record
                    </Link>

                    {!isAlreadyRetired ? (
                      <Link
                        to={`/retire/${item.creditId}`}
                        className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 bg-emerald-50/50"
                        title="Submit retirement request for this credit"
                      >
                        <Leaf className="w-3.5 h-3.5 text-forest" />
                        <span>Retire Credits Request</span>
                      </Link>
                    ) : (
                      <Link
                        to={`/certificate/${item.creditId}`}
                        className="btn-neutral-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-teal-700" />
                        <span>Retirement Certificate</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded bg-white">
          <Layers className="w-8 h-8 text-charcoal-subtle mx-auto mb-3" />
          <p className="text-sm text-charcoal-muted">
            {activeTab === "Owned"
              ? "No active unlisted credits. Buy from the marketplace or view your purchase history."
              : `No ${activeTab.toLowerCase()} credits found.`}
          </p>
          {activeTab === "Owned" && (
            <Link to="/marketplace" className="btn-outline text-xs mt-3 inline-block">
              Browse marketplace
            </Link>
          )}
        </div>
      ) : (
        /* ─── TAB 1, 3, 4: OWNED / LISTED / RETIRED CARDS ─── */
        <div className="space-y-3">
          {displayed.map((credit) => {
            const st = getState(credit.id);
            const proj = credit.project;
            const paidUnit = credit.paidPricePerTonne || credit.pricePerTonne || 150;
            const paidTotal = credit.paidPrice || credit.price || (credit.amount * paidUnit);

            return (
              <div key={credit.id} className="clean-card p-5 flex items-start gap-4 bg-white">
                <ProjectTypeIcon type={proj?.projectType} size="sm" imageUrl={proj?.imageUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="text-sm font-semibold text-charcoal">{proj?.name || "Unknown Project"}</h3>
                      <div className="font-mono text-[11px] text-charcoal-subtle mt-0.5">{credit.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {credit.listed && <span className="badge-listed">Listed for Sale</span>}
                      {credit.retired && <span className="badge-retired">Retired &amp; Locked</span>}
                      {!credit.listed && !credit.retired && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Active Holding
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-charcoal-muted mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-charcoal">
                      {credit.amount.toLocaleString("en-IN")} tCO2e
                    </span>
                    <span>&bull;</span>
                    <span>{proj?.location || "India"}</span>
                  </div>

                  {/* Explicit breakdown: Price paid and total cost */}
                  <div className="flex items-center gap-2 text-xs mt-2 flex-wrap">
                    <span className="text-[11px] font-mono bg-stone-50 border border-stone-200 text-stone-700 px-2 py-0.5 rounded">
                      Price Paid: <strong className="text-stone-900">₹{paidUnit.toLocaleString("en-IN")}/tCO2e</strong>
                    </span>
                    <span className="text-[11px] font-mono bg-stone-50 border border-stone-200 text-stone-700 px-2 py-0.5 rounded">
                      Total Paid: <strong className="text-[#14532D]">{formatINR(paidTotal)}</strong>
                    </span>
                  </div>

                  {credit.listed && (
                    <div className="text-xs text-charcoal-muted mt-1">
                      Listed on marketplace at ₹{credit.pricePerTonne.toLocaleString("en-IN")}/tCO2e &bull; Total: {formatINR(credit.price)}
                    </div>
                  )}

                  {credit.retired && credit.retiredAt && (
                    <div className="text-xs text-teal-800 mt-1 bg-teal-50/60 p-2 rounded border border-teal-100">
                      Retired on {new Date(credit.retiredAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      {credit.retireeName && <span> by {credit.retireeName}</span>}
                      {credit.reason && <p className="text-[11px] text-teal-700 mt-0.5 italic">"{credit.reason}"</p>}
                    </div>
                  )}

                  {st.error && <p className="text-xs text-red-600 mt-1">{st.error}</p>}
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link to={`/credit/${credit.id}`} className="btn-neutral-outline text-xs py-1.5 px-3 text-center">
                    Detail
                  </Link>

                  {credit.retired && (
                    <Link
                      to={`/certificate/${credit.id}`}
                      className="btn-neutral-outline text-xs py-1.5 px-3 flex items-center justify-center gap-1 text-teal-800 border-teal-200"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Certificate
                    </Link>
                  )}

                  {!credit.retired && !credit.listed && (
                    <>
                      {/* Prominent Option to Retire Credits Request */}
                      <Link
                        to={`/retire/${credit.id}`}
                        className="btn-outline text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 bg-emerald-50/40"
                        title="Submit retirement request for this credit lot"
                      >
                        <Leaf className="w-3.5 h-3.5 text-forest" />
                        <span>Retire Credits Request</span>
                      </Link>

                      <button
                        onClick={() => setListModal({ creditId: credit.id, amount: credit.amount })}
                        disabled={st.loading}
                        className="btn-neutral-outline text-xs py-1.5 px-3 flex items-center justify-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        List for Sale
                      </button>
                    </>
                  )}

                  {credit.listed && (
                    <button
                      onClick={() => handleCancelListing(credit.id)}
                      disabled={st.loading}
                      className="btn-neutral-outline text-xs py-1.5 px-3 text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      {st.loading ? "..." : "Delist"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
