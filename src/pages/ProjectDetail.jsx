import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Calendar,
  Building2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
  HelpCircle,
  Tag,
  Scale,
  Award,
  Compass,
  FileCheck,
  Globe,
  Plus,
  Minus,
  Maximize2,
  TrendingUp,
  RotateCcw,
  Download,
} from "lucide-react";
import {
  getCriProject,
  CRI_ATTRIBUTION,
  CRI_REGISTRY_HOME,
} from "../data/criProjects";
import {
  getAllCredits,
  getAllProjects,
  DEMO_WALLETS,
  buyCredit,
  sendBackForReview,
  resolveProjectImage,
} from "../services/ledgerService";
import { downloadProjectDetailsText, downloadProjectDetailsJson } from "../utils/exportProject";
import PaymentSheet from "../components/PaymentSheet";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";

function formatNumber(num) {
  if (num === null || num === undefined) return "Not available";
  return Number(num).toLocaleString("en-IN");
}

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Official UN SDG Color Palette matching CRI portal
const SDG_COLORS = {
  1: { bg: "#E5243B", text: "#FFFFFF" },
  5: { bg: "#FF3A21", text: "#FFFFFF" },
  6: { bg: "#26BDE2", text: "#FFFFFF" },
  7: { bg: "#FCC30B", text: "#FFFFFF" },
  8: { bg: "#A21942", text: "#FFFFFF" },
  9: { bg: "#FD6925", text: "#FFFFFF" },
  11: { bg: "#FD9D24", text: "#FFFFFF" },
  12: { bg: "#BF8B2E", text: "#FFFFFF" },
  13: { bg: "#3F7E44", text: "#FFFFFF" },
  14: { bg: "#0A97D9", text: "#FFFFFF" },
  15: { bg: "#56C02B", text: "#FFFFFF" },
};

// Compute indicative impact factor badge only if 4 or more SDGs are listed
function getIndicativeImpactFactor(project) {
  if (!project.sdgs || project.sdgs.length < 4) {
    return null;
  }
  const scoresByCriId = {
    CRI30023IN: 0.78, // Piplantri (5 SDGs)
    CRI140026IN: 0.71, // CONCOR Solar (5 SDGs)
    CRI70023IN: 0.62, // Rajsamand (4 SDGs)
  };
  return scoresByCriId[project.criId] || 0.65;
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { account } = useWallet();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [demoTokens, setDemoTokens] = useState([]);
  const [demoProjectState, setDemoProjectState] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [buySuccess, setBuySuccess] = useState(null);
  const [buyError, setBuyError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isSendingBack, setIsSendingBack] = useState(false);
  const [activePaymentSheetToken, setActivePaymentSheetToken] = useState(null);

  const isMiraVerifier =
    Boolean(user?.isVerifier) ||
    Boolean(useWallet()?.isVerifier) ||
    account?.toLowerCase() === DEMO_WALLETS.verifier?.toLowerCase() ||
    user?.email?.toLowerCase() === "mira@envirocheck.in" ||
    user?.email?.toLowerCase() === "meera@envirocheck.in";

  useEffect(() => {
    let proj = getCriProject(slug);
    if (!proj) {
      const allP = getAllProjects();
      const matched = allP.find(
        (p) =>
          p.slug === slug ||
          p.id === slug ||
          p.registryId === slug ||
          p.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug
      );
      if (matched) {
        proj = {
          criId: matched.registryId || matched.id,
          slug: matched.slug || slug,
          name: matched.name,
          hindiName: matched.hindiName || null,
          status: matched.status === "Approved" ? "Listed" : matched.status,
          registryUrl: matched.proofUrl || "https://registry.nccf.in/projects",
          type: matched.projectType || "Clean Energy",
          location: matched.location || "India",
          state: matched.state || "Maharashtra",
          estCreditsPerYear: matched.verifiedAmount || matched.estimatedCO2 || 1000,
          scale: matched.scale || "small",
          methodology: matched.methodology || "ACM0002",
          classification: matched.classification || "pa",
          listedDate: "Verified",
          registeredDate: "Polygon Amoy",
          creditingPeriod: "2024 - 2026",
          developer: matched.developer || "Tata Industries Ltd.",
          delegateEntity: matched.delegateEntity || "CarbonChain Enterprise",
          delegateUrl: matched.delegateUrl || "https://carbonchain.network",
          validationBody: matched.validationBody || { name: "VCS Lead Signatory", id: "CRI-VVB-000007" },
          verificationBody: matched.verificationBody || { name: "EnviroCheck Services", id: "CRI-VVB-000009" },
          sdgs: matched.sdgs ? matched.sdgs.map((n) => ({ number: n, name: "SDG" })) : [{ number: 13, name: "Climate Action" }],
          coordinates: null,
          galleryCount: 2,
          galleryCaptions: ["Telemetry & MRV Verification Baseline", "Ground Truth Sensor Audit"],
          historyCount: 12,
          documents: [],
          image: matched.imageUrl || resolveProjectImage(matched),
          description: [matched.description || "Verified carbon offset project on CarbonChain Enterprise."],
          demoLedgerId: matched.id,
        };
      }
    }

    setProject(proj);

    if (proj) {
      document.title = `${proj.name} | Carbon Registry - India`;
      const allCreds = getAllCredits();
      const matched = allCreds.filter(
        (c) =>
          c.projectId === proj.demoLedgerId ||
          c.project?.registryId === proj.criId
      );
      setDemoTokens(matched);

      const allDemoProjects = getAllProjects();
      const dp = allDemoProjects.find(
        (p) => p.id === proj.demoLedgerId || p.registryId === proj.criId
      );
      setDemoProjectState(dp || null);
    }
  }, [slug]);

  const handleSendBackFromDetail = async () => {
    const reason = window.prompt(
      "Send Project Back for Review\n\nEnter reason or telemetry discrepancies for Mira's re-audit:",
      "Identified baseline telemetry discrepancy during secondary MRV inspection. Returning to Verifier Queue for re-audit."
    );
    if (!reason) return;
    setIsSendingBack(true);
    try {
      const targetId = demoProjectState?.id || project.demoLedgerId || project.criId;
      await sendBackForReview(targetId, account || DEMO_WALLETS.verifier, { reason });
      alert(`Project "${project.name}" has been removed from Marketplace and returned to Mira's Verifier Queue as 'Sent Back for Review / Pending Verification'.`);
      navigate("/verifier");
    } catch (err) {
      alert("Failed to send back for review: " + (err.message || err));
    } finally {
      setIsSendingBack(false);
    }
  };

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold text-charcoal mb-2">
          Project Not Found
        </h2>
        <p className="text-sm text-charcoal-muted mb-6">
          The requested project does not exist in the Carbon Registry India dataset.
        </p>
        <Link to="/marketplace" className="btn-primary text-xs inline-flex items-center gap-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>
      </div>
    );
  }

  const impactFactor = getIndicativeImpactFactor(project);

  const handleBuy = async (credit) => {
    if (!account) {
      alert("Please connect or select a wallet first.");
      navigate("/connect-wallet");
      return;
    }
    if (credit.owner === account) {
      alert("You already own this demo credit.");
      return;
    }
    if (
      !window.confirm(
        `Buy demo token ${credit.id} (${credit.amount.toLocaleString(
          "en-IN"
        )} tCO2e) for ${formatINR(credit.price)} (illustrative price)?`
      )
    )
      return;

    setBuyingId(credit.id);
    setBuyError(null);
    try {
      await buyCredit(credit.id, account, user?.id);
      setBuySuccess(credit.id);
      const allCreds = getAllCredits();
      setDemoTokens(
        allCreds.filter(
          (c) =>
            c.projectId === project.demoLedgerId ||
            c.project?.registryId === project.criId
        )
      );
      setTimeout(() => setBuySuccess(null), 4000);
    } catch (err) {
      setBuyError(err.message);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-16">
      {/* ─── MRV AUDITOR ACTION BAR (Mira only) ────────────────────────────── */}
      {isMiraVerifier && (
        <div className="bg-[#003b1b] text-white px-4 sm:px-8 py-3 border-b border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md z-30 relative">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-300 flex items-center gap-2">
                <span>Lead MRV Auditor Inspection Mode</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-200/80">Mira Iyer</span>
              </div>
              <div className="text-xs text-white/90">
                Audit Status:{" "}
                <span className="font-mono font-bold text-emerald-300">
                  {demoProjectState?.status === "Sent Back for Review"
                    ? "Sent Back for Review / Pending Verification"
                    : demoProjectState?.status || project.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {demoProjectState?.status === "Approved" || project.status === "Listed" ? (
              <button
                type="button"
                onClick={handleSendBackFromDetail}
                disabled={isSendingBack}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm border border-amber-400 cursor-pointer disabled:opacity-50"
                title="Remove from Marketplace and return to Verifier Queue"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isSendingBack ? "animate-spin" : ""}`} />
                <span>{isSendingBack ? "Returning..." : "Send Back for Review"}</span>
              </button>
            ) : (
              <Link
                to="/verifier"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm border border-emerald-500"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                <span>Open in Verifier Queue &rarr;</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ─── 1. FULL WIDTH HERO BANNER ───────────────────────────────────── */}
      <div className="relative w-full h-[340px] sm:h-[380px] bg-charcoal overflow-hidden">
        {/* Background Image with Overlay */}
        <img
          src={project.image}
          alt={project.name}
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        {/* Gradient Overlay for high readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/40" />

        {/* Content inside Hero */}
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col justify-between">
          {/* Top row inside Hero */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-white/90 uppercase">
              {project.criId}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadProjectDetailsText(demoProjectState || project, null, user)}
                className="bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/20 text-xs px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors backdrop-blur-xs cursor-pointer"
                title="Download official project details (.txt)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-300" />
                <span>Download Details</span>
              </button>
              <a
                href={project.registryUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/20 text-xs px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors backdrop-blur-xs"
              >
                View on CRI <ExternalLink className="w-3 h-3 text-white/70" />
              </a>
              <Link
                to="/marketplace"
                className="bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/20 text-xs px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors backdrop-blur-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
              </Link>
            </div>
          </div>

          {/* Bottom row inside Hero: Title, Hindi title, location, status pill */}
          <div className="mb-14 sm:mb-16">
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight max-w-4xl drop-shadow-sm">
              {project.name}
            </h1>
            {project.hindiName && (
              <p className="text-lg sm:text-xl font-medium text-white/90 font-serif mt-1 drop-shadow-sm">
                {project.hindiName}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-white/80">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/70" />
                <span>{project.location}</span>
              </div>
              <span className="text-white/40">&bull;</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/20 text-white border border-white/30 backdrop-blur-xs lowercase">
                {project.status === "Listed" ? "listed" : "planned_listed"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. FLOATING WHITE STATS CARD ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="relative -mt-12 sm:-mt-14 z-10 bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8 mb-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {/* Stat 1: Estimated MCUs/yr */}
            <div className="pt-2 lg:pt-0 lg:px-4 first:pl-0">
              <div className="text-3xl sm:text-4xl font-bold text-[#00875A] tracking-tight">
                {formatNumber(project.estCreditsPerYear)}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1">
                Estimated MCUs/yr
              </div>
            </div>

            {/* Stat 2: MCUs Issued */}
            <div className="pt-2 lg:pt-0 lg:px-6">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                0
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                MCUs Issued
              </div>
            </div>

            {/* Stat 3: MCUs Retired */}
            <div className="pt-4 lg:pt-0 lg:px-6">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                0
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                MCUs Retired
              </div>
            </div>

            {/* Stat 4: Project Type */}
            <div className="pt-4 lg:pt-0 lg:px-6">
              <div className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                {project.type}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                Project Type
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. MAIN TWO-COLUMN BODY LAYOUT ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* ─── LEFT COLUMN (approx 68% width -> lg:col-span-8) ──────────── */}
          <div className="lg:col-span-8 space-y-10">
            {/* ABOUT THIS PROJECT */}
            <section className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 shadow-xs">
              <div className="mb-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5">
                  ABOUT THIS PROJECT
                </h2>
                <div className="w-10 h-0.5 bg-[#00875A]" />
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
                {project.description.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Objectives if present */}
              {project.objectives && project.objectives.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-900 mb-3">
                    Objectives
                  </h3>
                  <ol className="space-y-2 text-xs sm:text-sm text-gray-700 list-decimal list-inside pl-1 leading-relaxed">
                    {project.objectives.map((obj, i) => (
                      <li key={i} className="pl-1">
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Expected Environmental Impact if present */}
              {project.impacts && project.impacts.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-900 mb-3">
                    Expected Environmental Impact
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700 pl-1 leading-relaxed">
                    {project.impacts.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-gray-400 font-bold">&bull;</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Co-benefits if present */}
              {project.coBenefits && project.coBenefits.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-900 mb-3">
                    SDG Co-Benefits
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700 pl-1 leading-relaxed">
                    {project.coBenefits.map((cb, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-gray-400 font-bold">&bull;</span>
                        <span>{cb}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* PROJECT INFORMATION (CRI 2-Column Metadata Grid) */}
            <section className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 shadow-xs">
              <div className="mb-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5">
                  PROJECT INFORMATION
                </h2>
                <div className="w-10 h-0.5 bg-[#00875A]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                {/* 1. Project Developer */}
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                      PROJECT DEVELOPER
                    </div>
                    <div className="text-xs font-medium text-gray-800">
                      {project.developer}
                    </div>
                  </div>
                </div>

                {/* 2. Methodology */}
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                      METHODOLOGY
                    </div>
                    <div className="text-xs font-medium text-gray-800 font-mono">
                      {project.methodology}
                    </div>
                  </div>
                </div>

                {/* 3. Project Scale */}
                <div className="flex items-start gap-3">
                  <Scale className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                      PROJECT SCALE
                    </div>
                    <div className="text-xs font-medium text-gray-800 capitalize">
                      {project.scale}
                    </div>
                  </div>
                </div>

                {/* 4. Annual Estimated Credits */}
                <div className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                      ANNUAL ESTIMATED CREDITS
                    </div>
                    <div className="text-xs font-medium text-gray-800">
                      {formatNumber(project.estCreditsPerYear)}
                    </div>
                  </div>
                </div>

                {/* 5. Project Type */}
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                      PROJECT TYPE
                    </div>
                    <div className="text-xs font-medium text-gray-800">
                      {project.type}
                    </div>
                  </div>
                </div>

                {/* 6. Classification */}
                <div className="flex items-start gap-3">
                  <Compass className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                      CLASSIFICATION
                    </div>
                    <div className="text-xs font-medium text-gray-800 uppercase">
                      {project.classification}
                    </div>
                  </div>
                </div>

                {/* 7. Crediting Period */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                      CREDITING PERIOD
                    </div>
                    <div className="text-xs font-medium text-gray-800">
                      {project.creditingPeriod}
                    </div>
                  </div>
                </div>

                {/* 8. Listed Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                      LISTED DATE
                    </div>
                    <div className="text-xs font-medium text-gray-800">
                      {project.listedDate}
                    </div>
                  </div>
                </div>

                {/* 9. Registered Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                      REGISTERED DATE
                    </div>
                    <div className="text-xs font-medium text-gray-800">
                      {project.registeredDate}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SUSTAINABLE DEVELOPMENT GOALS */}
            <section className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5">
                    SUSTAINABLE DEVELOPMENT GOALS
                  </h2>
                  <div className="w-10 h-0.5 bg-[#00875A]" />
                </div>

                {/* Indicative Impact Factor badge */}
                {impactFactor !== null ? (
                  <div className="relative">
                    <span
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded bg-forest-light text-forest border border-forest/20 cursor-help"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Impact Factor {impactFactor} (indicative)
                      <HelpCircle className="w-3 h-3 text-forest/70" />
                    </span>
                    {showTooltip && (
                      <div className="absolute right-0 bottom-full mb-1.5 w-64 p-2.5 rounded bg-charcoal text-white text-[11px] leading-tight shadow-xl z-20">
                        Method: CRI SDG scoring, Scale x Intensity per SDG, top 4 summed and divided by 100. Scores here are demo values.
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400 italic">
                    Impact Factor: pending SDG scoring
                  </span>
                )}
              </div>

              {project.sdgs && project.sdgs.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {project.sdgs.map((sdg) => {
                    const colors = SDG_COLORS[sdg.number] || { bg: "#3F7E44", text: "#FFFFFF" };
                    return (
                      <div
                        key={sdg.number}
                        className="rounded-lg p-3 text-white flex flex-col justify-between h-24 shadow-xs transition-transform hover:-translate-y-0.5"
                        style={{ backgroundColor: colors.bg }}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xl font-black font-mono leading-none">
                            {sdg.number}
                          </span>
                          <Globe className="w-4 h-4 opacity-80" />
                        </div>
                        <div className="text-[11px] font-bold uppercase leading-tight line-clamp-2">
                          {sdg.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-500 py-3">
                  SDG contributions not published in snapshot.{" "}
                  <a
                    href={project.registryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00875A] hover:underline"
                  >
                    See CRI listing
                  </a>
                  .
                </div>
              )}
            </section>

            {/* PHOTO GALLERY */}
            <section className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5">
                    PHOTO GALLERY
                  </h2>
                  <div className="w-10 h-0.5 bg-[#00875A]" />
                </div>
                <span className="text-xs text-gray-400">
                  CRI lists {project.galleryCount} photos
                </span>
              </div>

              <div className="rounded-lg overflow-hidden border border-gray-100 bg-gray-50 mb-3">
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-72 sm:h-96 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fb = e.currentTarget.nextElementSibling;
                    if (fb) fb.classList.remove("hidden");
                  }}
                />
                <div className="hidden w-full h-72 flex flex-col items-center justify-center p-6 text-center bg-gray-50">
                  <Layers className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">Image file: {project.image}</p>
                </div>
              </div>

              {project.galleryCaptions && project.galleryCaptions.length > 0 && (
                <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    CRI Captions:
                  </div>
                  {project.galleryCaptions.map((cap, i) => (
                    <p key={i} className="text-xs text-gray-600 italic">
                      "{cap}"
                    </p>
                  ))}
                </div>
              )}
            </section>

            {/* CERTIFICATION DOCUMENTS */}
            <section className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5">
                    CERTIFICATION DOCUMENTS
                  </h2>
                  <div className="w-10 h-0.5 bg-[#00875A]" />
                </div>
                <span className="text-xs text-gray-400">
                  {project.documents.length} recorded
                </span>
              </div>

              {project.documents.length === 0 ? (
                <p className="text-xs text-gray-500 py-3">
                  No documents uploaded on CRI yet. See CRI listing for updates.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
                        <th className="pb-2.5">Document Name</th>
                        <th className="pb-2.5">Type</th>
                        <th className="pb-2.5">Date</th>
                        <th className="pb-2.5 text-right">Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {project.documents.map((doc, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60">
                          <td className="py-3 pr-4 font-medium text-gray-800 max-w-xs truncate">
                            {doc.name}
                          </td>
                          <td className="py-3 pr-4 uppercase text-[10px] font-semibold text-gray-500">
                            {doc.type}
                          </td>
                          <td className="py-3 pr-4 text-gray-500">{doc.date}</td>
                          <td className="py-3 text-right">
                            <a
                              href={project.registryUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#00875A] hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              View on CRI
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* ─── RIGHT COLUMN (approx 32% width -> lg:col-span-4) ─────────── */}
          <div className="lg:col-span-4 space-y-6">
            {/* BOX 1: LOCATION */}
            <div>
              <div className="mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">
                  LOCATION
                </h2>
                <div className="w-8 h-0.5 bg-[#00875A]" />
              </div>

              {project.coordinates ? (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-xs">
                  {/* Satellite Map Preview Frame */}
                  <div className="relative h-56 bg-slate-800 overflow-hidden">
                    <iframe
                      title="Project Location"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight="0"
                      marginWidth="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${project.coordinates.lng - 0.04}%2C${project.coordinates.lat - 0.04}%2C${project.coordinates.lng + 0.04}%2C${project.coordinates.lat + 0.04}&layer=mapnik&marker=${project.coordinates.lat}%2C${project.coordinates.lng}`}
                      className="w-full h-full opacity-90 contrast-105"
                    />

                    {/* Floating Map Pin */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-[#00875A] text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                        <MapPin className="w-4 h-4 fill-white" />
                      </div>
                    </div>

                    {/* Open in Google Maps button */}
                    <a
                      href={project.coordinates.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-2.5 right-2.5 bg-white/95 hover:bg-white text-gray-800 border border-gray-300 text-[11px] font-medium px-2.5 py-1 rounded shadow-xs inline-flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                      Google Maps
                    </a>
                  </div>

                  <div className="p-4 bg-white">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      <MapPin className="w-3.5 h-3.5 text-[#00875A]" />
                      <span>{project.location}</span>
                    </div>
                    <div className="text-[11px] font-mono text-gray-400 mt-1 pl-5">
                      {project.coordinates.lat}&deg; N, {project.coordinates.lng}&deg; E
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center mb-3">
                    <MapPin className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-xs font-medium text-gray-800 mb-0.5">
                    {project.location}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Coordinates not available
                  </div>
                </div>
              )}
            </div>

            {/* BOX 2: PROJECT DEVELOPER */}
            <div>
              <div className="mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">
                  PROJECT DEVELOPER
                </h2>
                <div className="w-8 h-0.5 bg-[#00875A]" />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00875A]/10 border border-[#00875A]/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#00875A]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-900 truncate">
                    {project.developer}
                  </div>
                  <div className="text-[11px] text-[#00875A] font-medium mt-0.5">
                    Independent Project Proponent
                  </div>
                </div>
              </div>
            </div>

            {/* BOX 3: DELEGATE ENTITY */}
            <div>
              <div className="mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">
                  DELEGATE ENTITY
                </h2>
                <div className="w-8 h-0.5 bg-[#00875A]" />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-gray-900 truncate">
                    {project.delegateEntity}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Delegate Entity
                  </div>
                  {project.delegateUrl && (
                    <a
                      href={project.delegateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-[#00875A] hover:underline inline-flex items-center gap-1 mt-0.5 truncate max-w-full"
                    >
                      {project.delegateUrl}
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* BOX 4: VALIDATION BODY */}
            <div>
              <div className="mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">
                  VALIDATION BODY
                </h2>
                <div className="w-8 h-0.5 bg-[#00875A]" />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  {project.validationBody?.name !== "Not yet assigned" ? (
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        {project.validationBody.name}
                      </div>
                      {project.validationBody.id && (
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                          ID: {project.validationBody.id}
                        </div>
                      )}
                      {project.validationBody.url && (
                        <a
                          href={project.validationBody.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#00875A] hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          Visit website <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic font-medium">
                      Not yet assigned
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOX 5: VERIFICATION BODY */}
            <div>
              <div className="mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">
                  VERIFICATION BODY
                </h2>
                <div className="w-8 h-0.5 bg-[#00875A]" />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 italic font-medium">
                    {project.verificationBody?.name || "Not yet assigned"}
                  </div>
                </div>
              </div>
            </div>

            {/* BOX 6: ISSUANCES, RETIREMENTS & HISTORY */}
            <div>
              <div className="mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1">
                  ISSUANCES, RETIREMENTS & HISTORY
                </h2>
                <div className="w-8 h-0.5 bg-[#00875A]" />
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xs text-xs space-y-1">
                <div className="font-semibold text-gray-800">
                  No issuances recorded yet
                </div>
                <div className="text-[11px] text-gray-500">
                  CRI records {project.historyCount} workflow history entries for this project.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. SOURCE ATTRIBUTION BANNER ────────────────────────────────── */}
        <div className="mt-12 p-4 rounded-xl border border-gray-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600">
          <div>
            <span className="font-semibold text-gray-900">Source Attribution: </span>
            {CRI_ATTRIBUTION}
          </div>
          <a
            href={CRI_REGISTRY_HOME}
            target="_blank"
            rel="noreferrer"
            className="text-[#00875A] hover:underline whitespace-nowrap inline-flex items-center gap-1 font-semibold"
          >
            registry.nccf.in/projects
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* ─── 5. CARBONCHAIN DEMO LEDGER PANEL ────────────────────────────── */}
        <div className="mt-8 bg-white rounded-xl border-t-4 border-t-charcoal border-x border-b border-gray-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#00875A]" />
                <h2 className="text-base font-bold text-gray-900">
                  CarbonChain demo ledger
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Demo tokens are simulated, not MCUs issued by CRI. Prices are illustrative.
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Demo Project ID: <code className="font-mono text-gray-800 font-semibold">{project.demoLedgerId}</code>
            </div>
          </div>

          {buySuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Purchased demo MCU {buySuccess}! Transaction recorded in demo ledger block. Go to My Credits to manage it.
            </div>
          )}
          {buyError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
              {buyError}
            </div>
          )}

          {demoProjectState?.status === "Pending" ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <div className="font-semibold mb-1">
                Status: Pending verification in CarbonChain demo
              </div>
              <p className="text-amber-700 leading-relaxed mb-3">
                This project is currently in the simulated verifier review queue in the demo ledger. No demo tokens have been minted yet.
              </p>
              <Link
                to="/verifier"
                className="btn-neutral-outline text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
              >
                Open Verifier Dashboard
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : demoTokens.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500">
              No active demo tokens minted for this project in the demo ledger yet.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-800">
                Active Demo Tokens ({demoTokens.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
                      <th className="pb-2">Token ID</th>
                      <th className="pb-2">tCO2e Amount</th>
                      <th className="pb-2">Illustrative Price</th>
                      <th className="pb-2">Current Owner</th>
                      <th className="pb-2">Demo Status</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {demoTokens.map((tok) => {
                      const isOwner = tok.owner === account;
                      return (
                        <tr key={tok.id} className="hover:bg-gray-50/60">
                          <td className="py-3 font-mono font-medium text-gray-900">
                            {tok.id}
                          </td>
                          <td className="py-3 font-semibold text-gray-900">
                            {tok.amount.toLocaleString("en-IN")} tCO2e
                          </td>
                          <td className="py-3 text-gray-800">
                            {formatINR(tok.price)}{" "}
                            <span className="text-[10px] text-gray-400">
                              (Rs {tok.pricePerTonne}/t)
                            </span>
                          </td>
                          <td className="py-3 font-mono text-[11px] text-gray-500">
                            {isOwner ? (
                              <span className="font-semibold text-[#00875A]">
                                You ({tok.owner?.slice(0, 6)}...{tok.owner?.slice(-4)})
                              </span>
                            ) : (
                              `${tok.owner?.slice(0, 6)}...${tok.owner?.slice(-4)}`
                            )}
                          </td>
                          <td className="py-3">
                            {tok.retired ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">
                                Retired
                              </span>
                            ) : tok.listed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Listed for Sale
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700">
                                Held in Wallet
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/credit/${tok.id}`}
                                className="btn-neutral-outline text-[11px] py-1 px-2.5"
                              >
                                View record
                              </Link>
                              {!tok.retired && tok.listed && !isOwner && (
                                <button
                                  type="button"
                                  onClick={() => setActivePaymentSheetToken(tok)}
                                  className="btn-outline text-[11px] py-1 px-3 cursor-pointer"
                                >
                                  Buy MCU
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Sheet Checkout Modal */}
      {activePaymentSheetToken && (
        <PaymentSheet
          credit={activePaymentSheetToken}
          project={project}
          onClose={() => setActivePaymentSheetToken(null)}
          onPurchased={() => {
            const allCreds = getAllCredits();
            setDemoTokens(
              allCreds.filter(
                (c) =>
                  c.projectId === project.demoLedgerId ||
                  c.project?.registryId === project.criId
              )
            );
          }}
        />
      )}
    </div>
  );
}
