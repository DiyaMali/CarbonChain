import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Copy,
  Check,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Wallet,
  LayoutDashboard,
  Store,
  FolderKanban,
  Coins,
  ArrowLeftRight,
  TrendingUp,
  RefreshCw,
  Bell,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { shortenAddress } from "../lib/format";
import { USE_DEMO_LEDGER } from "../config/contract";
import { resetDemoData } from "../services/ledgerService";
import { isVerifierUser, canSell, canBuy } from "../services/roleService";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, walletSession, openWalletModal, disconnectWallet } = useWallet();
  const { user, logout } = useAuth();

  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [resettingWorkspace, setResettingWorkspace] = useState(false);
  const profileDropdownRef = useRef(null);
  const walletDropdownRef = useRef(null);

  const handleCopyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    disconnectWallet();
    logout();
    setProfileDropdownOpen(false);
    navigate("/login");
  };

  const handleResetWorkspace = async () => {
    if (!window.confirm("Reset workspace data to the initial seed state? This cannot be undone.")) return;
    setResettingWorkspace(true);
    setProfileDropdownOpen(false);
    await resetDemoData();
    setResettingWorkspace(false);
    window.location.reload();
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target)) {
        setWalletDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  // Role-aware nav items for the public navbar
  const isVerifier = isVerifierUser(user);
  const isSeller = canSell(user);
  const isBuyer = canBuy(user);

  const navItems = user
    ? isVerifier
      ? [
          { to: "/verifier/queue", label: "Review Queue" },
          { to: "/verifier/retirements", label: "Retirement Requests" },
          { to: "/verifier/ledger", label: "Ledger" },
          { to: "/notifications", label: "Notifications" },
        ]
      : [
          { to: "/dashboard", label: "Dashboard" },
          ...(isSeller ? [{ to: "/my-projects", label: "My Projects" }] : []),
          ...(isBuyer ? [{ to: "/marketplace", label: "Marketplace" }] : []),
          { to: "/transactions", label: "Transactions" },
          { to: "/notifications", label: "Notifications" },
        ]
    : [
        { to: "/", label: "Home" },
        { to: "/marketplace", label: "Marketplace" },
      ];

  return (
    <header className="fixed top-3 sm:top-5 inset-x-0 z-50 flex flex-col items-center px-3 sm:px-6 pointer-events-none no-print">
      <div className="pointer-events-auto w-full max-w-[1536px] transition-all duration-300">
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#1F5C3F]/25 flex items-center justify-center bg-white shadow-sm group-hover:scale-105 group-hover:border-[#1F5C3F] transition-all duration-150">
                <img src="/logo.png" alt="CarbonChain" className="w-full h-full object-cover scale-110" />
              </div>
              <span
                className="text-2xl sm:text-3xl tracking-tight text-[#0F2A1D]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                CarbonChain
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-sm font-medium transition-colors hover:text-[#1F5C3F] ${
                    active ? "text-[#0F2A1D] font-bold" : "text-[#5F6F66]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: wallet + profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Wallet chip */}
            {account ? (
              <div className="relative" ref={walletDropdownRef}>
                <button
                  type="button"
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-stone-300 hover:border-[#14532D] bg-white transition-colors text-xs cursor-pointer"
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
                  <div className="absolute right-0 mt-1.5 w-44 bg-white border border-stone-200 rounded shadow-lg py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => { handleCopyAddress(); setWalletDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50 text-left transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                      <span>{copied ? "Copied" : "Copy address"}</span>
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
                className="px-3.5 py-1.5 rounded border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                Connect wallet
              </button>
            )}

            {/* Profile dropdown */}
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1 pl-2 pr-3 rounded-full border border-gray-200 hover:border-[#1F5C3F] bg-white transition-all shadow-sm hover:shadow"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1F5C3F] text-white text-xs font-semibold flex items-center justify-center">
                    {getInitials(user.name)}
                  </div>
                  <div className="text-left hidden xl:block">
                    <div className="text-sm font-semibold text-charcoal leading-tight truncate max-w-[120px]">
                      {user.name.split(" ")[0]}
                    </div>
                    <div className="text-xs text-forest font-medium">{user.role}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-charcoal-muted" />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-xl py-2 z-50 text-xs"
                    >
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <div className="font-semibold text-charcoal text-sm truncate">{user.name}</div>
                        <div className="text-charcoal-muted truncate mt-0.5">{user.email}</div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-forest-light text-forest font-medium text-[11px] border border-forest/20">
                            {isVerifier ? "Verification Authority" : user.role}
                          </span>
                        </div>
                        {account && (
                          <div className="mt-1.5 font-mono text-[10px] text-charcoal-subtle truncate">{account}</div>
                        )}
                      </div>

                      <div className="py-1">
                        {isVerifier ? (
                          <Link
                            to="/verifier/queue"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-charcoal hover:bg-forest-light hover:text-forest transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Review Queue</span>
                          </Link>
                        ) : (
                          <>
                            <Link to="/dashboard" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-charcoal hover:bg-forest-light hover:text-forest transition-colors">
                              <LayoutDashboard className="w-3.5 h-3.5" />
                              <span>Dashboard</span>
                            </Link>
                            {isBuyer && (
                              <Link to="/my-credits" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-charcoal hover:bg-forest-light hover:text-forest transition-colors">
                                <Coins className="w-3.5 h-3.5" />
                                <span>My Credits</span>
                              </Link>
                            )}
                            {isBuyer && (
                              <Link to="/impact" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-charcoal hover:bg-forest-light hover:text-forest transition-colors">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>Impact</span>
                              </Link>
                            )}
                          </>
                        )}
                      </div>

                      <div className="border-t border-gray-100 py-1">
                        {USE_DEMO_LEDGER && (
                          <button
                            onClick={handleResetWorkspace}
                            disabled={resettingWorkspace}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-amber-700 hover:bg-amber-50 transition-colors"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${resettingWorkspace ? "animate-spin" : ""}`} />
                            <span>{resettingWorkspace ? "Resetting..." : "Reset workspace data"}</span>
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="rounded-full border border-gray-300 hover:border-[#1F5C3F] px-4 py-2 text-sm font-medium text-charcoal hover:text-[#1F5C3F] transition-all"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full border border-[#1F5C3F] text-[#1F5C3F] px-5 py-2 text-sm font-medium hover:bg-[#1F5C3F] hover:text-white transition-all"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full border border-gray-200 text-charcoal hover:bg-white/80 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto mt-2 w-full max-w-[1536px] rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-4 space-y-3 md:hidden"
          >
            {user && (
              <div className="p-3 bg-cream/70 rounded-2xl border border-gray-200 text-xs mb-2">
                <div className="font-semibold text-charcoal">{user.name}</div>
                <div className="text-charcoal-muted text-[11px] truncate">{user.email}</div>
                <div className="text-forest font-medium mt-1">
                  {isVerifier ? "Verification Authority" : user.role}
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-1 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3.5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    isActive(item.to) ? "bg-[#1F5C3F] text-white" : "text-charcoal hover:bg-gray-100/70"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {!user ? (
              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 text-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-charcoal transition-all"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 text-center rounded-full border border-[#1F5C3F] text-[#1F5C3F] px-5 py-2 text-sm font-medium hover:bg-[#1F5C3F] hover:text-white transition-all"
                >
                  Get started
                </Link>
              </div>
            ) : (
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-1">
                {USE_DEMO_LEDGER && (
                  <button
                    onClick={handleResetWorkspace}
                    disabled={resettingWorkspace}
                    className="text-left text-xs text-amber-700 px-3 py-2 rounded-xl hover:bg-amber-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                    {resettingWorkspace ? "Resetting..." : "Reset workspace data"}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="text-left text-xs text-red-600 px-3 py-2 rounded-xl hover:bg-red-50"
                >
                  <LogOut className="w-3.5 h-3.5 inline mr-1" />
                  Sign out
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
