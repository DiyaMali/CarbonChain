import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Shield,
  CheckCircle2,
  Leaf,
  MapPin,
  ExternalLink,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useCreditDetail } from "../hooks/useLedger";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { buyCredit, verifyChainIntegrity, tamperBlock, SDG_NAMES, computeImpactFactor } from "../services/ledgerService";
import ProjectTypeIcon from "../components/ProjectTypeIcon";
import PaymentSheet from "../components/PaymentSheet";

const ACTION_LABELS = {
  CREDIT_MINTED: "MCU Minted",
  CREDIT_LISTED: "Listed on Marketplace",
  CREDIT_DELISTED: "Listing Cancelled",
  CREDIT_PURCHASED: "Purchased",
  CREDIT_RETIRED: "Retired (Permanent)",
};

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function shortenAddr(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function CreditDetail() {
  const { tokenId } = useParams();
  const { credit, history, loading, refetch } = useCreditDetail(tokenId);
  const { account, isDemoMode, connectWallet } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState(null);
  const [buySuccess, setBuySuccess] = useState(false);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [tampered, setTampered] = useState(false);

  const [QRCode, setQRCode] = useState(null);
  React.useEffect(() => {
    import("qrcode.react").then((m) => setQRCode(() => m.QRCodeSVG || m.default)).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (credit) document.title = `${credit.id} | CarbonChain`;
  }, [credit]);

  const effectiveWallet = account || (isDemoMode && user?.walletAddress);
  const isOwner = credit && (credit.owner === effectiveWallet || credit.ownerUserId === user?.id);
  const proj = credit?.project;

  const handleBuy = () => {
    if (!effectiveWallet) { navigate("/connect-wallet"); return; }
    if (isOwner) { alert("You cannot buy your own credit."); return; }
    setIsPaymentSheetOpen(true);
  };

  const handleVerify = async () => {
    setVerifying(true);
    const result = await verifyChainIntegrity();
    setVerifyResult(result);
    setVerifying(false);
  };

  const handleTamper = () => {
    if (history.length === 0) return;
    tamperBlock(history[0].index, "TAMPERED");
    setTampered(true);
    setVerifyResult(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />)}</div>
      </div>
    );
  }

  if (!credit) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Shield className="w-10 h-10 text-charcoal-subtle mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-charcoal mb-2">MCU not found</h1>
        <p className="text-sm text-charcoal-muted mb-4">Token ID <span className="font-mono">{tokenId}</span> was not found in the ledger.</p>
        <Link to="/marketplace" className="btn-outline-sm">Back to marketplace</Link>
      </div>
    );
  }

  const verifyUrl = `${window.location.origin}/verify/${credit.id}`;
  const sdgBreakdown = proj?.sdgScores ? Object.entries(proj.sdgScores) : [];

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-forest block mb-1">MCU Detail</span>
          <h1 className="text-2xl font-semibold text-charcoal">{credit.id}</h1>
          <p className="text-sm text-charcoal-muted mt-0.5">{proj?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {credit.retired && <span className="badge-retired">Retired</span>}
          {credit.listed && !credit.retired && <span className="badge-listed">Listed</span>}
          {!credit.listed && !credit.retired && <span className="badge-approved">Unlisted</span>}
        </div>
      </div>

      {buySuccess && (
        <div className="mb-6 p-4 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          MCU purchased successfully. Go to <Link to="/my-credits" className="underline ml-1">My Credits</Link> to view it.
        </div>
      )}
      {buyError && <div className="mb-6 p-4 rounded bg-red-50 border border-red-200 text-red-800 text-xs">{buyError}</div>}
      {credit.retired && (
        <div className="mb-6 p-4 rounded bg-gray-50 border border-gray-200 text-gray-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          This credit is retired and locked permanently. It cannot be sold or transferred again.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: detail */}
        <div className="lg:col-span-2 space-y-5">
          {/* Project info */}
          <div className="clean-card p-5">
            {proj?.imageUrl && (
              <div className="h-48 sm:h-64 rounded overflow-hidden border border-gray-100 bg-cream-light mb-4">
                <img src={proj.imageUrl} alt={proj?.name || "Project"} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-start gap-4 mb-4">
              <ProjectTypeIcon type={proj?.projectType} size="md" showLabel imageUrl={proj?.imageUrl} />
              <div>
                <h2 className="text-base font-semibold text-charcoal">{proj?.name}</h2>
                <div className="flex items-center gap-1.5 text-xs text-charcoal-muted mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {proj?.location}
                </div>
              </div>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">{proj?.description}</p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <Link
                to={`/projects/${proj?.slug || proj?.id}`}
                className="btn-neutral-outline text-xs inline-flex items-center gap-1.5"
              >
                View full CRI project details &rarr;
              </Link>
              {proj?.proofUrl && (
                <a
                  href={proj.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-forest underline"
                >
                  View on CRI registry <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Credit fields */}
          <div className="clean-card p-5 space-y-3">
            <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-3">Ledger Record</h3>
            <Field label="Credit Serial (MCU ID)" value={credit.id} mono />
            <Field label="Project" value={proj?.name} />
            <Field label="Amount" value={`${credit.amount.toLocaleString("en-IN")} tCO2e`} />
            <Field label="Current Owner" value={shortenAddr(credit.owner)} mono />
            {credit.listed && <Field label="Listed Price" value={`${formatINR(credit.price)} (Rs ${credit.pricePerTonne.toLocaleString("en-IN")}/tCO2e)`} />}
            <Field label="Minted" value={new Date(credit.mintedAt).toLocaleDateString("en-IN", { dateStyle: "long" })} />
            {credit.retired && (
              <>
                <div className="border-t border-gray-100 pt-3" />
                <Field label="Retired" value={new Date(credit.retiredAt).toLocaleDateString("en-IN", { dateStyle: "long" })} />
                <Field label="Retired By" value={credit.retireeName} />
                {credit.onBehalfOf && <Field label="On Behalf Of" value={credit.onBehalfOf} />}
                <Field label="Reason" value={credit.reason} />
                {credit.message && <Field label="Message" value={credit.message} />}
              </>
            )}
          </div>

          {/* SDG breakdown */}
          {sdgBreakdown.length > 0 && (
            <div className="clean-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider">SDG Impact Analysis</h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest border border-forest/20 rounded px-2 py-0.5 bg-forest-light/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Impact Factor {credit.impactFactor}
                </span>
              </div>
              <div className="space-y-2">
                {sdgBreakdown.map(([sdgId, score]) => {
                  const contribution = score.scale * score.intensity;
                  return (
                    <div key={sdgId} className="flex items-center gap-3 text-xs">
                      <span className="w-24 font-medium text-charcoal flex-shrink-0">{SDG_NAMES[sdgId] || `SDG ${sdgId}`}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-forest rounded-full h-1.5" style={{ width: `${(contribution / 25) * 100}%` }} />
                      </div>
                      <span className="text-charcoal-muted w-12 text-right font-mono">{score.scale}x{score.intensity}={contribution}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-charcoal-subtle mt-3">
                Impact Factor = sum of top 4 SDG contributions (scale x intensity) / 100. Method: CRI SDG Assessment Framework.
              </p>
            </div>
          )}

          {/* Timeline */}
          {history.length > 0 && (
            <div className="clean-card p-5">
              <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-4">Ledger Timeline</h3>
              <ol className="relative space-y-4 pl-5 border-l border-gray-200">
                {history.map((block, i) => (
                  <li key={i} className="relative">
                    <div className="absolute -left-[21px] w-3 h-3 rounded-full border-2 border-forest bg-white" />
                    <div className="text-xs font-medium text-charcoal">{ACTION_LABELS[block.action] || block.action}</div>
                    <div className="text-[11px] text-charcoal-muted">{new Date(block.timestamp).toLocaleString("en-IN")}</div>
                    <Link to={`/ledger/${block.index}`} className="text-[11px] font-mono text-forest underline hover:text-forest-hover">
                      View ledger record (Block #{block.index})
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Verify integrity */}
          <div className="clean-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-charcoal">Verify ledger integrity</h3>
                <p className="text-xs text-charcoal-muted mt-0.5">Recomputes SHA-256 hashes for all blocks in the chain.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleVerify} disabled={verifying} className="btn-outline-sm flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  {verifying ? "Verifying..." : "Verify chain"}
                </button>
                <button onClick={handleTamper} className="btn-neutral-outline text-xs py-1 px-2 text-red-600 border-red-200 hover:bg-red-50" title="Dev: tamper a block">
                  Tamper (dev)
                </button>
              </div>
            </div>
            {tampered && <p className="text-[11px] text-amber-700 mb-2">Block tampered. Run verify to detect the break.</p>}
            {verifyResult && (
              <div className={`flex items-start gap-2 p-3 rounded border text-xs ${verifyResult.intact ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                {verifyResult.intact
                  ? <><CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /><span><strong>Chain intact.</strong> {verifyResult.checked} blocks verified.</span></>
                  : <><AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" /><span><strong>Chain broken!</strong> {verifyResult.reason}</span></>}
              </div>
            )}
          </div>
        </div>

        {/* Right: actions + QR */}
        <div className="space-y-5">
          {/* Buy */}
          {credit.listed && !credit.retired && (
            <div className="clean-card p-5">
              <div className="text-2xl font-semibold text-charcoal mb-1">{formatINR(credit.price)}</div>
              <div className="text-xs text-charcoal-muted mb-4">Rs {credit.pricePerTonne.toLocaleString("en-IN")}/tCO2e</div>
              {isOwner ? (
                <div className="text-xs text-charcoal-muted border border-gray-200 rounded p-3 text-center">Your listing</div>
              ) : (
                <button onClick={handleBuy} disabled={buying || buySuccess} className="btn-outline w-full py-2.5 text-sm flex items-center justify-center gap-2">
                  {buying ? <><RefreshCw className="w-4 h-4 animate-spin" />Confirming...</> : buySuccess ? <><CheckCircle2 className="w-4 h-4" />Purchased</> : <><ShoppingBag className="w-4 h-4" />Buy MCU</>}
                </button>
              )}
              {!effectiveWallet && (
                <p className="text-[11px] text-charcoal-muted mt-2 text-center">
                  <Link to="/connect-wallet" className="text-forest underline">Set up wallet</Link> to buy
                </p>
              )}
            </div>
          )}

          {/* Owner actions */}
          {isOwner && !credit.retired && (
            <div className="clean-card p-5 space-y-2">
              <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-3">Owner Actions</h3>
              <Link to={`/retire/${credit.id}`} className="btn-neutral-outline w-full text-sm flex items-center justify-center gap-1.5 py-2">
                <Leaf className="w-4 h-4" />
                Retire this MCU
              </Link>
            </div>
          )}

          {/* Certificate */}
          {credit.retired && (
            <div className="clean-card p-5">
              <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-3">Retirement Certificate</h3>
              <Link to={`/certificate/${credit.id}`} className="btn-outline w-full text-sm flex items-center justify-center gap-1.5 py-2">
                <ExternalLink className="w-4 h-4" />
                View Certificate
              </Link>
            </div>
          )}

          {/* QR code */}
          <div className="clean-card p-5">
            <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-3">Public Verification</h3>
            <p className="text-[11px] text-charcoal-muted mb-3 leading-snug">
              Scan to verify this MCU's provenance, owner and retirement status without login.
            </p>
            {QRCode ? (
              <div className="flex justify-center p-2 bg-white border border-gray-200 rounded">
                <QRCode value={verifyUrl} size={120} />
              </div>
            ) : (
              <div className="flex justify-center p-4 bg-gray-50 border border-gray-200 rounded text-xs text-charcoal-muted">
                Loading QR...
              </div>
            )}
            <Link to={`/verify/${credit.id}`} className="text-[11px] text-forest underline hover:text-forest-hover mt-2 block text-center">
              Open public verification page
            </Link>
          </div>

          <div className="text-[11px] text-charcoal-subtle text-center">
            CarbonChain Ledger: SHA-256 hash-chained, tamper-evident records
          </div>
        </div>
      </div>

      {/* Universal Connected Wallet Payment Sheet */}
      {isPaymentSheetOpen && (
        <PaymentSheet
          credit={credit}
          project={proj}
          onClose={() => setIsPaymentSheetOpen(false)}
          onPurchased={() => {
            setIsPaymentSheetOpen(false);
            setBuySuccess(true);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3">
      <span className="text-[11px] font-medium text-charcoal-subtle w-36 flex-shrink-0">{label}</span>
      <span className={`text-xs text-charcoal break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
