import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Search,
  FileText,
  SlidersHorizontal,
  ArrowUpDown,
  Activity,
  Layers,
  Calendar,
  Lock,
  Download,
  Info,
  BookOpen,
  Cpu,
  MapPin,
  Satellite,
  Key,
  Check,
  Copy,
  Shield,
  FileSpreadsheet
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { useAllProjects } from "../hooks/useLedger";
import { approveProject, rejectProject, submitProject, resetDemoData, resolveProjectImage, DEMO_WALLETS } from "../services/ledgerService";

// Showcase Pending Projects specification
const SHOWCASE_PROJECTS = [
  {
    id: "CC-IND-2026-081",
    rawId: "proj_showcase_081",
    name: "Maharashtra Solar Power Grid Expansion",
    category: "Solar Energy",
    categoryBadgeClass: "bg-blue-100 text-blue-800",
    developer: "Tata Industries Ltd.",
    developerAddress: "0x7a89...338",
    location: "Satara District, Maharashtra, India",
    submittedTime: "Submitted 4 hours ago",
    submittedTimestamp: Date.now() - 4 * 3600 * 1000,
    standardMethodology: "Verra VCS-1849 • ACM0002",
    volumeType: "Certified Volume",
    volume: "1,000",
    volumeUnit: "tCO2e",
    volumeNum: 1000,
    metric3Label: "Vintage Period",
    metric3Value: "2024 - 2025 (Annual)",
    additionalityScore: "96.4/100",
    additionalityIcon: "verified",
    image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Modern high capacity photovoltaic solar farm in western India",
    telemetryOverlay: {
      left: "Sentinel-2 L2A Calibrated",
      right: "99.8% Match",
      icon: "satellite_alt"
    },
    docTitle: "View MRV Audit Report (PDF, 4.2 MB)",
    docType: "pdf",
    defaultNotes: "Satellite NDVI vegetation baseline and inverter output telemetry independently confirmed against regional grid factor."
  },
  {
    id: "CC-IND-2026-074",
    rawId: "proj_showcase_074",
    name: "Gujarat Coastal Wind Energy Project Phase II",
    category: "Wind Generation",
    categoryBadgeClass: "bg-blue-100 text-blue-800",
    developer: "Reliance New Energy Ltd.",
    developerAddress: "0x9b24...112",
    location: "Kutch District, Gujarat, India",
    submittedTime: "Submitted 14 hours ago",
    submittedTimestamp: Date.now() - 14 * 3600 * 1000,
    standardMethodology: "Gold Standard GS-4421",
    volumeType: "Estimated Volume",
    volume: "2,500",
    volumeUnit: "tCO2e",
    volumeNum: 2500,
    metric3Label: "Turbine Capacity",
    metric3Value: "48.5 MW Interconnected",
    additionalityScore: "98.1/100",
    additionalityIcon: "verified",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Massive white modern wind turbines along coastal salt marshes of Gujarat India",
    telemetryOverlay: {
      left: "SCADA Telemetry Stream",
      right: "Live Sync",
      icon: "sensors",
      liveDot: true
    },
    docTitle: "View Third-Party Verification & GIS Shapefile",
    docType: "shapefile",
    defaultNotes: "SCADA wind generation telemetry cross-verified with Western Regional Load Despatch Centre (WRLDC) hourly settlement records."
  },
  {
    id: "CC-IND-2026-059",
    rawId: "proj_showcase_059",
    name: "Uttarakhand Community Agroforestry & Watershed Restoration",
    category: "Forestry & REDD+",
    categoryBadgeClass: "bg-emerald-100 text-emerald-800",
    developer: "Adani Green Foundations",
    developerAddress: "0x3c19...542",
    location: "Nainital, Uttarakhand, India",
    submittedTime: "Submitted 1 day ago",
    submittedTimestamp: Date.now() - 24 * 3600 * 1000,
    standardMethodology: "Verra ARR-092 • VM0047",
    volumeType: "Biomass Yield",
    volume: "800",
    volumeUnit: "tCO2e",
    volumeNum: 800,
    metric3Label: "Community Co-Benefits",
    metric3Value: "SDG 6, 8, 13, 15",
    additionalityScore: "15% Locked",
    additionalityLabel: "Permanence Buffer",
    additionalityIcon: "lock",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Lush green Himalayan temperate forest canopy in Uttarakhand India",
    telemetryOverlay: {
      left: "LiDAR Canopy Profile",
      right: "14.2m Avg",
      icon: "nature"
    },
    docTitle: "View Biomass Density Audit & Satellite InSAR Data",
    docType: "insar",
    defaultNotes: "Drone LiDAR tree height canopy model verified against Forest Survey of India ground-truth sample plots."
  },
  {
    id: "CC-IND-2026-033",
    rawId: "proj_showcase_033",
    name: "Karnataka Rural Methane Capture & Bio-CNG Facility",
    category: "Biogas / Methane",
    categoryBadgeClass: "bg-teal-100 text-teal-800",
    developer: "JSW Energy Eco-Solutions",
    developerAddress: "0x8f43...904",
    location: "Bellary, Karnataka, India",
    submittedTime: "Submitted 2 days ago",
    submittedTimestamp: Date.now() - 48 * 3600 * 1000,
    standardMethodology: "UN CDM-3108 • AMS-III.D",
    volumeType: "Destruction Volume",
    volume: "1,200",
    volumeUnit: "tCO2e",
    volumeNum: 1200,
    metric3Label: "Flare Efficiency",
    metric3Value: "99.2% Direct Oxidized",
    additionalityScore: "94.8/100",
    additionalityIcon: "verified",
    image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Modern agricultural anaerobic digestion biogas tanks in rural southern India",
    telemetryOverlay: {
      left: "CEMS Sensor Audit",
      right: "Calibrated",
      icon: "gas_meter"
    },
    docTitle: "View Continuous Emissions Monitoring (CEMS) Logs",
    docType: "cems",
    defaultNotes: "Continuous emission monitoring systems (CEMS) ultrasonic gas flow meters calibrated to ISO 14064 standards."
  }
];

export default function VerifierDashboard() {
  const { account } = useWallet();
  const { projects: ledgerProjects, refetch } = useAllProjects();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "history" | "guidelines"
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStandard, setSelectedStandard] = useState("All");
  const [selectedVolume, setSelectedVolume] = useState("All");
  const [selectedSort, setSelectedSort] = useState("newest");

  // Removed/processed project ID tracking
  const [processedIds, setProcessedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cc_verifier_processed") || "[]");
    } catch {
      return [];
    }
  });

  const [reviewHistory, setReviewHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("cc_verifier_history");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "CC-IND-2026-021",
        name: "Tamil Nadu Wind Farm Cluster Phase 1",
        category: "Wind Generation",
        volume: "3,200 tCO2e",
        status: "Approved",
        auditDate: "Yesterday at 16:40",
        txHash: "0x89f2a...c014",
        block: 68912380
      },
      {
        id: "CC-IND-2026-018",
        name: "Himachal Pine Needle Gasification",
        category: "Biomass",
        volume: "950 tCO2e",
        status: "Approved",
        auditDate: "2 days ago",
        txHash: "0x12b6e...fa30",
        block: 68912190
      },
      {
        id: "CC-IND-2026-015",
        name: "Rajasthan Unregulated Brick Kiln Offset",
        category: "Industrial",
        volume: "1,500 tCO2e",
        status: "Rejected",
        auditDate: "3 days ago",
        rejectionReason: "Inconsistent baseline measurement & incomplete leakage assessment.",
        txHash: "0x44dc1...ee99",
        block: 68911850
      }
    ];
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("cc_verifier_history", JSON.stringify(reviewHistory));
      localStorage.setItem("cc_verifier_processed", JSON.stringify(processedIds));
    } catch {}
  }, [reviewHistory, processedIds]);

  // Reset demo data to seeded state (Mira verifier action)
  const handleResetDemo = async () => {
    if (!window.confirm("Reset all demo data to initial demonstration state?\n\nThis will restore all projects in Marketplace and Verifier Queue, resetting any reviewed, sent back, or rejected projects.")) {
      return;
    }
    setIsResettingDemo(true);
    try {
      await resetDemoData();
      localStorage.removeItem("cc_verifier_processed");
      localStorage.removeItem("cc_verifier_history");
      setProcessedIds([]);
      if (refetch) await refetch();
      window.location.reload();
    } catch (err) {
      alert("Failed to reset demo data: " + (err.message || err));
      setIsResettingDemo(false);
    }
  };

  // Merge live ledger pending projects with initial showcase projects
  const pendingQueue = useMemo(() => {
    // 1. Convert live ledger projects that are Pending or Sent Back for Review
    const livePending = (ledgerProjects || [])
      .filter((p) => (p.status === "Pending" || p.status === "Sent Back for Review") && !processedIds.includes(p.id))
      .map((p) => {
        const isSentBack = p.status === "Sent Back for Review";
        return {
          id: p.registryId || p.id.toUpperCase(),
          rawId: p.id,
          name: p.name,
          category: p.projectType || "Clean Energy",
          categoryBadgeClass: isSentBack ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-blue-100 text-blue-800",
          developer: p.ownerUserId === "usr_ipp_demo" ? "Rajesh Sharma (Green Ventures)" : (p.developer || "Project Developer"),
          developerAddress: p.owner ? `0x${p.owner.slice(2, 6)}...${p.owner.slice(-3)}` : "0x7a89...338",
          location: p.location || "Maharashtra, India",
          submittedTime: isSentBack ? "Returned by Mira for Re-audit" : "Submitted recently",
          submittedTimestamp: new Date(p.returnedAt || p.submittedAt || Date.now()).getTime(),
          standardMethodology: p.methodology ? `CRI • ${p.methodology}` : "CRI Methodology • ACM0002",
          volumeType: isSentBack ? "Audit Flagged Volume" : "Certified Volume",
          volume: Number(p.verifiedAmount || p.estimatedCO2 || 1000).toLocaleString(),
          volumeUnit: "tCO2e",
          volumeNum: Number(p.verifiedAmount || p.estimatedCO2 || 1000),
          metric3Label: isSentBack ? "Audit Status" : "Vintage Period",
          metric3Value: isSentBack ? "Sent Back for Review" : "2024 - 2025 (Annual)",
          additionalityScore: "95.5/100",
          additionalityIcon: "verified",
          image: p.imageUrl || resolveProjectImage(p),
          telemetryOverlay: {
            left: isSentBack ? "Re-audit Flagged" : "CRI Registry Calibrated",
            right: isSentBack ? "Under Re-examination" : "99.4% Match",
            icon: isSentBack ? "warning" : "satellite_alt"
          },
          docTitle: p.proofUrl ? `View Audit Proof (${p.proofUrl.slice(0, 30)}...)` : "View MRV Audit Report (PDF, 3.8 MB)",
          docType: "pdf",
          defaultNotes: p.verifierNote || p.description || "Audited and verified against CRI carbon registry methodology.",
          isSentBack,
          returnReason: p.returnReason || p.verifierNote,
          statusLabel: isSentBack ? "Sent Back for Review / Pending Verification" : "Pending Verification",
        };
      });

    // 2. Showcase projects that haven't been approved/rejected yet
    const showcase = SHOWCASE_PROJECTS.filter(
      (s) => !processedIds.includes(s.id) && !processedIds.includes(s.rawId)
    );

    // Merge: live submissions / returned projects first, then showcase
    return [...livePending, ...showcase];
  }, [ledgerProjects, processedIds]);

  // Selected project for Workflow / Attestation execution panels
  const [selectedProjectForApprove, setSelectedProjectForApprove] = useState(SHOWCASE_PROJECTS[0]);
  const [selectedProjectForReject, setSelectedProjectForReject] = useState(SHOWCASE_PROJECTS[0]);

  // Sync selected projects if queue updates
  useEffect(() => {
    if (pendingQueue.length > 0) {
      if (!selectedProjectForApprove || !pendingQueue.some((p) => p.id === selectedProjectForApprove.id)) {
        setSelectedProjectForApprove(pendingQueue[0]);
        setVerifiedVolume(String(pendingQueue[0].volumeNum || 1000));
        setAuditorNotes(pendingQueue[0].defaultNotes || "");
      }
      if (!selectedProjectForReject || !pendingQueue.some((p) => p.id === selectedProjectForReject.id)) {
        setSelectedProjectForReject(pendingQueue[0]);
      }
    }
  }, [pendingQueue]);

  // Approval Form fields
  const [verifiedVolume, setVerifiedVolume] = useState("1,000");
  const [auditorAccreditation] = useState("AUD-ISO-2026-992");
  const [auditorNotes, setAuditorNotes] = useState(SHOWCASE_PROJECTS[0]?.defaultNotes || "");
  const [syncVerraApi, setSyncVerraApi] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  // Rejection Form fields
  const [rejectionCategory, setRejectionCategory] = useState("Deficient Baseline Additionality Calculations");
  const [rejectionNotes, setRejectionNotes] = useState(
    "Proof document unreadable or missing baseline additionality calculations. Satellite optical reflection index does not align with stated array surface area."
  );
  const [isRejecting, setIsRejecting] = useState(false);

  // Inspection & Confirmation Dialogs
  const [inspectingProject, setInspectingProject] = useState(null);
  const [attestationSuccessModal, setAttestationSuccessModal] = useState(null);
  const [rejectionSuccessModal, setRejectionSuccessModal] = useState(null);

  useEffect(() => {
    document.title = "Verifier Dashboard — Pending Reviews | CarbonChain Enterprise";
  }, []);

  // Set selected project and smooth scroll to execution preview
  const handleSelectForApprove = (proj) => {
    setSelectedProjectForApprove(proj);
    setVerifiedVolume(String(proj.volumeNum || 1000));
    setAuditorNotes(proj.defaultNotes || `Verification completed for ${proj.name}. Methodology compliant.`);
    const el = document.getElementById("approve-modal-preview");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectForReject = (proj) => {
    setSelectedProjectForReject(proj);
    const el = document.getElementById("reject-modal-preview");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Refresh queue
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (refetch) await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Export audit log CSV
  const handleExportAuditLog = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Project ID,Project Name,Standard,Volume (tCO2e),Status,Timestamp,Ledger Block"]
        .concat(
          pendingQueue.map(
            (p) =>
              `"${p.id}","${p.name}","${p.standardMethodology}","${p.volumeNum}","Pending Attestation","${p.submittedTime}","68912404"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CarbonChain_MRV_Audit_Queue_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  // Handle Approve Action - Commits to ledger, mints ERC-721 token, updates history
  const handleApproveSubmission = async () => {
    if (!selectedProjectForApprove) return;
    setIsApproving(true);

    try {
      const targetProj = selectedProjectForApprove;
      const effectiveWallet = account || DEMO_WALLETS.verifier;
      const cleanVol = Number(String(verifiedVolume).replace(/,/g, "")) || targetProj.volumeNum;

      // Find matching ledger project by rawId, id, or name
      const allLedger = ledgerProjects || [];
      const matchedLedgerProj = allLedger.find(
        (lp) =>
          lp.id === targetProj.rawId ||
          lp.id === targetProj.id ||
          lp.registryId === targetProj.id ||
          lp.name.toLowerCase() === targetProj.name.toLowerCase()
      );
      const targetId = matchedLedgerProj ? matchedLedgerProj.id : (targetProj.rawId || targetProj.id);

      let mintedCreditId = null;
      let blockNumber = 68912405;
      let finalProjectId = targetId;

      // 1. Attempt to approve directly in the ledger
      try {
        const res = await approveProject(targetId, effectiveWallet, {
          verifiedAmount: cleanVol,
          note: auditorNotes
        });
        mintedCreditId = res?.creditId;
        blockNumber = res?.block?.index || 68912405;
      } catch (err) {
        // If not existing in ledger, submit it first then approve to ensure true persistence
        try {
          const subRes = await submitProject(
            targetProj.developerAddress || DEMO_WALLETS.ipp,
            "usr_ipp_demo",
            {
              name: targetProj.name,
              projectType: targetProj.category,
              location: targetProj.location,
              estimatedCO2: cleanVol,
              description: auditorNotes,
              proofUrl: "https://carbonchain.network/proof",
              imageUrl: targetProj.image,
              sdgs: [13, 15, 8],
            }
          );
          finalProjectId = subRes.projectId;
          const appRes = await approveProject(subRes.projectId, effectiveWallet, {
            verifiedAmount: cleanVol,
            note: auditorNotes
          });
          mintedCreditId = appRes?.creditId;
          blockNumber = appRes?.block?.index || 68912405;
        } catch (e2) {
          console.warn("Simulated fallback ledger approval:", e2);
        }
      }

      // 2. Mark project as processed in state and localStorage
      setProcessedIds((prev) => [...prev, targetProj.id, targetProj.rawId, finalProjectId].filter(Boolean));

      // 3. Add to immutable review history
      const newHistoryItem = {
        id: targetProj.id,
        rawId: finalProjectId,
        name: targetProj.name,
        category: targetProj.category,
        volume: `${cleanVol.toLocaleString()} tCO2e`,
        status: "Approved",
        auditDate: "Just now",
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        block: blockNumber
      };
      setReviewHistory((prev) => [newHistoryItem, ...prev]);

      // 4. Trigger system refetch so all other views update
      if (refetch) await refetch();

      // 5. Open Success Attestation Modal
      setAttestationSuccessModal({
        project: {
          ...targetProj,
          finalProjectId
        },
        verifiedVolume: cleanVol.toLocaleString(),
        creditId: mintedCreditId,
        txHash: `0x7a89f3cd44921b72e90f14ba08d4841b91933ba42e5b871c532410a8b30129e1`,
        block: blockNumber
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Reject Action - Commits rejection to ledger, logs event
  const handleRejectSubmission = async () => {
    if (!selectedProjectForReject) return;
    setIsRejecting(true);

    try {
      const targetProj = selectedProjectForReject;
      const effectiveWallet = account || DEMO_WALLETS.verifier;
      const targetId = targetProj.rawId || targetProj.id;
      let blockNumber = 68912405;

      try {
        const res = await rejectProject(targetId, effectiveWallet, {
          note: `[${rejectionCategory}] ${rejectionNotes}`
        });
        blockNumber = res?.block?.index || 68912405;
      } catch (err) {
        // Fallback simulation
      }

      setProcessedIds((prev) => [...prev, targetProj.id, targetProj.rawId].filter(Boolean));

      const newHistoryItem = {
        id: targetProj.id,
        name: targetProj.name,
        category: targetProj.category,
        volume: `${targetProj.volume} tCO2e`,
        status: "Rejected",
        auditDate: "Just now",
        rejectionReason: `${rejectionCategory}: ${rejectionNotes}`,
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        block: blockNumber
      };
      setReviewHistory((prev) => [newHistoryItem, ...prev]);

      if (refetch) await refetch();

      setRejectionSuccessModal({
        project: targetProj,
        category: rejectionCategory,
        notes: rejectionNotes,
        block: blockNumber
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Filter logic
  const filteredProjects = useMemo(() => {
    return pendingQueue
      .filter((proj) => {
        const matchesSearch =
          searchQuery === "" ||
          proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          proj.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          proj.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          proj.developer.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType =
          selectedType === "All" ||
          (selectedType === "Solar" && proj.category.toLowerCase().includes("solar")) ||
          (selectedType === "Wind" && proj.category.toLowerCase().includes("wind")) ||
          (selectedType === "Forestry" && proj.category.toLowerCase().includes("forestry")) ||
          (selectedType === "Biogas" && proj.category.toLowerCase().includes("biogas"));

        const matchesStandard =
          selectedStandard === "All" ||
          (selectedStandard === "Verra" && proj.standardMethodology.includes("Verra")) ||
          (selectedStandard === "Gold Standard" && proj.standardMethodology.includes("Gold")) ||
          (selectedStandard === "CDM" && proj.standardMethodology.includes("CDM"));

        const matchesVolume =
          selectedVolume === "All" ||
          (selectedVolume === "under1k" && proj.volumeNum < 1000) ||
          (selectedVolume === "1k-5k" && proj.volumeNum >= 1000 && proj.volumeNum <= 5000) ||
          (selectedVolume === "over5k" && proj.volumeNum > 5000);

        return matchesSearch && matchesType && matchesStandard && matchesVolume;
      })
      .sort((a, b) => {
        if (selectedSort === "newest") return b.submittedTimestamp - a.submittedTimestamp;
        if (selectedSort === "volume") return b.volumeNum - a.volumeNum;
        if (selectedSort === "sla") return a.volumeNum - b.volumeNum;
        return 0;
      });
  }, [pendingQueue, searchQuery, selectedType, selectedStandard, selectedVolume, selectedSort]);

  // Dynamic Under Assessment sum
  const underAssessmentTonnes = useMemo(() => {
    return pendingQueue.reduce((acc, p) => acc + (p.volumeNum || 0), 0);
  }, [pendingQueue]);

  return (
    <div className="flex flex-col w-full bg-[#F4F7F4] min-h-full pb-16">
      <div className="px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 max-w-[1520px] mx-auto w-full">

        {/* ─────────────────────────────────────────────────────────────
            SECTION 1: PAGE HEADER & CONSOLE METADATA
        ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 bg-white p-6 sm:p-8 rounded-xl shadow-sm relative overflow-hidden border border-gray-200">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-200/40 to-transparent pointer-events-none blur-3xl"></div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="flex flex-col gap-1 max-w-4xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-900/10 text-[#003b1b] text-[11px] font-mono font-semibold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003b1b] animate-ping"></span>
                  MRV Auditor Console • Decentralized Compliance
                </span>
                <span className="text-gray-400 text-xs">•</span>
                <span className="font-mono text-xs text-[#3a6753] font-semibold">Ledger Block #68,912,404</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#131b2e] tracking-tight mt-1">
                Verifier Dashboard — Pending Reviews <span className="text-[#3a6753] font-normal">({pendingQueue.length})</span>
              </h1>
              <p className="text-sm text-gray-600 max-w-3xl mt-1 leading-relaxed">
                Review project documentation, baseline satellite telemetry, and issue cryptographic ERC-721 token minting attestations on Polygon Amoy.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-center shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleResetDemo}
                disabled={isResettingDemo}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors shadow-xs border border-amber-300 cursor-pointer disabled:opacity-50"
                title="Reset all demo projects and credits to initial presentation state"
              >
                <span className={`material-symbols-outlined text-[18px] text-amber-700 ${isResettingDemo ? "animate-spin" : ""}`}>restart_alt</span>
                <span>{isResettingDemo ? "Resetting Demo..." : "Reset Demo Data"}</span>
              </button>
              <button
                type="button"
                onClick={handleExportAuditLog}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-semibold transition-colors shadow-xs border border-gray-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
                <span>Export Audit Log</span>
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#14532d] text-white hover:bg-[#1f4d3a] text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? "animate-spin" : ""}`}>refresh</span>
                <span>Refresh Queue</span>
              </button>
            </div>
          </div>

          {/* Export Toast Notification */}
          {exportNotice && (
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg text-xs flex items-center justify-between shadow-xs border border-emerald-300">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                <span>MRV Compliance audit log exported successfully (ISO 14064 CSV format).</span>
              </div>
            </div>
          )}

          {/* Navigation Tabs within Console */}
          <div className="flex items-center gap-2 mt-2 border-t border-gray-100 pt-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                activeTab === "pending"
                  ? "bg-[#003b1b] text-white"
                  : "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Pending Reviews</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#6ffbbe] text-[#003a25] text-[11px] font-bold">
                {pendingQueue.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#003b1b] text-white"
                  : "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Review History</span>
              <span className="px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-700 text-[11px] font-semibold">
                {reviewHistory.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("guidelines")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "guidelines"
                  ? "bg-[#003b1b] text-white"
                  : "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>Auditor Guidelines</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 2: METRIC SUMMARY CARDS
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Queue Size */}
          <div className="bg-white p-5 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-gray-200 group">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500"></div>
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Queue Size</span>
              <span className="material-symbols-outlined text-amber-500 text-[20px]">pending_actions</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-gray-900">{pendingQueue.length}</span>
              <span className="text-xs text-gray-500">Projects awaiting</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-amber-600 text-[11px] font-semibold">
              <span className="material-symbols-outlined text-[14px]">priority_high</span>
              <span>3 priority SLAs exp. 6h</span>
            </div>
          </div>

          {/* Under Assessment Volume */}
          <div className="bg-white p-5 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-gray-200 group">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-600"></div>
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Under Assessment</span>
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">filter_vintage</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-gray-900">{underAssessmentTonnes.toLocaleString()}</span>
              <span className="text-xs font-semibold text-emerald-700">tCO2e</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600">
              <span>Est. Value: ${(underAssessmentTonnes * 15).toLocaleString()} USD</span>
              <span className="text-emerald-700 font-bold">+18% wk</span>
            </div>
          </div>

          {/* Average Review Turnaround */}
          <div className="bg-white p-5 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-gray-200 group">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#14532d]"></div>
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Average Review Time</span>
              <span className="material-symbols-outlined text-[#14532d] text-[20px]">pace</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-gray-900">18.4</span>
              <span className="text-xs text-gray-500">Hours / Project</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-emerald-700 text-[11px] font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_down</span>
              <span>4.2 hrs faster than benchmark</span>
            </div>
          </div>

          {/* Auditor Accreditations */}
          <div className="bg-white p-5 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden border border-gray-200 group">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#005337]"></div>
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Auditor Credentials</span>
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base text-gray-900 font-semibold">ISO 14064 &amp; Verra</span>
              <span className="text-[11px] text-emerald-700 font-medium">VCS Certified Lead Signatory</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-emerald-800 text-[11px] bg-emerald-50 px-2 py-0.5 rounded w-fit font-bold border border-emerald-200">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
              <span>Smart Contract Authorized</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 3: FILTER & CONTROL CENTER
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "pending" && (
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-200">
            <div className="flex-1 w-full relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
              <input
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#F8FAFC] text-gray-900 placeholder:text-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#14532d]/20 border border-gray-200"
                placeholder="Search project name, registry ID, submitter wallet (0x...)..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
              {/* Project Type Filter */}
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-2 rounded-lg text-gray-700 text-xs border border-gray-200">
                <span className="material-symbols-outlined text-[18px] text-[#3a6753]">category</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-transparent focus:outline-none font-medium text-gray-800 cursor-pointer text-xs"
                >
                  <option value="All">All Types</option>
                  <option value="Solar">Solar Energy</option>
                  <option value="Wind">Wind Generation</option>
                  <option value="Forestry">Forestry &amp; ARR</option>
                  <option value="Biogas">Biogas / Methane</option>
                </select>
              </div>

              {/* Registry Standard Filter */}
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-2 rounded-lg text-gray-700 text-xs border border-gray-200">
                <span className="material-symbols-outlined text-[18px] text-[#3a6753]">verified</span>
                <select
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value)}
                  className="bg-transparent focus:outline-none font-medium text-gray-800 cursor-pointer text-xs"
                >
                  <option value="All">All Standards</option>
                  <option value="Verra">Verra VCS</option>
                  <option value="Gold Standard">Gold Standard</option>
                  <option value="CDM">Clean Dev Mechanism (CDM)</option>
                </select>
              </div>

              {/* Volume Range Filter */}
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-2 rounded-lg text-gray-700 text-xs border border-gray-200">
                <span className="material-symbols-outlined text-[18px] text-[#3a6753]">tune</span>
                <select
                  value={selectedVolume}
                  onChange={(e) => setSelectedVolume(e.target.value)}
                  className="bg-transparent focus:outline-none font-medium text-gray-800 cursor-pointer text-xs"
                >
                  <option value="All">Volume Range</option>
                  <option value="under1k">&lt; 1,000 tCO2e</option>
                  <option value="1k-5k">1,000 - 5,000 tCO2e</option>
                  <option value="over5k">&gt; 5,000 tCO2e</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-2 rounded-lg text-gray-700 text-xs ml-auto md:ml-0 border border-gray-200">
                <span className="material-symbols-outlined text-[18px] text-gray-400">sort</span>
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="bg-transparent focus:outline-none font-medium text-gray-800 cursor-pointer text-xs"
                >
                  <option value="newest">Submission (Newest first)</option>
                  <option value="volume">Volume (High to Low)</option>
                  <option value="sla">SLA Expiring Soon</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SECTION 4: VERTICAL LIST OF REVIEW CARDS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "pending" && (
          <div className="flex flex-col gap-5">
            {filteredProjects.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-emerald-600 mb-2">check_circle</span>
                <h3 className="text-base font-semibold text-gray-800">All submissions in queue verified</h3>
                <p className="text-xs text-gray-500 mt-1">There are no pending submissions matching your active filter criteria.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedType("All");
                    setSelectedStandard("All");
                    setSelectedVolume("All");
                  }}
                  className="mt-4 px-4 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredProjects.map((proj) => (
                <article
                  key={proj.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col xl:flex-row border border-gray-200"
                >
                  {/* Left Image & Telemetry Section */}
                  <div className="relative xl:w-80 h-56 xl:h-auto shrink-0 bg-gray-100 overflow-hidden">
                    <img
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      src={proj.image}
                      alt={proj.name}
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {proj.isSentBack ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-600 text-white text-[11px] uppercase font-bold tracking-wider shadow-md flex items-center gap-1.5 border border-amber-400">
                          <span className="material-symbols-outlined text-[13px]">rotate_left</span>
                          Sent Back for Review / Pending Verification
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] uppercase font-bold tracking-wider shadow-sm flex items-center gap-1 border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Awaiting Attestation
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white bg-[#14532d]/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-[11px] font-mono border border-white/10">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px]">{proj.telemetryOverlay.icon}</span>
                        <span>{proj.telemetryOverlay.left}</span>
                      </span>
                      <span className="text-[#6ffbbe] font-bold">{proj.telemetryOverlay.right}</span>
                    </div>
                  </div>

                  {/* Right Details Section */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${proj.categoryBadgeClass}`}>
                            {proj.category}
                          </span>
                          <span className="font-mono text-xs text-gray-500">Project ID: {proj.id}</span>
                        </div>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          {proj.submittedTime}
                        </span>
                      </div>
                      <h2
                        onClick={() => handleSelectForApprove(proj)}
                        className="text-lg sm:text-xl text-gray-900 font-semibold tracking-tight hover:text-[#003b1b] transition-colors cursor-pointer mt-1"
                      >
                        {proj.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-0.5">
                        <span>Submitted by <strong className="font-semibold text-gray-900">{proj.developer}</strong></span>
                        <span className="font-mono text-[#3a6753] bg-gray-100 px-1.5 py-0.5 rounded text-[11px] border border-gray-200">
                          {proj.developerAddress}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#3a6753]">location_on</span>
                          {proj.location}
                        </span>
                      </div>

                      {/* Return Reason Alert Banner if sent back */}
                      {proj.isSentBack && (
                        <div className="mt-2.5 p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2 shadow-2xs">
                          <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0 mt-0.5">report_problem</span>
                          <div>
                            <span className="font-bold text-amber-900">Returned from Marketplace by Mira: </span>
                            <span className="text-amber-900">{proj.returnReason || proj.defaultNotes}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Technical Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-3.5 rounded-lg border border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-gray-500 uppercase font-semibold">Standard &amp; Methodology</span>
                        <span className="text-xs text-gray-900 font-semibold mt-0.5 truncate">{proj.standardMethodology}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-gray-500 uppercase font-semibold">{proj.volumeType}</span>
                        <span className="text-base text-[#003b1b] font-bold mt-0.5">
                          {proj.volume} <span className="text-xs font-normal text-[#3a6753]">{proj.volumeUnit}</span>
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-gray-500 uppercase font-semibold">{proj.metric3Label}</span>
                        <span className="text-xs text-gray-900 font-semibold mt-0.5 truncate">{proj.metric3Value}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-gray-500 uppercase font-semibold">
                          {proj.additionalityLabel || "Additionality Score"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-emerald-700">{proj.additionalityScore}</span>
                          <span className="material-symbols-outlined text-emerald-700 text-[16px]">
                            {proj.additionalityIcon}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Document Strip & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setInspectingProject(proj)}
                        className="inline-flex items-center gap-1.5 text-[#003b1b] hover:text-[#1f4d3a] text-xs font-medium group text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#3a6753] group-hover:translate-x-0.5 transition-transform">
                          {proj.docType === "pdf" ? "picture_as_pdf" : proj.docType === "shapefile" ? "map" : proj.docType === "insar" ? "layers" : "receipt_long"}
                        </span>
                        <span className="underline decoration-[#3a6753]/40 underline-offset-4 font-semibold">{proj.docTitle}</span>
                        <span className="material-symbols-outlined text-[15px] text-gray-400">north_east</span>
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectingProject(proj)}
                          className="px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 text-[#3a6753] text-xs font-semibold transition-colors shadow-xs border border-gray-200 flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">query_stats</span>
                          <span>Inspect Baseline Data</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectForReject(proj)}
                          className="px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors shadow-xs flex items-center gap-1 cursor-pointer border border-red-200"
                        >
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectForApprove(proj)}
                          className="px-4 py-2 rounded-lg bg-[#14532d] text-white hover:bg-[#1f4d3a] text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-[#6ffbbe]">verified_user</span>
                          <span>{proj.isSentBack ? "Verify Again & Relist" : "Approve & Mint"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB CONTENT: REVIEW HISTORY
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Audited Projects Ledger History</h3>
                <p className="text-xs text-gray-500 mt-0.5">Immutable record of VVB attestations committed to Polygon Amoy consensus.</p>
              </div>
              <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded font-bold border border-emerald-200">
                {reviewHistory.length} Attestations Recorded
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {reviewHistory.map((item, index) => (
                <div key={index} className="p-4 sm:px-6 hover:bg-[#F8FAFC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">{item.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {item.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.status === "Approved"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>Volume: <strong className="text-gray-900 font-mono">{item.volume}</strong></span>
                      <span>•</span>
                      <span>Audited: {item.auditDate}</span>
                      {item.rejectionReason && (
                        <>
                          <span>•</span>
                          <span className="text-red-700 italic max-w-md truncate">"{item.rejectionReason}"</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono text-gray-500 space-y-1">
                    <div>Block #{item.block}</div>
                    <div className="flex items-center justify-end gap-2">
                      {item.status === "Approved" && (
                        <Link
                          to={`/marketplace?highlight=${encodeURIComponent(item.rawId || item.id || item.name)}`}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-sans font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[13px]">storefront</span>
                          <span>View in Marketplace</span>
                        </Link>
                      )}
                      <Link to="/ledger/0" className="text-[#3a6753] hover:underline inline-flex items-center gap-1 font-semibold">
                        <span>{item.txHash}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB CONTENT: AUDITOR GUIDELINES
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "guidelines" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm text-xs text-gray-700 leading-relaxed">
            <h3 className="text-base font-bold text-gray-900">VVB Compliance Standards &amp; MRV Verification Protocols</h3>
            <p>
              As an accredited Validation &amp; Verification Body (VVB), attestations made via this console generate cryptographic proofs committed directly to Polygon Amoy smart contracts. Ensure adherence to the following requirements:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-gray-200 space-y-2">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ISO 14064-2 Baseline</span>
                </div>
                <p className="text-gray-600">
                  Verify project additionality and baseline emission projections against regional business-as-usual parameters.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-gray-200 space-y-2">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Satellite className="w-4 h-4 text-emerald-600" />
                  <span>Copernicus &amp; LiDAR Validation</span>
                </div>
                <p className="text-gray-600">
                  Cross-examine stated project area coordinates with Sentinel-2 L2A optical reflection and SAR backscatter data.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-gray-200 space-y-2">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Double-Counting Prevention</span>
                </div>
                <p className="text-gray-600">
                  Ensure synchronization with Verra VCS / Gold Standard APIs to prevent double-minting across registry boundaries.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SECTION 5: VERIFICATION ACTION MODALS & WORKFLOWS
        ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#003b1b] text-[22px]">developer_board</span>
              <h3 className="text-base font-bold text-gray-900">Auditor Transaction Workflows &amp; Attestation Modals</h3>
            </div>
            <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider font-semibold">Simulated Execution Environment</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Modal Preview A: Approve & Mint Attestation */}
            <div
              className="lg:col-span-7 bg-white rounded-xl shadow-md p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border border-gray-200"
              id="approve-modal-preview"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#003b1b] via-[#6ffbbe] to-[#3a6753]"></div>
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-[#3a6753] uppercase tracking-wider flex items-center gap-1 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      {selectedProjectForApprove?.isSentBack ? "Smart Contract Action: REVERIFY_AND_RELIST" : "Smart Contract Action: MINT_VERIFIED_CREDIT"}
                    </span>
                    <h4 className="text-lg font-bold text-gray-900 mt-1">
                      {selectedProjectForApprove?.isSentBack ? "Re-verify & Relist: " : "Approve Project: "}
                      {selectedProjectForApprove?.name || "Maharashtra Solar Power Grid"}
                    </h4>
                  </div>
                  <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="material-symbols-outlined text-[24px]">verified</span>
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selectedProjectForApprove?.isSentBack
                    ? `This will sign the on-chain re-audit attestation with Mira's Lead Auditor key, verifying compliance and immediately relisting ${verifiedVolume} tCO2e credits on the active Marketplace.`
                    : `This will sign the on-chain MRV attestation with your auditor key and mint ${verifiedVolume} ERC-721 tokenized carbon credits directly to ${selectedProjectForApprove?.developer || "Tata Industries Ltd"}'s custodial vault.`}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8FAFC] p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-gray-700 font-semibold uppercase">Verified Volume</label>
                    <div className="relative">
                      <input
                        className="w-full px-3 py-2 rounded bg-white font-mono text-xs font-bold text-gray-900 focus:outline-none border border-gray-300"
                        type="text"
                        value={verifiedVolume}
                        onChange={(e) => setVerifiedVolume(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3a6753] font-bold select-none">
                        tCO2e
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-gray-700 font-semibold uppercase">Auditor Accreditation Number</label>
                    <input
                      className="w-full px-3 py-2 rounded bg-gray-100 font-mono text-xs text-gray-600 focus:outline-none cursor-not-allowed border border-gray-200 font-semibold"
                      readOnly
                      type="text"
                      value={auditorAccreditation}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-gray-700 font-semibold uppercase">Verification Auditor Notes</label>
                    <textarea
                      className="w-full px-3 py-2 rounded bg-white text-xs text-gray-900 focus:outline-none resize-none border border-gray-300 leading-relaxed"
                      rows={2}
                      value={auditorNotes}
                      onChange={(e) => setAuditorNotes(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        checked={syncVerraApi}
                        onChange={(e) => setSyncVerraApi(e.target.checked)}
                        className="w-4 h-4 rounded text-[#003b1b] focus:ring-0 cursor-pointer"
                        type="checkbox"
                      />
                      <span className="text-xs text-gray-800 font-medium">Synchronize issuance with Verra VCS Direct Registry API</span>
                    </label>
                    <span className="font-mono text-xs text-emerald-700 flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[14px]">link</span> VCS-API Synced
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setAuditorNotes(selectedProjectForApprove?.defaultNotes || "")}
                  className="px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors cursor-pointer border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveSubmission}
                  disabled={isApproving || !selectedProjectForApprove}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#14532d] text-white hover:bg-[#1f4d3a] text-xs font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[18px] text-[#6ffbbe] ${isApproving ? "animate-spin" : ""}`}>
                    {isApproving ? "refresh" : "shield_lock"}
                  </span>
                  <span>
                    {isApproving
                      ? "Signing Attestation..."
                      : selectedProjectForApprove?.isSentBack
                      ? "Verify Again & Relist on Marketplace"
                      : "Sign Attestation & Mint Credits"}
                  </span>
                </button>
              </div>
            </div>

            {/* Modal Preview B: Reject Project Submission */}
            <div
              className="lg:col-span-5 bg-white rounded-xl shadow-md p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border border-gray-200"
              id="reject-modal-preview"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500"></div>
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-red-600 uppercase tracking-wider flex items-center gap-1 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Rejection &amp; Audit Return Flow
                    </span>
                    <h4 className="text-lg font-bold text-gray-900 mt-1">Reject Project Submission</h4>
                  </div>
                  <span className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-200">
                    <span className="material-symbols-outlined text-[24px]">gavel</span>
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Rejection writes an immutable flagged event to Polygon Amoy. The developer will receive auditor remarks and can resubmit with updated MRV data.
                </p>

                <div className="flex flex-col gap-3 bg-[#F8FAFC] p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-gray-700 font-semibold uppercase">Reason for Rejection Category</label>
                    <select
                      className="w-full px-3 py-2 rounded bg-white text-xs text-gray-900 focus:outline-none cursor-pointer border border-gray-300"
                      value={rejectionCategory}
                      onChange={(e) => setRejectionCategory(e.target.value)}
                    >
                      <option value="Deficient Baseline Additionality Calculations">Deficient Baseline Additionality Calculations</option>
                      <option value="Telemetry Inconsistency / Uncalibrated Inverters">Telemetry Inconsistency / Uncalibrated Inverters</option>
                      <option value="Corrupt or Incomplete GIS Polygon Boundary">Corrupt or Incomplete GIS Polygon Boundary</option>
                      <option value="Expired Accreditation of Third-Party Auditor">Expired Accreditation of Third-Party Auditor</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono text-gray-700 font-semibold uppercase">Auditor Explanation Note</label>
                    <textarea
                      className="w-full px-3 py-2 rounded bg-white text-xs text-gray-900 focus:outline-none resize-none border border-gray-300 leading-relaxed"
                      rows={3}
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setRejectionNotes("Proof document unreadable or missing baseline additionality calculations.")}
                  className="px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors cursor-pointer border border-gray-200"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmission}
                  disabled={isRejecting || !selectedProjectForReject}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer border border-red-200 disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isRejecting ? "animate-spin" : ""}`}>
                    {isRejecting ? "refresh" : "block"}
                  </span>
                  <span>{isRejecting ? "Flagging On-Chain..." : "Confirm Rejection"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: BASELINE TELEMETRY INSPECTOR (OPAQUE WHITE BACKGROUND)
      ───────────────────────────────────────────────────────────── */}
      {inspectingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-gray-900 rounded-2xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-50">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#003b1b] text-[22px]">satellite_alt</span>
                <h3 className="font-bold text-sm text-gray-900">
                  MRV Baseline Telemetry Inspector &bull; {inspectingProject.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingProject(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Fully Opaque Solid White) */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs bg-white text-gray-900">
              <div className="flex items-start gap-4 p-3 bg-[#F8FAFC] rounded-xl border border-gray-200">
                <img
                  src={inspectingProject.image}
                  alt={inspectingProject.name}
                  className="w-28 h-24 rounded-lg object-cover border border-gray-200 shrink-0"
                />
                <div className="space-y-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inspectingProject.categoryBadgeClass}`}>
                    {inspectingProject.category}
                  </span>
                  <h4 className="font-bold text-sm text-gray-900">{inspectingProject.name}</h4>
                  <p className="text-gray-500">{inspectingProject.location}</p>
                  <p className="font-mono text-[#3a6753] font-semibold flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">sensors</span>
                    <span>{inspectingProject.telemetryOverlay.left} &bull; {inspectingProject.telemetryOverlay.right}</span>
                  </p>
                </div>
              </div>

              {/* Spectral bands */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-gray-200 space-y-2">
                <div className="font-bold text-gray-800 uppercase tracking-wider text-[10px] flex items-center justify-between">
                  <span>Copernicus Multispectral Optical Calibration (Sentinel-2 L2A)</span>
                  <span className="text-emerald-700 font-mono text-[10px]">99.8% Calibration Match</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-xs">
                    <div className="text-[10px] text-gray-500 font-medium">B02 (Blue)</div>
                    <div className="font-bold text-gray-900 text-sm mt-0.5">490 nm</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">0.082 Refl</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-xs">
                    <div className="text-[10px] text-gray-500 font-medium">B03 (Green)</div>
                    <div className="font-bold text-gray-900 text-sm mt-0.5">560 nm</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">0.124 Refl</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-xs">
                    <div className="text-[10px] text-gray-500 font-medium">B04 (Red)</div>
                    <div className="font-bold text-gray-900 text-sm mt-0.5">665 nm</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">0.065 Refl</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-xs">
                    <div className="text-[10px] text-gray-500 font-medium">B08 (NIR)</div>
                    <div className="font-bold text-gray-900 text-sm mt-0.5">842 nm</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">0.781 Refl</div>
                  </div>
                </div>
              </div>

              {/* Cryptographic hash proof */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-900 font-bold">
                  <span>ORACLE SIGNATURE ROOT</span>
                  <span className="text-emerald-700">CONFIRMED ✓</span>
                </div>
                <div className="font-mono text-[10px] text-emerald-800 break-all bg-white/70 p-1.5 rounded border border-emerald-200">
                  0x3a4f6d892bc105e1974d6c29184ba48f0923e410b847291a9238c105e492bfa7
                </div>
              </div>

              {/* Modal Footer inside content */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setInspectingProject(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectForApprove(inspectingProject);
                    setInspectingProject(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#14532d] text-white text-xs font-semibold hover:bg-[#1f4d3a] cursor-pointer shadow-xs transition-colors"
                >
                  Proceed to Approve &amp; Mint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ATTESTATION SUCCESS (OPAQUE WHITE BACKGROUND)
      ───────────────────────────────────────────────────────────── */}
      {attestationSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-gray-900 rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden p-6 space-y-4 text-center z-50">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Attestation Signed &amp; Credits Minted</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Successfully minted <strong className="text-gray-900">{attestationSuccessModal.verifiedVolume} ERC-721 tokenized credits</strong> for {attestationSuccessModal.project.name}.
              </p>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-gray-200 text-left font-mono text-[11px] space-y-1">
              <div className="flex justify-between text-gray-500">
                <span>POLYGON AMOY BLOCK:</span>
                <span className="text-gray-900 font-bold">#{attestationSuccessModal.block}</span>
              </div>
              <div className="text-gray-500 truncate">
                TX: <span className="text-[#3a6753] font-semibold">{attestationSuccessModal.txHash}</span>
              </div>
              <div className="text-[10px] text-gray-500">
                Auditor Accreditation: {auditorAccreditation}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                to={`/marketplace?highlight=${encodeURIComponent(
                  attestationSuccessModal.project.finalProjectId ||
                  attestationSuccessModal.project.rawId ||
                  attestationSuccessModal.project.id ||
                  attestationSuccessModal.project.name
                )}`}
                onClick={() => setAttestationSuccessModal(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 text-center flex items-center justify-center transition-colors"
              >
                View in Marketplace
              </Link>
              <button
                type="button"
                onClick={() => setAttestationSuccessModal(null)}
                className="flex-1 py-2 rounded-lg bg-[#14532d] text-white text-xs font-semibold hover:bg-[#1f4d3a] cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: REJECTION CONFIRMED (OPAQUE WHITE BACKGROUND)
      ───────────────────────────────────────────────────────────── */}
      {rejectionSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-gray-900 rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden p-6 space-y-4 text-center z-50">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">cancel</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Submission Flagged &amp; Returned</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Project <strong className="text-gray-900">{rejectionSuccessModal.project.name}</strong> was rejected under category <em>"{rejectionSuccessModal.category}"</em>.
              </p>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-gray-200 text-left font-mono text-[11px] space-y-1">
              <div className="flex justify-between text-gray-500">
                <span>POLYGON AMOY BLOCK:</span>
                <span className="text-gray-900 font-bold">#{rejectionSuccessModal.block}</span>
              </div>
              <div className="text-gray-500 text-[10px] italic">
                Developer notified via on-chain event log. Resubmission allowed with updated MRV data.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRejectionSuccessModal(null)}
              className="w-full py-2 rounded-lg bg-[#14532d] text-white text-xs font-semibold hover:bg-[#1f4d3a] cursor-pointer shadow-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
