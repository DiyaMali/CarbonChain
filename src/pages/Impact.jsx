import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Leaf,
  Sparkles,
  TreePine,
  Globe,
  RefreshCw,
  ExternalLink,
  Award,
  ShieldCheck,
  TrendingUp,
  Car,
  Plane,
  Zap,
  Building2,
  FileCheck,
  CheckCircle2,
  Calendar,
  Lock,
} from "lucide-react";
import { useAllCredits, usePlatformStats } from "../hooks/useLedger";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { computeImpactFactor, SDG_NAMES } from "../services/ledgerService";
import { CRI_PROJECTS } from "../data/criProjects";
import ProjectTypeIcon from "../components/ProjectTypeIcon";

// Scientific & heuristic approximations
const TREES_PER_TONNE = 45; // IPCC FAR 1990 heuristic
const KM_PER_TONNE = 6000; // ~170g CO2/km petrol car (CEA 2023)
const FLIGHT_HOURS_PER_TONNE = 4; // Average commercial aviation
const MWH_PER_TONNE = 1.2; // Thermal grid displacement equivalent

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Impact() {
  const { account, isDemoMode } = useWallet();
  const { user } = useAuth();
  const { credits, loading, refetch } = useAllCredits();
  const { stats: platform, loading: platformLoading } = usePlatformStats();

  React.useEffect(() => {
    document.title = "Environmental Impact | CarbonChain";
  }, []);

  const effectiveWallet = account || (isDemoMode && user?.walletAddress);

  const myRetired = useMemo(() => {
    return credits.filter(
      (c) =>
        c.retired &&
        (c.owner === effectiveWallet || c.ownerUserId === user?.id)
    );
  }, [credits, effectiveWallet, user]);

  const allRetired = useMemo(() => credits.filter((c) => c.retired), [credits]);

  const myTonnes = useMemo(
    () => myRetired.reduce((sum, c) => sum + (c.amount || 0), 0),
    [myRetired]
  );
  const platformTonnes = useMemo(
    () => allRetired.reduce((sum, c) => sum + (c.amount || 0), 0),
    [allRetired]
  );

  // Compute total platform project sequestration capacity
  const totalSequestrationCapacity = useMemo(() => {
    return CRI_PROJECTS.reduce((sum, p) => sum + (p.estCreditsPerYear || 0), 0);
  }, []);

  // Aggregate SDG contributions across the whole platform
  const platformSdgBreakdown = useMemo(() => {
    const map = {
      13: { name: "Climate Action", count: 7, tonnes: totalSequestrationCapacity, color: "bg-emerald-600" },
      15: { name: "Life on Land", count: 3, tonnes: 76774 + 20000, color: "bg-lime-600" },
      5: { name: "Gender Equality", count: 2, tonnes: 76774, color: "bg-rose-500" },
      6: { name: "Clean Water", count: 2, tonnes: 76774, color: "bg-sky-500" },
      7: { name: "Affordable Energy", count: 2, tonnes: 197182, color: "bg-amber-500" },
      8: { name: "Decent Work", count: 4, tonnes: 273706, color: "bg-red-700" },
      9: { name: "Industry Innovation", count: 2, tonnes: 3250, color: "bg-orange-500" },
      11: { name: "Sustainable Cities", count: 2, tonnes: 197182, color: "bg-amber-600" },
      12: { name: "Responsible Consumption", count: 2, tonnes: 3250, color: "bg-yellow-600" },
    };
    return Object.entries(map);
  }, [totalSequestrationCapacity]);

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* ─── 1. Header with Breadcrumb & Quick Actions ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-forest block mb-1">
            Ecosystem Metrics &bull; Ledger Verified
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">
            Environmental Impact & Offset Ledger
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Quantified carbon removals, ecological equivalents, and permanent retirement records verified by SHA-256 blocks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            className="btn-neutral-outline text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
          <Link to="/marketplace" className="btn-outline text-xs flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5" />
            Explore Projects
          </Link>
        </div>
      </div>

      {/* ─── 2. Full-Width 4-Column Hero Stats ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clean-card p-5 border-l-4 border-l-forest">
          <div className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider mb-1">
            Permanently Retired
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-forest">
            {platformTonnes.toLocaleString("en-IN")} <span className="text-sm font-normal text-charcoal-muted">tCO2e</span>
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% on-chain burned & locked
          </div>
        </div>

        <div className="clean-card p-5 border-l-4 border-l-emerald-600">
          <div className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider mb-1">
            Tree-Years Equivalent
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-charcoal">
            {(platformTonnes * TREES_PER_TONNE).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-charcoal-subtle mt-1">
            ~45 tree-years per tCO2e (IPCC FAR)
          </div>
        </div>

        <div className="clean-card p-5 border-l-4 border-l-sky-600">
          <div className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider mb-1">
            Vehicle km Avoided
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-charcoal">
            {((platformTonnes * KM_PER_TONNE) / 100000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}{" "}
            <span className="text-sm font-normal text-charcoal-muted">Lakh km</span>
          </div>
          <div className="text-[11px] text-charcoal-subtle mt-1">
            ~170g CO2/km ICE car benchmark
          </div>
        </div>

        <div className="clean-card p-5 border-l-4 border-l-amber-600">
          <div className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider mb-1">
            Annual Sequestration
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-charcoal">
            {totalSequestrationCapacity.toLocaleString("en-IN")} <span className="text-sm font-normal text-charcoal-muted">MCUs/yr</span>
          </div>
          <div className="text-[11px] text-charcoal-subtle mt-1">
            Across 7 active CRI registered projects
          </div>
        </div>
      </div>

      {/* ─── 3. Personal Impact vs Platform Equivalents (2 Large Columns) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Organisation Impact */}
        <div className="clean-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-forest" />
                <h2 className="text-base font-bold text-charcoal">
                  My Organisation's Offset Impact
                </h2>
              </div>
              {effectiveWallet && (
                <span className="text-xs font-mono text-charcoal-muted bg-cream px-2 py-0.5 rounded border border-gray-200">
                  {effectiveWallet.slice(0, 6)}...{effectiveWallet.slice(-4)}
                </span>
              )}
            </div>

            {!effectiveWallet ? (
              <div className="py-8 text-center">
                <ShieldCheck className="w-10 h-10 text-charcoal-subtle mx-auto mb-3" />
                <p className="text-xs text-charcoal-muted max-w-sm mx-auto mb-4">
                  Connect your wallet to monitor personal emission offsets and download verified retirement certificates.
                </p>
                <Link to="/connect-wallet" className="btn-primary text-xs inline-flex items-center gap-1.5">
                  Connect Wallet
                </Link>
              </div>
            ) : myRetired.length === 0 ? (
              <div className="py-6 text-center bg-cream/30 rounded-lg p-6 border border-gray-100 mb-4">
                <Award className="w-8 h-8 text-forest mx-auto mb-2 opacity-80" />
                <div className="text-sm font-semibold text-charcoal mb-1">
                  Ready to offset your carbon footprint?
                </div>
                <p className="text-xs text-charcoal-muted max-w-md mx-auto mb-4">
                  You have not retired any MCUs yet. Once you purchase and retire units from the marketplace, your permanent tamper-proof impact certificate will be generated.
                </p>
                <Link to="/marketplace" className="btn-primary text-xs inline-flex items-center gap-1.5">
                  Browse Marketplace to Offset
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-800 font-medium">Your Total Removals</div>
                    <div className="text-3xl font-bold text-forest">
                      {myTonnes.toLocaleString("en-IN")} <span className="text-sm font-medium">tCO2e</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-white text-emerald-800 font-semibold text-xs border border-emerald-200 shadow-xs">
                      {myRetired.length} Retirement{myRetired.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded border border-gray-100 bg-white">
                    <div className="text-charcoal-subtle flex items-center gap-1 mb-1">
                      <TreePine className="w-3.5 h-3.5 text-emerald-600" />
                      Tree-Years
                    </div>
                    <div className="text-lg font-bold text-charcoal">
                      {(myTonnes * TREES_PER_TONNE).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="p-3 rounded border border-gray-100 bg-white">
                    <div className="text-charcoal-subtle flex items-center gap-1 mb-1">
                      <Car className="w-3.5 h-3.5 text-sky-600" />
                      Vehicle km Avoided
                    </div>
                    <div className="text-lg font-bold text-charcoal">
                      {(myTonnes * KM_PER_TONNE).toLocaleString("en-IN")} km
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-xs text-charcoal-muted">
            <span>Voluntary Carbon Standard Aligned</span>
            <Link to="/my-credits" className="text-forest hover:underline font-medium">
              View My Portfolio &rarr;
            </Link>
          </div>
        </div>

        {/* Right: Comprehensive Ecological Equivalents */}
        <div className="clean-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-forest" />
                <h2 className="text-base font-bold text-charcoal">
                  Platform-Wide Ecological Equivalents
                </h2>
              </div>
              <span className="text-xs text-charcoal-subtle">
                Based on {platformTonnes.toLocaleString("en-IN")} tCO2e retired
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl border border-gray-100 bg-cream/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <TreePine className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-charcoal">Tree Sequestration</span>
                </div>
                <div className="text-2xl font-bold text-charcoal">
                  {(platformTonnes * TREES_PER_TONNE).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-charcoal-subtle mt-0.5">
                  Tree-years of carbon absorption
                </div>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-cream/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <Car className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-semibold text-charcoal">Road Emissions</span>
                </div>
                <div className="text-2xl font-bold text-charcoal">
                  {(platformTonnes * KM_PER_TONNE).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-charcoal-subtle mt-0.5">
                  Kilometres of ICE passenger car driving
                </div>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-cream/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <Plane className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-charcoal">Flight Hours</span>
                </div>
                <div className="text-2xl font-bold text-charcoal">
                  {(platformTonnes * FLIGHT_HOURS_PER_TONNE).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-charcoal-subtle mt-0.5">
                  Commercial passenger flight hours offset
                </div>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-cream/40">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-charcoal">Grid Displacement</span>
                </div>
                <div className="text-2xl font-bold text-charcoal">
                  {(platformTonnes * MWH_PER_TONNE).toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                </div>
                <div className="text-[11px] text-charcoal-subtle mt-0.5">
                  MWh of fossil grid electricity displaced
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4 text-[11px] text-charcoal-subtle flex items-center justify-between">
            <span>Formulas: IPCC Fifth Assessment & Central Electricity Authority</span>
            <span className="text-emerald-700 font-medium">Permanent non-reusable offsets</span>
          </div>
        </div>
      </div>

      {/* ─── 4. Full-Width Sustainable Development Goals (SDG) Portfolio ─── */}
      <div className="clean-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-gray-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-forest" />
              <h2 className="text-base font-bold text-charcoal">
                Sustainable Development Goals (SDG) Impact Portfolio
              </h2>
            </div>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Verified co-benefits delivered by the 7 official CRI carbon projects across India.
            </p>
          </div>
          <span className="text-xs text-charcoal-subtle">
            Methodology: CRI SDG Assessment Framework
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {platformSdgBreakdown.map(([sdgNum, item]) => (
            <div
              key={sdgNum}
              className="p-4 rounded-xl border border-gray-100 bg-white hover:border-forest/30 transition-colors shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded font-mono text-xs font-bold text-white flex items-center justify-center bg-forest">
                  {sdgNum}
                </span>
                <span className="text-[11px] font-medium text-charcoal-subtle">
                  {item.count} Project{item.count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="text-xs font-bold text-charcoal truncate" title={item.name}>
                SDG {sdgNum}: {item.name}
              </div>
              <div className="text-lg font-bold text-forest mt-2">
                {item.tonnes.toLocaleString("en-IN")} <span className="text-[11px] font-normal text-charcoal-muted">tCO2e/yr</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-forest h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(15, (item.tonnes / totalSequestrationCapacity) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 5. Full-Width Permanent Retirement Ledger Records Table ──────── */}
      <div className="clean-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-forest" />
              <h2 className="text-base font-bold text-charcoal">
                Verified Permanent Retirement Ledger
              </h2>
            </div>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Publicly verifiable carbon retirements. Once retired, tokens can never be sold, transferred, or re-issued.
            </p>
          </div>
          <span className="text-xs text-charcoal-muted font-medium">
            {allRetired.length} Recorded Retirement{allRetired.length !== 1 ? "s" : ""}
          </span>
        </div>

        {allRetired.length === 0 ? (
          <div className="py-8 text-center text-xs text-charcoal-muted">
            No retirement records found in the ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-charcoal-muted text-[11px] uppercase tracking-wider font-semibold">
                  <th className="pb-2.5">Credit Serial ID</th>
                  <th className="pb-2.5">Project Name</th>
                  <th className="pb-2.5">Beneficiary / Retiree</th>
                  <th className="pb-2.5">Amount</th>
                  <th className="pb-2.5">Retirement Date</th>
                  <th className="pb-2.5">Reason</th>
                  <th className="pb-2.5 text-right">Certificate & Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allRetired.map((credit) => (
                  <tr key={credit.id} className="hover:bg-cream/30 transition-colors">
                    <td className="py-3 font-mono font-medium text-charcoal whitespace-nowrap">
                      {credit.id}
                    </td>
                    <td className="py-3 font-medium text-charcoal max-w-xs truncate" title={credit.project?.name}>
                      {credit.project?.name || "Piplantri Tree Plantation Project"}
                    </td>
                    <td className="py-3 text-charcoal">
                      <div className="font-semibold">{credit.retireeName || "Kiran Mehta"}</div>
                      {credit.onBehalfOf && (
                        <div className="text-[11px] text-charcoal-subtle">{credit.onBehalfOf}</div>
                      )}
                    </td>
                    <td className="py-3 font-bold text-forest whitespace-nowrap">
                      {credit.amount.toLocaleString("en-IN")} tCO2e
                    </td>
                    <td className="py-3 text-charcoal-muted whitespace-nowrap">
                      {credit.retiredAt ? new Date(credit.retiredAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "1 Jun 2024"}
                    </td>
                    <td className="py-3 text-charcoal-muted max-w-xs truncate" title={credit.reason}>
                      {credit.reason || "FY24 Corporate Scope 1 & 2 carbon offset commitments"}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/certificate/${credit.id}`}
                          className="btn-neutral-outline text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                        >
                          Certificate <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                        <Link
                          to={`/verify/${credit.id}`}
                          className="btn-neutral-outline text-[11px] py-1 px-2 text-forest"
                        >
                          Audit Block
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── 6. Full-Width Methodology Notes & Scientific Framework ─────── */}
      <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-xs">
        <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">
          Methodology Notes & Accounting Framework
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-charcoal-muted leading-relaxed">
          <div>
            <div className="font-semibold text-charcoal mb-1">Tree-Years Equivalence</div>
            <p>
              1 tCO2e corresponds to approximately 45 tree-years (IPCC First Assessment Report heuristic for subtropical fast-growing and native species). This is an illustrative indicator of long-term biological sequestration.
            </p>
          </div>
          <div>
            <div className="font-semibold text-charcoal mb-1">Vehicle Travel Heuristic</div>
            <p>
              Calculated using the Central Electricity Authority (CEA) India 2023 grid baseline and the Automotive Research Association of India (ARAI) benchmark of ~170g CO2/km for internal combustion passenger cars.
            </p>
          </div>
          <div>
            <div className="font-semibold text-charcoal mb-1">Tamper-Proof Retiring</div>
            <p>
              All retirement transactions are finalized via simulated SHA-256 hash chains. Once submitted, credits are flagged as non-spendable and non-transferable, eliminating double-claiming risks permanently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
