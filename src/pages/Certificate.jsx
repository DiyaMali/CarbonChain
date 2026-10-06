import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Printer, ExternalLink, Leaf } from "lucide-react";
import { getCredit, getProject, computeImpactFactor, SDG_NAMES } from "../services/ledgerService";

export default function Certificate() {
  const { tokenId } = useParams();
  const [QRCode, setQRCode] = useState(null);

  const credit = getCredit(tokenId);
  const project = credit ? getProject(credit.projectId) : null;
  const impactFactor = project ? computeImpactFactor(project.sdgScores) : 0;

  useEffect(() => {
    import("qrcode.react").then((m) => setQRCode(() => m.QRCodeSVG || m.default)).catch(() => {});
  }, []);

  useEffect(() => {
    if (credit) document.title = `Certificate: ${credit.id} | CarbonChain`;
  }, [credit]);

  if (!credit || !project) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-3">Certificate not found</h1>
        <Link to="/my-credits" className="btn-outline-sm">Back to My Credits</Link>
      </div>
    );
  }

  if (!credit.retired) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Not retired</h1>
        <p className="text-sm text-charcoal-muted mb-4">MCU {credit.id} has not been retired yet.</p>
        <Link to={`/credit/${credit.id}`} className="btn-outline-sm">Go to credit detail</Link>
      </div>
    );
  }

  const verifyUrl = `${window.location.origin}/verify/${credit.id}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Print button */}
      <div className="flex items-center justify-between mb-6 no-print">
        <Link to="/my-credits" className="btn-text text-xs">Back to My Credits</Link>
        <button onClick={() => window.print()} className="btn-outline-sm flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5" />
          Print / Save PDF
        </button>
      </div>

      {/* Certificate */}
      <div id="certificate" className="border-2 border-forest/30 rounded p-8 sm:p-12 bg-white print-target">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b border-gray-200">
          <div className="w-12 h-12 rounded border border-forest bg-forest-light flex items-center justify-center mx-auto mb-3">
            <Leaf className="w-6 h-6 text-forest" />
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-charcoal-subtle mb-1">
            CarbonChain &bull; Demo Ledger
          </div>
          <h1 className="text-2xl font-semibold text-charcoal mb-0.5">Carbon Credit Retirement Certificate</h1>
          <p className="text-sm text-charcoal-muted">This certifies the permanent retirement of the following Marketable Carbon Unit</p>
        </div>

        {/* Main content */}
        <div className="flex flex-col sm:flex-row gap-8 mb-8">
          <div className="flex-1 space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-1">MCU Serial Number</div>
              <div className="text-lg font-mono font-semibold text-charcoal">{credit.id}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-1">Tonnes Retired</div>
              <div className="text-3xl font-semibold text-forest">{credit.amount.toLocaleString("en-IN")} tCO2e</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-1">Project</div>
              <div className="flex items-center gap-3">
                {project.imageUrl && (
                  <div className="w-12 h-12 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                    <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-charcoal">{project.name}</div>
                  <div className="text-xs text-charcoal-muted">{project.location} &bull; {project.projectType}</div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-1">Retired By</div>
              <div className="text-sm font-semibold text-charcoal">{credit.retireeName}</div>
              {credit.onBehalfOf && <div className="text-xs text-charcoal-muted">on behalf of: {credit.onBehalfOf}</div>}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-1">Reason</div>
              <div className="text-sm text-charcoal">{credit.reason}</div>
            </div>
            {credit.message && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-1">Statement</div>
                <div className="text-sm text-charcoal italic">"{credit.message}"</div>
              </div>
            )}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-1">Retirement Date</div>
              <div className="text-sm text-charcoal">{new Date(credit.retiredAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</div>
            </div>
          </div>

          {/* QR + info */}
          <div className="flex flex-col items-center gap-4 sm:w-40">
            {QRCode ? (
              <div className="p-2 border border-gray-200 rounded bg-white">
                <QRCode value={verifyUrl} size={120} />
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-xs text-charcoal-muted">
                QR code
              </div>
            )}
            <div className="text-center">
              <div className="text-[10px] text-charcoal-subtle uppercase tracking-wider mb-0.5">Scan to verify</div>
              <div className="text-[10px] font-mono text-charcoal-subtle break-all">{credit.id}</div>
            </div>
          </div>
        </div>

        {/* SDGs */}
        {project.sdgs && project.sdgs.length > 0 && (
          <div className="mb-6 pt-5 border-t border-gray-100">
            <div className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium mb-2">UN SDGs Addressed</div>
            <div className="flex flex-wrap gap-1.5">
              {project.sdgs.map((s) => (
                <span key={s} className="text-[11px] px-2 py-1 rounded border border-forest/20 bg-forest-light/40 text-forest font-medium">
                  {SDG_NAMES[s] || `SDG ${s}`}
                </span>
              ))}
            </div>
            {impactFactor > 0 && (
              <div className="text-[11px] text-charcoal-muted mt-2">
                SDG Impact Factor: <span className="font-semibold text-forest">{impactFactor}</span>
              </div>
            )}
          </div>
        )}

        {/* Ledger info */}
        <div className="pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-charcoal-subtle">
          <div className="space-y-0.5">
            <div>MCU: <span className="font-mono">{credit.id}</span></div>
            <div>Owner wallet: <span className="font-mono">{credit.owner}</span></div>
            <div>Retired at: {credit.retiredAt}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Permanently Retired
            </span>
            <span className="text-[10px]">Demo ledger &bull; SHA-256 hash-chained</span>
          </div>
        </div>
      </div>

      {/* Actions (no-print) */}
      <div className="mt-6 flex flex-wrap items-center gap-3 no-print">
        <Link to={`/verify/${credit.id}`} className="btn-outline-sm flex items-center gap-1.5">
          <ExternalLink className="w-3.5 h-3.5" />
          Public verification page
        </Link>
        <Link to={`/credit/${credit.id}`} className="btn-neutral-outline text-xs flex items-center gap-1.5">
          Full credit detail
        </Link>
      </div>
    </div>
  );
}
