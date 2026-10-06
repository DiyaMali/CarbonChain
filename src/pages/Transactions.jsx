import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Search,
  Filter,
  RefreshCw,
  Coins,
  Leaf,
  Layers,
  Clock,
  ArrowUpRight,
  Check,
  Copy,
  TrendingUp,
  Receipt,
  User,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import {
  getAllTransactions,
  getPurchasesHistory,
  getSalesHistory,
  getAllLedgerBlocks,
  verifyChainIntegrity,
  getAllCredits,
} from "../services/ledgerService";
import { isSellUser, isBuyUser } from "../services/roleService";
import { downloadLedgerBlockRecord } from "../utils/exportProject";
import ProjectTypeIcon from "../components/ProjectTypeIcon";

function formatINR(n) {
  if (n === null || n === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Transactions() {
  const { account, isDemoMode } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isSeller = isSellUser(user);
  const isBuyer = isBuyUser(user);

  const defaultTab = searchParams.get("tab") || (isSeller && !isBuyer ? "sales" : "purchases");
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const effectiveWallet = account || (isDemoMode && user?.walletAddress);

  useEffect(() => {
    document.title = "Transactions & Ledger | CarbonChain";
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const allTxs = useMemo(() => {
    return getAllTransactions();
  }, [effectiveWallet]);

  const purchases = useMemo(() => {
    return getPurchasesHistory(effectiveWallet);
  }, [effectiveWallet]);

  const sales = useMemo(() => {
    return getSalesHistory(effectiveWallet);
  }, [effectiveWallet]);

  const blocks = useMemo(() => {
    return getAllLedgerBlocks();
  }, []);

  const credits = useMemo(() => {
    return getAllCredits();
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await verifyChainIntegrity();
      setVerifyResult(res);
    } catch (e) {
      setVerifyResult({ intact: false, reason: e.message });
    } finally {
      setVerifying(false);
    }
  };

  const copyText = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopiedHash(txt);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const q = searchTerm.toLowerCase();
      return (
        !q ||
        p.projectName?.toLowerCase().includes(q) ||
        p.creditId?.toLowerCase().includes(q) ||
        p.projectType?.toLowerCase().includes(q) ||
        p.paymentRef?.toLowerCase().includes(q) ||
        p.paymentReference?.toLowerCase().includes(q)
      );
    });
  }, [purchases, searchTerm]);

  // Filtered Sales (Seller view per spec §6.3)
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const q = searchTerm.toLowerCase();
      return (
        !q ||
        s.projectName?.toLowerCase().includes(q) ||
        s.creditId?.toLowerCase().includes(q) ||
        s.buyerUserId?.toLowerCase().includes(q) ||
        s.buyerWallet?.toLowerCase().includes(q) ||
        s.paymentRef?.toLowerCase().includes(q) ||
        s.paymentReference?.toLowerCase().includes(q)
      );
    });
  }, [sales, searchTerm]);

  // Filtered All Transactions
  const filteredAllTxs = useMemo(() => {
    return allTxs.filter((tx) => {
      const q = searchTerm.toLowerCase();
      return (
        !q ||
        tx.project?.toLowerCase().includes(q) ||
        tx.type?.toLowerCase().includes(q) ||
        tx.tokenId?.toLowerCase().includes(q) ||
        tx.txHash?.toLowerCase().includes(q)
      );
    });
  }, [allTxs, searchTerm]);

  // Seller metrics
  const totalSalesTonnes = useMemo(() => {
    return sales.reduce((acc, s) => acc + (s.quantity || s.amount || 0), 0);
  }, [sales]);

  const totalNetRevenue = useMemo(() => {
    return sales.reduce((acc, s) => {
      const subtotal = s.subtotal || (s.quantity || 0) * (s.pricePerTonne || 0);
      const fee = s.platformFee !== undefined ? s.platformFee : Math.round(subtotal * 0.01);
      return acc + (subtotal - fee);
    }, 0);
  }, [sales]);

  // Buyer metrics
  const totalPurchasedTonnes = useMemo(() => {
    return purchases.reduce((acc, p) => acc + (p.quantity || p.amount || 0), 0);
  }, [purchases]);

  const totalAmountSpent = useMemo(() => {
    return purchases.reduce((acc, p) => acc + (p.pricePaid || p.totalPaid || 0), 0);
  }, [purchases]);

  const totalBlocks = blocks.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#14532D] block mb-1">
            Settlement &amp; Audit Trail
          </span>
          <h1 className="text-2xl font-semibold text-stone-900">
            {isSeller && !isBuyer ? "Sales & Settlements" : "Transaction History"}
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Cryptographic ledger records anchored by SHA-256 hash chains.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleVerifyChain}
            disabled={verifying}
            className="btn-outline text-xs flex items-center gap-1.5 cursor-pointer"
            title="Recompute all block hashes to verify chain integrity"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${verifying ? "animate-spin" : "text-[#14532D]"}`} />
            {verifying ? "Verifying Chain..." : "Verify Ledger Integrity"}
          </button>
        </div>
      </div>

      {/* ── Integrity Verification Banner ── */}
      {verifyResult && (
        <div
          className={`p-4 rounded border text-xs flex items-start justify-between gap-3 ${
            verifyResult.intact
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {verifyResult.intact ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {verifyResult.intact
                  ? "Ledger Integrity Verified"
                  : "Ledger Integrity Failure Detected"}
              </p>
              <p className="mt-0.5 text-stone-600">
                {verifyResult.intact
                  ? `All ${verifyResult.checked} consecutive blocks re-hashed and confirmed intact against SHA-256 genesis root.`
                  : verifyResult.reason || "Hash chain mismatch."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVerifyResult(null)}
            className="text-stone-400 hover:text-stone-700 p-1"
          >
            <AlertCircle className="w-4 h-4 rotate-45" />
          </button>
        </div>
      )}

      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSeller ? (
          <>
            {/* Seller Metric 1 */}
            <div className="bg-white p-4 rounded border border-stone-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
                <span>Credits Sold</span>
                <TrendingUp className="w-4 h-4 text-[#14532D]" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-stone-900">
                  {totalSalesTonnes.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-stone-500 ml-1">tCO2e</span>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                Across {sales.length} settled buyer order{sales.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Seller Metric 2 */}
            <div className="bg-white p-4 rounded border border-stone-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
                <span>Net Payout Received</span>
                <Coins className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-emerald-800">
                  {formatINR(totalNetRevenue)}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                Net after 1% platform fee deduction
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Buyer Metric 1 */}
            <div className="bg-white p-4 rounded border border-stone-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
                <span>Purchased Credits</span>
                <Coins className="w-4 h-4 text-[#14532D]" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-stone-900">
                  {totalPurchasedTonnes.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-stone-500 ml-1">tCO2e</span>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                Across {purchases.length} settled purchase{purchases.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Buyer Metric 2 */}
            <div className="bg-white p-4 rounded border border-stone-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
                <span>Total Value Paid</span>
                <ArrowLeftRight className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-emerald-800">
                  {formatINR(totalAmountSpent)}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                Includes 1% platform settlement fee
              </div>
            </div>
          </>
        )}

        {/* Common Metric 3: Ledger Blocks */}
        <div className="bg-white p-4 rounded border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
            <span>Ledger Blocks</span>
            <Layers className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-stone-900">
              #{totalBlocks}
            </span>
            <span className="text-xs text-stone-500 ml-1">blocks</span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
            SHA-256 tamper-evident chain
          </div>
        </div>

        {/* Common Metric 4: CarbonChain Network */}
        <div className="bg-white p-4 rounded border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
            <span>Settlement Network</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-stone-900">CarbonChain Network</span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-emerald-700 font-medium">
            SHA-256 hash-chained consensus
          </div>
        </div>
      </div>

      {/* ── Tabs & Filter Bar ── */}
      <div className="bg-white p-4 rounded border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Tab Pill */}
          <div className="flex p-1 bg-stone-100 rounded border border-stone-200/80 w-fit text-xs font-semibold">
            {/* Sales Tab (for Sellers) */}
            {isSeller && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("sales");
                  setSearchParams({ tab: "sales" });
                }}
                className={`px-4 py-1.5 rounded transition-all cursor-pointer ${
                  activeTab === "sales"
                    ? "bg-white text-[#14532D] shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Sales ({sales.length})
              </button>
            )}

            {/* Purchases Tab (for Buyers) */}
            {isBuyer && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("purchases");
                  setSearchParams({ tab: "purchases" });
                }}
                className={`px-4 py-1.5 rounded transition-all cursor-pointer ${
                  activeTab === "purchases"
                    ? "bg-white text-[#14532D] shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Purchases History ({purchases.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setSearchParams({ tab: "all" });
              }}
              className={`px-4 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-[#14532D] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              All Activity ({allTxs.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("blocks");
                setSearchParams({ tab: "blocks" });
              }}
              className={`px-4 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === "blocks"
                  ? "bg-white text-[#14532D] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Ledger Blocks ({blocks.length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search project, payment ref, or hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded focus:outline-none focus:border-[#14532D]"
            />
          </div>
        </div>

        {/* ── TAB: SALES (Seller view per spec §6.3) ── */}
        {activeTab === "sales" && (
          <div className="overflow-x-auto">
            {filteredSales.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-200 rounded bg-stone-50/50">
                <Coins className="w-8 h-8 text-stone-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-stone-800">No sales recorded</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  When buyers purchase credits from your listed projects, detailed settlements with subtotal, platform fees, and net payouts will appear here.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Buyer</th>
                    <th className="py-3 px-3">Project / Asset</th>
                    <th className="py-3 px-3">Quantity</th>
                    <th className="py-3 px-3">Subtotal</th>
                    <th className="py-3 px-3">Fee (1%)</th>
                    <th className="py-3 px-3">Net Received</th>
                    <th className="py-3 px-3">Payment Ref</th>
                    <th className="py-3 px-3 text-right">Ledger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredSales.map((item, idx) => {
                    const subtotal = item.subtotal || (item.quantity || 0) * (item.pricePerTonne || 0);
                    const fee = item.platformFee !== undefined ? item.platformFee : Math.round(subtotal * 0.01);
                    const netReceived = subtotal - fee;
                    const dateStr = item.purchasedAt
                      ? new Date(item.purchasedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recent";
                    const buyerLabel =
                      item.buyerUserId === "usr_ironbridge"
                        ? "Ironbridge Steel and Cement Ltd"
                        : item.buyerWallet
                        ? `${item.buyerWallet.slice(0, 6)}...${item.buyerWallet.slice(-4)}`
                        : "Institutional Buyer";

                    return (
                      <tr key={item.id || idx} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap text-stone-500">{dateStr}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-semibold text-stone-800">{buyerLabel}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-stone-900">{item.projectName}</div>
                          <div className="text-[10px] font-mono text-stone-400">
                            {item.serialRange || item.creditId}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono font-semibold text-stone-900">
                          {item.quantity?.toLocaleString("en-IN")} <span className="text-[11px] text-stone-500">t</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-stone-700">
                          {formatINR(subtotal)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-stone-400">
                          -{formatINR(fee)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-emerald-800">
                          {formatINR(netReceived)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-stone-600">
                          {item.paymentRef || item.paymentReference || "-"}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-right">
                          {item.blockIndex !== undefined ? (
                            <Link
                              to={`/ledger/${item.blockIndex}`}
                              className="text-[#14532D] font-mono hover:underline inline-flex items-center gap-1"
                            >
                              <span>Block #{item.blockIndex}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <Link
                              to="/verifier/ledger"
                              className="text-[#14532D] font-mono hover:underline inline-flex items-center gap-1"
                            >
                              <span>Ledger</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── TAB: PURCHASES HISTORY (Buyer view per spec §10.3) ── */}
        {activeTab === "purchases" && (
          <div className="overflow-x-auto">
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-200 rounded bg-stone-50/50">
                <Coins className="w-8 h-8 text-stone-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-stone-800">No purchases found</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  When you purchase carbon credits, your detailed receipts, serial allocations, and ledger block proofs will appear here.
                </p>
                <Link
                  to="/marketplace"
                  className="btn-outline text-xs inline-block mt-4"
                >
                  Browse Marketplace
                </Link>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Project / Serial</th>
                    <th className="py-3 px-3">Quantity</th>
                    <th className="py-3 px-3">Amount Paid</th>
                    <th className="py-3 px-3">Payment Ref</th>
                    <th className="py-3 px-3">Block Record</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredPurchases.map((item, idx) => {
                    const matchedCredit = credits.find((c) => c.id === item.creditId);
                    const isRetired = matchedCredit?.retired;

                    return (
                      <tr key={item.id || idx} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap text-stone-500">
                          {item.purchasedAt
                            ? new Date(item.purchasedAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "Recent"}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-stone-900">{item.projectName}</div>
                          <div className="text-[10px] font-mono text-stone-400">
                            {item.serialRange || item.creditId}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono font-semibold text-stone-900">
                          {item.quantity?.toLocaleString("en-IN")}{" "}
                          <span className="text-[11px] text-stone-500">tCO2e</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono font-semibold text-stone-900">
                          {formatINR(item.totalPaid || item.pricePaid)}
                          <span className="block text-[10px] text-stone-400 font-normal">
                            @{formatINR(item.pricePerTonne || item.pricePerTonnePaid)} / t
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-stone-600">
                          {item.paymentRef || item.paymentReference || "-"}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {item.blockIndex !== undefined ? (
                            <Link
                              to={`/ledger/${item.blockIndex}`}
                              className="text-[#14532D] font-mono hover:underline inline-flex items-center gap-1"
                            >
                              <span>Block #{item.blockIndex}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="font-mono text-stone-400 text-[11px]">Ledger Sync</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-right space-x-1.5">
                          <Link
                            to="/my-credits"
                            className="btn-outline text-[11px] px-2.5 py-1 inline-flex items-center gap-1"
                          >
                            View Holdings
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── TAB: ALL ACTIVITY TABLE ── */}
        {activeTab === "all" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Event Type</th>
                  <th className="py-3 px-3">Project / Asset</th>
                  <th className="py-3 px-3">Quantity</th>
                  <th className="py-3 px-3">Value</th>
                  <th className="py-3 px-3">Block Hash</th>
                  <th className="py-3 px-3 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredAllTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-3 text-stone-500 whitespace-nowrap">{tx.date}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          tx.type === "Purchase"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : tx.type === "Retirement"
                            ? "bg-stone-100 text-stone-700 border border-stone-200"
                            : tx.type === "Minting"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : tx.type === "Listing"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-stone-100 text-stone-700 border border-stone-200"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-900">{tx.project}</div>
                      <div className="font-mono text-[10px] text-stone-500">{tx.tokenId}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono">
                      {tx.quantity ? `${tx.quantity.toLocaleString("en-IN")} t` : "-"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-stone-800 font-semibold">
                      {tx.value ? formatINR(tx.value) : "-"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      <span className="text-stone-500 truncate max-w-[120px] inline-block align-bottom" title={tx.blockHash}>
                        {tx.blockHash ? `${tx.blockHash.slice(0, 8)}...${tx.blockHash.slice(-6)}` : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <Link
                        to={`/ledger/${tx.blockIndex}`}
                        className="btn-neutral-outline text-[11px] px-2.5 py-1 inline-flex items-center gap-1"
                      >
                        Block #{tx.blockIndex}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: LEDGER BLOCKS ── */}
        {activeTab === "blocks" && (
          <div className="overflow-x-auto space-y-3">
            <div className="text-xs text-stone-500 font-mono pb-1">
              Consensus Blocks ({blocks.length} total blocks in hash-chain)
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-3">Height</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Block Hash</th>
                  <th className="py-3 px-3">Previous Hash</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {blocks.map((b) => (
                  <tr key={b.index} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-stone-900">#{b.index}</td>
                    <td className="py-3 px-3 font-sans font-semibold text-[#14532D]">
                      {b.action}
                    </td>
                    <td className="py-3 px-3 text-emerald-800 truncate max-w-[140px]" title={b.hash}>
                      {b.hash.slice(0, 8)}...{b.hash.slice(-6)}
                    </td>
                    <td className="py-3 px-3 text-stone-400 truncate max-w-[140px]" title={b.prevHash}>
                      {b.prevHash.slice(0, 8)}...{b.prevHash.slice(-6)}
                    </td>
                    <td className="py-3 px-3 font-sans text-stone-500 whitespace-nowrap">
                      {new Date(b.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right space-x-1.5 font-sans">
                      <Link
                        to={`/ledger/${b.index}`}
                        className="btn-outline text-[11px] px-2.5 py-1 inline-flex items-center gap-1"
                      >
                        Inspect
                      </Link>
                      <button
                        type="button"
                        onClick={() => downloadLedgerBlockRecord(b)}
                        className="btn-neutral-outline text-[11px] px-2 py-1 inline-flex items-center gap-1"
                        title="Download Block Record"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
