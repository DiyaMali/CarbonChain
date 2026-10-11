import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { canSell, canBuy } from "../services/roleService";
import {
  getAllProjects,
  getAllCredits,
  getPurchasesHistory,
  getAllLedgerBlocks,
  seedMeridianSellerIfEmpty,
  updateListingPrice,
  DEMO_WALLETS,
} from "../services/ledgerService";
import { getUserNotifications } from "../services/notificationService";
import PageHeader from "../components/PageHeader";
import ProjectThumbnail from "../components/ProjectThumbnail";
import IssuedVsSoldChart from "../components/IssuedVsSoldChart";
import TermTooltip from "../components/TermTooltip";
import ActionTooltip from "../components/ActionTooltip";
import CopyableText from "../components/CopyableText";
import { THEME, STATUS_COLORS } from "../styles/tokens";

// Benchmark price bands config
const SECTOR_BENCHMARKS = {
  Solar: { floor: 1100, ceiling: 1280, bandMin: 1100, bandMax: 1280 },
  Wind: { floor: 1050, ceiling: 1200, bandMin: 1050, bandMax: 1200 },
  Agroforestry: { floor: 1100, ceiling: 1400, bandMin: 1100, bandMax: 1400 },
  Waste: { floor: 900, ceiling: 1150, bandMin: 900, bandMax: 1150 },
  "Waste Gas": { floor: 900, ceiling: 1150, bandMin: 900, bandMax: 1150 },
};

const STAGE_EXPLANATIONS = {
  Submitted: "Baseline documentation uploaded and awaiting audit queue assignment.",
  "ACVA review": "A verifier checks your evidence before credits are issued. Simulated in this prototype.",
  Listed: "Certified credits verified and actively available for buyers on the marketplace.",
  "Sold out": "All issued credits for this project have been settled and purchased.",
  Rejected: "Audit returned with non compliance findings requiring proponent revisions.",
};

function formatINR(val) {
  if (val === null || val === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

function getRelativeTime(timestamp, fallback) {
  if (fallback) return fallback;
  if (!timestamp) return "Recent";
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  if (diffMs < 0) return "Just now";
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${Math.max(1, diffMins)} min ago`;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { account } = useWallet();

  const isSeller = canSell(user);
  const isBuyer = canBuy(user);

  // Auto seed Meridian seller projects if empty
  useEffect(() => {
    seedMeridianSellerIfEmpty();
  }, []);

  useEffect(() => {
    document.title = "Dashboard | CarbonChain";
  }, []);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-stone-900 mb-3">Please sign in</h1>
        <Link
          to="/login"
          className="px-4 py-2 border rounded text-xs font-semibold"
          style={{ borderColor: "#14452F", color: "#14452F" }}
        >
          Sign in &rarr;
        </Link>
      </div>
    );
  }

  // Render Seller Dashboard
  if (isSeller) {
    return <SellerDashboard user={user} account={account} />;
  }

  // Fallback Buyer Dashboard
  return <BuyerDashboard user={user} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SELLER DASHBOARD IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────
function SellerDashboard({ user, account }) {
  const [dateFilter, setDateFilter] = useState("30d"); // "7d" | "30d" | "all"
  const [stageFilter, setStageFilter] = useState("all"); // "all" | "Submitted" | "ACVA review" | "Listed" | "Sold out" | "Rejected"
  const [checklistVisible, setChecklistVisible] = useState(true);
  const [editingCredit, setEditingCredit] = useState(null); // { project, credit, price }
  const [editPriceInput, setEditPriceInput] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Hover states for charts and pipeline
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null); // "sold" | "available" | null
  const [hoveredRevenueBar, setHoveredRevenueBar] = useState(null); // projectId | null
  const [hoveredStage, setHoveredStage] = useState(null); // stage name | null

  // Raw state from ledger and project services
  const [projectsList, setProjectsList] = useState([]);
  const [creditsList, setCreditsList] = useState([]);
  const [purchasesList, setPurchasesList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);

  const loadData = () => {
    seedMeridianSellerIfEmpty();
    const projs = getAllProjects();
    const creds = getAllCredits();
    const purch = getPurchasesHistory();
    const blocks = getAllLedgerBlocks();
    const notifs = getUserNotifications(user);

    setProjectsList(projs);
    setCreditsList(creds);
    setPurchasesList(purch);
    setBlocksList(blocks);
    setNotificationsList(notifs);
  };

  useEffect(() => {
    loadData();
  }, [refreshKey, user]);

  // Seller projects: filter by ownership
  const sellerProjects = useMemo(() => {
    const effectiveWallet = account || DEMO_WALLETS.ipp;
    return projectsList.filter(
      (p) =>
        p.ownerUserId === user?.id ||
        (effectiveWallet && p.owner?.toLowerCase() === effectiveWallet.toLowerCase()) ||
        (!account && p.ownerUserId === "usr_meridian")
    );
  }, [projectsList, account, user]);

  // Compute per-project metrics strictly from ledger data
  const projectMetrics = useMemo(() => {
    return sellerProjects.map((proj) => {
      const isApproved = proj.status === "Approved";
      const isRejected = proj.status === "Rejected";
      const isPending = proj.status === "Pending" || proj.status === "ACVA review";

      // Never show a sale, minted credit or revenue for a project under review or rejected
      const issued = isApproved ? (proj.verifiedAmount || proj.listQuantity || proj.issued || 0) : 0;

      // Project purchases
      const projPurchases = isApproved
        ? purchasesList.filter((p) => p.projectId === proj.id || p.projectName === proj.name)
        : [];

      const sold = isApproved
        ? projPurchases.reduce((sum, p) => sum + (p.quantity || p.amount || 0), 0)
        : 0;

      const revenue = isApproved
        ? projPurchases.reduce(
            (sum, p) =>
              sum +
              (p.subtotal ||
                (p.quantity || p.amount || 0) * (p.pricePerTonne || proj.askingPrice || 0)),
            0
          )
        : 0;

      const available = Math.max(0, issued - sold);

      // Associated credit
      const credit = creditsList.find((c) => c.projectId === proj.id && !c.retired);

      // Stage identification
      let stage = "Submitted";
      if (isRejected) {
        stage = "Rejected";
      } else if (isPending) {
        stage = "ACVA review";
      } else if (isApproved) {
        stage = available === 0 && issued > 0 ? "Sold out" : "Listed";
      }

      // Asking price and benchmark
      const askingPrice = credit?.pricePerTonne || proj.askingPrice || 1200;
      const benchmark = SECTOR_BENCHMARKS[proj.projectType] || {
        floor: Math.round(askingPrice * 0.9),
        ceiling: Math.round(askingPrice * 1.1),
        bandMin: Math.round(askingPrice * 0.9),
        bandMax: Math.round(askingPrice * 1.1),
      };

      return {
        ...proj,
        issued,
        sold,
        available,
        revenue,
        stage,
        askingPrice,
        benchmark,
        credit,
        purchasesCount: projPurchases.length,
      };
    });
  }, [sellerProjects, purchasesList, creditsList]);

  // Aggregate numbers
  const totalIssued = useMemo(
    () => projectMetrics.reduce((sum, p) => sum + p.issued, 0),
    [projectMetrics]
  );
  const totalSold = useMemo(
    () => projectMetrics.reduce((sum, p) => sum + p.sold, 0),
    [projectMetrics]
  );
  const totalAvailable = useMemo(
    () => projectMetrics.reduce((sum, p) => sum + p.available, 0),
    [projectMetrics]
  );
  const totalRevenue = useMemo(
    () => projectMetrics.reduce((sum, p) => sum + p.revenue, 0),
    [projectMetrics]
  );
  const activeListingsCount = useMemo(
    () => projectMetrics.filter((p) => p.stage === "Listed" && p.available > 0).length,
    [projectMetrics]
  );
  const totalProjects = projectMetrics.length;

  // Pipeline stage counts
  const pipelineCounts = useMemo(() => {
    return {
      Submitted: projectMetrics.filter((p) => p.stage === "Submitted").length,
      "ACVA review": projectMetrics.filter((p) => p.stage === "ACVA review").length,
      Listed: projectMetrics.filter((p) => p.stage === "Listed").length,
      "Sold out": projectMetrics.filter((p) => p.stage === "Sold out").length,
      Rejected: projectMetrics.filter((p) => p.stage === "Rejected").length,
    };
  }, [projectMetrics]);

  // Projects per stage for hover popovers
  const stageProjectsMap = useMemo(() => {
    const map = {
      Submitted: [],
      "ACVA review": [],
      Listed: [],
      "Sold out": [],
      Rejected: [],
    };
    projectMetrics.forEach((p) => {
      if (map[p.stage]) {
        map[p.stage].push(p.name);
      }
    });
    return map;
  }, [projectMetrics]);

  // Consistency checks (dev-only assertion / console warning)
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      const sumSoldAvail = totalSold + totalAvailable;
      if (totalIssued !== sumSoldAvail) {
        console.warn(
          `[Consistency Check] Mismatch: issued (${totalIssued}) !== sold (${totalSold}) + available (${totalAvailable})`
        );
      }
      const sumRevenueCheck = projectMetrics.reduce(
        (sum, p) => sum + p.sold * p.askingPrice,
        0
      );
      if (totalRevenue !== sumRevenueCheck) {
        console.warn(
          `[Consistency Check] Mismatch: revenue (${totalRevenue}) !== sum of sold*price (${sumRevenueCheck})`
        );
      }
      const pipelineSum = Object.values(pipelineCounts).reduce((a, b) => a + b, 0);
      if (pipelineSum !== totalProjects) {
        console.warn(
          `[Consistency Check] Mismatch: pipeline sum (${pipelineSum}) !== total projects (${totalProjects})`
        );
      }
    }
  }, [
    totalIssued,
    totalSold,
    totalAvailable,
    totalRevenue,
    pipelineCounts,
    totalProjects,
    projectMetrics,
  ]);

  // Donut chart stroke dash calculations
  // Circumference = 2 * PI * 62 = 389.56
  const circumference = 389.56;
  const soldPercent = totalIssued > 0 ? totalSold / totalIssued : 0;
  const availablePercent = totalIssued > 0 ? totalAvailable / totalIssued : 0;
  const soldDash = (soldPercent * circumference).toFixed(1);
  const availableDash = (availablePercent * circumference).toFixed(1);

  // Filter project cards by stage
  const displayedProjects = useMemo(() => {
    if (!stageFilter || stageFilter === "all") return projectMetrics;
    return projectMetrics.filter((p) => p.stage === stageFilter);
  }, [projectMetrics, stageFilter]);

  // Action required items built from real data
  const actionItems = useMemo(() => {
    const items = [];

    // 1. Rejected projects
    const rejectedProjects = projectMetrics.filter((p) => p.stage === "Rejected");
    for (const rp of rejectedProjects) {
      items.push({
        id: `rej_${rp.id}`,
        type: "REJECTED_PROJECT",
        badge: "Rejected Project",
        tag: `Biogas #${rp.tokenNumber ? rp.tokenNumber.replace("#", "") : "0852"}`,
        title: rp.name,
        desc: rp.verifierNote || "Document audit revision required.",
        actionText: "Resubmit project →",
        actionLink: `/submit?resubmit=${rp.id}`,
        isRed: true,
      });
    }

    // 2. Stale listings: listed projects with no sales in 14 days
    const staleListings = projectMetrics.filter(
      (p) => p.stage === "Listed" && p.available > 0
    );
    if (staleListings.length > 0) {
      const sp = staleListings[0];
      items.push({
        id: `stale_${sp.id}`,
        type: "STALE_LISTING",
        badge: "Stale Listing",
        tag: "14 days",
        title: sp.name,
        desc: `No inquiries in 14 days; ask ₹${sp.askingPrice.toLocaleString("en-IN")}.`,
        footerLeft: `${sp.available.toLocaleString("en-IN")} tCO₂e idle`,
        actionText: "Adjust asking price →",
        onAction: () => {
          setEditingCredit({ project: sp, credit: sp.credit, price: sp.askingPrice });
          setEditPriceInput(sp.askingPrice);
        },
        isRed: false,
      });
    }

    // 3. Platform notice (sample from notifications)
    const unreadNotifs = notificationsList.filter((n) => !n.read && !n.unread);
    const unreadCount = unreadNotifs.length > 0 ? unreadNotifs.length : 2;
    items.push({
      id: "platform_notice",
      type: "PLATFORM_NOTICE",
      badge: "Platform notice (sample)",
      tag: `${unreadCount} unread`,
      title: "Registry Guidelines Update",
      desc: "2 test compliance notices published.",
      footerLeft: "Notice board",
      actionText: "View notices →",
      actionLink: "/notifications",
      isGreen: true,
    });

    return items;
  }, [projectMetrics, notificationsList]);

  // Dynamic 6 months ending at current month
  const chartMonths = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        name: monthNames[d.getMonth()],
        full: d.toLocaleString("en-US", { month: "long" }),
        isCurrent: i === 0,
        monthIndex: 6 - i,
      });
    }
    return result;
  }, []);

  // Filtered recent ledger activity
  const recentActivityBlocks = useMemo(() => {
    const sellerProjectIds = new Set(sellerProjects.map((p) => p.id));
    const sellerProjectNames = new Set(sellerProjects.map((p) => p.name));

    const fallbackEvents = [
      {
        id: "ev_1",
        title: "Sale: Wind Energy Plant (1,300 tCO₂e settled)",
        desc: "Recorded on simulated ledger",
        blockNumber: "Block #48",
        blockIndex: 48,
        time: "12 min ago",
        dotColor: "#14452F",
      },
      {
        id: "ev_2",
        title: "Sale: Solar Farm 10MW (1,000 tCO₂e settled)",
        desc: "Recorded on simulated ledger",
        blockNumber: "Block #43",
        blockIndex: 43,
        time: "1 hour ago",
        dotColor: "#14452F",
      },
      {
        id: "ev_3",
        title: "Credit minted: Wind Energy Plant (2,000 tCO₂e)",
        desc: "Batch issuance recorded in seller vault",
        blockNumber: "Block #36",
        blockIndex: 36,
        time: "5 hours ago",
        dotColor: "#1B5A3E",
      },
      {
        id: "ev_4",
        title: "Credit minted: Solar Farm 10MW (1,500 tCO₂e)",
        desc: "Batch issuance recorded in seller vault",
        blockNumber: "Block #31",
        blockIndex: 31,
        time: "1 day ago",
        dotColor: "#1B5A3E",
      },
      {
        id: "ev_5",
        title: "Project rejected: Biogas Capture Station",
        desc: "Missing stamp on page 4",
        blockNumber: "Block #24",
        blockIndex: 24,
        time: "2 days ago",
        dotColor: "#A12A2A",
      },
    ];

    const filteredBlocks = blocksList
      .filter((b) => {
        if (!b || !b.action) return false;
        const p = b.payload || {};
        const matchesProj =
          sellerProjectIds.has(p.projectId) ||
          sellerProjectNames.has(p.name) ||
          sellerProjectNames.has(p.projectName);
        if (
          (b.action === "CREDIT_MINTED" ||
            b.action === "CREDIT_PURCHASED" ||
            b.action === "PURCHASED") &&
          (p.projectId === "proj_agro_0977" || p.projectId === "proj_biogas_0852")
        ) {
          return false;
        }
        return (
          matchesProj ||
          b.action === "CREDIT_PURCHASED" ||
          b.action === "PROJECT_REJECTED"
        );
      })
      .slice(-5)
      .reverse();

    if (filteredBlocks.length >= 3) {
      return filteredBlocks.map((b) => {
        const p = b.payload || {};
        let title = b.action;
        let desc = "Recorded on simulated ledger";
        let dotColor = "#14452F";

        if (b.action === "CREDIT_PURCHASED" || b.action === "PURCHASED") {
          title = `Sale: ${p.projectName || p.name || "Carbon Project"} (${(p.quantity || p.amount || 0).toLocaleString("en-IN")} tCO₂e settled)`;
          desc = "Recorded on simulated ledger";
          dotColor = "#14452F";
        } else if (b.action === "CREDIT_MINTED") {
          title = `Credit minted: ${p.name || p.projectName || "Carbon Project"} (${(p.amount || 0).toLocaleString("en-IN")} tCO₂e)`;
          desc = "Batch issuance recorded in seller vault";
          dotColor = "#1B5A3E";
        } else if (b.action === "PROJECT_REJECTED") {
          title = `Project rejected: ${p.name || p.projectName || "Carbon Project"}`;
          desc = p.reason || "Verification review returned";
          dotColor = "#A12A2A";
        } else if (b.action === "PROJECT_APPROVED") {
          title = `Project approved: ${p.name || "Carbon Project"}`;
          desc = "ACVA audit verification completed";
          dotColor = "#14452F";
        } else if (b.action === "PROJECT_SUBMITTED") {
          title = `Project submitted: ${p.name || "Carbon Project"}`;
          desc = "Baseline audit submitted for ACVA review";
          dotColor = "#8A5A00";
        }

        return {
          id: `blk_${b.index}`,
          title,
          desc,
          blockNumber: `Block #${b.index}`,
          blockIndex: b.index,
          time: getRelativeTime(b.timestamp),
          dotColor,
        };
      });
    }

    return fallbackEvents;
  }, [blocksList, sellerProjects]);

  // Handle price update
  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!editingCredit?.credit && !editingCredit?.project) return;
    const creditId =
      editingCredit.credit?.id || `CCI-MCU-${editingCredit.project?.tokenId || "001042"}`;
    setEditLoading(true);
    setEditError("");
    try {
      await updateListingPrice(creditId, Number(editPriceInput));
      setEditingCredit(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setEditError(err.message || "Failed to update price.");
    } finally {
      setEditLoading(false);
    }
  };

  // Projects with sales for revenue bar chart
  const projectsWithSales = useMemo(() => {
    return projectMetrics.filter((p) => p.sold > 0 && p.revenue > 0);
  }, [projectMetrics]);

  return (
    <div
      className="flex-1 flex flex-col min-w-0 overflow-y-auto text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900"
      style={{ backgroundColor: "#F4F7F5" }}
    >
      <PageHeader
        role="seller"
        eyebrow="SELLER OVERVIEW"
        title="Dashboard"
        subtitle="Seller dashboard: project issuances and simulated settlement overview"
        action={{ label: "Submit Project", to: "/submit" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center border border-white/30 rounded p-0.5 text-xs font-medium"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <button
              type="button"
              onClick={() => setDateFilter("7d")}
              className={`px-3 py-1 transition-colors whitespace-nowrap rounded ${
                dateFilter === "7d"
                  ? "bg-white font-semibold"
                  : "text-white/80 hover:text-white"
              }`}
              style={dateFilter === "7d" ? { color: "#14452F" } : {}}
            >
              7 days
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("30d")}
              className={`px-3 py-1 transition-colors whitespace-nowrap rounded ${
                dateFilter === "30d"
                  ? "bg-white font-semibold"
                  : "text-white/80 hover:text-white"
              }`}
              style={dateFilter === "30d" ? { color: "#14452F" } : {}}
            >
              30 days
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("all")}
              className={`px-3 py-1 transition-colors whitespace-nowrap rounded ${
                dateFilter === "all"
                  ? "bg-white font-semibold"
                  : "text-white/80 hover:text-white"
              }`}
              style={dateFilter === "all" ? { color: "#14452F" } : {}}
            >
              All
            </button>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/40 text-xs font-medium text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            style={{ backgroundColor: "transparent" }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </PageHeader>

      {/* ── CONTENT BODY: 1440px framed layout ── */}
      <div className="p-8 space-y-6 max-w-[1440px] w-full mx-auto">
        {/* ── EMPTY STATE CHECKLIST (When seller has no projects) ── */}
        {totalProjects === 0 ? (
          <div
            className="rounded-[12px] p-8 text-center space-y-6 shadow-sm"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #EAE5DC" }}
          >
            <div className="max-w-xl mx-auto space-y-2">
              <span
                className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  backgroundColor: "#E6F4EC",
                  color: "#14452F",
                  border: "1px solid #14452F",
                }}
              >
                New Seller Workspace
              </span>
              <h2 className="text-xl font-bold text-stone-900">Get Started on CarbonChain</h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                Complete these three steps to register your emission reduction assets and start
                issuing credits on the simulated registry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left max-w-4xl mx-auto">
              <div
                className="p-5 rounded-[10px] flex flex-col justify-between"
                style={{ backgroundColor: "#F7F5F0", border: "1px solid #EAE5DC" }}
              >
                <div>
                  <div
                    className="w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center bg-white mb-3"
                    style={{ border: "1px solid #14452F", color: "#14452F" }}
                  >
                    1
                  </div>
                  <h3 className="text-sm font-bold text-stone-900">Submit a project</h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    Upload baseline audit documentation and project coordinates.
                  </p>
                </div>
                <div
                  className="mt-4 pt-3"
                  style={{ borderTop: "1px solid #EAE5DC" }}
                >
                  <Link
                    to="/submit"
                    className="text-xs font-semibold hover:underline"
                    style={{ color: "#14452F" }}
                  >
                    Start submission →
                  </Link>
                </div>
              </div>

              <div
                className="p-5 rounded-[10px] flex flex-col justify-between"
                style={{ backgroundColor: "#F7F5F0", border: "1px solid #EAE5DC" }}
              >
                <div>
                  <div
                    className="w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center bg-white mb-3"
                    style={{ border: "1px solid #D1D5DB", color: "#6B7280" }}
                  >
                    2
                  </div>
                  <h3 className="text-sm font-bold text-stone-900">ACVA review</h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    Accredited verification agency validates metrics and confirms baseline.
                  </p>
                </div>
                <div
                  className="mt-4 pt-3"
                  style={{ borderTop: "1px solid #EAE5DC" }}
                >
                  <span className="text-xs text-stone-500 font-medium">
                    Verification in progress
                  </span>
                </div>
              </div>

              <div
                className="p-5 rounded-[10px] flex flex-col justify-between"
                style={{ backgroundColor: "#F7F5F0", border: "1px solid #EAE5DC" }}
              >
                <div>
                  <div
                    className="w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center bg-white mb-3"
                    style={{ border: "1px solid #D1D5DB", color: "#6B7280" }}
                  >
                    3
                  </div>
                  <h3 className="text-sm font-bold text-stone-900">List and sell</h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    Set asking price per tCO₂e, deposit units into simulated ledger custody, receive
                    instant settlement funds.
                  </p>
                </div>
                <div
                  className="mt-4 pt-3"
                  style={{ borderTop: "1px solid #EAE5DC" }}
                >
                  <Link
                    to="/marketplace"
                    className="text-xs font-semibold hover:underline"
                    style={{ color: "#14452F" }}
                  >
                    Explore marketplace →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── SUMMARY BAND (Solid background #14452F, text colors as specified) ── */}
            <section
              className="rounded-[12px] p-6 md:p-7 shadow-sm text-white"
              style={{ backgroundColor: "#14452F", border: "1px solid #0F3824" }}
            >
              <div className="flex flex-col xl:flex-row items-center justify-between gap-8">
                {/* Left side: SVG Donut */}
                {/* Left side: SVG Donut */}
                <div className="flex flex-col sm:flex-row items-center gap-8 w-full xl:w-auto">
                  <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                    <svg className="w-44 h-44 -rotate-90 drop-shadow-sm overflow-visible" viewBox="0 0 160 160">
                      {/* Unfilled track / Available segment */}
                      <circle
                        cx="80"
                        cy="80"
                        fill="none"
                        r="62"
                        stroke={hoveredDonutSegment === "available" ? "#3B946B" : "#2F7A57"}
                        strokeWidth={hoveredDonutSegment === "available" ? "20" : "16"}
                        className="transition-all duration-180 cursor-pointer"
                        onMouseEnter={() => setHoveredDonutSegment("available")}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                      />
                      {/* Sold segment arc */}
                      <circle
                        cx="80"
                        cy="80"
                        fill="none"
                        r="62"
                        stroke="#5EE6A8"
                        strokeDasharray={`${soldDash} ${circumference}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        strokeWidth={hoveredDonutSegment === "sold" ? "20" : "16"}
                        className="transition-all duration-180 cursor-pointer"
                        onMouseEnter={() => setHoveredDonutSegment("sold")}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                      />
                    </svg>

                    {/* Donut Tooltip overlay when segment is hovered */}
                    {hoveredDonutSegment ? (
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pointer-events-none rounded-full"
                        style={{ backgroundColor: "rgba(20, 69, 47, 0.94)" }}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "#BFE8D0" }}>
                          {hoveredDonutSegment === "sold" ? "Credits Sold" : "Credits Available"}
                        </span>
                        <span className="text-xl font-bold font-mono text-white mt-0.5">
                          {hoveredDonutSegment === "sold"
                            ? totalSold.toLocaleString("en-IN")
                            : totalAvailable.toLocaleString("en-IN")}{" "}
                          t
                        </span>
                        <span className="text-[11px] font-semibold mt-0.5" style={{ color: "#5EE6A8" }}>
                          {hoveredDonutSegment === "sold"
                            ? `${(soldPercent * 100).toFixed(1)}% of total`
                            : `${(availablePercent * 100).toFixed(1)}% of total`}
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pointer-events-none">
                        <span
                          className="text-2xl font-bold tracking-tight leading-none"
                          style={{ color: "#FFFFFF" }}
                        >
                          {totalAvailable.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs font-semibold mt-1" style={{ color: "#BFE8D0" }}>
                          tCO₂e
                        </span>
                        <span
                          className="text-[12px] tracking-wider font-bold px-2.5 py-0.5 rounded-full mt-1.5 whitespace-nowrap"
                          style={{
                            backgroundColor: "#1B5A3E",
                            border: "1px solid #2F7A57",
                            color: "#5EE6A8",
                          }}
                        >
                          Available
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3.5 flex-1 min-w-[250px]">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: "#5EE6A8" }}
                        />
                        <p
                          className="text-[12px] uppercase tracking-widest font-semibold"
                          style={{ color: "#BFE8D0" }}
                        >
                          Total Issuance Balance
                        </p>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span
                          className="text-3xl font-bold tracking-tight"
                          style={{ color: "#FFFFFF" }}
                        >
                          {totalIssued.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs font-medium" style={{ color: "#BFE8D0" }}>
                          tCO₂e Issued
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div
                      className="space-y-2 text-xs p-3 rounded-[8px]"
                      style={{ backgroundColor: "#1B5A3E", border: "1px solid #2F7A57" }}
                    >
                      <button
                        type="button"
                        onMouseEnter={() => setHoveredDonutSegment("sold")}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                        onFocus={() => setHoveredDonutSegment("sold")}
                        onBlur={() => setHoveredDonutSegment(null)}
                        className={`w-full flex items-center justify-between gap-3 p-1 rounded transition-all cursor-pointer ${
                          hoveredDonutSegment === "sold"
                            ? "bg-white/10 ring-1 ring-[#5EE6A8]"
                            : hoveredDonutSegment
                            ? "opacity-60"
                            : "opacity-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: "#5EE6A8" }}
                          />
                          <span className="font-medium text-xs text-left" style={{ color: "#BFE8D0" }}>
                            Credits Sold
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-xs" style={{ color: "#FFFFFF" }}>
                          {totalSold.toLocaleString("en-IN")} tCO₂e
                        </span>
                      </button>

                      <button
                        type="button"
                        onMouseEnter={() => setHoveredDonutSegment("available")}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                        onFocus={() => setHoveredDonutSegment("available")}
                        onBlur={() => setHoveredDonutSegment(null)}
                        className={`w-full flex items-center justify-between gap-3 p-1 rounded transition-all cursor-pointer ${
                          hoveredDonutSegment === "available"
                            ? "bg-white/10 ring-1 ring-[#2F7A57]"
                            : hoveredDonutSegment
                            ? "opacity-60"
                            : "opacity-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: "#2F7A57", border: "1px solid #5EE6A8" }}
                          />
                          <span className="font-medium text-xs text-left" style={{ color: "#BFE8D0" }}>
                            Credits Available
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-xs" style={{ color: "#FFFFFF" }}>
                          {totalAvailable.toLocaleString("en-IN")} tCO₂e
                        </span>
                      </button>
                    </div>

                    {/* Note underneath donut */}
                    <div className="flex items-center gap-1.5 text-xs pt-1">
                      <svg
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: "#5EE6A8" }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-xs font-normal" style={{ color: "#BFE8D0" }}>
                        Balance recorded on simulated ledger.
                      </span>
                    </div>
                  </div>
                </div>


                {/* Vertical dividing hairline */}
                <div
                  className="hidden xl:block w-px h-32"
                  style={{ backgroundColor: "#2F7A57" }}
                />

                {/* Right side: Three compact figures with solid #1B5A3E and 1px border of #2F7A57 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full xl:w-auto shrink-0">
                  {/* Figure 1: Credits Sold */}
                  <div
                    className="rounded-[10px] p-4 min-w-[170px]"
                    style={{ backgroundColor: "#1B5A3E", border: "1px solid #2F7A57" }}
                  >
                    <span className="text-xs block mb-2 font-medium" style={{ color: "#BFE8D0" }}>
                      Credits sold
                    </span>
                    <div
                      className="text-2xl font-bold tracking-tight"
                      style={{ color: "#FFFFFF" }}
                    >
                      {totalSold.toLocaleString("en-IN")}
                    </div>
                    <span className="text-xs mt-1 block" style={{ color: "#BFE8D0" }}>
                      tCO₂e settled
                    </span>
                  </div>

                  {/* Figure 2: Revenue */}
                  <div
                    className="rounded-[10px] p-4 min-w-[170px]"
                    style={{ backgroundColor: "#1B5A3E", border: "1px solid #2F7A57" }}
                  >
                    <span className="text-xs block mb-2 font-medium" style={{ color: "#BFE8D0" }}>
                      Revenue
                    </span>
                    <div
                      className="text-2xl font-bold tracking-tight"
                      style={{ color: "#FFFFFF" }}
                    >
                      {formatINR(totalRevenue)}
                    </div>
                    <span className="text-xs mt-1 block" style={{ color: "#BFE8D0" }}>
                      Across {projectsWithSales.length} active projects
                    </span>
                  </div>

                  {/* Figure 3: Active Listings */}
                  <div
                    className="rounded-[10px] p-4 min-w-[170px]"
                    style={{ backgroundColor: "#1B5A3E", border: "1px solid #2F7A57" }}
                  >
                    <span className="text-xs block mb-2 font-medium" style={{ color: "#BFE8D0" }}>
                      Active listings
                    </span>
                    <div
                      className="text-2xl font-bold tracking-tight"
                      style={{ color: "#FFFFFF" }}
                    >
                      {activeListingsCount}
                    </div>
                    <span className="text-xs mt-1 block" style={{ color: "#BFE8D0" }}>
                      Simulated ledger custody
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── LIFECYCLE PIPELINE STRIP ── */}
            <section
              className="rounded-[12px] p-4 shadow-sm"
              style={{ backgroundColor: "#FFFFFF", border: "1px solid #EAE5DC" }}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Project Lifecycle Pipeline
                  </span>
                  <span className="text-stone-300 text-xs">|</span>
                  <span className="text-xs text-stone-500">Filter cards by stage</span>
                </div>
                <span className="text-xs text-stone-700 font-semibold">{totalProjects} projects</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
                {/* Stage 1: Submitted */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setStageFilter(stageFilter === "Submitted" ? "all" : "Submitted")}
                    onMouseEnter={() => setHoveredStage("Submitted")}
                    onMouseLeave={() => setHoveredStage(null)}
                    onFocus={() => setHoveredStage("Submitted")}
                    onBlur={() => setHoveredStage(null)}
                    className="w-full text-left p-3 rounded-[8px] transition-colors cursor-pointer"
                    style={{
                      backgroundColor: stageFilter === "Submitted" ? "#E6F4EC" : "#F7F5F0",
                      border: stageFilter === "Submitted" ? "2px solid #14452F" : "1px solid #EAE5DC",
                    }}
                  >
                    {stageFilter === "Submitted" && (
                      <span
                        className="absolute -top-2 right-2 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase whitespace-nowrap bg-white"
                        style={{ border: "1px solid #14452F", color: "#14452F" }}
                      >
                        Filtered
                      </span>
                    )}
                    <div className="flex items-center justify-between text-xs text-stone-600 mb-1.5">
                      <span className="font-medium">1. Submitted</span>
                      <span className="w-2 h-2 rounded-full bg-stone-300" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-stone-800">
                        {pipelineCounts["Submitted"]}
                      </span>
                      <span className="text-xs text-stone-500">projects</span>
                    </div>
                  </button>

                  {hoveredStage === "Submitted" && (
                    <div
                      role="tooltip"
                      className="absolute z-30 bottom-full left-0 mb-2 w-64 p-3 rounded-lg text-left shadow-xl pointer-events-none"
                      style={{ backgroundColor: "#14201A", border: "1px solid #2F7A57", color: "#FFFFFF" }}
                    >
                      <div className="text-xs font-bold text-white mb-1">1. Submitted</div>
                      <p className="text-[11px] text-stone-300 leading-normal mb-2">
                        {STAGE_EXPLANATIONS["Submitted"]}
                      </p>
                      <div className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider mb-1">
                        Projects ({stageProjectsMap["Submitted"]?.length || 0}):
                      </div>
                      {stageProjectsMap["Submitted"]?.length > 0 ? (
                        <ul className="text-[11px] text-stone-200 space-y-0.5 list-disc list-inside">
                          {stageProjectsMap["Submitted"].map((name, i) => (
                            <li key={i} className="truncate">{name}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">No projects in this stage</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Stage 2: ACVA review */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setStageFilter(stageFilter === "ACVA review" ? "all" : "ACVA review")}
                    onMouseEnter={() => setHoveredStage("ACVA review")}
                    onMouseLeave={() => setHoveredStage(null)}
                    onFocus={() => setHoveredStage("ACVA review")}
                    onBlur={() => setHoveredStage(null)}
                    className="w-full text-left p-3 rounded-[8px] transition-colors cursor-pointer"
                    style={{
                      backgroundColor: stageFilter === "ACVA review" ? "#FFF4D6" : "#FFFBF0",
                      border: stageFilter === "ACVA review" ? "2px solid #8A5A00" : "1px solid #FDE68A",
                    }}
                  >
                    {stageFilter === "ACVA review" && (
                      <span
                        className="absolute -top-2 right-2 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase whitespace-nowrap bg-white"
                        style={{ border: "1px solid #8A5A00", color: "#8A5A00" }}
                      >
                        Filtered
                      </span>
                    )}
                    <div
                      className="flex items-center justify-between text-xs mb-1.5 font-semibold"
                      style={{ color: "#8A5A00" }}
                    >
                      <span>2. ACVA review</span>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#8A5A00" }} />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold" style={{ color: "#8A5A00" }}>
                        {pipelineCounts["ACVA review"]}
                      </span>
                      <span className="text-xs font-medium" style={{ color: "#8A5A00" }}>
                        project
                      </span>
                    </div>
                  </button>

                  {hoveredStage === "ACVA review" && (
                    <div
                      role="tooltip"
                      className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg text-left shadow-xl pointer-events-none"
                      style={{ backgroundColor: "#14201A", border: "1px solid #2F7A57", color: "#FFFFFF" }}
                    >
                      <div className="text-xs font-bold text-white mb-1">2. ACVA review</div>
                      <p className="text-[11px] text-stone-300 leading-normal mb-2">
                        {STAGE_EXPLANATIONS["ACVA review"]}
                      </p>
                      <div className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider mb-1">
                        Projects ({stageProjectsMap["ACVA review"]?.length || 0}):
                      </div>
                      {stageProjectsMap["ACVA review"]?.length > 0 ? (
                        <ul className="text-[11px] text-stone-200 space-y-0.5 list-disc list-inside">
                          {stageProjectsMap["ACVA review"].map((name, i) => (
                            <li key={i} className="truncate">{name}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">No projects in this stage</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Stage 3: Listed */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setStageFilter(stageFilter === "Listed" ? "all" : "Listed")}
                    onMouseEnter={() => setHoveredStage("Listed")}
                    onMouseLeave={() => setHoveredStage(null)}
                    onFocus={() => setHoveredStage("Listed")}
                    onBlur={() => setHoveredStage(null)}
                    className="w-full text-left p-3 rounded-[8px] transition-colors cursor-pointer"
                    style={{
                      backgroundColor: stageFilter === "Listed" ? "#E6F4EC" : "#F7F5F0",
                      border: stageFilter === "Listed" ? "2px solid #14452F" : "1px solid #EAE5DC",
                    }}
                  >
                    {stageFilter === "Listed" && (
                      <span
                        className="absolute -top-2 right-2 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase whitespace-nowrap bg-white"
                        style={{ border: "1px solid #14452F", color: "#14452F" }}
                      >
                        Filtered
                      </span>
                    )}
                    <div
                      className="flex items-center justify-between text-xs mb-1.5 font-bold"
                      style={{ color: "#14452F" }}
                    >
                      <span>3. Listed</span>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#14452F" }} />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold" style={{ color: "#14452F" }}>
                        {pipelineCounts["Listed"]}
                      </span>
                      <span className="text-xs font-medium" style={{ color: "#14452F" }}>
                        projects
                      </span>
                    </div>
                  </button>

                  {hoveredStage === "Listed" && (
                    <div
                      role="tooltip"
                      className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg text-left shadow-xl pointer-events-none"
                      style={{ backgroundColor: "#14201A", border: "1px solid #2F7A57", color: "#FFFFFF" }}
                    >
                      <div className="text-xs font-bold text-white mb-1">3. Listed</div>
                      <p className="text-[11px] text-stone-300 leading-normal mb-2">
                        {STAGE_EXPLANATIONS["Listed"]}
                      </p>
                      <div className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider mb-1">
                        Projects ({stageProjectsMap["Listed"]?.length || 0}):
                      </div>
                      {stageProjectsMap["Listed"]?.length > 0 ? (
                        <ul className="text-[11px] text-stone-200 space-y-0.5 list-disc list-inside">
                          {stageProjectsMap["Listed"].map((name, i) => (
                            <li key={i} className="truncate">{name}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">No projects in this stage</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Stage 4: Sold out */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setStageFilter(stageFilter === "Sold out" ? "all" : "Sold out")}
                    onMouseEnter={() => setHoveredStage("Sold out")}
                    onMouseLeave={() => setHoveredStage(null)}
                    onFocus={() => setHoveredStage("Sold out")}
                    onBlur={() => setHoveredStage(null)}
                    className="w-full text-left p-3 rounded-[8px] transition-colors cursor-pointer"
                    style={{
                      backgroundColor: stageFilter === "Sold out" ? "#E6F4EC" : "#F7F5F0",
                      border: stageFilter === "Sold out" ? "2px solid #14452F" : "1px solid #EAE5DC",
                    }}
                  >
                    {stageFilter === "Sold out" && (
                      <span
                        className="absolute -top-2 right-2 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase whitespace-nowrap bg-white"
                        style={{ border: "1px solid #14452F", color: "#14452F" }}
                      >
                        Filtered
                      </span>
                    )}
                    <div className="flex items-center justify-between text-xs text-stone-600 mb-1.5">
                      <span className="font-medium">4. Sold out</span>
                      <span className="w-2 h-2 rounded-full bg-stone-300" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-stone-800">
                        {pipelineCounts["Sold out"]}
                      </span>
                      <span className="text-xs text-stone-500">records</span>
                    </div>
                  </button>

                  {hoveredStage === "Sold out" && (
                    <div
                      role="tooltip"
                      className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg text-left shadow-xl pointer-events-none"
                      style={{ backgroundColor: "#14201A", border: "1px solid #2F7A57", color: "#FFFFFF" }}
                    >
                      <div className="text-xs font-bold text-white mb-1">4. Sold out</div>
                      <p className="text-[11px] text-stone-300 leading-normal mb-2">
                        {STAGE_EXPLANATIONS["Sold out"]}
                      </p>
                      <div className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider mb-1">
                        Projects ({stageProjectsMap["Sold out"]?.length || 0}):
                      </div>
                      {stageProjectsMap["Sold out"]?.length > 0 ? (
                        <ul className="text-[11px] text-stone-200 space-y-0.5 list-disc list-inside">
                          {stageProjectsMap["Sold out"].map((name, i) => (
                            <li key={i} className="truncate">{name}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">No projects in this stage</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Stage 5: Rejected */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setStageFilter(stageFilter === "Rejected" ? "all" : "Rejected")}
                    onMouseEnter={() => setHoveredStage("Rejected")}
                    onMouseLeave={() => setHoveredStage(null)}
                    onFocus={() => setHoveredStage("Rejected")}
                    onBlur={() => setHoveredStage(null)}
                    className="w-full text-left p-3 rounded-[8px] transition-colors cursor-pointer"
                    style={{
                      backgroundColor: stageFilter === "Rejected" ? "#FDECEC" : "#FFF5F5",
                      border: stageFilter === "Rejected" ? "2px solid #A12A2A" : "1px solid #FECACA",
                    }}
                  >
                    {stageFilter === "Rejected" && (
                      <span
                        className="absolute -top-2 right-2 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase whitespace-nowrap bg-white"
                        style={{ border: "1px solid #A12A2A", color: "#A12A2A" }}
                      >
                        Filtered
                      </span>
                    )}
                    <div
                      className="flex items-center justify-between text-xs mb-1.5 font-medium"
                      style={{ color: "#A12A2A" }}
                    >
                      <span>5. Rejected</span>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#A12A2A" }} />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold" style={{ color: "#A12A2A" }}>
                        {pipelineCounts["Rejected"]}
                      </span>
                      <span className="text-xs" style={{ color: "#A12A2A" }}>
                        project
                      </span>
                    </div>
                  </button>

                  {hoveredStage === "Rejected" && (
                    <div
                      role="tooltip"
                      className="absolute z-30 bottom-full right-0 mb-2 w-64 p-3 rounded-lg text-left shadow-xl pointer-events-none"
                      style={{ backgroundColor: "#14201A", border: "1px solid #2F7A57", color: "#FFFFFF" }}
                    >
                      <div className="text-xs font-bold text-white mb-1">5. Rejected</div>
                      <p className="text-[11px] text-stone-300 leading-normal mb-2">
                        {STAGE_EXPLANATIONS["Rejected"]}
                      </p>
                      <div className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider mb-1">
                        Projects ({stageProjectsMap["Rejected"]?.length || 0}):
                      </div>
                      {stageProjectsMap["Rejected"]?.length > 0 ? (
                        <ul className="text-[11px] text-stone-200 space-y-0.5 list-disc list-inside">
                          {stageProjectsMap["Rejected"].map((name, i) => (
                            <li key={i} className="truncate">{name}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">No projects in this stage</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── PROJECT CARDS & RIGHT COLUMN (CSS Grid, align-items: stretch, 24px gap) ── */}
            <section
              className="grid grid-cols-1 lg:grid-cols-3"
              style={{ display: "grid", alignItems: "stretch", gap: "24px" }}
            >
              {/* LEFT & CENTER (Span 2): 2-Column Grid of Project Cards */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="text-base font-bold text-stone-900 leading-tight">
                        Project Portfolio &amp; Issuances
                      </h2>
                      <p className="text-xs text-stone-500 mt-1">
                        Active registry assets and simulated token status
                      </p>
                    </div>
                    {stageFilter !== "all" && (
                      <button
                        type="button"
                        onClick={() => setStageFilter("all")}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: "#14452F" }}
                      >
                        Show all projects
                      </button>
                    )}
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded"
                    style={{ backgroundColor: "#F7F5F0", border: "1px solid #EAE5DC", color: "#4B5563" }}
                  >
                    {displayedProjects.length} registered asset
                    {displayedProjects.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div
                  className="flex-1 grid grid-cols-1 md:grid-cols-2"
                  style={{ display: "grid", gap: "24px", gridAutoRows: "1fr" }}
                >
                  {displayedProjects.length === 0 ? (
                    <div
                      className="col-span-1 md:col-span-2 rounded-[12px] p-8 text-center space-y-3"
                      style={{ backgroundColor: "#FFFFFF", border: "1px solid #EAE5DC" }}
                    >
                      <p className="text-sm text-stone-600">No projects in this stage.</p>
                      <button
                        type="button"
                        onClick={() => setStageFilter("all")}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: "#14452F" }}
                      >
                        Show all projects
                      </button>
                    </div>
                  ) : (
                    displayedProjects.map((proj) => {
                    const isRejected = proj.stage === "Rejected";
                    const isReview = proj.stage === "ACVA review";
                    const isListed = proj.stage === "Listed" || proj.stage === "Sold out";

                    // Sold progress calculation
                    const soldPercentVal =
                      proj.issued > 0 ? Math.round((proj.sold / proj.issued) * 100) : 0;

                    // Sector band markers calculation
                    const bFloor = proj.benchmark.floor;
                    const bCeil = proj.benchmark.ceiling;
                    const bRange = bCeil - bFloor || 100;
                    const priceOffsetPercent = Math.min(
                      90,
                      Math.max(10, Math.round(((proj.askingPrice - bFloor) / bRange) * 100))
                    );

                    return (
                      <div
                        key={proj.id}
                        className="rounded-[12px] p-5 flex flex-col justify-between shadow-sm transition-colors h-full hover-card group"
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E3E8E5",
                          borderLeft: `4px solid ${
                            proj.stage === "Listed"
                              ? "#14452F"
                              : proj.stage === "Sold out"
                              ? "#4A5550"
                              : proj.stage === "Rejected"
                              ? "#A12A2A"
                              : "#8A5A00"
                          }`,
                        }}
                      >
                        <div>
                          {/* Card Header: Thumbnail + Name, Token, Status */}
                          <div className="flex items-start gap-3.5 mb-3">
                            <ProjectThumbnail
                              project={proj}
                              className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-[8px]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-sm font-bold text-stone-900 leading-tight">
                                    {proj.name}
                                  </h3>
                                  <p className="text-xs text-stone-500 mt-1">
                                    <span className="font-mono text-[12px]">
                                      Token {proj.tokenNumber || `#${proj.tokenId || "1042"}`}
                                    </span>
                                    {" : "}
                                    {proj.location}
                                  </p>
                                </div>

                            {/* Solid Fill Status Badges per Item 2 */}
                            {isListed && (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold shrink-0 whitespace-nowrap"
                                style={{
                                  backgroundColor: "#E6F4EC",
                                  color: "#14452F",
                                  border: "1px solid #14452F",
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: "#14452F" }}
                                />
                                Listed
                              </span>
                            )}
                            {isReview && (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold shrink-0 whitespace-nowrap"
                                style={{
                                  backgroundColor: "#FFF4D6",
                                  color: "#8A5A00",
                                  border: "1px solid #8A5A00",
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: "#8A5A00" }}
                                />
                                ACVA review
                              </span>
                            )}
                            {isRejected && (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold shrink-0 whitespace-nowrap"
                                style={{
                                  backgroundColor: "#FDECEC",
                                  color: "#A12A2A",
                                  border: "1px solid #A12A2A",
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: "#A12A2A" }}
                                />
                                Rejected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                          {/* Sector Tag & Issuance status */}
                          <div className="flex items-center gap-2 text-xs text-stone-600 mb-3">
                            <TermTooltip
                              term="Sector"
                              definition="Standard classification of environmental reduction project for benchmark comparison."
                            >
                              <span
                                className="px-2 py-0.5 rounded text-xs font-medium cursor-help"
                                style={{ backgroundColor: "#F7F5F0", border: "1px solid #EAE5DC" }}
                              >
                                Sector: {proj.projectType}
                              </span>
                            </TermTooltip>
                            <span className="text-stone-300">•</span>
                            {isListed && (
                              <span className="text-xs">
                                Issued: {proj.issued.toLocaleString("en-IN")}{" "}
                                <TermTooltip term="tCO2e" definition="Tonnes of carbon dioxide equivalent, the standard metric unit for measuring greenhouse gas reductions.">
                                  <span>tCO₂e</span>
                                </TermTooltip>
                              </span>
                            )}
                            {isReview && (
                              <span className="text-xs">
                                Requested: {(proj.estimatedCO2 || 800).toLocaleString("en-IN")}{" "}
                                <TermTooltip term="tCO2e" definition="Tonnes of carbon dioxide equivalent, the standard metric unit for measuring greenhouse gas reductions.">
                                  <span>tCO₂e</span>
                                </TermTooltip>
                              </span>
                            )}
                            {isRejected && <span className="text-xs">0 issued, 0 sold</span>}
                          </div>

                          {/* Segmented Lifecycle Progress Bar per Item 3: filled segments in #14452F, unfilled in #E3E8E5 */}
                          {isListed && (
                            <div
                              className="mb-4 p-2.5 rounded-[8px]"
                              style={{ backgroundColor: "#F7F5F0", border: "1px solid #EAE5DC" }}
                            >
                              <div
                                className="grid grid-cols-4 text-[11px] text-center mb-1.5"
                                style={{ color: "#666666" }}
                              >
                                <span className="text-left">Submitted</span>
                                <span>Review</span>
                                <span>Approved</span>
                                <span className="text-right font-bold" style={{ color: "#14452F" }}>
                                  Listed
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 w-full h-1.5">
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#14452F" }}
                                />
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#14452F" }}
                                />
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#14452F" }}
                                />
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#14452F" }}
                                />
                              </div>
                            </div>
                          )}

                          {isReview && (
                            <div
                              className="mb-4 p-2.5 rounded-[8px]"
                              style={{ backgroundColor: "#F7F5F0", border: "1px solid #EAE5DC" }}
                            >
                              <div
                                className="grid grid-cols-4 text-[11px] text-center mb-1.5"
                                style={{ color: "#666666" }}
                              >
                                <span className="text-left">Submitted</span>
                                <span className="font-bold" style={{ color: "#8A5A00" }}>
                                  Review
                                </span>
                                <span>Approved</span>
                                <span className="text-right">Listed</span>
                              </div>
                              <div className="flex items-center gap-1.5 w-full h-1.5">
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#14452F" }}
                                />
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#14452F" }}
                                />
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#E3E8E5" }}
                                />
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#E3E8E5" }}
                                />
                              </div>
                            </div>
                          )}

                          {isRejected && (
                            <div
                              className="mb-4 p-2.5 rounded-[8px]"
                              style={{ backgroundColor: "#FDF2F2", border: "1px solid #FECACA" }}
                            >
                              <div
                                className="grid grid-cols-4 text-[11px] text-center mb-1.5"
                                style={{ color: "#666666" }}
                              >
                                <span className="text-left">Submitted</span>
                                <span>Review</span>
                                <span className="font-bold" style={{ color: "#A12A2A" }}>
                                  Rejected
                                </span>
                                <span className="text-right">Listed</span>
                              </div>
                              <div className="flex items-center gap-1.5 w-full h-1.5">
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#14452F" }}
                                />
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#14452F" }}
                                />
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#E3E8E5" }}
                                />
                                <div
                                  className="flex-1 h-full rounded-full"
                                  style={{ backgroundColor: "#E3E8E5" }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Listed Cards Body: Sold Progress Bar & Asking Price */}
                          {isListed && (
                            <>
                              <div className="mb-4">
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span className="text-stone-600">Sold Progress:</span>
                                  <span className="font-semibold text-stone-800">
                                    {soldPercentVal}%{" "}
                                    <span className="text-stone-500 text-xs font-normal">
                                      ({proj.sold.toLocaleString("en-IN")} /{" "}
                                      {proj.issued.toLocaleString("en-IN")} tCO₂e)
                                    </span>
                                  </span>
                                </div>
                                <div
                                  className="w-full rounded-full h-2 overflow-hidden"
                                  style={{ backgroundColor: "#F2EEE6", border: "1px solid #EAE5DC" }}
                                >
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(100, soldPercentVal)}%`,
                                      backgroundColor: "#14452F",
                                    }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-stone-500 mt-1">
                                  <span>Settled revenue: {formatINR(proj.revenue)}</span>
                                  <span>
                                    Remaining: {proj.available.toLocaleString("en-IN")} tCO₂e
                                  </span>
                                </div>
                              </div>

                              {/* Asking price against sector band */}
                              <div
                                className="p-3 rounded-[8px] mb-4"
                                style={{ backgroundColor: "#FAF8F5", border: "1px solid #EAE5DC" }}
                              >
                                <div className="flex justify-between items-baseline text-xs mb-1.5">
                                  <span className="text-stone-600">Asking Price:</span>
                                  <span className="font-bold" style={{ color: "#14452F" }}>
                                    ₹{proj.askingPrice.toLocaleString("en-IN")} / t
                                  </span>
                                </div>
                                <div className="relative w-full h-1.5 bg-stone-200 rounded-full my-2">
                                  <div
                                    className="absolute left-[15%] w-[70%] h-full rounded-full"
                                    style={{ backgroundColor: "#E5F3E9" }}
                                  />
                                  <div
                                    className="absolute top-[-3px] w-2.5 h-3 rounded-sm"
                                    style={{
                                      left: `${priceOffsetPercent}%`,
                                      backgroundColor: "#14452F",
                                    }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-stone-500">
                                  <span>Floor: ₹{bFloor.toLocaleString("en-IN")}</span>
                                  <span className="font-medium" style={{ color: "#14452F" }}>
                                    Band: ₹{proj.benchmark.bandMin.toLocaleString("en-IN")} - ₹
                                    {proj.benchmark.bandMax.toLocaleString("en-IN")}
                                  </span>
                                  <span>Ceiling: ₹{bCeil.toLocaleString("en-IN")}</span>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Review Card Body */}
                          {isReview && (
                            <div
                              className="p-3 rounded-[8px] mb-4 space-y-1.5"
                              style={{ backgroundColor: "#FAF8F5", border: "1px solid #EAE5DC" }}
                            >
                              <div className="flex justify-between text-xs">
                                <span className="text-stone-600">Pending Review Quantity:</span>
                                <span className="font-semibold text-stone-900">
                                  {(proj.estimatedCO2 || 800).toLocaleString("en-IN")} tCO₂e (0
                                  issued, 0 sold)
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-stone-600">Asking Price Proposed:</span>
                                <span className="font-semibold" style={{ color: "#14452F" }}>
                                  ₹{proj.askingPrice.toLocaleString("en-IN")} / t
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 pt-1">
                                {proj.verifierNote ||
                                  "Auditor verifying baseline tree growth metrics and geo-boundary records."}
                              </p>
                            </div>
                          )}

                          {/* Rejected Card Body */}
                          {isRejected && (
                            <div
                              className="rounded-[8px] p-3 text-xs text-stone-800 mb-4"
                              style={{ backgroundColor: "#FDECEC", border: "1px solid #FECACA" }}
                            >
                              <span
                                className="font-semibold block mb-1"
                                style={{ color: "#A12A2A" }}
                              >
                                Verifier Assessment Note
                              </span>
                              <p className="text-xs text-stone-700 leading-relaxed">
                                Audit note:{" "}
                                {proj.verifierNote ||
                                  "Proof document missing GHG audit stamp on page 4."}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        <div
                          className="pt-3 flex items-center justify-between"
                          style={{ borderTop: "1px solid #EAE5DC" }}
                        >
                          {isRejected ? (
                            <>
                              <span className="text-xs text-stone-500 whitespace-nowrap">
                                Requires document re-upload
                              </span>
                              <div className="flex items-center gap-2.5 project-card-actions">
                                <Link
                                  to={`/submit?resubmit=${proj.id}`}
                                  className="px-3 py-1 rounded text-xs font-semibold hover:bg-red-50 transition-colors whitespace-nowrap"
                                  style={{
                                    border: "1px solid #FECACA",
                                    color: "#A12A2A",
                                  }}
                                >
                                  Resubmit
                                </Link>
                                <Link
                                  to={`/projects/${proj.slug || proj.id}`}
                                  className="px-2.5 py-1 text-xs font-medium text-stone-700 hover:underline"
                                  style={{ color: "#14452F" }}
                                >
                                  View
                                </Link>
                              </div>
                            </>
                          ) : isReview ? (
                            <div className="w-full flex items-center justify-end project-card-actions">
                              <Link
                                to={`/projects/${proj.slug || proj.id}`}
                                className="px-3 py-1 rounded border border-stone-300 text-xs font-medium text-stone-700 hover:border-stone-500 transition-colors"
                              >
                                View
                              </Link>
                            </div>
                          ) : (
                            <div className="w-full flex items-center justify-end gap-3 project-card-actions">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCredit({
                                    project: proj,
                                    credit: proj.credit,
                                    price: proj.askingPrice,
                                  });
                                  setEditPriceInput(proj.askingPrice);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-stone-700 underline-offset-4 hover:underline"
                              >
                                Edit price
                              </button>
                              <Link
                                to={`/projects/${proj.slug || proj.id}`}
                                className="px-3 py-1 rounded text-xs font-semibold transition-colors"
                                style={{
                                  border: "1px solid #14452F",
                                  color: "#14452F",
                                }}
                              >
                                View
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                </div>
              </div>

              {/* RIGHT COLUMN: Action Required + Impact Equivalents in flex column with 24px gap */}
              <div
                className="flex flex-col"
                style={{ display: "flex", flexDirection: "column", gap: "24px" }}
              >
                {/* 1. Action Required List */}
                <div
                  className="rounded-[12px] p-5 shadow-sm"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #EAE5DC" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#8A5A00" }}
                      />
                      <h3 className="text-sm font-bold text-stone-900 leading-tight">
                        Action Required
                      </h3>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded font-semibold whitespace-nowrap"
                      style={{
                        backgroundColor: "#FFF4D6",
                        border: "1px solid #FDE68A",
                        color: "#8A5A00",
                      }}
                    >
                      {actionItems.length} items
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-4 mt-2">
                    Urgent tasks affecting compliance, liquidity, or listing visibility
                  </p>

                  <div className="space-y-3">
                    {actionItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-[8px] hover-card"
                        style={{
                          backgroundColor: item.isRed ? "#FDF2F2" : "#F7F5F0",
                          border: item.isRed ? "1px solid #FECACA" : "1px solid #EAE5DC",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-xs font-bold uppercase tracking-wider"
                            style={{
                              color: item.isRed
                                ? "#A12A2A"
                                : item.isGreen
                                ? "#14452F"
                                : "#4B5563",
                            }}
                          >
                            {item.badge}
                          </span>
                          <span
                            className="text-xs font-mono"
                            style={{
                              color: item.isGreen ? "#14452F" : "#6B7280",
                              fontWeight: item.isGreen ? "600" : "normal",
                            }}
                          >
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-xs text-stone-900 font-semibold mt-1">{item.title}</p>
                        <p className="text-xs text-stone-600 mt-1">{item.desc}</p>
                        <div
                          className="mt-2.5 pt-2 flex items-center justify-between"
                          style={{
                            borderTop: item.isRed ? "1px solid #FECACA" : "1px solid #EAE5DC",
                          }}
                        >
                          <span className="text-xs text-stone-500">
                            {item.footerLeft || "ACVA verification"}
                          </span>
                          {item.actionLink ? (
                            <Link
                              to={item.actionLink}
                              className="text-xs font-semibold underline-offset-4 hover:underline whitespace-nowrap"
                              style={{ color: item.isRed ? "#A12A2A" : "#14452F" }}
                            >
                              {item.actionText}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={item.onAction}
                              className="text-xs font-semibold hover:underline whitespace-nowrap"
                              style={{ color: "#14452F" }}
                            >
                              {item.actionText}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Impact Equivalents Card (flex-grow: 1, tiles with justify-content: space-evenly) */}
                <div
                  className="rounded-[12px] p-5 shadow-sm flex flex-col justify-between"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #EAE5DC",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 leading-tight">
                          Impact Equivalents
                        </h3>
                        <span className="text-[11px] text-stone-500 font-normal block mt-0.5">
                          (Indicative equivalents)
                        </span>
                      </div>
                      <span
                        className="text-xs font-mono font-semibold px-2 py-0.5 rounded shrink-0 whitespace-nowrap"
                        style={{
                          backgroundColor: "#E6F4EC",
                          color: "#14452F",
                          border: "1px solid #14452F",
                        }}
                      >
                        {totalSold.toLocaleString("en-IN")} tCO₂e
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mb-3 mt-1">
                      Physical environmental translation of settled credits
                    </p>
                  </div>

                  {/* Vertically distributed stacked tiles (justify-content: space-evenly) */}
                  <div
                    className="flex-1 flex flex-col justify-evenly"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-evenly",
                      gap: "12px",
                      flexGrow: 1,
                    }}
                  >
                    {/* Tile 1: Trees grown */}
                    <div
                      className="p-3.5 rounded-[8px] flex items-start gap-3"
                      style={{ backgroundColor: "#FAF8F5", border: "1px solid #EAE5DC" }}
                    >
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: "#E6F4EC",
                          border: "1px solid #14452F",
                          color: "#14452F",
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M12 2L8 8h3v5H9l3 7 3-7h-2V8h3L12 2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-900">
                          {(totalSold * 16).toLocaleString("en-IN")} trees
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">
                          Equivalent to trees grown for ten years.
                        </p>
                      </div>
                    </div>

                    {/* Tile 2: Passenger Car Km Avoided */}
                    <div
                      className="p-3.5 rounded-[8px] flex items-start gap-3"
                      style={{ backgroundColor: "#FAF8F5", border: "1px solid #EAE5DC" }}
                    >
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: "#E6F4EC",
                          border: "1px solid #14452F",
                          color: "#14452F",
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="7" cy="17" r="2" />
                          <circle cx="17" cy="17" r="2" />
                          <path
                            d="M5 17H3v-6l2-5h9l4 5h3v6h-2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-900">
                          {(totalSold * 4000).toLocaleString("en-IN")} km
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">
                          Passenger car kilometres avoided.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── CHARTS ROW: Issued vs Sold & Revenue by Project ── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Line chart "Issued vs sold" */}
              <IssuedVsSoldChart totalIssued={totalIssued} totalSold={totalSold} />

              {/* Right: Revenue by Project */}
              <div
                className="rounded-[12px] p-5 flex flex-col justify-between shadow-sm"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #EAE5DC" }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 leading-tight">
                        Revenue by project
                      </h3>
                      <p className="text-xs text-stone-500 mt-2">
                        Breakdown of settled proceeds by active asset portfolio
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded"
                      style={{
                        backgroundColor: "#E6F4EC",
                        color: "#14452F",
                        border: "1px solid #14452F",
                      }}
                    >
                      Total: {formatINR(totalRevenue)}
                    </span>
                  </div>

                  {/* Horizontal Bars */}
                  <div className="space-y-5 py-2">
                    {projectsWithSales.map((p, idx) => {
                      const share = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
                      const barBg = idx === 0 ? "#14452F" : "#1B5A3E";
                      const isHovered = hoveredRevenueBar === p.id;
                      const isDimmed = hoveredRevenueBar !== null && !isHovered;

                      return (
                        <div
                          key={p.id}
                          className={`relative rounded-lg p-2 -mx-2 transition-all ${
                            isHovered
                              ? "bg-emerald-50 ring-1 ring-[#14452F]"
                              : isDimmed
                              ? "opacity-35"
                              : "opacity-100"
                          }`}
                          onMouseEnter={() => setHoveredRevenueBar(p.id)}
                          onMouseLeave={() => setHoveredRevenueBar(null)}
                          onFocus={() => setHoveredRevenueBar(p.id)}
                          onBlur={() => setHoveredRevenueBar(null)}
                          tabIndex={0}
                          role="group"
                          aria-label={`${p.name}: ${p.sold} tCO2e sold at ₹${p.askingPrice} per tonne, total revenue ${formatINR(p.revenue)}`}
                        >
                          {/* Tooltip on bar hover */}
                          {isHovered && (
                            <div
                              role="tooltip"
                              className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg text-xs shadow-xl pointer-events-none text-left"
                              style={{
                                backgroundColor: "#14201A",
                                border: "1px solid #2F7A57",
                                color: "#FFFFFF",
                              }}
                            >
                              <div className="font-bold text-white mb-1.5 truncate">{p.name}</div>
                              <div className="space-y-1 text-[11px] text-stone-300">
                                <div className="flex justify-between">
                                  <span>tCO₂e Sold:</span>
                                  <span className="font-mono text-white">
                                    {p.sold.toLocaleString("en-IN")} tCO₂e
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Price:</span>
                                  <span className="font-mono text-white">
                                    ₹{p.askingPrice.toLocaleString("en-IN")} / t
                                  </span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-white/20">
                                  <span className="font-semibold text-emerald-300">Revenue:</span>
                                  <span className="font-mono font-bold text-emerald-300">
                                    {formatINR(p.revenue)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <Link
                              to={`/projects/${p.slug || p.id}`}
                              className="font-semibold text-stone-800 hover:underline"
                            >
                              {p.name}
                            </Link>
                            <span className="font-bold text-stone-900">{formatINR(p.revenue)}</span>
                          </div>
                          <Link
                            to={`/projects/${p.slug || p.id}`}
                            className="block w-full rounded-full h-3 overflow-hidden group"
                            style={{ backgroundColor: "#F2EEE6", border: "1px solid #EAE5DC" }}
                            title={`View ${p.name}`}
                          >
                            <div
                              className="h-3 rounded-full transition-all"
                              style={{ width: `${share.toFixed(2)}%`, backgroundColor: barBg }}
                            />
                          </Link>
                          <div className="flex justify-between text-xs text-stone-500 mt-1">
                            <span>
                              {p.sold.toLocaleString("en-IN")} tCO₂e @ ₹
                              {p.askingPrice.toLocaleString("en-IN")}
                            </span>
                            <span className="font-medium text-stone-600">
                              {share.toFixed(1)}% of revenue
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="pt-4 flex items-center justify-between text-xs text-stone-600"
                  style={{ borderTop: "1px solid #EAE5DC" }}
                >
                  <span>
                    Sum: {projectsWithSales.map((p) => formatINR(p.revenue)).join(" + ")}
                  </span>
                  <span className="font-bold text-xs" style={{ color: "#14452F" }}>
                    {formatINR(totalRevenue)}
                  </span>
                </div>
              </div>
            </section>

            {/* ── RECENT LEDGER ACTIVITY ── */}
            <section
              className="rounded-[12px] p-5 shadow-sm"
              style={{ backgroundColor: "#FFFFFF", border: "1px solid #EAE5DC" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 leading-tight">
                    Recent Ledger Activity
                  </h3>
                  <p className="text-xs text-stone-500 mt-2">
                    Recorded on simulated ledger for registered contracts
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "#F7F5F0",
                    border: "1px solid #EAE5DC",
                    color: "#6B7280",
                  }}
                >
                  Simulated test environment
                </span>
              </div>

              {/* Activity rows */}
              <div className="divide-y divide-stone-200">
                {recentActivityBlocks.map((ev) => (
                  <div
                    key={ev.id}
                    className="py-3 px-2 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover-row"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: ev.dotColor }}
                      />
                      <div>
                        <p className="text-xs font-bold text-stone-900">{ev.title}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{ev.desc}</p>
                      </div>
                    </div>
                    <div className="sm:text-right pl-5 sm:pl-0">
                      <Link
                        to={`/ledger/${ev.blockIndex}`}
                        className="font-mono text-xs underline-offset-4 hover:underline"
                        style={{ color: "#14452F" }}
                      >
                        {ev.blockNumber}
                      </Link>
                      <div className="text-xs text-stone-400">{ev.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 3-STEP COMPLIANCE CHECKLIST (Dismissible) ── */}
            {checklistVisible && (
              <section
                className="rounded-[12px] p-6 shadow-sm"
                style={{ backgroundColor: "#F7F5F0", border: "1px solid #EAE5DC" }}
              >
                <div
                  className="flex items-center justify-between mb-4 pb-3"
                  style={{ borderBottom: "1px solid #EAE5DC" }}
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #14452F",
                          color: "#14452F",
                        }}
                      >
                        New Seller Setup
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 leading-tight">
                        3-Step Compliance Checklist
                      </h3>
                    </div>
                    <p className="text-xs text-stone-600 mt-2">
                      Standard procedure to onboard additional projects or new solar clusters
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChecklistVisible(false)}
                    className="text-xs text-stone-600 hover:text-stone-900 underline-offset-4 hover:underline"
                  >
                    Hide checklist
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step 1 */}
                  <div
                    className="p-4 rounded-[10px] bg-white flex flex-col justify-between hover-card"
                    style={{ border: "1px solid #EAE5DC" }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0"
                        style={{
                          border: "1px solid #14452F",
                          color: "#14452F",
                          backgroundColor: "#F7F5F0",
                        }}
                      >
                        1
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 leading-tight">
                          Submit a project
                        </h4>
                        <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                          Upload baseline audit documentation and project coordinates.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2">
                      <Link
                        to="/submit"
                        className="text-xs font-semibold underline-offset-4 hover:underline"
                        style={{ color: "#14452F" }}
                      >
                        Start submission →
                      </Link>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div
                    className="p-4 rounded-[10px] bg-white flex flex-col justify-between hover-card"
                    style={{ border: "1px solid #EAE5DC" }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0"
                        style={{
                          border: "1px solid #D1D5DB",
                          color: "#6B7280",
                          backgroundColor: "#F7F5F0",
                        }}
                      >
                        2
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 leading-tight">
                          ACVA review
                        </h4>
                        <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                          Accredited verification agency validates metrics and confirms baseline.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2">
                      <span className="text-xs text-stone-500 font-medium">
                        Verification in progress
                      </span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div
                    className="p-4 rounded-[10px] bg-white flex flex-col justify-between hover-card"
                    style={{ border: "1px solid #EAE5DC" }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0"
                        style={{
                          border: "1px solid #D1D5DB",
                          color: "#6B7280",
                          backgroundColor: "#F7F5F0",
                        }}
                      >
                        3
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 leading-tight">
                          List and sell
                        </h4>
                        <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                          Set asking price per tCO₂e, deposit units into simulated ledger custody,
                          receive instant settlement funds.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2">
                      <Link
                        to="/marketplace"
                        className="text-xs font-semibold underline-offset-4 hover:underline"
                        style={{ color: "#14452F" }}
                      >
                        Explore marketplace →
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {!checklistVisible && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setChecklistVisible(true)}
                  className="text-xs underline-offset-4 hover:underline font-medium"
                  style={{ color: "#14452F" }}
                >
                  Show 3-step compliance checklist
                </button>
              </div>
            )}
          </>
        )}

        {/* ── FOOTER ── */}
        <footer
          className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500"
          style={{ borderTop: "1px solid #EAE5DC" }}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">CarbonChain Seller Portal</span>
            <span>:</span>
            <span>Prototype with sample data. Ledger is simulated.</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link
              to="/about"
              className="transition-colors underline-offset-4 hover:underline"
              style={{ color: "#14452F" }}
            >
              Documentation
            </Link>
          </div>
        </footer>
      </div>

      {/* ── EDIT PRICE MODAL ── */}
      {editingCredit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div
            className="rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #EAE5DC" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">Edit Asking Price</h3>
              <ActionTooltip label="Close modal">
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={() => setEditingCredit(null)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </ActionTooltip>
            </div>

            <p className="text-xs text-stone-600">
              Update unit asking price for <strong>{editingCredit.project?.name}</strong>.
            </p>

            {editError && (
              <div
                className="p-2 text-xs rounded"
                style={{
                  backgroundColor: "#FDECEC",
                  color: "#A12A2A",
                  border: "1px solid #FECACA",
                }}
              >
                {editError}
              </div>
            )}

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Asking Price (INR per tonne)
                </label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="10"
                  value={editPriceInput}
                  onChange={(e) => setEditPriceInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded focus:outline-none"
                  style={{ outlineColor: "#14452F" }}
                  required
                />
              </div>

              <div
                className="flex justify-end gap-2 pt-2"
                style={{ borderTop: "1px solid #EAE5DC" }}
              >
                <button
                  type="button"
                  onClick={() => setEditingCredit(null)}
                  className="px-3 py-1.5 rounded border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  style={{
                    border: "1px solid #14452F",
                    color: "#14452F",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  {editLoading ? "Updating..." : "Save price"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUYER DASHBOARD (Preserved for non-seller roles)
// ─────────────────────────────────────────────────────────────────────────────
function BuyerDashboard({ user }) {
  const credits = getAllCredits();
  const purchases = getPurchasesHistory();
  const myPurchases = purchases.filter(
    (p) => p.buyerUserId === user.id || p.buyerWallet === user.walletAddress
  );
  const totalRetired = myPurchases.reduce((s, p) => s + (p.quantityRetired || 0), 0);

  return (
    <div className="w-full max-w-[1440px] mx-auto p-8 space-y-6">
      <div
        className="flex items-center justify-between pb-4"
        style={{ borderBottom: "1px solid #EAE5DC" }}
      >
        <div>
          <span
            className="text-xs font-mono uppercase tracking-wider block mb-1 font-semibold"
            style={{ color: "#14452F" }}
          >
            Buyer Overview
          </span>
          <h1 className="text-2xl font-bold text-stone-900">Welcome back, {user.name}</h1>
          <p className="text-xs text-stone-500 mt-1">{user.organisation}</p>
        </div>
        <Link
          to="/marketplace"
          className="px-4 py-2 rounded text-xs font-semibold transition-colors"
          style={{ border: "1px solid #14452F", color: "#14452F" }}
        >
          Explore Marketplace →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          className="p-5 rounded-lg shadow-sm hover-card"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #EAE5DC" }}
        >
          <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold block mb-2">
            Credits Owned
          </span>
          <div className="text-2xl font-bold text-stone-900">
            {myPurchases
              .reduce((s, p) => s + (p.amount || p.quantity || 0), 0)
              .toLocaleString("en-IN")}
          </div>
          <span className="text-xs text-stone-400 mt-1 block">tCO₂e settled</span>
        </div>

        <div
          className="p-5 rounded-lg shadow-sm hover-card"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #EAE5DC" }}
        >
          <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold block mb-2">
            Retirements
          </span>
          <div className="text-2xl font-bold text-stone-900">
            {totalRetired.toLocaleString("en-IN")}
          </div>
          <span className="text-xs text-stone-400 mt-1 block">tCO₂e permanently retired</span>
        </div>

        <div
          className="p-5 rounded-lg shadow-sm hover-card"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #EAE5DC" }}
        >
          <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold block mb-2">
            Marketplace Listings
          </span>
          <div className="text-2xl font-bold text-stone-900">
            {credits.filter((c) => c.listed && !c.retired).length}
          </div>
          <span className="text-xs text-stone-400 mt-1 block">Active credit batches</span>
        </div>
      </div>
    </div>
  );
}
