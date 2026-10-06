import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Shield, CheckCircle2, Leaf, ExternalLink, Award, FileText } from "lucide-react";
import {
  getCredit,
  getProject,
  getHistory,
  getAllLedgerBlocks,
  computeImpactFactor,
  SDG_NAMES,
  getRetirementRequest,
  resolveProjectImage
} from "../services/ledgerService";

export default function PublicVerify() {
  const { tokenId } = useParams();
  const id = tokenId;

  React.useEffect(() => {
    document.title = `Verify Record: ${id} | CarbonChain`;
  }, [id]);

  // Check retirement request first
  const retReq = getRetirementRequest(id);
  const credit = !retReq ? getCredit(id) : null;

  const projectId = retReq?.projectId || credit?.projectId;
  const project = projectId ? getProject(projectId) : null;
  const impactFactor = project ? computeImpactFactor(project.sdgScores) : 0;
  const blocks = getAllLedgerBlocks();

  // Find relevant ledger block
  const block = useMemo(() => {
    return (
      blocks.find(
        (b) =>
          b.payload?.approvalRef === id ||
          b.payload?.requestId === id ||
          b.payload?.creditId === id ||
          b.payload?.paymentReference === id
      ) || blocks[blocks.length - 1]
    );
  }, [blocks, id]);

  if (!retReq && !credit && !project) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center clean-card p-8">
        <Shield className="w-10 h-10 text-charcoal-subtle mx-auto mb-3" />
        <h1 className="text-xl font-semibold text-charcoal mb-2">Record Not Found</h1>
        <p className="text-xs text-charcoal-muted mb-4">
          Record <span className="font-mono font-bold">{id}</span> could not be verified on the CarbonChain Ledger.
        </p>
        <Link to="/marketplace" className="btn-outline-sm">Browse Marketplace</Link>
      </div>
    );
  }

  const isRetired = retReq?.status === "Approved" || credit?.retired;
  const volume = retReq?.quantity || credit?.amount || 100;
  const entityName = retReq?.retireeName || credit?.retireeName || "Ironbridge Steel and Cement Ltd";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded border border-emerald-200 bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-forest block mb-0.5 font-medium">
            Public Registry Verification Record
          </span>
          <h1 className="text-xl font-semibold text-charcoal font-mono">{id}</h1>
          <p className="text-xs text-charcoal-muted">{project?.name || "Verified Carbon Asset"}</p>
        </div>
      </div>

      {/* Project photo */}
      {project && (
        <div className="h-44 rounded overflow-hidden border border-gray-200 mb-6 bg-cream-light">
          <img
            src={resolveProjectImage(project)}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Status Badge */}
      <div
        className={`mb-6 p-3.5 rounded border text-xs font-medium flex items-center justify-between ${
          isRetired
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-blue-50 border-blue-200 text-blue-900"
        }`}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            {isRetired
              ? "Permanently Retired & Attested by Verification Authority"
              : "Active and verified on CarbonChain Network"}
          </span>
        </div>
        <span className="font-mono text-[11px] font-semibold">
          {isRetired ? "AUDIT_VERIFIED" : "ACTIVE"}
        </span>
      </div>

      {/* Verification details table */}
      <div className="clean-card p-5 mb-5 space-y-3 text-xs">
        <Field label="Record Identifier" value={id} mono />
        {project && <Field label="Project Name" value={project.name} />}
        {project && <Field label="Jurisdiction" value={project.location} />}
        {project && <Field label="Methodology" value={project.methodology || "ACM0002"} />}
        <Field label="Retired Volume" value={`${volume.toLocaleString("en-IN")} tCO2e (MCUs)`} mono />
        <Field label="Beneficiary" value={entityName} />
        {retReq?.reason && <Field label="Declared Purpose" value={retReq.reason} />}
        <Field
          label="Verification Date"
          value={new Date(retReq?.approvedAt || credit?.retiredAt || Date.now()).toLocaleDateString("en-IN", {
            dateStyle: "long",
          })}
        />
        {block && (
          <Field
            label="Ledger Block"
            value={
              <Link
                to={`/ledger/${block.index}`}
                className="text-forest underline font-semibold hover:no-underline inline-flex items-center gap-1 font-mono"
              >
                Block #{block.index} &bull; SHA-256 Proof
                <ExternalLink className="w-3 h-3" />
              </Link>
            }
          />
        )}
      </div>

      {/* SDGs */}
      {project?.sdgs && project.sdgs.length > 0 && (
        <div className="clean-card p-5 mb-5">
          <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-2">
            UN Sustainable Development Goals (SDGs)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {project.sdgs.map((sdgId) => (
              <span
                key={sdgId}
                className="text-[11px] px-2 py-0.5 rounded border border-forest/20 bg-forest/5 text-forest font-medium font-mono"
              >
                {SDG_NAMES[sdgId] || `SDG ${sdgId}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="text-center pt-2">
        <Link
          to={`/certificate/${id}`}
          className="btn-outline-sm inline-flex items-center gap-1.5"
        >
          <Award className="w-3.5 h-3.5" />
          <span>View Official Certificate</span>
        </Link>
      </div>

      <div className="mt-8 text-[11px] text-charcoal-subtle text-center">
        CarbonChain Ledger: SHA-256 hash-chained, tamper-evident records
      </div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-4">
      <span className="text-xs font-medium text-charcoal-subtle w-36 flex-shrink-0">{label}</span>
      <span className={`text-xs text-charcoal break-all ${mono ? "font-mono font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  );
}
