import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  FileText,
  Layers,
  ArrowUpRight,
  Database
} from "lucide-react";
import { getVerifierHistory } from "../services/ledgerService";

export default function VerifierHistory() {
  const [historyItems, setHistoryItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "approved" | "rejected" | "retirements"
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.title = "Review History | CarbonChain";
    loadHistory();
  }, []);

  const loadHistory = () => {
    const items = getVerifierHistory();
    setHistoryItems(items);
  };

  const counts = useMemo(() => {
    return {
      all: historyItems.length,
      approved: historyItems.filter((i) => i.type === "PROJECT_APPROVED").length,
      rejected: historyItems.filter((i) => i.type === "PROJECT_REJECTED").length,
      retirements: historyItems.filter((i) =>
        i.type === "RETIREMENT_APPROVED" || i.type === "RETIREMENT_REJECTED"
      ).length,
    };
  }, [historyItems]);

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      // Filter tab
      if (activeFilter === "approved" && item.type !== "PROJECT_APPROVED") return false;
      if (activeFilter === "rejected" && item.type !== "PROJECT_REJECTED") return false;
      if (
        activeFilter === "retirements" &&
        item.type !== "RETIREMENT_APPROVED" &&
        item.type !== "RETIREMENT_REJECTED"
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (item.projectName || item.name || "").toLowerCase();
        const id = (item.projectId || item.id || "").toLowerCase();
        const ref = (item.approvalRef || "").toLowerCase();
        const note = (item.note || item.reason || "").toLowerCase();
        return name.includes(q) || id.includes(q) || ref.includes(q) || note.includes(q);
      }
      return true;
    });
  }, [historyItems, activeFilter, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-forest font-medium">
              Audit & Verification Records
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-charcoal">Review History</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Permanent log of project attestation decisions and retirement authorizations.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="clean-card p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === "all"
                ? "bg-forest/10 border-forest text-forest font-semibold"
                : "border-gray-200 text-charcoal-muted hover:text-charcoal hover:border-gray-300"
            }`}
          >
            All Decisions ({counts.all})
          </button>
          <button
            onClick={() => setActiveFilter("approved")}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === "approved"
                ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold"
                : "border-gray-200 text-charcoal-muted hover:text-charcoal hover:border-gray-300"
            }`}
          >
            Approved Projects ({counts.approved})
          </button>
          <button
            onClick={() => setActiveFilter("rejected")}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === "rejected"
                ? "bg-rose-50 border-rose-500 text-rose-800 font-semibold"
                : "border-gray-200 text-charcoal-muted hover:text-charcoal hover:border-gray-300"
            }`}
          >
            Rejected ({counts.rejected})
          </button>
          <button
            onClick={() => setActiveFilter("retirements")}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === "retirements"
                ? "bg-blue-50 border-blue-500 text-blue-800 font-semibold"
                : "border-gray-200 text-charcoal-muted hover:text-charcoal hover:border-gray-300"
            }`}
          >
            Retirements ({counts.retirements})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, IDs, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-forest text-charcoal placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* History Table */}
      {filteredItems.length === 0 ? (
        <div className="clean-card p-12 text-center">
          <Database className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-charcoal mb-1">No review history found</h3>
          <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
            {searchQuery
              ? "No records matched your search criteria."
              : "Completed attestation decisions and retirement approvals will appear here."}
          </p>
        </div>
      ) : (
        <div className="clean-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-charcoal-subtle font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Project / Asset</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4">Notes / Rationale</th>
                  <th className="py-3 px-4 text-right">Ledger Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-charcoal">
                {filteredItems.map((item) => {
                  const isApproved =
                    item.type === "PROJECT_APPROVED" || item.type === "RETIREMENT_APPROVED";
                  const isRetirement =
                    item.type === "RETIREMENT_APPROVED" || item.type === "RETIREMENT_REJECTED";

                  const volumeDisplay =
                    item.verifiedQuantity || item.quantity || item.volume || 0;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-charcoal-muted font-mono text-[11px]">
                        {item.timestamp
                          ? new Date(item.timestamp).toLocaleString("en-IN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "Seeded record"}
                      </td>

                      {/* Decision Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.type === "PROJECT_APPROVED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Project Approved
                          </span>
                        )}
                        {item.type === "PROJECT_REJECTED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Project Rejected
                          </span>
                        )}
                        {item.type === "RETIREMENT_APPROVED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            Retirement Approved
                          </span>
                        )}
                        {item.type === "RETIREMENT_REJECTED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Retirement Rejected
                          </span>
                        )}
                      </td>

                      {/* Project info */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-charcoal line-clamp-1">
                          {item.projectName || item.name || "Carbon Offset Project"}
                        </div>
                        <div className="font-mono text-[11px] text-charcoal-subtle">
                          {item.projectId || item.id}
                          {item.approvalRef && (
                            <span className="ml-1 text-forest">({item.approvalRef})</span>
                          )}
                        </div>
                      </td>

                      {/* Volume */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        {typeof volumeDisplay === "number"
                          ? `${volumeDisplay.toLocaleString("en-IN")} tCO2e`
                          : String(volumeDisplay)}
                      </td>

                      {/* Note / Rationale */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="line-clamp-2 text-xs text-charcoal-muted">
                          {item.note || item.reason || "Verification requirements fulfilled."}
                        </p>
                      </td>

                      {/* Ledger link */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {item.blockIndex !== undefined ? (
                          <Link
                            to={`/ledger/${item.blockIndex}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 hover:border-forest text-charcoal hover:text-forest transition-colors font-mono text-[11px]"
                            title="Inspect Block on CarbonChain Ledger"
                          >
                            <span>Block #{item.blockIndex}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-gray-400 font-mono text-[11px]">Genesis</span>
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
  );
}
