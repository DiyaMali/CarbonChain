import React from "react";
import { useParams, Link } from "react-router-dom";
import { Shield, CheckCircle2, Leaf, ExternalLink } from "lucide-react";
import { getCredit, getProject, getHistory, getAllLedgerBlocks, computeImpactFactor, SDG_NAMES } from "../services/ledgerService";

const ACTION_LABELS = {
  CREDIT_MINTED: "MCU Minted",
  CREDIT_LISTED: "Listed on Marketplace",
  CREDIT_DELISTED: "Listing Cancelled",
  CREDIT_PURCHASED: "Purchased",
  CREDIT_RETIRED: "Retired (Permanent)",
};

export default function PublicVerify() {
  const { tokenId } = useParams();

  React.useEffect(() => {
    document.title = `Verify MCU ${tokenId} | CarbonChain`;
  }, [tokenId]);

  const credit = getCredit(tokenId);
  const project = credit ? getProject(credit.projectId) : null;
  const history = getHistory(tokenId);
  const impactFactor = project ? computeImpactFactor(project.sdgScores) : 0;
  const blocks = getAllLedgerBlocks();

  if (!credit || !project) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Shield className="w-10 h-10 text-charcoal-subtle mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-charcoal mb-2">MCU not found</h1>
        <p className="text-sm text-charcoal-muted mb-4">Token ID <span className="font-mono">{tokenId}</span> could not be found in the ledger.</p>
        <Link to="/marketplace" className="btn-text">Browse marketplace</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded border border-emerald-200 bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-forest block mb-0.5">
            Public Verification Record
          </span>
          <h1 className="text-xl font-semibold text-charcoal">MCU {credit.id}</h1>
          <p className="text-xs text-charcoal-muted">{project.name}</p>
        </div>
      </div>

      {/* Project photo */}
      {project.imageUrl && (
        <div className="h-44 rounded overflow-hidden border border-gray-200 mb-6 bg-cream-light">
          <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Status */}
      <div className={`mb-6 p-3.5 rounded border text-xs font-medium flex items-center gap-2 ${
        credit.retired
          ? "bg-gray-50 border-gray-200 text-gray-700"
          : credit.listed
          ? "bg-blue-50 border-blue-200 text-blue-800"
          : "bg-emerald-50 border-emerald-200 text-emerald-800"
      }`}>
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        {credit.retired ? "Retired and permanently locked" : credit.listed ? "Active on marketplace" : "Verified, not listed"}
      </div>

      {/* Credit fields */}
      <div className="clean-card p-5 mb-5 space-y-3 text-sm">
        <Field label="Credit Serial" value={credit.id} mono />
        <Field label="Project" value={project.name} />
        <Field label="Location" value={project.location} />
        <Field label="Type" value={project.projectType} />
        <Field label="Amount" value={`${credit.amount.toLocaleString("en-IN")} tCO2e`} />
        <Field label="Current Owner" value={credit.owner} mono />
        <Field label="Minted" value={new Date(credit.mintedAt).toLocaleDateString("en-IN", { dateStyle: "long" })} />
        {credit.retired && (
          <>
            <Field label="Retired On" value={new Date(credit.retiredAt).toLocaleDateString("en-IN", { dateStyle: "long" })} />
            <Field label="Retired By" value={credit.retireeName} />
            {credit.onBehalfOf && <Field label="On Behalf Of" value={credit.onBehalfOf} />}
            <Field label="Reason" value={credit.reason} />
          </>
        )}
        <Field label="Impact Factor" value={`${impactFactor} / 1.0`} />
      </div>

      {/* SDGs */}
      {project.sdgs && project.sdgs.length > 0 && (
        <div className="clean-card p-5 mb-5">
          <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-3">UN SDGs Addressed</h3>
          <div className="flex flex-wrap gap-2">
            {project.sdgs.map((sdgId) => (
              <span key={sdgId} className="text-[11px] px-2 py-1 rounded border border-forest/20 bg-forest-light/30 text-forest font-medium">
                {SDG_NAMES[sdgId] || `SDG ${sdgId}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {history.length > 0 && (
        <div className="clean-card p-5 mb-5">
          <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-4">Ledger Timeline</h3>
          <ol className="space-y-3">
            {history.map((block, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-forest mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-charcoal">{ACTION_LABELS[block.action] || block.action}</div>
                  <div className="text-[11px] text-charcoal-muted">{new Date(block.timestamp).toLocaleString("en-IN")}</div>
                  <Link to={`/ledger/${block.index}`} className="text-[11px] font-mono text-forest underline hover:text-forest-hover">
                    Block #{block.index}
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="text-center">
        <Link to={`/credit/${credit.id}`} className="btn-outline-sm inline-flex items-center gap-1.5">
          <ExternalLink className="w-3.5 h-3.5" />
          Full credit detail
        </Link>
      </div>

      <div className="mt-8 text-[11px] text-charcoal-subtle text-center">
        Demo ledger: SHA-256 hash-chained records (simulated blockchain)
      </div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4">
      <span className="text-xs font-medium text-charcoal-subtle w-32 flex-shrink-0">{label}</span>
      <span className={`text-sm text-charcoal break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
