import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Printer, ExternalLink, Leaf, ShieldCheck, Award } from "lucide-react";
import {
  getCredit,
  getProject,
  computeImpactFactor,
  SDG_NAMES,
  getRetirementRequest,
  resolveProjectImage
} from "../services/ledgerService";

export default function Certificate() {
  const { tokenId } = useParams();
  const id = tokenId;
  const [QRCode, setQRCode] = useState(null);

  // Check retirement request first (per spec §11 & §17)
  const retReq = getRetirementRequest(id);
  const credit = !retReq ? getCredit(id) : null;

  const projectId = retReq?.projectId || credit?.projectId;
  const project = projectId ? getProject(projectId) : null;
  const impactFactor = project ? computeImpactFactor(project.sdgScores) : 0;

  useEffect(() => {
    import("qrcode.react").then((m) => setQRCode(() => m.QRCodeSVG || m.default)).catch(() => {});
  }, []);

  useEffect(() => {
    const titleId = retReq?.approvalRef || credit?.id || id;
    document.title = `Retirement Certificate: ${titleId} | CarbonChain`;
  }, [retReq, credit, id]);

  const isApprovedRetirement = retReq?.status === "Approved" || credit?.retired;

  if (!retReq && !credit) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center clean-card p-8">
        <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h1 className="text-xl font-semibold mb-2 text-charcoal">Certificate Not Found</h1>
        <p className="text-xs text-charcoal-muted mb-4">
          No retirement record matching reference <strong className="font-mono">{id}</strong> was found on the CarbonChain Ledger.
        </p>
        <Link to="/my-credits" className="btn-outline-sm">Back to My Credits</Link>
      </div>
    );
  }

  if (!isApprovedRetirement) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center clean-card p-8">
        <h1 className="text-xl font-semibold mb-2 text-charcoal">Retirement Pending</h1>
        <p className="text-sm text-charcoal-muted mb-4">
          Retirement request {id} is currently under review by the Verification Authority and has not yet been approved.
        </p>
        <Link to="/my-credits?tab=requests" className="btn-outline-sm">View in My Credits</Link>
      </div>
    );
  }

  const certificateRef = retReq?.approvalRef || `RET-2026-${credit?.id?.slice(-6) || "000108"}`;
  const quantityRetired = retReq?.quantity || credit?.amount || 100;
  const retireeName = retReq?.retireeName || credit?.retireeName || "Ironbridge Steel and Cement Ltd";
  const onBehalfOf = retReq?.onBehalfOfName || credit?.onBehalfOf || "";
  const retirementReason = retReq?.reason || credit?.reason || "Scope 1/2 GHG reporting compliance";
  const statementMessage = retReq?.message || credit?.message || "";
  const retirementDate = retReq?.approvedAt || credit?.retiredAt || new Date().toISOString();
  const serialRange = retReq?.serialRange || credit?.serialRange || `CCI-${projectId}-000001`;

  const verifyUrl = `${window.location.origin}/verify/${certificateRef}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Print button */}
      <div className="flex items-center justify-between mb-6 no-print">
        <Link to="/my-credits" className="btn-text text-xs">&larr; Back to My Credits</Link>
        <button
          onClick={() => window.print()}
          className="btn-outline-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Print / Save as PDF
        </button>
      </div>

      {/* Official Certificate Box */}
      <div id="certificate" className="border-2 border-forest/30 rounded-lg p-8 sm:p-12 bg-white print-target shadow-sm relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none">
          <Leaf className="w-72 h-72 text-forest" />
        </div>

        {/* Certificate Header */}
        <div className="text-center mb-8 pb-6 border-b border-gray-200">
          <div className="w-12 h-12 rounded border border-forest bg-forest/10 flex items-center justify-center mx-auto mb-3">
            <Leaf className="w-6 h-6 text-forest" />
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-forest font-semibold mb-1">
            CarbonChain &bull; Official Registry Record
          </div>
          <h1 className="text-2xl font-semibold text-charcoal mb-0.5">
            Carbon Credit Retirement Certificate
          </h1>
          <p className="text-xs text-charcoal-muted max-w-md mx-auto">
            This certifies the permanent, irreversible retirement and climate declaration of verified carbon credits on the CarbonChain Ledger.
          </p>
        </div>

        {/* Main Certificate Content */}
        <div className="flex flex-col sm:flex-row gap-8 mb-8">
          <div className="flex-1 space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-0.5">
                Certificate Approval Reference
              </div>
              <div className="text-lg font-mono font-bold text-forest">{certificateRef}</div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-0.5">
                Volume Retired
              </div>
              <div className="text-3xl font-semibold text-charcoal font-mono">
                {quantityRetired.toLocaleString("en-IN")}{" "}
                <span className="text-base font-normal text-charcoal-muted">tCO2e (MCUs)</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-0.5">
                Serial Number Range
              </div>
              <div className="text-xs font-mono font-semibold text-charcoal">{serialRange}</div>
            </div>

            {project && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-1">
                  Originating Project
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                    <img
                      src={resolveProjectImage(project)}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-charcoal">{project.name}</div>
                    <div className="text-xs text-charcoal-muted">
                      {project.location} &bull; {project.projectType || project.type}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-0.5">
                Beneficiary / Retired For
              </div>
              <div className="text-sm font-semibold text-charcoal">{retireeName}</div>
              {onBehalfOf && (
                <div className="text-xs text-charcoal-muted">on behalf of: {onBehalfOf}</div>
              )}
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-0.5">
                Retirement Purpose
              </div>
              <div className="text-xs text-charcoal">{retirementReason}</div>
            </div>

            {statementMessage && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-0.5">
                  Public Declaration
                </div>
                <div className="text-xs text-charcoal italic leading-relaxed">
                  "{statementMessage}"
                </div>
              </div>
            )}

            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-0.5">
                Retirement Authorization Date
              </div>
              <div className="text-xs font-mono text-charcoal">
                {new Date(retirementDate).toLocaleDateString("en-IN", {
                  dateStyle: "long",
                })}
              </div>
            </div>
          </div>

          {/* QR Code & Verification Block */}
          <div className="flex flex-col items-center gap-3 sm:w-44 border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-6 pt-4 sm:pt-0">
            {QRCode ? (
              <div className="p-2 border border-gray-200 rounded bg-white shadow-2xs">
                <QRCode value={verifyUrl} size={130} />
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-50 border border-gray-200 rounded flex items-center justify-center text-xs text-charcoal-muted">
                QR Verification
              </div>
            )}
            <div className="text-center">
              <div className="text-[10px] text-charcoal-subtle uppercase tracking-wider font-semibold">
                Scan to Verify
              </div>
              <div className="text-[10px] font-mono text-forest font-semibold mt-0.5">
                {certificateRef}
              </div>
            </div>
            <div className="text-center pt-2">
              <span className="text-[10px] text-charcoal-subtle uppercase tracking-wider block font-medium">
                Authorized By
              </span>
              <span className="text-xs font-semibold text-charcoal block">
                Diya Mali
              </span>
              <span className="text-[10px] text-charcoal-muted block font-mono">
                Verification Authority (VVB)
              </span>
            </div>
          </div>
        </div>

        {/* SDGs */}
        {project?.sdgs && project.sdgs.length > 0 && (
          <div className="mb-6 pt-5 border-t border-gray-100">
            <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-2">
              Sustainable Development Goals (SDGs) Addressed
            </div>
            <div className="flex flex-wrap gap-1.5">
              {project.sdgs.map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-2 py-0.5 rounded border border-forest/20 bg-forest/5 text-forest font-medium font-mono"
                >
                  SDG {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ledger Footer */}
        <div className="pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-charcoal-subtle">
          <div className="space-y-0.5">
            <div>Certificate ID: <span className="font-mono">{certificateRef}</span></div>
            <div>Serial Units: <span className="font-mono">{serialRange}</span></div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Permanently Retired &bull; Tamper-Evident
            </span>
            <span className="text-[10px] font-mono">CarbonChain Network &bull; SHA-256 Hash Chained</span>
          </div>
        </div>
      </div>

      {/* Actions (no-print) */}
      <div className="mt-6 flex flex-wrap items-center gap-3 no-print">
        <Link to={`/verify/${certificateRef}`} className="btn-outline-sm flex items-center gap-1.5">
          <ExternalLink className="w-3.5 h-3.5" />
          Public Verification Record
        </Link>
        {project && (
          <Link
            to={`/projects/${project.slug || project.id}`}
            className="btn-neutral-outline text-xs px-3 py-1.5"
          >
            Project Details
          </Link>
        )}
      </div>
    </div>
  );
}
