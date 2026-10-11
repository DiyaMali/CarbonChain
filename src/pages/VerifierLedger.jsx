import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  Database,
  Download,
  RefreshCw,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  FileText,
  Clock,
  User,
} from "lucide-react";
import { getAllLedgerBlocks, verifyChainIntegrity, DEMO_WALLETS } from "../services/ledgerService";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import CopyableText from "../components/CopyableText";
import TermTooltip from "../components/TermTooltip";
import ActionTooltip from "../components/ActionTooltip";

function shortenHash(hash, len = 6) {
  if (!hash) return "-";
  const str = String(hash).trim();
  if (str.length <= len * 2 + 3) return str;
  return `${str.slice(0, len)}...${str.slice(-len)}`;
}

const ACTION_LABELS = {
  GENESIS: { label: "Genesis", color: "bg-stone-100 text-stone-700 border-stone-200" },
  PROJECT_SUBMITTED: { label: "Project Submitted", color: "bg-blue-50 text-blue-700 border-blue-200" },
  PROJECT_APPROVED: { label: "Project Approved", color: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold" },
  PROJECT_REJECTED: { label: "Project Rejected", color: "bg-rose-50 text-rose-800 border-rose-200 font-semibold" },
  CREDIT_MINTED: { label: "Credits Minted", color: "bg-teal-50 text-teal-800 border-teal-200" },
  CREDIT_LISTED: { label: "Credits Listed", color: "bg-sky-50 text-sky-800 border-sky-200" },
  LISTED: { label: "Credits Listed", color: "bg-sky-50 text-sky-800 border-sky-200" },
  CREDIT_DELISTED: { label: "Credits Delisted", color: "bg-amber-50 text-amber-800 border-amber-200" },
  CREDIT_PURCHASED: { label: "Credits Purchased", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  PURCHASED: { label: "Credits Purchased", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  RETIREMENT_REQUESTED: { label: "Retirement Requested", color: "bg-amber-50 text-amber-800 border-amber-200" },
  RETIREMENT_APPROVED: { label: "Retirement Approved", color: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold" },
  CREDIT_RETIRED: { label: "Retirement Approved", color: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold" },
  RETIREMENT_REJECTED: { label: "Retirement Rejected", color: "bg-rose-50 text-rose-800 border-rose-200 font-semibold" },
  PRICE_UPDATED: { label: "Price Updated", color: "bg-violet-50 text-violet-800 border-violet-200" },
  PROJECT_CONCLUDED: { label: "Project Concluded", color: "bg-purple-50 text-purple-800 border-purple-200" },
  FILES_FINGERPRINTED: { label: "Files Fingerprinted", color: "bg-stone-50 text-stone-700 border-stone-200" },
};

export default function VerifierLedger() {
  const { user } = useAuth();
  const { account } = useWallet();

  const [blocks, setBlocks] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "approvals" | "rejections" | "purchases" | "retirements"
  const [onlyMyDecisions, setOnlyMyDecisions] = useState(false);
  const [hoveredBlockIndex, setHoveredBlockIndex] = useState(null);

  // Chain integrity state
  const [integrityState, setIntegrityState] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const loadBlocks = () => {
    const list = getAllLedgerBlocks();
    setBlocks(list);
  };

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyChainIntegrity();
      setIntegrityState(res);
    } catch (err) {
      setIntegrityState({ intact: false, reason: err.message || "Integrity verification failed" });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    document.title = "Ledger Audit | Verifier (simulated ACVA role) | CarbonChain";
    loadBlocks();
    handleVerifyChain();
  }, []);

  // Four stat cards calculations
  const stats = useMemo(() => {
    const totalBlocks = blocks.length;
    const latestBlock = totalBlocks > 0 ? blocks[totalBlocks - 1] : null;
    const latestBlockNum = latestBlock ? `#${latestBlock.index}` : "-";
    const latestBlockHash = latestBlock ? shortenHash(latestBlock.hash) : "-";

    const approvalsAndRetirements = blocks.filter((b) => {
      const act = b.action;
      return (
        act === "PROJECT_APPROVED" ||
        act === "RETIREMENT_APPROVED" ||
        act === "CREDIT_RETIRED"
      );
    }).length;

    return {
      totalBlocks,
      latestBlockNum,
      latestBlockHash,
      approvalsAndRetirements,
    };
  }, [blocks]);

  // Verifier identification for "Show only my decisions"
  const verifierWallet = (user?.walletAddress || account || DEMO_WALLETS.verifier || "").toLowerCase();
  const verifierUserId = user?.id || "usr_verifier";

  // Filtered blocks list
  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      const p = b.payload || {};
      const act = b.action;

      // Filter tab
      if (activeTab === "approvals" && act !== "PROJECT_APPROVED") {
        return false;
      }
      if (activeTab === "rejections" && act !== "PROJECT_REJECTED" && act !== "RETIREMENT_REJECTED") {
        return false;
      }
      if (activeTab === "purchases" && act !== "PURCHASED" && act !== "CREDIT_PURCHASED") {
        return false;
      }
      if (
        activeTab === "retirements" &&
        act !== "RETIREMENT_APPROVED" &&
        act !== "RETIREMENT_REQUESTED" &&
        act !== "CREDIT_RETIRED"
      ) {
        return false;
      }

      // "Show only my decisions" toggle
      if (onlyMyDecisions) {
        const actor = (p.actor || "").toLowerCase();
        const verifier = (p.verifier || "").toLowerCase();
        const isSigner =
          verifier === verifierWallet ||
          actor === verifierWallet ||
          p.verifierUserId === verifierUserId ||
          ((act === "PROJECT_APPROVED" || act === "PROJECT_REJECTED" || act === "RETIREMENT_APPROVED" || act === "RETIREMENT_REJECTED") &&
            (verifier === verifierWallet || actor === verifierWallet || !verifier));
        if (!isSigner) return false;
      }

      return true;
    });
  }, [blocks, activeTab, onlyMyDecisions, verifierWallet, verifierUserId]);

  // Export ledger to CSV
  const handleExportCSV = () => {
    const headers = [
      "Block Index",
      "Timestamp",
      "Event Type",
      "Project Name",
      "Serial Range",
      "Volume (tCO2e)",
      "Initiator",
      "Block Hash",
      "Previous Hash",
    ];

    const rows = filteredBlocks.map((b) => {
      const p = b.payload || {};
      const projName = p.name || p.projectName || p.projectId || "-";
      const serial = p.serialRange || p.serialNumber || p.approvalRef || "-";
      const volume = p.amount || p.quantity || p.verifiedAmount || p.estimatedCO2 || "-";
      const initiator = p.verifier || p.actor || p.buyer || p.seller || "-";

      return [
        b.index,
        `"${b.timestamp || "-"}"`,
        `"${b.action || "-"}"`,
        `"${String(projName).replace(/"/g, '""')}"`,
        `"${String(serial).replace(/"/g, '""')}"`,
        volume,
        `"${initiator}"`,
        `"${b.hash || "-"}"`,
        `"${b.prevHash || "-"}"`,
      ].join(",");
    });

    const csvString = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `carbonchain_ledger_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#F4F7F5" }}>
      <PageHeader
        role="verifier"
        eyebrow="SIMULATED LEDGER"
        title="Ledger Blocks"
        subtitle="Complete SHA-256 hash-chained immutable event stream. Inspect block integrity, provenance, and attestations."
        action={{ label: "Export CSV", onClick: handleExportCSV }}
      />
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      {/* Chain Integrity Banner */}
      {integrityState && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
            integrityState.intact
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
              : "bg-rose-50 border-rose-200 text-rose-950"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                integrityState.intact
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {integrityState.intact ? (
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-700" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>
                  {integrityState.intact
                    ? "Chain integrity: Valid"
                    : `Chain integrity: Broken at block ${integrityState.failedAt ?? "unknown"}`}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    integrityState.intact
                      ? "bg-emerald-200/60 text-emerald-900 border border-emerald-300"
                      : "bg-rose-200 text-rose-900 border border-rose-300"
                  }`}
                >
                  {integrityState.intact ? "Tamper-Evident" : "Compromised"}
                </span>
              </div>
              <p className="text-xs text-charcoal-muted mt-0.5">
                {integrityState.intact
                  ? `All ${integrityState.checked ?? blocks.length} blocks verified cryptographically. Previous-hash pointers and SHA-256 block digests intact.`
                  : integrityState.reason || "Hash mismatch detected on ledger chain."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="btn-outline-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
            <span>{isVerifying ? "Verifying chain..." : "Verify full chain"}</span>
          </button>
        </div>
      )}

      {/* Four Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Blocks"
          value={stats.totalBlocks}
          subtext="Genesis through latest head"
          theme="blocks"
          icon={Database}
        />
        <StatCard
          label="Latest Block Number"
          value={stats.latestBlockNum}
          subtext="Most recent committed block"
          theme="credits"
          icon={Layers}
        />
        <StatCard
          label="Latest Block Hash"
          value={stats.latestBlockHash}
          subtext="SHA-256 state root"
          theme="money"
          icon={FileText}
        />
        <StatCard
          label="Approvals & Retirements"
          value={stats.approvalsAndRetirements}
          subtext="Attestation milestones"
          theme="pending"
          icon={ShieldCheck}
        />
      </div>

      {/* Filter Tabs & "Show only my decisions" Toggle */}
      <div className="clean-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "approvals", label: "Project Approvals" },
            { id: "rejections", label: "Rejections" },
            { id: "purchases", label: "Purchases" },
            { id: "retirements", label: "Retirements" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-forest/10 border-forest text-forest font-semibold"
                  : "border-gray-200 text-charcoal-muted hover:text-charcoal hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toggle: "Show only my decisions" */}
        <label className="inline-flex items-center gap-2.5 text-xs text-charcoal font-medium cursor-pointer select-none self-start md:self-auto">
          <input
            type="checkbox"
            checked={onlyMyDecisions}
            onChange={(e) => setOnlyMyDecisions(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-forest focus:ring-forest cursor-pointer"
          />
          <span>Show only my decisions</span>
        </label>
      </div>

      {/* Ledger Table */}
      <div className="clean-card overflow-hidden">
        {filteredBlocks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Database className="w-10 h-10 text-charcoal-subtle mx-auto" />
            <h3 className="text-sm font-semibold text-charcoal">
              No blocks yet. Approve a project to create the first block.
            </h3>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
              {onlyMyDecisions
                ? "No blocks signed by your verifier account match the selected filter. Try turning off 'Show only my decisions'."
                : "No ledger blocks match your selected criteria."}
            </p>
            {onlyMyDecisions && (
              <button
                type="button"
                onClick={() => setOnlyMyDecisions(false)}
                className="btn-neutral-outline text-xs px-3 py-1.5"
              >
                Clear "Show only my decisions"
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-charcoal-subtle font-semibold uppercase tracking-wider text-[11px]" style={{ backgroundColor: "#EEF3F0" }}>
                  <th className="py-3 px-4">Block #</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event type</th>
                  <th className="py-3 px-4">Project and serial range</th>
                  <th className="py-3 px-4 text-right">Volume (tCO2e)</th>
                  <th className="py-3 px-4">Initiator</th>
                  <th className="py-3 px-4 font-mono">Block hash</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBlocks
                  .slice()
                  .reverse()
                  .map((b) => {
                    const p = b.payload || {};
                    const actionInfo = ACTION_LABELS[b.action] || {
                      label: b.action,
                      color: "bg-gray-100 text-gray-700 border-gray-200",
                    };

                    const projName = p.name || p.projectName || (p.projectId ? `Project ${p.projectId}` : null);
                    const serial = p.serialRange || p.serialNumber || p.approvalRef || null;
                    const volume = p.amount || p.quantity || p.verifiedAmount || p.estimatedCO2 || null;

                    const initiatorRaw = p.verifier || p.actor || p.buyer || p.seller || null;
                    const initiatorLabel = initiatorRaw
                      ? shortenHash(initiatorRaw, 4)
                      : "-";

                    const isHovered = hoveredBlockIndex === b.index;
                    const isParent = hoveredBlockIndex !== null && b.index === hoveredBlockIndex - 1;

                    return (
                      <tr
                        key={b.index}
                        className={`hover-row transition-colors relative ${
                          isHovered
                            ? "bg-[#F0F7F4]"
                            : isParent
                            ? "bg-[#F4F9F6] border-l-4 border-l-emerald-600"
                            : ""
                        }`}
                        onMouseEnter={() => setHoveredBlockIndex(b.index)}
                        onMouseLeave={() => setHoveredBlockIndex(null)}
                        onFocus={() => setHoveredBlockIndex(b.index)}
                        onBlur={() => setHoveredBlockIndex(null)}
                        tabIndex={0}
                      >
                        {/* Block # */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-charcoal">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-charcoal text-[11px]">
                              #{b.index}
                            </span>
                            {isParent && (
                              <span className="text-[10px] text-emerald-800 font-semibold px-1 py-0.2 rounded bg-emerald-100/70 border border-emerald-300">
                                Previous
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-charcoal-muted whitespace-nowrap">
                          {b.timestamp
                            ? new Date(b.timestamp).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>

                        {/* Event type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] border ${actionInfo.color}`}
                          >
                            {actionInfo.label}
                          </span>
                        </td>

                        {/* Project and serial range */}
                        <td className="py-3.5 px-4 max-w-[280px]">
                          {projName ? (
                            <div className="font-semibold text-charcoal truncate" title={projName}>
                              {projName}
                            </div>
                          ) : (
                            <div className="text-charcoal-subtle italic">Registry System</div>
                          )}
                          {serial && (
                            <div className="text-[10px] text-charcoal-muted font-mono truncate mt-0.5">
                              <CopyableText text={serial} />
                            </div>
                          )}
                        </td>

                        {/* Volume */}
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-charcoal">
                          {volume !== null && volume !== undefined && volume !== "" ? (
                            <span>{Number(volume).toLocaleString("en-IN")}</span>
                          ) : (
                            <span className="text-charcoal-subtle">-</span>
                          )}
                        </td>

                        {/* Initiator */}
                        <td className="py-3.5 px-4 font-mono text-charcoal-muted whitespace-nowrap">
                          {initiatorRaw ? (
                            <CopyableText text={initiatorRaw} displayText={initiatorLabel} />
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* Block hash */}
                        <td className="py-3.5 px-4 font-mono text-charcoal text-[11px] whitespace-nowrap">
                          <TermTooltip term="SHA-256 Digest" definition={`Full Block Hash: ${b.hash}`}>
                            <CopyableText text={b.hash} displayText={shortenHash(b.hash, 5)} />
                          </TermTooltip>
                        </td>

                        {/* Inspect link */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            to={`/ledger/${b.index}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-forest-dark hover:underline"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
