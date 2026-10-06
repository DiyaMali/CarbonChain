import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, Database, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { verifyChainIntegrity, getAllLedgerBlocks } from "../services/ledgerService";
import { USE_DEMO_LEDGER } from "../config/contract";

export default function Footer() {
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const handleVerify = async () => {
    setVerifying(true);
    const result = await verifyChainIntegrity();
    setVerifyResult(result);
    setVerifying(false);
  };

  const blockCount = USE_DEMO_LEDGER ? getAllLedgerBlocks().length : 0;

  return (
    <footer className="border-t border-gray-200 bg-white mt-auto no-print">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-forest/20 flex items-center justify-center bg-white shadow-sm">
                <img src="/logo.png" alt="CarbonChain" className="w-full h-full object-cover" />
              </div>
              <span className="font-semibold text-charcoal">CarbonChain</span>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Transparent carbon credit trading mirroring India's Carbon Registry (CRI) model.
            </p>
            <p className="text-[11px] text-charcoal-subtle mt-2">
              IPP &bull; VVB &bull; TO &bull; MCU
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-3">Platform</h3>
            <nav className="space-y-2 text-xs text-charcoal-muted">
              <Link to="/marketplace" className="block hover:text-charcoal transition-colors">Marketplace</Link>
              <Link to="/dashboard" className="block hover:text-charcoal transition-colors">Dashboard</Link>
              <Link to="/submit" className="block hover:text-charcoal transition-colors">Submit Project</Link>
              <Link to="/my-credits" className="block hover:text-charcoal transition-colors">My Credits</Link>
              <Link to="/impact" className="block hover:text-charcoal transition-colors">Environmental Impact</Link>
            </nav>
          </div>

          {/* Registry */}
          <div>
            <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-3">Registry</h3>
            <nav className="space-y-2 text-xs text-charcoal-muted">
              <a href="https://cri.nccf.in" target="_blank" rel="noreferrer" className="block hover:text-charcoal transition-colors">India Carbon Registry (CRI)</a>
              <a href="https://nccf.in" target="_blank" rel="noreferrer" className="block hover:text-charcoal transition-colors">NCCF</a>
              <Link to="/verifier" className="block hover:text-charcoal transition-colors">Verifier Dashboard</Link>
            </nav>
          </div>

          {/* Ledger integrity */}
          {USE_DEMO_LEDGER && (
            <div>
              <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-3">Ledger Integrity</h3>
              <p className="text-[11px] text-charcoal-muted mb-3 leading-snug">
                SHA-256 hash-chained records ({blockCount} blocks). Tamper detection is built in.
              </p>
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="btn-neutral-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                {verifying ? "Verifying..." : "Verify chain"}
              </button>
              {verifyResult && (
                <div className={`mt-2 text-[11px] flex items-center gap-1.5 ${verifyResult.intact ? "text-emerald-700" : "text-red-700"}`}>
                  {verifyResult.intact
                    ? <><CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />Chain intact, {verifyResult.checked} blocks verified</>
                    : <><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />Chain broken at block {verifyResult.failedAt}</>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-6 space-y-2">
          <div className="text-xs text-charcoal-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-charcoal">Project data: </span>
              Carbon Registry India (<a href="https://registry.nccf.in/projects" target="_blank" rel="noreferrer" className="text-forest hover:underline">registry.nccf.in</a>), an initiative by NCCF. Snapshot taken 1 Oct 2026.
            </div>
            <a
              href="https://registry.nccf.in/projects"
              target="_blank"
              rel="noreferrer"
              className="text-forest hover:underline text-xs whitespace-nowrap"
            >
              Registry home &rarr;
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-charcoal-subtle pt-2 border-t border-gray-50">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-forest" />
                CarbonChain Ledger: SHA-256 hash-chained, tamper-evident records. Indicative market pricing.
              </div>
              <div>
                Production design: ERC-721 contract on Polygon. Real CRI registry records show MCUs only.
              </div>
            </div>
            <div className="whitespace-nowrap">
              CarbonChain &copy; {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
