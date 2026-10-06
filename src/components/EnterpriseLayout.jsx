import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  Store,
  FolderKanban,
  Coins,
  ArrowLeftRight,
  TrendingUp,
  User,
  Check,
  Copy,
  RotateCcw,
  LogOut,
  ChevronDown,
  RefreshCw,
  Wallet,
  Bell,
  History,
  Database,
  SendHorizonal,
  Leaf,
  ClipboardList,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { shortenAddress } from "../utils/walletUtils";
import { isVerifierUser, canSell, canBuy } from "../services/roleService";
import { resetDemoData } from "../services/ledgerService";

export default function EnterpriseLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, walletSession, openWalletModal, disconnectWallet, inrBalance, addDemoFunds } =
    useWallet();
  const { user, logout } = useAuth();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const walletDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target)) {
        setWalletDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    disconnectWallet();
    logout();
    navigate("/login");
  };

  const handleResetWorkspace = async () => {
    if (
      !window.confirm(
        "Reset workspace data to the initial state?\n\nThis restores all seeded projects and clears any changes."
      )
    )
      return;
    setIsResetting(true);
    try {
      await resetDemoData();
      window.location.reload();
    } catch (err) {
      alert("Failed to reset: " + (err.message || err));
      setIsResetting(false);
    }
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const orgName = user?.organisation || user?.name || "Organisation";
  const isVerifier = isVerifierUser(user);
  const isSeller = canSell(user);
  const isBuyer = canBuy(user);

  // Role badge label
  const roleBadge = isVerifier
    ? "Verifier (VVB)"
    : isSeller && isBuyer
    ? "Sell + Buy"
    : isSeller
    ? "Project Owner"
    : isBuyer
    ? "Buyer"
    : "Account";

  return (
    <div className="min-h-screen h-screen bg-[#F8F9FA] flex text-[#181E1B] font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden">
      {/* ── LEFT DARK SIDEBAR ── */}
      <aside className="w-60 lg:w-64 bg-[#0A1F14] text-white flex-shrink-0 flex flex-col justify-between border-r border-[#143825] z-30 select-none">
        <div>
          {/* Top Logo */}
          <div className="px-5 py-5 border-b border-[#143825]/80">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-emerald-500/40 flex items-center justify-center shadow-sm group-hover:border-emerald-400 transition-colors">
                <img src="/logo.png" alt="CarbonChain" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-white leading-tight">
                  CarbonChain
                </span>
                <span className="text-[9px] font-mono tracking-widest text-emerald-400 font-medium uppercase">
                  ENTERPRISE LEDGER
                </span>
              </div>
            </Link>
          </div>

          {/* Organisation block */}
          <div className="px-5 py-4 border-b border-[#143825]/60 bg-[#07170E]/50">
            <div className="text-[9px] font-mono font-semibold uppercase tracking-wider text-[#6b9080] mb-1">
              ORGANISATION
            </div>
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-semibold text-white truncate">{orgName}</span>
              <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 flex-shrink-0">
                {roleBadge.toUpperCase()}
              </span>
            </div>
          </div>

          {/* ── Role-based navigation ── */}
          <nav className="p-3 space-y-0.5">
            {isVerifier ? (
              /* Verifier nav per spec §3.3 */
              <>
                <SidebarNavItem
                  to="/verifier/queue"
                  icon={<ClipboardList className="w-4 h-4" />}
                  label="Review Queue"
                  currentPath={location.pathname}
                  matchPrefix="/verifier/queue"
                  altPrefix="/verifier"
                />
                <SidebarNavItem
                  to="/verifier/retirements"
                  icon={<Leaf className="w-4 h-4" />}
                  label="Retirement Requests"
                  currentPath={location.pathname}
                />
                <SidebarNavItem
                  to="/verifier/history"
                  icon={<History className="w-4 h-4" />}
                  label="Review History"
                  currentPath={location.pathname}
                />
                <SidebarNavItem
                  to="/verifier/ledger"
                  icon={<Database className="w-4 h-4" />}
                  label="Ledger"
                  currentPath={location.pathname}
                />
                <SidebarNavItem
                  to="/notifications"
                  icon={<Bell className="w-4 h-4" />}
                  label="Notifications"
                  currentPath={location.pathname}
                />
              </>
            ) : (
              /* Seller / Buyer / Both nav per spec §3.3 */
              <>
                <SidebarNavItem
                  to="/dashboard"
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  label="Dashboard"
                  currentPath={location.pathname}
                />
                {isSeller && (
                  <>
                    <SidebarNavItem
                      to="/submit"
                      icon={<SendHorizonal className="w-4 h-4" />}
                      label="Submit Project"
                      currentPath={location.pathname}
                    />
                    <SidebarNavItem
                      to="/my-projects"
                      icon={<FolderKanban className="w-4 h-4" />}
                      label="My Projects"
                      currentPath={location.pathname}
                    />
                  </>
                )}
                {isBuyer && (
                  <>
                    <SidebarNavItem
                      to="/marketplace"
                      icon={<Store className="w-4 h-4" />}
                      label="Marketplace"
                      currentPath={location.pathname}
                    />
                    <SidebarNavItem
                      to="/my-credits"
                      icon={<Coins className="w-4 h-4" />}
                      label="My Credits"
                      currentPath={location.pathname}
                    />
                    <SidebarNavItem
                      to="/impact"
                      icon={<TrendingUp className="w-4 h-4" />}
                      label="Impact"
                      currentPath={location.pathname}
                    />
                  </>
                )}
                <SidebarNavItem
                  to="/transactions"
                  icon={<ArrowLeftRight className="w-4 h-4" />}
                  label="Transactions"
                  currentPath={location.pathname}
                  matchPrefix="/transactions"
                  altPrefix="/ledger"
                />
                <SidebarNavItem
                  to="/notifications"
                  icon={<Bell className="w-4 h-4" />}
                  label="Notifications"
                  currentPath={location.pathname}
                />
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#143825]/80 bg-[#07170E]/70 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-[#6b9080]">
            <span>PROTOCOL VERSION</span>
            <span className="text-emerald-400/80 font-bold">V3.0.0</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>CarbonChain Ledger Synced</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200/80 px-6 py-2.5 flex items-center justify-between shadow-xs flex-shrink-0">
          {/* Left: wallet chip + role badge */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {account ? (
              <div className="relative" ref={walletDropdownRef}>
                <button
                  type="button"
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded border border-stone-300 hover:border-[#14532D] bg-white transition-colors text-xs cursor-pointer"
                  title="Wallet options"
                >
                  <div className="w-5 h-5 rounded bg-[#14532D] text-white flex items-center justify-center font-bold text-[10px]">
                    {walletSession?.provider ? walletSession.provider[0].toUpperCase() : "M"}
                  </div>
                  <span className="font-mono text-xs font-semibold text-stone-800">
                    {shortenAddress(account)}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                </button>

                {walletDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-48 bg-white border border-stone-200 rounded shadow-lg py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => { copyAddress(account); setWalletDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50 text-left transition-colors cursor-pointer"
                    >
                      {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                      <span>{copiedAddress ? "Copied" : "Copy address"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setWalletDropdownOpen(false); openWalletModal(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50 text-left transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                      <span>Switch wallet</span>
                    </button>
                    <div className="border-t border-stone-100 my-0.5" />
                    <button
                      type="button"
                      onClick={() => { setWalletDropdownOpen(false); disconnectWallet(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 text-left transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openWalletModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect wallet</span>
              </button>
            )}

            {/* Verifier badge */}
            {isVerifier && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-[#005337] text-[#39ce94] text-[11px] font-mono font-bold tracking-wider uppercase border border-[#39ce94]/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verification Authority</span>
              </div>
            )}

            {/* Reset workspace button */}
            <button
              type="button"
              onClick={handleResetWorkspace}
              disabled={isResetting}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Reset workspace data to initial seed state"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-amber-700 ${isResetting ? "animate-spin" : ""}`} />
              <span>{isResetting ? "Resetting..." : "Reset workspace data"}</span>
            </button>
          </div>

          {/* Right: org name + sign out */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[160px]">
                {orgName}
              </div>
              <div className="text-[10px] text-gray-500 font-medium">{roleBadge}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#0F3822] text-white text-xs font-bold flex items-center justify-center border border-gray-200">
              {orgName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 text-xs font-medium border border-gray-200 hover:border-red-200 transition-colors cursor-pointer ml-1"
              title="Sign out of CarbonChain"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarNavItem({ to, icon, label, currentPath, matchPrefix, altPrefix }) {
  const isActive =
    (matchPrefix && currentPath.startsWith(matchPrefix)) ||
    (altPrefix && currentPath.startsWith(altPrefix)) ||
    currentPath === to;

  if (isActive) {
    return (
      <Link
        to={to}
        className="relative flex items-center justify-between px-3 py-2.5 rounded bg-[#133E26] text-white font-medium text-xs border border-emerald-500/20"
      >
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">{icon}</span>
          <span className="text-white font-medium">{label}</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2 rounded text-gray-400 hover:text-white hover:bg-[#133E26]/50 transition-colors text-xs font-medium"
    >
      <span className="text-gray-400">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
