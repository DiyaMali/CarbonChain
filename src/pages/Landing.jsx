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
} from "lucide-react";
import { usePlatformStats, useMarketplaceCredits } from "../hooks/useLedger";
import { SDG_NAMES } from "../services/ledgerService";
import ProjectTypeIcon from "../components/ProjectTypeIcon";
import HeroVideo from "../components/HeroVideo";

const STEPS = [
  { icon: <FileUp className="w-5 h-5 text-forest" />, label: "Submit", desc: "IPP registers a project on the platform with proof documentation." },
  { icon: <CheckCircle2 className="w-5 h-5 text-forest" />, label: "Verify", desc: "An accredited VVB (Validation and Verification Body) audits and approves the sequestration data." },
  { icon: <Coins className="w-5 h-5 text-forest" />, label: "Tokenize", desc: "Each verified tCO2e is minted as an MCU: a unique, tamper-proof ledger record." },
  { icon: <ArrowLeftRight className="w-5 h-5 text-forest" />, label: "Trade", desc: "TOs (Transactional Organisations) browse and buy MCUs on the open marketplace." },
  { icon: <Lock className="w-5 h-5 text-forest" />, label: "Retire", desc: "The buyer retires the MCU permanently. Retirement is irreversible -- no double counting." },
];

const PROBLEM_STATS = [
  { stat: "Rs 8.6T", label: "India's estimated voluntary carbon market potential by 2030", source: "NITI Aayog" },
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

  const previewCredits = listedCredits.slice(0, 3);

  return (
    <div className="space-y-10 sm:space-y-12 pb-12">
      {/* ── Cinematic Hero — exact sprout-hero layout ── */}
      <section className="relative min-h-screen w-full overflow-hidden bg-white">
        {/* Video background — z-0, anchored bottom */}
        <HeroVideo />

        {/* Hero content — z-10 */}
        <section
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
        </section>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-[#0F2A1D]">
          Scroll to explore live ledger data &amp; verified projects ↓
        </div>

        {/* Explore Marketplace — floats above 2nd windmill from left */}
        <Link
          to="/marketplace"
          className="animate-fade-rise-delay-2 absolute z-20 rounded-full bg-[#1F5C3F] px-8 py-4 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-[1.04] hover:shadow-xl"
          style={{ bottom: "53%", left: "26%", transform: "translateX(-50%)" }}
        >
          Explore Marketplace
        </Link>

        {/* Get Started — floats above windmill fan center */}
        <Link
          to="/signup"
          className="animate-fade-rise-delay-2 absolute z-20 rounded-full bg-[#1F5C3F] px-8 py-4 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-[1.04] hover:shadow-xl"
          style={{ bottom: "53%", left: "63%", transform: "translateX(-50%)" }}
        >
          Get Started
        </Link>
      </section>

      {/* Live stats */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="border border-gray-200 rounded p-6 sm:p-8 bg-cream-light">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-gray-200 gap-2">
            <div>
              <h2 className="text-lg font-semibold text-charcoal">Demo Ledger -- Live Data</h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Computed from seeded CRI project data. No mocked metrics.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-forest border border-forest/20 rounded px-2.5 py-1 bg-forest-light/30">
              <Database className="w-3.5 h-3.5" />
              SHA-256 hash-chained
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Projects on ledger", value: statsLoading ? "--" : stats?.projectCount ?? 0 },
              { label: "MCUs issued", value: statsLoading ? "--" : stats?.creditCount ?? 0 },
              { label: "tCO2e retired", value: statsLoading ? "--" : (stats?.retiredTonnes ?? 0).toLocaleString("en-IN") },
              { label: "Ledger blocks", value: statsLoading ? "--" : stats?.blockCount ?? 0 },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-2xl sm:text-3xl font-semibold text-charcoal">{value}</div>
                <div className="text-xs text-charcoal-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem stats */}
      <section className="w-full max-w-[1536px] mx-auto px-4 sm:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-charcoal mb-1">The double-counting problem</h2>
          <p className="text-sm text-charcoal-muted max-w-2xl leading-relaxed">
            India's voluntary carbon market faces a structural transparency gap. Legacy registries rely on manual records -- the same credit can be claimed by multiple parties.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROBLEM_STATS.map(({ stat, label, source }) => (
            <div key={stat} className="border border-gray-200 rounded p-4 bg-white">
              <div className="text-2xl font-semibold text-charcoal mb-1">{stat}</div>
              <div className="text-xs text-charcoal-muted leading-snug mb-2">{label}</div>
              <div className="text-[10px] uppercase tracking-wider text-charcoal-subtle font-medium">{source}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Official CRI definition */}
      <section className="w-full max-w-[1536px] mx-auto px-4 sm:px-8">
        <div className="border border-forest/20 rounded p-5 sm:p-6 bg-forest-light/20">
          <div className="text-[10px] uppercase tracking-wider text-forest font-semibold mb-2">
            CRI Definition -- Double Counting
          </div>
          <blockquote className="text-sm text-charcoal leading-relaxed italic">
            "Double counting occurs when the same GHG emission reduction or removal is counted more than once towards achieving the mitigation targets. This can occur in three forms: double issuance, double use, and double claiming."
          </blockquote>
          <div className="text-[11px] text-charcoal-subtle mt-2">
            Source: India Carbon Registry (CRI / NCCF), Methodology Framework v1.0
          </div>
        </div>
      </section>

      {/* Solution explainer */}
      <section className="w-full max-w-[1536px] mx-auto px-4 sm:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-charcoal mb-1">How CarbonChain solves it</h2>
          <p className="text-sm text-charcoal-muted max-w-2xl">
            A hash-chained ledger where every action (mint, list, buy, retire) is appended as a tamper-evident block. Retiring an MCU is irreversible -- the record is locked forever.
          </p>
        </div>

        {/* 5-step visual */}
        <div className="flex flex-col sm:flex-row gap-0">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 flex-1">
              <div className="flex sm:flex-col items-center gap-2 sm:gap-0 w-full">
                <div className="w-10 h-10 rounded border border-forest/20 bg-forest-light flex items-center justify-center flex-shrink-0">
                  {step.icon}
                </div>
                {i < STEPS.length - 1 && (
                  <>
                    <div className="hidden sm:block flex-1 h-px bg-forest/20 w-full mt-5" />
                    <div className="sm:hidden w-px flex-1 bg-forest/20" style={{ minHeight: "24px" }} />
                  </>
                )}
              </div>
              <div className="sm:text-center sm:px-2">
                <div className="text-sm font-semibold text-charcoal">{step.label}</div>
                <div className="text-[11px] text-charcoal-muted mt-0.5 leading-snug">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Same account, both sides */}
      <section className="w-full max-w-[1536px] mx-auto px-4 sm:px-8">
        <div className="border border-gray-200 rounded p-5 sm:p-6 bg-white">
          <h2 className="text-base font-semibold text-charcoal mb-2">Same account, both sides of the trade</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            CarbonChain uses a unified account model. Any organisation can be an Independent Project Proponent (IPP) who submits projects, and also a Transactional Organisation (TO) who buys and retires credits.
            Only VVBs (Validation and Verification Bodies) are separately permissioned -- they cannot buy or sell credits, only audit.
            This mirrors the CRI account structure: IPP, VVB, TO -- with one unified login.
          </p>
        </div>
      </section>

      {/* Built on India's registry model */}
      <section className="w-full max-w-[1536px] mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-charcoal mb-2">Built on India's registry model</h2>
            <p className="text-sm text-charcoal-muted leading-relaxed mb-3">
              The Carbon Registry India (CRI), operated by NCCF under the Ministry of Environment, Forest and Climate Change, defines the rules for MCU issuance, VVB accreditation and credit lifecycle.
              CarbonChain implements the same terminology and workflow: IPP submits, VVB verifies, MCU is issued, TO buys and retires.
            </p>
            <a href="https://cri.nccf.in" target="_blank" rel="noreferrer" className="btn-text text-xs">
              Visit cri.nccf.in &rarr;
            </a>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-3">
            {["IPP\nProject Owner", "VVB\nVerifier", "TO\nBuyer"].map((role, i) => (
              <div key={i} className="border border-gray-200 rounded p-3 text-center">
                <div className="text-xs font-semibold text-charcoal whitespace-pre-line">{role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace preview */}
      {!creditsLoading && previewCredits.length > 0 && (
        <section className="w-full max-w-[1536px] mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-charcoal">Live from the marketplace</h2>
            <Link to="/marketplace" className="btn-text text-xs">View all &rarr;</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {previewCredits.map((credit) => (
              <Link
                key={credit.id}
                to={`/projects/${credit.project?.slug || credit.projectId}`}
                className="clean-card p-4 hover:border-forest/30 transition-colors block group"
              >
                <div className="h-28 rounded overflow-hidden bg-cream-light border border-gray-100 flex items-center justify-center mb-3 relative">
                  {credit.project?.imageUrl ? (
                    <img
                      src={credit.project.imageUrl}
                      alt={credit.project?.name || "Project"}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fb = e.currentTarget.nextElementSibling;
                        if (fb) fb.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${credit.project?.imageUrl ? "hidden" : ""}`}>
                    <ProjectTypeIcon type={credit.project?.projectType} size="md" />
                  </div>
                </div>
                <div className="text-xs font-semibold text-charcoal truncate">{credit.project?.name}</div>
                <div className="flex items-center gap-1 text-[11px] text-charcoal-muted mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {credit.project?.location}
                </div>
                <div className="mt-2 text-sm font-semibold text-charcoal">{credit.amount.toLocaleString("en-IN")} tCO2e</div>
                <div className="text-[11px] text-charcoal-muted">Rs {credit.pricePerTonne.toLocaleString("en-IN")}/tCO2e</div>
                {credit.impactFactor > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-forest font-medium">
                    <Sparkles className="w-2.5 h-2.5" />
                    Impact Factor {credit.impactFactor}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 text-center">
        <h2 className="text-2xl font-semibold text-charcoal mb-3">Start trading transparent carbon credits</h2>
        <p className="text-sm text-charcoal-muted mb-6 leading-relaxed">
          Submit your emission reduction project, have it verified by a VVB, and receive MCUs that buyers can trust.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/signup" className="btn-outline px-8 py-3 text-sm">Create an account</Link>
          <Link to="/marketplace" className="btn-neutral-outline px-8 py-3 text-sm">Browse marketplace</Link>
        </div>
      </section>
    </div>
  );
}
