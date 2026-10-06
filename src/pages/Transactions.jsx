import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import {
  getAllTransactions,
  getPurchasesHistory,
  getAllLedgerBlocks,
  verifyChainIntegrity,
  getAllCredits,
} from "../services/ledgerService";
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

  const [activeTab, setActiveTab] = useState("purchases"); // "purchases" | "all" | "blocks"
  const [searchTerm, setSearchTerm] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const effectiveWallet = account || (isDemoMode && user?.walletAddress);

  useEffect(() => {
    document.title = "Transaction History | CarbonChain";
  }, []);

  const allTxs = useMemo(() => {
    return getAllTransactions();
  }, [effectiveWallet]);

  const purchases = useMemo(() => {
    return getPurchasesHistory(effectiveWallet);
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
      setVerifyResult({ valid: false, error: e.message });
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
        p.projectType?.toLowerCase().includes(q)
      );
    });
  }, [purchases, searchTerm]);

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

  // Stats
  const totalPurchasedTonnes = purchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalAmountSpent = purchases.reduce((sum, p) => sum + (Number(p.pricePaid) || 0), 0);
  const totalBlocks = blocks.length;

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#14532D]" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-800">
              POLYGON CONSENSUS LEDGER
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A1D] tracking-tight">
            Transaction History
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Cryptographically audited record of credit purchases, token issuances, and retirements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleVerifyChain}
            disabled={verifying}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#14532D] text-[#14532D] bg-white hover:bg-emerald-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className={`w-4 h-4 ${verifying ? "animate-spin" : ""}`} />
            <span>{verifying ? "Auditing SHA-256 Chain..." : "Verify Chain Integrity"}</span>
          </button>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14532D] hover:bg-[#0f4022] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Buy Credits</span>
          </Link>
        </div>
      </div>

      {/* ── Chain Integrity Notification ── */}
      {verifyResult && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            verifyResult.valid
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {verifyResult.valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0" />
            )}
            <div>
              <span className="font-bold text-sm block">
                {verifyResult.valid ? "Hash Chain Integrity Verified 100%" : "Integrity Verification Failed"}
              </span>
              <span className="text-[11px] opacity-90">
                {verifyResult.valid
                  ? `All ${verifyResult.blockCount || totalBlocks} consecutive blocks verified using SHA-256 Web Crypto consensus.`
                  : verifyResult.error || "A block in the chain does not match its cryptographic hash."}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVerifyResult(null)}
            className="text-stone-400 hover:text-stone-700 font-semibold px-2 py-1 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
            <span>Purchased Credits</span>
            <Coins className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-[#0F2A1D]">
              {totalPurchasedTonnes.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-stone-500 ml-1">tCO2e</span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
            Across {purchases.length} settled purchase{purchases.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
            <span>Total Value Paid</span>
            <ArrowLeftRight className="w-4 h-4 text-[#14532D]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-800">
              {formatINR(totalAmountSpent)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
            Includes platform settlement fees
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
            <span>Consensus Blocks</span>
            <Layers className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-stone-900">
              #{totalBlocks}
            </span>
            <span className="text-xs text-stone-500 ml-1">blocks</span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
            SHA-256 immutable chain
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
            <span>Audit Network</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-[#0F2A1D]">Polygon Mainnet</span>
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-emerald-700 font-medium">
            Synced with local consensus state
          </div>
        </div>
      </div>

      {/* ── Tabs & Filter Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Tab Pill */}
          <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200/80 w-fit text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("purchases")}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "purchases"
                  ? "bg-white text-[#14532D] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Purchases History ({purchases.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-[#14532D] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              All Activity &amp; Transfers ({allTxs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("blocks")}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
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
              placeholder="Search by project, token ID, or hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]"
            />
          </div>
        </div>

        {/* ── TAB 1: PURCHASES HISTORY TABLE ── */}
        {activeTab === "purchases" && (
          <div className="overflow-x-auto">
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                <Coins className="w-8 h-8 text-stone-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-stone-800">No purchases found</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  When carbon credits are purchased on the marketplace, your detailed order receipt, quantity, and blockchain block proof will appear here.
                </p>
                <Link to="/marketplace" className="inline-block mt-4 px-4 py-2 bg-[#14532D] text-white text-xs font-semibold rounded-lg shadow-sm">
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
                    <th className="py-3 px-3">Status</th>
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
                        <td className="py-3 px-3 text-stone-500 whitespace-nowrap">
                          {item.purchasedAt
                            ? new Date(item.purchasedAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Recently"}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-stone-900 leading-tight">
                            {item.projectName}
                          </div>
                          <div className="font-mono text-[10px] text-stone-500 mt-0.5 flex items-center gap-1.5">
                            <span>{item.creditId}</span>
                            <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 text-[9px] uppercase">
                              {item.projectType}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-bold text-emerald-800 text-sm">
                            {Number(item.amount || 0).toLocaleString("en-IN")}
                          </span>{" "}
                          <span className="text-[11px] text-stone-500">tCO2e</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono font-semibold text-stone-900">
                          {formatINR(item.pricePaid)}
                          <span className="block text-[10px] text-stone-400 font-normal">
                            @{formatINR(item.pricePerTonnePaid)} / t
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isRetired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                              <Leaf className="w-3 h-3 text-teal-700" />
                              Retired
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Confirmed
                            </span>
                          )}
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
                          {isRetired ? (
                            <Link
                              to={`/certificate/${item.creditId}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition"
                            >
                              Certificate
                            </Link>
                          ) : (
                            <Link
                              to={`/retire/${item.creditId}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#14532D] bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition"
                            >
                              Retire
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

        {/* ── TAB 2: ALL ACTIVITY TABLE ── */}
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
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          tx.type === "Purchase"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : tx.type === "Retirement"
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
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
                      {tx.quantity ? `${tx.quantity.toLocaleString("en-IN")} tCO2e` : "—"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-semibold text-stone-800">
                      {tx.amountPaid ? formatINR(tx.amountPaid) : "—"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-stone-600">
                      <span
                        onClick={() => copyText(tx.blockHash)}
                        className="cursor-pointer hover:underline text-blue-600 inline-flex items-center gap-1"
                        title="Click to copy hash"
                      >
                        {tx.shortTxHash}
                        {copiedHash === tx.blockHash ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-60" />
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <Link
                        to={`/ledger/${tx.blockIndex}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#14532D] hover:bg-emerald-50 rounded border border-stone-200 transition"
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

        {/* ── TAB 3: LEDGER BLOCKS ── */}
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
                    <td className="py-3 px-3 text-blue-600 truncate max-w-[140px]" title={b.hash}>
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#14532D] hover:bg-emerald-50 rounded border border-stone-200"
                      >
                        Inspect
                      </Link>
                      <button
                        type="button"
                        onClick={() => downloadLedgerBlockRecord(b)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-stone-600 hover:bg-stone-100 rounded border border-stone-200"
                        title="Download Block JSON Record"
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
