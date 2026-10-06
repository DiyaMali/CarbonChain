import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Shield,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  X,
  HelpCircle,
} from "lucide-react";
import {
  CRI_PROJECTS,
  getCriSummaryStats,
  CRI_ATTRIBUTION,
  CRI_REGISTRY_HOME,
} from "../data/criProjects";
import {
  getAllCredits,
  getAllProjects,
  buyCredit,
  sendBackForReview,
  resetDemoData,
  resolveProjectImage,
  DEMO_WALLETS,
  saveCredits,
} from "../services/ledgerService";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { canBuy, canSell, isVerifierUser } from "../services/roleService";
import PaymentSheet from "../components/PaymentSheet";

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

export default function Marketplace() {
  const { account, isVerifier } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isVerifierRole =
    Boolean(user?.isVerifier) ||
    Boolean(isVerifier) ||
    account?.toLowerCase() === DEMO_WALLETS.verifier?.toLowerCase() ||
    user?.id === "usr_verifier";

  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [searchQuery, setSearchQuery] = useState("");
  const [demoCredits, setDemoCredits] = useState([]);
  const [demoProjects, setDemoProjects] = useState([]);
  const [buyingId, setBuyingId] = useState(null);
  const [buySuccess, setBuySuccess] = useState(null);
  const [buyError, setBuyError] = useState(null);
  const [activePaymentToken, setActivePaymentToken] = useState(null);

  // Verifier "Send Back for Review" modal state
  const [sendBackModalProject, setSendBackModalProject] = useState(null);
  const [sendBackReason, setSendBackReason] = useState("");
  const [isSendingBack, setIsSendingBack] = useState(false);
  const [sendBackSuccessNotice, setSendBackSuccessNotice] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const highlightKey = searchParams.get("highlight");

  const refreshData = () => {
    const rawCredits = getAllCredits();
    const rawProjects = getAllProjects();

    const existingProjectIds = new Set(rawCredits.map((c) => c.projectId));
    let newCreditsAdded = false;
    const creditsToPersist = [...rawCredits];

    // Ensure every approved project has an active listed credit
    rawProjects.forEach((p) => {
      if (p.status === "Approved" && !existingProjectIds.has(p.id) && !existingProjectIds.has(p.registryId)) {
        const nextIndex = creditsToPersist.length + 1;
        const creditId = `CCI-MCU-${String(nextIndex).padStart(6, "0")}`;
        const cleanAmount = Number(p.verifiedAmount || p.estimatedCO2 || 1000);
        const pricePerTonne = 150;
        const newCred = {
          id: creditId,
          tokenIndex: nextIndex,
          projectId: p.id,
          amount: cleanAmount,
          price: cleanAmount * pricePerTonne,
          pricePerTonne,
          owner: p.owner || DEMO_WALLETS.ipp,
          ownerUserId: p.ownerUserId || "usr_meridian",
          listed: true,
          retired: false,
          retiredAt: null,
          retireeName: "",
          onBehalfOf: "",
          reason: "",
          message: "",
          mintedAt: new Date().toISOString(),
        };
        creditsToPersist.push(newCred);
        existingProjectIds.add(p.id);
        newCreditsAdded = true;
      }
    });

    if (newCreditsAdded) {
      saveCredits(creditsToPersist);
    }

    // Ensure only credits for actively approved projects remain listed
    const syncedCredits = creditsToPersist.map((c) => {
      const p = rawProjects.find((proj) => proj.id === c.projectId || proj.registryId === c.projectId);
      if (p?.status === "Approved" && !c.retired) {
        return { ...c, listed: true };
      }
      if (p && (p.status === "Sent Back for Review" || p.status === "Pending" || p.status === "Rejected")) {
        return { ...c, listed: false };
      }
      return c;
    });

    setDemoCredits(syncedCredits);
    setDemoProjects(rawProjects);
  };

  useEffect(() => {
    document.title = "CRI Projects & Marketplace | CarbonChain";
    refreshData();
  }, []);

  // Open the Send Back for Review modal
  const handleOpenSendBack = (project, e) => {
    e?.stopPropagation();
    setSendBackModalProject(project);
    setSendBackReason(
      "Identified baseline telemetry discrepancy during secondary MRV inspection. Returning to Verifier Queue for re-audit."
    );
  };

  // Confirm sending back to verifier queue
  const handleConfirmSendBack = async () => {
    if (!sendBackModalProject) return;
    setIsSendingBack(true);
    try {
      const targetId = sendBackModalProject.demoLedgerId || sendBackModalProject.criId;
      await sendBackForReview(targetId, account || DEMO_WALLETS.verifier, {
        reason: sendBackReason,
      });

      refreshData();
      setSendBackSuccessNotice({
        projectName: sendBackModalProject.name,
        projectId: targetId,
      });
      setSendBackModalProject(null);
    } catch (err) {
      alert("Failed to send project back for review: " + (err.message || err));
    } finally {
      setIsSendingBack(false);
    }
  };

  // Merge CRI baseline projects with any newly verified/approved projects from ledger
  const allMarketplaceProjects = useMemo(() => {
    // 1. Map CRI projects with dynamic live approval status
    const criItems = CRI_PROJECTS
      .map((cp) => {
        const dp = demoProjects.find(
          (p) =>
            p.id === cp.demoLedgerId ||
            p.registryId === cp.criId ||
            p.name?.toLowerCase() === cp.name?.toLowerCase()
        );

        // If sent back for review or pending or rejected in ledger, it must NOT appear in active Marketplace listings
        const isSentBack = dp?.status === "Sent Back for Review";
        const isPending = dp?.status === "Pending";
        const isRejected = dp?.status === "Rejected";

        if (isSentBack || isPending || isRejected) {
          return null; // Delisted and returned to verifier queue
        }

        const hasApprovedToken = demoCredits.some(
          (c) =>
            (c.projectId === cp.demoLedgerId ||
              c.project?.registryId === cp.criId ||
              c.projectId === cp.criId) &&
            c.listed &&
            !c.retired
        );
        const isListed = dp?.status === "Approved" || hasApprovedToken || cp.status === "Listed";

        return {
          ...cp,
          status: isListed ? "Listed" : cp.status,
          ledgerStatus: dp?.status || (isListed ? "Approved" : "Pending"),
          estCreditsPerYear: dp?.verifiedAmount || cp.estCreditsPerYear,
          demoLedgerId: dp?.id || cp.demoLedgerId,
        };
      })
      .filter(Boolean);

    // 2. Extra verified projects from the ledger (e.g. Maharashtra Solar, user submitted projects)
    const criLedgerIds = new Set(CRI_PROJECTS.map((p) => p.demoLedgerId));
    const criIds = new Set(CRI_PROJECTS.map((p) => p.criId));
    const criNames = new Set(CRI_PROJECTS.map((p) => p.name.toLowerCase()));

    const extraItems = demoProjects
      .filter(
        (dp) =>
          !criLedgerIds.has(dp.id) &&
          !criIds.has(dp.registryId) &&
          !criNames.has(dp.name.toLowerCase()) &&
          dp.status === "Approved" // only actively approved projects appear in Marketplace
      )
      .map((dp) => {
        return {
          criId: dp.registryId || dp.id,
          slug: dp.slug || dp.id.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: dp.name,
          hindiName: dp.hindiName || null,
          status: "Listed",
          ledgerStatus: "Approved",
          type: dp.projectType || "Clean Energy",
          location: dp.location || "India",
          state: dp.state || "Maharashtra",
          estCreditsPerYear: dp.verifiedAmount || dp.estimatedCO2 || 1000,
          scale: dp.scale || "small",
          methodology: dp.methodology || "ACM0002",
          classification: dp.classification || "pa",
          listedDate: "Verified",
          registeredDate: "Polygon Amoy",
          creditingPeriod: "2024 - 2026",
          developer: dp.developer || "Tata Industries Ltd.",
          delegateEntity: dp.delegateEntity || "CarbonChain Enterprise",
          delegateUrl: dp.delegateUrl || "https://carbonchain.network",
          validationBody: dp.validationBody || { name: "VCS Lead Signatory", id: "CRI-VVB-000007" },
          verificationBody: dp.verificationBody || { name: "EnviroCheck Services", id: "CRI-VVB-000009" },
          sdgs: dp.sdgs ? dp.sdgs.map((n) => ({ number: n, name: "SDG" })) : [{ number: 13, name: "Climate Action" }],
          image: dp.imageUrl || resolveProjectImage(dp),
          description: [dp.description || "Verified carbon offset project on CarbonChain Enterprise."],
          demoLedgerId: dp.id,
        };
      });

    return [...criItems, ...extraItems];
  }, [demoProjects, demoCredits]);

  // Dynamic summary count
  const summary = useMemo(() => {
    const total = allMarketplaceProjects.length;
    const listed = allMarketplaceProjects.filter((p) => p.status === "Listed").length;
    const planned = total - listed;
    return { total, listed, planned };
  }, [allMarketplaceProjects]);

  // Filter projects according to UI filters
  const filteredProjects = useMemo(() => {
    return allMarketplaceProjects.filter((p) => {
      // If user came via highlightKey, ensure the target project is always included
      if (highlightKey) {
        const norm = decodeURIComponent(highlightKey).toLowerCase().trim();
        const pKey = `${p.demoLedgerId || ""} ${p.criId || ""} ${p.name || ""} ${p.slug || ""}`.toLowerCase();
        if (pKey.includes(norm) || (p.name && norm.includes(p.name.toLowerCase()))) {
          return true;
        }
      }

      if (statusFilter !== "All Status" && p.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== "All Types" && !p.type?.toLowerCase().includes(typeFilter.toLowerCase())) {
        return false;
      }
      if (
        locationFilter !== "All Locations" &&
        !p.location?.toLowerCase().includes(locationFilter.toLowerCase())
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesHindi = p.hindiName && p.hindiName.toLowerCase().includes(q);
        const matchesId = p.criId?.toLowerCase().includes(q);
        const matchesLoc = p.location?.toLowerCase().includes(q);
        const matchesDev = p.developer?.toLowerCase().includes(q);
        if (!matchesName && !matchesHindi && !matchesId && !matchesLoc && !matchesDev) {
          return false;
        }
      }
      return true;
    });
  }, [allMarketplaceProjects, statusFilter, typeFilter, locationFilter, searchQuery, highlightKey]);

  // Scroll to highlighted project if requested in URL
  useEffect(() => {
    if (highlightKey) {
      setTimeout(() => {
        const normalized = decodeURIComponent(highlightKey).toLowerCase().trim();
        const cards = Array.from(document.querySelectorAll("[data-project-key]"));
        const target = cards.find((el) => {
          const key = el.getAttribute("data-project-key")?.toLowerCase() || "";
          return key.includes(normalized) || (key && normalized.includes(key));
        });
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);
    }
  }, [highlightKey, filteredProjects]);

  const handleBuy = (credit, e, project) => {
    e?.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    if (isVerifierUser(user)) {
      alert("Verifier accounts cannot purchase credits.");
      return;
    }
    if (!canBuy(user)) {
      alert("Your account is registered for selling only. Purchasing carbon credits is for buying accounts.");
      return;
    }
    if (!account) {
      navigate("/connect-wallet");
      return;
    }
    if (credit.owner === account) {
      alert("You cannot purchase credits that you have listed.");
      return;
    }

    // Ensure token exists in ledger credits before purchase
    const currentCredits = getAllCredits();
    if (!currentCredits.some((c) => c.id === credit.id)) {
      currentCredits.push({ ...credit, listed: true });
      saveCredits(currentCredits);
    }

    // Attach project context so PaymentSheet can display the project name
    setActivePaymentToken({ ...credit, _project: project });
  };

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-200 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-forest block mb-1">
            Carbon Registry India &bull; Official Snapshot
          </span>
          <h1 className="text-2xl font-semibold text-charcoal">
            CRI Project Marketplace
          </h1>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Real projects from Carbon Registry India (registry.nccf.in). Trading in Marketable Carbon Units (MCUs).
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href={CRI_REGISTRY_HOME}
            target="_blank"
            rel="noreferrer"
            className="btn-neutral-outline text-xs inline-flex items-center gap-1.5"
          >
            Open CRI Registry
            <ExternalLink className="w-3 h-3 text-charcoal-subtle" />
          </a>
          <button
            onClick={refreshData}
            className="btn-neutral-outline text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Verifier Inspection Mode Banner */}
      {isVerifierRole && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#003b1b] to-[#124d2c] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <span>Verification Authority Mode Active</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-200/80">Diya Mali, Verification Authority</span>
              </div>
              <div className="text-xs text-emerald-100/90 mt-0.5">
                You have verification authority over listed projects. If any data or baseline requires re-examination, use <strong className="text-white font-semibold">"Send Back for Review"</strong> on any project to return it to your Review Queue.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/verifier"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Open Verifier Queue</span>
            </Link>
          </div>
        </div>
      )}

      {/* Return Success Notice */}
      {sendBackSuccessNotice && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <RotateCcw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">
                Project "{sendBackSuccessNotice.projectName}" returned to Verifier Queue
              </div>
              <div className="text-amber-800 text-[11px] mt-0.5">
                Status updated to: <span className="font-semibold text-amber-900 font-mono">Sent Back for Review / Pending Verification</span>. Removed from active marketplace listings.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/verifier"
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-2xs inline-flex items-center gap-1.5"
            >
              <span>Go to Verifier Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setSendBackSuccessNotice(null)}
              className="p-1 rounded text-amber-700 hover:text-amber-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {buySuccess && (
        <div className="mb-4 p-3.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Credit token {buySuccess} purchased and recorded on ledger block! Go to My Credits to view it.
        </div>
      )}
      {buyError && (
        <div className="mb-4 p-3.5 rounded bg-red-50 border border-red-200 text-red-800 text-xs">
          {buyError}
        </div>
      )}

      {/* CRI-style summary count row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded bg-cream/60 border border-gray-200 mb-6 text-xs text-charcoal">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-charcoal">
            Total: {summary.total}
          </span>
          <span className="text-charcoal-muted">
            Planned: <span className="text-amber-700 font-medium">{summary.planned}</span>
          </span>
          <span className="text-charcoal-muted">
            Listed: <span className="text-blue-700 font-medium">{summary.listed}</span>
          </span>
          {filteredProjects.length !== summary.total && (
            <span className="text-charcoal-subtle">
              &bull; Showing {filteredProjects.length} filtered
            </span>
          )}
        </div>
        <div className="text-[11px] text-charcoal-muted">
          Indicative market prices per tCO2e (CarbonChain Network)
        </div>
      </div>

      {/* Filters matching CRI site */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-gray-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-forest font-medium"
        >
          <option value="All Status">All Status</option>
          <option value="Listed">Listed ({summary.listed})</option>
          <option value="Planned">Planned ({summary.planned})</option>
        </select>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs border border-gray-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-forest"
        >
          <option value="All Types">All Types</option>
          <option value="Afforestation and reforestation">
            Afforestation and reforestation
          </option>
          <option value="Energy Industries">Energy Industries</option>
          <option value="Transport">Transport</option>
        </select>

        {/* Location filter */}
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="text-xs border border-gray-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-forest"
        >
          <option value="All Locations">All Locations</option>
          <option value="Rajasthan">Rajasthan</option>
          <option value="Delhi">Delhi</option>
          <option value="Odisha">Odisha</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="Telangana">Telangana</option>
        </select>

        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-subtle" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, CRI ID, developer, or location..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        {(statusFilter !== "All Status" ||
          typeFilter !== "All Types" ||
          locationFilter !== "All Locations" ||
          searchQuery) && (
          <button
            onClick={() => {
              setStatusFilter("All Status");
              setTypeFilter("All Types");
              setLocationFilter("All Locations");
              setSearchQuery("");
            }}
            className="btn-text text-xs text-charcoal-muted hover:text-charcoal"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid of CRI Project Cards */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded">
          <ShoppingBag className="w-8 h-8 text-charcoal-subtle mx-auto mb-3" />
          <p className="text-sm text-charcoal-muted">
            No projects match the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            let activeToken = demoCredits.find(
              (c) =>
                (c.projectId === project.demoLedgerId ||
                  c.project?.registryId === project.criId ||
                  c.projectId === project.criId ||
                  c.projectId === project.id ||
                  c.project?.name?.toLowerCase() === project.name?.toLowerCase() ||
                  (project.name && c.projectId && project.name.toLowerCase().includes(c.projectId.toLowerCase()))) &&
                (c.listed || project.status === "Listed") &&
                !c.retired
            );

            // Fallback: If project is Listed in Marketplace, ensure an active buyable token is present
            if (!activeToken && project.status === "Listed") {
              const est = project.estCreditsPerYear || 1000;
              activeToken = {
                id: `CCI-MCU-${String(project.demoLedgerId || project.criId || "000008").replace(/[^a-zA-Z0-9]/g, "")}`,
                projectId: project.demoLedgerId || project.criId,
                amount: est,
                price: est * 150,
                pricePerTonne: 150,
                owner: DEMO_WALLETS.ipp,
                ownerUserId: "usr_meridian",
                listed: true,
                retired: false,
              };
            }

            const demoProj = demoProjects.find(
              (dp) =>
                dp.id === project.demoLedgerId ||
                dp.registryId === project.criId ||
                dp.name?.toLowerCase() === project.name?.toLowerCase()
            );
            const isPendingInDemo = demoProj?.status === "Pending";

            const isHighlighted = Boolean(
              highlightKey && (() => {
                const norm = decodeURIComponent(highlightKey).toLowerCase().trim();
                const pKey = `${project.demoLedgerId || ""} ${project.criId || ""} ${project.name || ""} ${project.slug || ""}`.toLowerCase();
                return pKey.includes(norm) || (project.name && norm.includes(project.name.toLowerCase()));
              })()
            );

            return (
              <CriProjectCard
                key={project.criId || project.demoLedgerId}
                project={project}
                token={activeToken}
                isPendingInDemo={isPendingInDemo}
                account={account}
                buyingId={buyingId}
                onBuy={handleBuy}
                isHighlighted={isHighlighted}
                isVerifierRole={isVerifierRole}
                onSendBack={handleOpenSendBack}
              />
            );
          })}
        </div>
      )}

      {/* Illustrative Price Notice & Source Attribution */}
      <div className="mt-12 pt-6 border-t border-gray-200 space-y-3">
        <p className="text-[11px] text-charcoal-subtle text-center">
          Note: Prices are indicative and in Indian Rupees per tCO2e. CRI registry displays estimated annual credit generation without prices. CarbonChain Ledger: SHA-256 hash-chained, tamper-evident records.
        </p>
        <div className="p-4 rounded bg-cream/40 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-charcoal-muted">
          <div>
            <span className="font-semibold text-charcoal">Source Attribution: </span>
            {CRI_ATTRIBUTION}
          </div>
          <a
            href={CRI_REGISTRY_HOME}
            target="_blank"
            rel="noreferrer"
            className="text-forest hover:underline whitespace-nowrap inline-flex items-center gap-1 font-medium"
          >
            registry.nccf.in/projects
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ── Send Back for Review Modal (Verifier Mira Only) ── */}
      {sendBackModalProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSendBackModalProject(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-xs">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  Send Project Back for Review
                </h3>
                <span className="text-[11px] font-mono text-amber-700 font-semibold uppercase tracking-wider">
                  Verification Authority Control • Diya Mali
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 mb-4 text-xs text-amber-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-800 font-medium">Project Name:</span>
                <span className="font-bold text-gray-900">{sendBackModalProject.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-800 font-medium">Registry ID:</span>
                <span className="font-mono text-gray-800 font-semibold">{sendBackModalProject.criId || sendBackModalProject.demoLedgerId}</span>
              </div>
              <div className="pt-2 border-t border-amber-200/80">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900 mb-1">Status Lifecycle:</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold text-[11px]">
                    Verified / Marketplace
                  </span>
                  <span className="text-amber-700 font-bold">&rarr;</span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-bold text-[11px]">
                    Sent Back for Review / Pending Verification
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-amber-900/90 pt-1 leading-relaxed border-t border-amber-200/60">
                This project will immediately disappear from active Marketplace listings and return to the <strong>Review Queue</strong> for full re-examination. The project is <strong>NOT deleted</strong> and can be verified again or rejected later.
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
                Auditor Re-audit Reason / Telemetry Notes:
              </label>
              <textarea
                rows={3}
                value={sendBackReason}
                onChange={(e) => setSendBackReason(e.target.value)}
                placeholder="Specify telemetry discrepancies, baseline calculation adjustments, or reasons for return..."
                className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans text-gray-900 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSendBackModalProject(null)}
                disabled={isSendingBack}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendBack}
                disabled={isSendingBack}
                className="px-4 py-2.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isSendingBack ? "animate-spin" : ""}`} />
                <span>{isSendingBack ? "Sending back..." : "Confirm Send Back for Review"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Connected Wallet Payment Sheet */}
      {activePaymentToken && (
        <PaymentSheet
          credit={activePaymentToken}
          project={activePaymentToken._project || activePaymentToken.project}
          onClose={() => setActivePaymentToken(null)}
          onPurchased={() => {
            setActivePaymentToken(null);
            refreshData();
          }}
        />
      )}
    </div>
  );
}

function CriProjectCard({
  project,
  token,
  isPendingInDemo,
  account,
  buyingId,
  onBuy,
  isHighlighted,
  isVerifierRole,
  onSendBack,
}) {
  const navigate = useNavigate();
  const impactFactor = getIndicativeImpactFactor(project);
  const [showTooltip, setShowTooltip] = useState(false);

  const isOwner = token && token.owner === account;
  const isBuying = token && buyingId === token.id;
  const projectKey = `${project.demoLedgerId || ""} ${project.criId || ""} ${project.name || ""} ${project.slug || ""}`.toLowerCase();

  return (
    <div
      data-project-key={projectKey}
      onClick={() => navigate(`/projects/${project.slug}`)}
      className={`clean-card flex flex-col cursor-pointer hover:border-forest/40 transition-all duration-200 group overflow-hidden relative ${
        isHighlighted ? "ring-2 ring-emerald-500 shadow-xl border-emerald-400 bg-emerald-50/20" : ""
      }`}
    >
      {/* Newly Verified badge if highlighted */}
      {isHighlighted && (
        <div className="absolute top-2 inset-x-8 z-30 text-center pointer-events-none">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-md animate-pulse">
            ✓ Newly Verified &amp; Added to Marketplace
          </span>
        </div>
      )}

      {/* Photo with status badge */}
      <div className="h-44 relative bg-cream-light overflow-hidden border-b border-gray-100 flex items-center justify-center">
        <img
          src={project.image || resolveProjectImage(project)}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const fallback = resolveProjectImage(project);
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            } else {
              e.currentTarget.src = "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80";
            }
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0f3d24] to-[#1e583d] flex flex-col items-center justify-center p-4 text-center text-white">
          <span className="material-symbols-outlined text-3xl text-emerald-400 mb-1">eco</span>
          <span className="text-xs font-semibold">{project.name}</span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium border shadow-xs ${
              project.status === "Listed" || token
                ? "bg-blue-50/95 text-blue-700 border-blue-200 font-semibold"
                : "bg-amber-50/95 text-amber-700 border-amber-200"
            }`}
          >
            {project.status === "Listed" || token ? "Listed" : project.status}
          </span>
        </div>

        {/* CRI ID badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/95 text-charcoal border border-gray-200 shadow-xs font-semibold">
            {project.criId}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Name and Hindi subtitle */}
        <h3
          className="text-sm font-semibold text-charcoal leading-snug mb-1 group-hover:text-forest transition-colors line-clamp-2"
          title={project.name}
        >
          {project.name}
        </h3>
        {project.hindiName && (
          <p className="text-xs text-charcoal-muted font-serif mb-2 line-clamp-1">
            {project.hindiName}
          </p>
        )}

        {/* 2-line clamped description */}
        <p className="text-xs text-charcoal-muted leading-relaxed line-clamp-2 mb-3">
          {project.description[0]}
        </p>

        {/* Small Validation body / Verification body boxes */}
        <div className="grid grid-cols-2 gap-2 p-2 rounded bg-cream/40 border border-gray-100 text-[11px] mb-3">
          <div>
            <div className="text-charcoal-subtle font-medium text-[10px] uppercase">
              Validation Body
            </div>
            <div className="text-charcoal font-medium truncate" title={project.validationBody?.name}>
              {project.validationBody?.name || "Not yet assigned"}
            </div>
          </div>
          <div>
            <div className="text-charcoal-subtle font-medium text-[10px] uppercase">
              Verification Body
            </div>
            <div className="text-charcoal font-medium truncate" title={project.verificationBody?.name}>
              {project.verificationBody?.name || "Not yet assigned"}
            </div>
          </div>
        </div>

        {/* Type, Location, and Est. MCUs/yr */}
        <div className="space-y-1 text-xs mb-3">
          <div className="flex items-center justify-between text-charcoal-muted">
            <span className="truncate pr-2">{project.type}</span>
            <span className="font-semibold text-charcoal whitespace-nowrap">
              {formatNumber(project.estCreditsPerYear)} MCUs/yr
            </span>
          </div>
          <div className="flex items-center gap-1 text-charcoal-subtle text-[11px]">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
        </div>

        {/* SDGs & Impact Factor */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mb-4 text-[11px]">
          <div className="flex items-center gap-1">
            {project.sdgs && project.sdgs.length > 0 ? (
              <span className="text-charcoal-muted">
                {project.sdgs.length} official SDG{project.sdgs.length !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-charcoal-subtle italic">See CRI listing</span>
            )}
          </div>

          {impactFactor !== null ? (
            <div
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <span
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-forest-light text-forest border border-forest/20 cursor-help"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Impact {impactFactor} (indicative)
                <HelpCircle className="w-2 h-2 text-forest/70" />
              </span>
              {showTooltip && (
                <div className="absolute right-0 bottom-full mb-1 w-52 p-2 rounded bg-charcoal text-white text-[10px] leading-tight shadow-lg z-20">
                  Method: CRI SDG scoring, Scale x Intensity per SDG, top 4 summed and divided by 100. Scores here are illustrative values.
                </div>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-charcoal-subtle italic">
              Impact Factor: pending SDG scoring
            </span>
          )}
        </div>

        {/* ─── Trading Row ────────────────────────────────────────────── */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          {token ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-charcoal">
                    {formatINR(token.price)}
                  </div>
                  <div className="text-[10px] text-charcoal-subtle font-mono">
                    ₹{token.pricePerTonne?.toLocaleString("en-IN") || "450"}/tCO2e (indicative)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-forest font-mono">
                    {token.amount.toLocaleString("en-IN")} tCO2e
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    Verified in CarbonChain
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Link
                  to={`/projects/${project.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="btn-neutral-outline text-xs flex-1 text-center py-1.5"
                >
                  View Details
                </Link>
                {isOwner ? (
                  <span className="text-[11px] text-charcoal-subtle border border-gray-200 rounded px-2.5 py-1.5 text-center flex-1">
                    Your listing
                  </span>
                ) : (
                  <button
                    onClick={(e) => onBuy(token, e, project)}
                    disabled={isBuying}
                    className="btn-outline text-xs flex-1 py-1.5 cursor-pointer"
                  >
                    {isBuying ? "Confirming..." : "Buy Credits"}
                  </button>
                )}
              </div>
            </div>
          ) : isPendingInDemo ? (
            <div>
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="text-amber-700 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending verification
                </span>
                <span className="text-[10px] text-charcoal-subtle font-mono">
                  Verifier queue
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/projects/${project.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="btn-neutral-outline text-xs flex-1 text-center py-1.5"
                >
                  View Details
                </Link>
                <Link
                  to="/verifier"
                  onClick={(e) => e.stopPropagation()}
                  className="btn-neutral-outline text-xs flex-1 text-center py-1.5 text-forest"
                >
                  Review in Verifier
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to={`/projects/${project.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="btn-neutral-outline text-xs w-full text-center py-1.5"
              >
                View Details
              </Link>
            </div>
          )}

          {/* ─── Verifier Controls: Send Back for Review ─── */}
          {isVerifierRole && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-3.5 pt-2.5 border-t border-amber-200/80 bg-amber-50/70 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="font-mono text-[10px] tracking-wide uppercase">Verifier Control</span>
              </div>
              <button
                type="button"
                onClick={(e) => onSendBack(project, e)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                title="Remove this project from Marketplace and return to Verifier Queue for re-audit"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Send Back for Review</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
