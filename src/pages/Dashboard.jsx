import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  Layers,
  Leaf,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Database,
  X,
  Shield,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { useWalletLedgerStats, usePlatformStats } from "../hooks/useLedger";
import { USE_DEMO_LEDGER } from "../config/contract";
import { canSell, canBuy } from "../services/roleService";

const ACTION_LABELS = {
  PROJECT_SUBMITTED: "Project submitted",
  PROJECT_APPROVED: "Project approved by VVB",
  PROJECT_REJECTED: "Project rejected",
  CREDIT_MINTED: "MCU minted",
  CREDIT_LISTED: "MCU listed on marketplace",
  CREDIT_DELISTED: "Listing cancelled",
  CREDIT_PURCHASED: "MCU purchased",
  CREDIT_RETIRED: "MCU retired (permanent)",
  GENESIS: "Ledger initialised",
};

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const { account, isVerifier, isDemoMode, openWalletModal, hasSkippedWallet } = useWallet();
  const { stats, loading, refetch } = useWalletLedgerStats(account);
  const { stats: platformStats } = usePlatformStats();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState(null);

  const isSeller = canSell(user);
  const isBuyer = canBuy(user);

  React.useEffect(() => {
    document.title = "Dashboard | CarbonChain";

    // Handle redirect message from route guards per Patch P1 spec §2
    const msg = location.state?.message || new URLSearchParams(location.search).get("message");
    if (msg) {
      setRedirectNotice(msg);
    }
  }, [location]);

  // Show wallet connect modal over dashboard if not connected in this session and not skipped
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const forceConnect = searchParams.get("connect") === "true";

    if (user && !account && (!hasSkippedWallet || forceConnect)) {
      openWalletModal();
    }
  }, [user, account, hasSkippedWallet, location.search, openWalletModal]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-charcoal mb-3">Please sign in</h1>
        <Link to="/login" className="btn-outline">Sign in &rarr;</Link>
      </div>
    );
  }

  const hasWallet = Boolean(account);

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Capability Guard Redirect Banner per Patch P1 spec §2 */}
      {redirectNotice && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-medium leading-relaxed">{redirectNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setRedirectNotice(null)}
            className="p-1 text-amber-700 hover:text-amber-950 rounded transition-colors cursor-pointer shrink-0 ml-3"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Slim dismissible banner when wallet connection is skipped */}
      {!account && hasSkippedWallet && !bannerDismissed && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-[#14532D]/30 bg-[#F4F7F3] text-xs text-[#0F2A1D] shadow-2xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#14532D] flex-shrink-0" />
            <span className="font-medium">Connect a wallet to buy, sell or retire credits</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openWalletModal()}
              className="px-3 py-1 rounded-md border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 font-semibold text-xs transition-colors cursor-pointer"
            >
              Connect wallet
            </button>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-forest block mb-1">
            Enterprise Dashboard
          </span>
          <h1 className="text-2xl font-semibold text-charcoal">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-charcoal-muted mt-0.5">{user.organisation}</p>
        </div>
        <div className="flex items-center gap-2">
          {isVerifier && (
            <Link to="/verifier" className="btn-outline-sm flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verifier Queue
            </Link>
          )}
          <button onClick={refetch} className="btn-neutral-outline text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats grid per Patch P1 spec §2: display only sections account has */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isSeller && (
          <StatCard
            icon={<FileText className="w-4 h-4 text-charcoal-subtle" />}
            label="Projects Submitted"
            value={loading ? "--" : stats?.submittedProjectsCount ?? 0}
            link="/my-projects"
          />
        )}
        {isBuyer && (
          <StatCard
            icon={<Layers className="w-4 h-4 text-charcoal-subtle" />}
            label="Credits Owned"
            value={loading ? "--" : stats?.ownedCreditsCount ?? 0}
            link="/my-credits"
          />
        )}
        {isSeller && (
          <StatCard
            icon={<ShoppingBag className="w-4 h-4 text-charcoal-subtle" />}
            label="Active Listings"
            value={loading ? "--" : stats?.listedCreditsCount ?? 0}
            link="/my-projects"
          />
        )}
        {isBuyer && (
          <StatCard
            icon={<Leaf className="w-4 h-4 text-charcoal-subtle" />}
            label="tCO2e Retired"
            value={loading ? "--" : (stats?.retiredTonnes ?? 0).toLocaleString("en-IN")}
            link="/impact"
          />
        )}
      </div>

      {/* Quick actions per Patch P1 spec §2: display only enabled capability actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {isSeller && (
          <QuickAction
            to="/submit"
            icon={<FileText className="w-5 h-5 text-forest" />}
            title="Submit Project"
            desc="Register a new emission reduction project for VVB review"
          />
        )}
        {isBuyer && (
          <QuickAction
            to="/marketplace"
            icon={<ShoppingBag className="w-5 h-5 text-forest" />}
            title="Buy Credits"
            desc="Browse listed MCUs and offset your carbon footprint"
          />
        )}
        {isBuyer && (
          <QuickAction
            to="/impact"
            icon={<TrendingUp className="w-5 h-5 text-forest" />}
            title="Environmental Impact"
            desc="View your total retirements and impact certificates"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="clean-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-charcoal">Recent Activity</h2>
            {hasWallet && (
              <Link to="/my-credits" className="text-xs btn-text">View all &rarr;</Link>
            )}
          </div>

          {!hasWallet ? (
            <div className="text-center py-8 text-xs text-charcoal-muted">
              Set up your wallet to see activity
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : stats?.recentActivity?.length > 0 ? (
            <ol className="space-y-3">
              {stats.recentActivity.slice(0, 8).map((block, i) => (
                <li key={i} className="flex items-start gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-forest mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-charcoal font-medium">{ACTION_LABELS[block.action] || block.action}</div>
                    {block.payload?.creditId && (
                      <div className="font-mono text-[11px] text-charcoal-muted">{block.payload.creditId}</div>
                    )}
                    <div className="text-[11px] text-charcoal-subtle flex items-center gap-1">
                      {new Date(block.timestamp).toLocaleDateString("en-IN")}
                      <span className="mx-1">·</span>
                      <Link to={`/ledger/${block.index}`} className="text-forest underline hover:text-forest-hover">
                        Block #{block.index}
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-center py-8 text-xs text-charcoal-muted">
              No activity yet. Submit a project or buy a credit to get started.
            </div>
          )}
        </div>

        {/* Platform stats + my projects */}
        <div className="space-y-4">
          {/* Platform stats */}
          <div className="clean-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-charcoal-subtle" />
              <h2 className="text-sm font-semibold text-charcoal">Platform Overview</h2>
            </div>
            {platformStats && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <PlatformStat label="Projects" value={platformStats.projectCount} />
                <PlatformStat label="Approved" value={platformStats.approvedProjects} />
                <PlatformStat label="MCUs Issued" value={platformStats.creditCount} />
                <PlatformStat label="Listed" value={platformStats.listedCredits} />
                <PlatformStat label="Retired" value={platformStats.retiredCount} />
                <PlatformStat label="tCO2e Retired" value={platformStats.retiredTonnes.toLocaleString("en-IN")} />
              </div>
            )}
            <div className="mt-3 text-[11px] text-charcoal-subtle">
              Ledger: {platformStats?.blockCount ?? 0} blocks
            </div>
          </div>

          {/* My projects quick view (sellers only per Patch P1 spec §2) */}
          {isSeller && hasWallet && stats?.myProjects?.length > 0 && (
            <div className="clean-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-charcoal">My Projects</h2>
                <Link to="/my-projects" className="text-xs btn-text">All &rarr;</Link>
              </div>
              <div className="space-y-2">
                {stats.myProjects.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="text-charcoal truncate flex-1 mr-2">{p.name}</span>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, link }) {
  return (
    <Link to={link} className="clean-card p-4 hover:border-forest/30 transition-colors block">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[11px] uppercase tracking-wider text-charcoal-subtle font-medium">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-charcoal">{value}</div>
    </Link>
  );
}

function QuickAction({ to, icon, title, desc }) {
  return (
    <Link to={to} className="clean-card p-4 hover:border-forest/40 transition-colors flex items-start gap-3">
      <div className="w-8 h-8 rounded border border-forest/20 bg-forest-light flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-charcoal">{title}</div>
        <div className="text-xs text-charcoal-muted mt-0.5 leading-snug">{desc}</div>
      </div>
    </Link>
  );
}

function PlatformStat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-charcoal-subtle">{label}</span>
      <span className="text-sm font-semibold text-charcoal">{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes = {
    Pending: "badge-pending",
    Approved: "badge-approved",
    Rejected: "badge-rejected",
  };
  return <span className={classes[status] || "badge-pending"}>{status}</span>;
}
