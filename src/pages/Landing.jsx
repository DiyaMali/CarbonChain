import React from "react";
import { Link } from "react-router-dom";
import {
  FileUp,
  CheckCircle2,
  Coins,
  ArrowLeftRight,
  Lock,
  MapPin,
  Sparkles,
  Database,
  ShieldCheck,
  Award,
  ChevronDown
} from "lucide-react";
import { usePlatformStats, useMarketplaceCredits } from "../hooks/useLedger";
import { SDG_NAMES } from "../services/ledgerService";
import ProjectTypeIcon from "../components/ProjectTypeIcon";
import HeroVideo from "../components/HeroVideo";

const STEPS = [
  {
    icon: <FileUp className="w-5 h-5 text-forest" />,
    label: "Submit",
    desc: "Project Proponent registers project with evidence, photos and calculation factors.",
  },
  {
    icon: <CheckCircle2 className="w-5 h-5 text-forest" />,
    label: "Verify",
    desc: "A verifier reviews the evidence and approves or rejects the project.",
  },
  {
    icon: <Coins className="w-5 h-5 text-forest" />,
    label: "Tokenize",
    desc: "Each verified tCO2e is minted as an MCU token with FIFO serial tracking.",
  },
  {
    icon: <ArrowLeftRight className="w-5 h-5 text-forest" />,
    label: "Trade",
    desc: "Transactional Organisations browse and buy verified credits with per-tonne pricing.",
  },
  {
    icon: <Lock className="w-5 h-5 text-forest" />,
    label: "Retire",
    desc: "Retirement is approved by a verifier after payment is confirmed, then locked permanently.",
  },
];

const PROBLEM_STATS = [
  { stat: "₹8.6T", label: "India's estimated voluntary carbon market potential by 2030", source: "NITI Aayog" },
  { stat: "78%", label: "of audited projects found with data integrity issues in legacy registries", source: "Berkeley Carbon Trading Project" },
  { stat: "90%", label: "of project applications without traceable digital audit trail", source: "State of Voluntary Carbon Markets" },
  { stat: "85%", label: "of buyers concerned about double-counting risk", source: "Bloomberg NEF 2023" },
];

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function Landing() {
  const { stats, loading: statsLoading } = usePlatformStats();
  const { credits: listedCredits, loading: creditsLoading } = useMarketplaceCredits();

  React.useEffect(() => {
    document.title = "CarbonChain | Transparent Carbon Credit Trading for India";
  }, []);

  // Sort marketplace preview with Green Wings first on ties per spec §5
  const previewCredits = React.useMemo(() => {
    const sorted = [...listedCredits].sort((a, b) => {
      const aName = (a.project?.name || "").toLowerCase();
      const bName = (b.project?.name || "").toLowerCase();
      if (aName.includes("green wings")) return -1;
      if (bName.includes("green wings")) return 1;
      return 0;
    });
    return sorted.slice(0, 3);
  }, [listedCredits]);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* ── Cinematic Hero — exact sprout-hero layout with green oval buttons on windmill fans ── */}
      <section className="relative min-h-screen w-full overflow-hidden bg-white">
        {/* Video background — covers screen */}
        <HeroVideo />

        {/* Hero content — z-10 */}
        <div
          className="relative z-10 flex flex-col items-center justify-center px-6 pb-20 text-center"
          style={{ paddingTop: "calc(5.5rem + 1rem)" }}
        >
          {/* Main headline */}
          <h1
            className="animate-fade-rise max-w-6xl text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-normal text-[#0F2A1D]"
            style={{ fontFamily: "var(--font-display)", lineHeight: 0.95, letterSpacing: "-2px" }}
          >
            CarbonChain
          </h1>

          {/* Description */}
          <p className="animate-fade-rise-delay mt-3.5 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed text-[#5F6F66]">
            A transparent platform for carbon credit tracking and trading.
          </p>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-[#0F2A1D]">
          Scroll to explore live ledger data &amp; verified projects ↓
        </div>

        {/* Explore Marketplace — floats above 2nd windmill from left */}
        <Link
          to="/marketplace"
          className="animate-fade-rise-delay-2 absolute z-20 rounded-full bg-[#1F5C3F] px-6 py-3 sm:px-8 sm:py-4 text-xs sm:text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-[1.04] hover:shadow-xl"
          style={{ bottom: "53%", left: "26%", transform: "translateX(-50%)" }}
        >
          Explore Marketplace
        </Link>

        {/* Get Started — floats above windmill fan center */}
        <Link
          to="/signup"
          className="animate-fade-rise-delay-2 absolute z-20 rounded-full bg-[#1F5C3F] px-6 py-3 sm:px-8 sm:py-4 text-xs sm:text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-[1.04] hover:shadow-xl"
          style={{ bottom: "53%", left: "63%", transform: "translateX(-50%)" }}
        >
          Get Started
        </Link>
      </section>

      {/* ─── 2. Problem Stats ─── */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-charcoal mb-1">The double-counting problem</h2>
          <p className="text-sm text-charcoal-muted max-w-2xl leading-relaxed">
            India's voluntary carbon market faces a structural transparency gap. Legacy registries rely on manual spreadsheets: the same credit can be claimed by multiple parties.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROBLEM_STATS.map(({ stat, label, source }) => (
            <div key={stat} className="clean-card p-4">
              <div className="text-2xl font-semibold text-charcoal mb-1 font-mono">{stat}</div>
              <div className="text-xs text-charcoal-muted leading-snug mb-2">{label}</div>
              <div className="text-[10px] uppercase tracking-wider text-charcoal-subtle font-medium">{source}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. Official CRI Definition (CRI Glossary) ─── */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="border border-forest/20 rounded p-5 sm:p-6 bg-forest/5">
          <div className="text-[10px] uppercase tracking-wider text-forest font-semibold mb-2">
            Official CRI Definition &bull; Double Counting
          </div>
          <blockquote className="text-sm text-charcoal leading-relaxed italic">
            "Double counting occurs when the same GHG emission reduction or removal is counted more than once towards achieving mitigation targets. This can occur in three forms: double issuance, double use, and double claiming."
          </blockquote>
          <div className="text-[11px] text-charcoal-subtle mt-2 font-mono">
            Source: Carbon Registry India (registry.nccf.in), Methodology Framework v1.0
          </div>
        </div>
      </section>

      {/* ─── 4. Solution & 5 Steps ─── */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-charcoal mb-1">How CarbonChain solves it</h2>
          <p className="text-sm text-charcoal-muted max-w-2xl leading-relaxed">
            A hash-chained ledger where every action (submit, verify, tokenize, trade, retire) is appended as a tamper-evident block. Retirement is approved by an accredited verifier and locked permanently.
          </p>
        </div>

        {/* 5-step visual with exact spec §14 step copy */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STEPS.map((step, i) => (
            <div key={step.label} className="clean-card p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded border border-forest/20 bg-forest/5 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-mono text-charcoal-subtle font-bold">
                    STEP {i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-charcoal mb-1">{step.label}</h3>
                <p className="text-xs text-charcoal-muted leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. Unified Account Structure & Architecture ─── */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="clean-card p-6">
          <h2 className="text-base font-semibold text-charcoal mb-2">
            Same company, both sides of the trade
          </h2>
          <p className="text-xs text-charcoal-muted leading-relaxed max-w-3xl">
            CarbonChain mirrors India's Carbon Registry account architecture: Independent Project Proponent (IPP), Validation and Verification Body (VVB), and Transactional Organisation (TO).
            Organisations select their capabilities (Sell, Buy, or both) with strict role segregation. Verification Authorities independently audit evidence and authorize permanent retirement certificates.
          </p>
        </div>
      </section>

      {/* ─── 6. Built on India's Registry Model ─── */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-charcoal mb-2">Built on India's registry model</h2>
            <p className="text-xs text-charcoal-muted leading-relaxed mb-4">
              Carbon Registry India (CRI), operated by NCCF, establishes standards for Marketable Carbon Unit (MCU) issuance, baseline calculation methodologies, and additionality. CarbonChain aligns directly with this operational model.
            </p>
            <a
              href="https://registry.nccf.in"
              target="_blank"
              rel="noreferrer"
              className="btn-neutral-outline text-xs inline-flex items-center gap-1.5"
            >
              <span>Explore CRI Registry</span>
              &rarr;
            </a>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-3 w-full">
            {[
              { role: "IPP", title: "Project Proponent", desc: "Submits evidence" },
              { role: "VVB", title: "Verification Body", desc: "Audits & approves" },
              { role: "TO", title: "Transactional Org", desc: "Buys & retires" },
            ].map((item, i) => (
              <div key={i} className="clean-card p-3 text-center">
                <span className="text-xs font-mono font-bold text-forest block">{item.role}</span>
                <span className="text-xs font-semibold text-charcoal block mt-0.5">{item.title}</span>
                <span className="text-[10px] text-charcoal-subtle block mt-0.5">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. Live Ledger Statistics ─── */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="clean-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-2">
            <div>
              <h2 className="text-base font-semibold text-charcoal">CarbonChain Ledger &bull; Live Records</h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                SHA-256 hash-chained, tamper-evident records. Computed from live ledger data.
              </p>
            </div>
            <Link
              to="/ledger/0"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-forest border border-forest/20 rounded px-2.5 py-1 bg-forest/5 hover:bg-forest/10 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Verify Block Chain</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono">
            {[
              { label: "Projects on ledger", value: statsLoading ? "--" : stats?.projectCount ?? 0 },
              { label: "MCUs issued", value: statsLoading ? "--" : stats?.creditCount ?? 0 },
              { label: "tCO2e retired", value: statsLoading ? "--" : (stats?.retiredTonnes ?? 0).toLocaleString("en-IN") },
              { label: "Ledger blocks", value: statsLoading ? "--" : stats?.blockCount ?? 0 },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-2xl sm:text-3xl font-semibold text-charcoal">{value}</div>
                <div className="text-xs text-charcoal-muted mt-0.5 font-sans">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. Marketplace Preview ─── */}
      {!creditsLoading && previewCredits.length > 0 && (
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-charcoal">Verified Marketplace Projects</h2>
              <p className="text-xs text-charcoal-muted">Active project listings ready for purchase and retirement.</p>
            </div>
            <Link to="/marketplace" className="btn-outline-sm">View Marketplace &rarr;</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {previewCredits.map((credit) => (
              <Link
                key={credit.id}
                to={`/projects/${credit.project?.slug || credit.projectId}`}
                className="clean-card p-4 hover:border-forest/40 transition-colors block group"
              >
                <div className="h-32 rounded overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center mb-3 relative">
                  {credit.project?.imageUrl ? (
                    <img
                      src={credit.project.imageUrl}
                      alt={credit.project?.name || "Project"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <ProjectTypeIcon type={credit.project?.projectType} size="md" />
                  )}
                </div>
                <div className="text-xs font-semibold text-charcoal truncate">{credit.project?.name}</div>
                <div className="flex items-center gap-1 text-[11px] text-charcoal-muted mt-0.5">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="truncate">{credit.project?.location}</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-charcoal font-mono">
                  {credit.amount?.toLocaleString("en-IN")} tCO2e available
                </div>
                <div className="text-[11px] text-charcoal-muted font-mono">
                  ₹{credit.pricePerTonne?.toLocaleString("en-IN")}/tCO2e (indicative)
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── 9. Final CTA ─── */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-semibold text-charcoal mb-2">
          Start trading transparent carbon credits
        </h2>
        <p className="text-xs text-charcoal-muted mb-6 max-w-md mx-auto leading-relaxed">
          Submit verified emission reduction projects, audit technical evidence as a Verification Authority, or acquire traceable offsets.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/signup" className="px-6 py-2.5 rounded border border-forest text-forest hover:bg-forest/5 text-xs font-semibold transition-colors cursor-pointer">
            Create an Account
          </Link>
          <Link to="/marketplace" className="btn-neutral-outline px-6 py-2.5 text-xs font-semibold">
            Browse Marketplace
          </Link>
        </div>
      </section>
    </div>
  );
}
