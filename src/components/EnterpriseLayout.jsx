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
  ReceiptText,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { shortenAddress } from "../utils/walletUtils";
import { isVerifierUser, canSell, canBuy } from "../services/roleService";
import { resetDemoData } from "../services/ledgerService";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from "../services/notificationService";

export default function EnterpriseLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, walletSession, openWalletModal, disconnectWallet, inrBalance, addDemoFunds } =
    useWallet();
  const { user, logout } = useAuth();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userNotifications, setUserNotifications] = useState([]);
  const walletDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  useEffect(() => {
    const loadNotifs = () => {
      if (user) {
        setUserNotifications(getUserNotifications(user));
      }
    };
    loadNotifs();

    window.addEventListener("cc_notification_added", loadNotifs);
    window.addEventListener("cc_notification_updated", loadNotifs);
    return () => {
      window.removeEventListener("cc_notification_added", loadNotifs);
      window.removeEventListener("cc_notification_updated", loadNotifs);
    };
  }, [user]);
  useEffect(() => {
    function handleClickOutside(event) {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target)) {
        setWalletDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
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
            {!user ? (
              <>
                <SidebarNavItem
                  to="/marketplace"
                  icon={<Store className="w-4 h-4" />}
                  label="Marketplace"
                  currentPath={location.pathname}
                />
                <SidebarNavItem
                  to="/login"
                  icon={<User className="w-4 h-4" />}
                  label="Sign In"
                  currentPath={location.pathname}
                />
              </>
            ) : isVerifier ? (
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
                    <SidebarNavItem
                      to="/transactions?tab=sales"
                      icon={<ReceiptText className="w-4 h-4" />}
                      label="Sales"
                      currentPath={location.pathname + location.search}
                      matchPrefix="/transactions?tab=sales"
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
                  currentPath={location.pathname + location.search}
                  matchPrefix={location.search.includes("tab=sales") ? null : "/transactions"}
                  altPrefix="/ledger"
                />
                <SidebarNavItem
                  to="/notifications"
                  icon={<Bell className="w-4 h-4" />}
                  label="Notifications"
                  currentPath={location.pathname}
                />
                <SidebarNavItem
                  to="/profile"
                  icon={<User className="w-4 h-4" />}
                  label="Profile"
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

          {/* Right: notifications bell + org name + sign out OR sign in / sign up */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Bell Dropdown */}
                <div className="relative" ref={notifDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="relative p-2 rounded-full hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                    title="Notifications"
                    aria-label="View notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {userNotifications.filter((n) => !n.read).length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white animate-pulse" />
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-lg shadow-xl py-2 z-50 text-xs animate-fade-in">
                      <div className="flex items-center justify-between px-3 pb-2 border-b border-stone-100">
                        <span className="font-semibold text-stone-900">Notifications</span>
                        <Link
                          to="/notifications"
                          onClick={() => setNotifDropdownOpen(false)}
                          className="text-[11px] text-[#14532D] hover:underline font-medium"
                        >
                          View all ({userNotifications.length})
                        </Link>
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                        {userNotifications.length === 0 ? (
                          <div className="py-6 text-center text-stone-400 text-xs">
                            No notifications
                          </div>
                        ) : (
                          userNotifications.slice(0, 5).map((n) => (
                            <div
                              key={n.id}
                              className={`p-3 transition-colors ${
                                n.read ? "bg-white" : "bg-emerald-50/30"
                              } hover:bg-stone-50`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-stone-900 text-xs line-clamp-1">
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono shrink-0">
                                  {new Date(n.timestamp).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              {n.link && (
                                <Link
                                  to={n.link}
                                  onClick={() => {
                                    markNotificationAsRead(n.id);
                                    setNotifDropdownOpen(false);
                                  }}
                                  className="text-[11px] text-[#14532D] hover:underline font-medium inline-block mt-1"
                                >
                                  View details &rarr;
                                </Link>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 px-3 border-t border-stone-100 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setNotifDropdownOpen(false)}
                          className="block py-1 text-xs text-[#14532D] font-semibold hover:underline"
                        >
                          Open notification center
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/profile" className="text-right hidden sm:block hover:opacity-80 transition-opacity">
                  <div className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[160px]">
                    {orgName}
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">{roleBadge}</div>
                </Link>
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
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0F3822] rounded hover:bg-[#133E26] transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
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
