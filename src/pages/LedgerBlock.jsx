import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Shield, ChevronLeft, ChevronRight, Database, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { getLedgerBlock, getAllLedgerBlocks, verifyChainIntegrity, tamperBlock } from "../services/ledgerService";
import { downloadLedgerBlockRecord } from "../utils/exportProject";
import { USE_DEMO_LEDGER } from "../config/contract";
import PageHeader from "../components/PageHeader";

const ACTION_LABELS = {
  GENESIS: "Ledger Genesis",
  PROJECT_SUBMITTED: "Project Submitted",
  PROJECT_APPROVED: "Project Approved",
  PROJECT_REJECTED: "Project Rejected",
  CREDIT_MINTED: "MCU Minted",
  CREDIT_LISTED: "MCU Listed",
  CREDIT_DELISTED: "MCU Delisted",
  CREDIT_PURCHASED: "MCU Purchased",
  CREDIT_RETIRED: "MCU Retired (Permanent)",
};

export default function LedgerBlock() {
  const { blockIndex } = useParams();
  const idx = parseInt(blockIndex, 10);
  const isValidIndex = !isNaN(idx) && idx >= 0;
  const block = isValidIndex ? getLedgerBlock(idx) : null;
  const allBlocks = getAllLedgerBlocks();

  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [tampered, setTampered] = useState(false);

  React.useEffect(() => {
    document.title = isValidIndex
      ? `Ledger Block #${idx} | CarbonChain`
      : "Ledger Block Not Found | CarbonChain";
  }, [idx, isValidIndex]);

  const handleVerify = async () => {
    setVerifying(true);
    const result = await verifyChainIntegrity();
    setVerifyResult(result);
    setVerifying(false);
  };

  const handleTamper = () => {
    if (!isValidIndex) return;
    tamperBlock(idx, `TAMPERED_AT_${new Date().toISOString()}`);
    setTampered(true);
    setVerifyResult(null);
  };

  if (!isValidIndex || !block) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Database className="w-10 h-10 text-charcoal-subtle mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-charcoal mb-2">
          {isValidIndex ? `Block #${idx} not found` : "Block Not Found"}
        </h1>
        <p className="text-xs text-charcoal-muted max-w-md mx-auto mb-6">
          {isValidIndex
            ? `Block #${idx} does not exist in the hash-chained ledger. Total blocks recorded: ${allBlocks.length}.`
            : "The requested block index is not a valid number. Please inspect a specific block from the ledger list."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/verifier/ledger" className="btn-outline text-xs px-4 py-2">
            Back to Ledger List
          </Link>
          <Link to="/dashboard" className="btn-neutral-outline text-xs px-4 py-2">
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#F4F7F5" }}>
      <PageHeader
        role="verifier"
        eyebrow="BLOCK INSPECTION"
        title={`Block #${block.index}: ${ACTION_LABELS[block.action] || block.action}`}
        subtitle={new Date(block.timestamp).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "medium" })}
        action={{ label: "Back to Ledger", to: "/verifier/ledger" }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center justify-end">
          <button
            type="button"
            onClick={() => downloadLedgerBlockRecord(block)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border rounded text-xs font-semibold transition-colors cursor-pointer"
            style={{ borderColor: "#1F3A5F", color: "#1F3A5F", backgroundColor: "#FFFFFF" }}
            title={`Download Ledger Block #${block.index} record (.json) to your computer`}
          >
            <Download className="w-3.5 h-3.5" />
            Download Ledger Record
          </button>
        </div>

      {tampered && (
        <div className="mb-4 p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          Block payload has been tampered. Run "Verify chain integrity" to detect the integrity state.
        </div>
      )}

      {/* Block fields */}
      <div className="clean-card p-6 space-y-4 mb-6 font-mono text-xs">
        <Row label="Block Index" value={String(block.index)} />
        <Row label="Action" value={block.action} />
        <Row label="Timestamp" value={block.timestamp} />
        <Row label="Prev Hash" value={block.prevHash} mono />
        <Row label="This Hash" value={block.hash} mono highlight />
        <Row label="Tx Hash" value={block.txHash} mono />
        <div className="border-t border-gray-100 pt-4">
          <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle mb-2">Payload</div>
          <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(block.payload, null, 2)}
          </pre>
        </div>
      </div>

      {/* Verify chain integrity */}
      <div className="clean-card p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-charcoal">Verify ledger integrity</h3>
            <p className="text-xs text-charcoal-muted mt-0.5">Recomputes SHA-256 hashes for all {allBlocks.length} blocks.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleVerify} disabled={verifying} className="btn-outline-sm">
              {verifying ? "Verifying..." : "Verify chain"}
            </button>
            {/* Tamper button for testing / audit verification */}
            <button
              onClick={handleTamper}
              className="btn-neutral-outline text-xs px-2 py-1 text-red-600 border-red-200 hover:bg-red-50"
              title="Test integrity detection by altering block payload"
            >
              Tamper Block
            </button>
          </div>
        </div>

        {verifyResult && (
          <div className={`flex items-start gap-2 p-3 rounded border text-xs ${
            verifyResult.intact
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {verifyResult.intact
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
            <div>
              {verifyResult.intact
                ? <><strong>Chain intact.</strong> {verifyResult.checked} blocks verified. No tampering detected.</>
                : <><strong>Chain broken!</strong> {verifyResult.reason}. A block has been tampered with.</>}
            </div>
          </div>
        )}
      </div>

      {/* Navigation between blocks */}
      <div className="flex items-center justify-between text-xs text-charcoal-muted">
        {idx > 0
          ? <Link to={`/ledger/${idx - 1}`} className="inline-flex items-center gap-1 btn-text text-xs"><ChevronLeft className="w-3.5 h-3.5" />Block #{idx - 1}</Link>
          : <span />}
        {idx < allBlocks.length - 1
          ? <Link to={`/ledger/${idx + 1}`} className="inline-flex items-center gap-1 btn-text text-xs">Block #{idx + 1}<ChevronRight className="w-3.5 h-3.5" /></Link>
          : <span className="text-charcoal-subtle">Latest block</span>}
      </div>

      <div className="mt-8 text-[11px] text-charcoal-subtle text-center">
        CarbonChain Ledger: SHA-256 hash-chained, tamper-evident records
      </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, highlight }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className="text-[11px] uppercase tracking-wider text-charcoal-subtle w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`break-all leading-relaxed ${highlight ? "text-forest font-semibold" : "text-charcoal"} ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
