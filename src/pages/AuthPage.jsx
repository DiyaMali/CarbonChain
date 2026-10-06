import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, LogOut, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";

export default function AuthPage({ initialMode = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, quickSignIn, user, logout } = useAuth();
  const { connectWallet } = useWallet();

  // Mode: "login" or "signup"
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Sign Up form state - clean and un-prefilled
  const [signupOrgName, setSignupOrgName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [canCreateSell, setCanCreateSell] = useState(true);
  const [canBuyRetire, setCanBuyRetire] = useState(true);
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const loginInputRef = useRef(null);
  const signupInputRef = useRef(null);

  useEffect(() => {
    document.title = mode === "signup" ? "Create Account | CarbonChain" : "Sign In | CarbonChain";
  }, [mode]);

  useEffect(() => {
    if (location.pathname === "/signup" || location.hash === "#signup") {
      setMode("signup");
    } else if (location.pathname === "/login" || location.hash === "#login") {
      setMode("login");
    }
  }, [location.pathname, location.hash]);

  // Route according to user role
  const routeUserByRole = (targetUser) => {
    if (targetUser?.isVerifier) {
      navigate("/verifier/queue");
    } else {
      navigate("/dashboard");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }

    try {
      setLoginLoading(true);
      const authenticatedUser = await login(loginEmail, loginPassword, rememberMe);
      await routeUserByRole(authenticatedUser);
    } catch (err) {
      setLoginError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");

    if (!signupOrgName.trim()) {
      setSignupError("Please enter your organization or individual name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      setSignupError("Please enter a valid email address.");
      return;
    }

    if (signupPassword.length < 8) {
      setSignupError("Password must be at least 8 characters long.");
      return;
    }

    if (!canCreateSell && !canBuyRetire) {
      setSignupError("Please select at least one capability for your account.");
      return;
    }

    const capabilities = [];
    if (canCreateSell) capabilities.push("create_sell");
    if (canBuyRetire) capabilities.push("buy_retire");

    try {
      setSignupLoading(true);
      const newUser = await signup({
        name: signupOrgName,
        organisation: signupOrgName,
        email: signupEmail,
        password: signupPassword,
        capabilities,
        rememberMe: true,
      });

      // Normal organizations route directly to Organization Dashboard
      await routeUserByRole(newUser);
    } catch (err) {
      setSignupError(err.message || "Failed to create account. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  // Quick sign in — directly signs in as one of the three seeded accounts
  const handleQuickSignIn = (role) => {
    setLoginError("");
    try {
      const targetUser = quickSignIn(role);
      routeUserByRole(targetUser);
    } catch (err) {
      setLoginError(err.message || "Quick sign in failed.");
    }
  };

  const switchToSignup = (e) => {
    if (e) e.preventDefault();
    setMode("signup");
    setSignupError("");
    setTimeout(() => {
      if (signupInputRef.current) signupInputRef.current.focus();
    }, 50);
  };

  const switchToLogin = (e) => {
    if (e) e.preventDefault();
    setMode("login");
    setLoginError("");
    setTimeout(() => {
      if (loginInputRef.current) loginInputRef.current.focus();
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#f3f6f3] text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* ── Top Brand Bar ── */}
      <header className="w-full max-w-xl mx-auto mb-6 flex items-center justify-between" data-purpose="page-header">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#14532D] flex items-center justify-center text-white shadow-sm group-hover:bg-[#0f3f22] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#14532D]">CarbonChain</span>
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 bg-[#dcfce7] text-[#14532D] rounded-full border border-emerald-200">
          Ecological Ledger v2.4
        </span>
      </header>

      {/* ── Centered Main Content ── */}
      <main className="w-full max-w-xl mx-auto flex-grow flex flex-col justify-center">
        {/* Outer Frame */}
        <div className="bg-white/70 backdrop-blur-sm border border-emerald-900/10 rounded-2xl p-5 sm:p-7 shadow-sm" data-purpose="auth-outer-frame">
          {/* Header row with Title and Mode Switcher */}
          <div className="mb-5 pb-3 border-b border-emerald-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-[#14532D] flex items-center gap-2">
              <span className="text-emerald-700">2.</span>
              <span>{mode === "signup" ? "Sign Up" : "Login"}</span>
              <span className="font-normal text-emerald-800 text-sm">(Unified Account)</span>
            </h1>

            {/* Mode Segmented Switch Buttons */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={switchToLogin}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === "login"
                    ? "bg-white text-[#14532D] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
              <button
                type="button"
                onClick={switchToSignup}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === "signup"
                    ? "bg-white text-[#14532D] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          </div>

          {/* Active session warning if logged in */}
          {user && (
            <div className="mb-4 flex items-center justify-between gap-2 text-xs bg-emerald-50 text-emerald-900 px-3 py-2 rounded-lg border border-emerald-200">
              <span className="truncate">
                Signed in as: <strong className="font-semibold">{user.name}</strong> ({user.role})
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => routeUserByRole(user)}
                  className="font-bold underline text-emerald-800 hover:text-emerald-950 cursor-pointer"
                >
                  Dashboard &rarr;
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="text-red-600 hover:text-red-800 inline-flex items-center gap-0.5 cursor-pointer ml-1"
                  title="Sign out of current account"
                >
                  <LogOut className="w-3 h-3" />
                  Sign out
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── CENTERED LOGIN CARD ── */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {mode === "login" && (
            <section
              aria-labelledby="login-heading"
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between"
              data-purpose="login-form-card"
            >
              <div>
                {/* Login Header */}
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-[#14532D] tracking-tight" id="login-heading">
                    Login
                  </h2>
                  <p className="text-sm font-semibold text-slate-900 mt-1">Welcome back!</p>
                  <p className="text-xs text-slate-500 mt-0.5">Sign in to your CarbonChain account</p>
                </div>

                {/* Error Banner */}
                {loginError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">{loginError}</div>
                  </div>
                )}

                {/* Demo Quick Select (Easy switching between Normal Org and Mira Verifier) */}
                <div className="mb-4 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs">
                  <div className="text-[11px] font-semibold text-emerald-950 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>⚡ Quick Demo Credentials</span>
                    <span className="text-[10px] text-emerald-700 font-normal">Click to fill</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => fillDemoAccount("mira")}
                      className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100/70 text-[#14532D] border border-emerald-300/80 font-medium text-[11px] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                      title="Mira Iyer - Authorized Verifier"
                    >
                      <span>🛡️ Mira</span>
                      <span className="text-[10px] px-1 bg-amber-100 text-amber-800 rounded font-semibold">Verifier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoAccount("rajesh")}
                      className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100/70 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                      title="Rajesh Sharma - Project Owner (IPP)"
                    >
                      <span>🌿 Rajesh</span>
                      <span className="text-[10px] px-1 bg-emerald-100 text-emerald-800 rounded font-semibold">Org / IPP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoAccount("kiran")}
                      className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100/70 text-slate-700 border border-slate-300 font-medium text-[11px] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                      title="Kiran Mehta - Buyer (TO)"
                    >
                      <span>🏢 Kiran</span>
                      <span className="text-[10px] px-1 bg-blue-100 text-blue-800 rounded font-semibold">Buyer</span>
                    </button>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4" data-purpose="login-form">
                  {/* Email Input Field */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="login-email">
                      Email address
                    </label>
                    <input
                      ref={loginInputRef}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#14532D] focus:border-[#14532D] transition-colors placeholder:text-slate-400 text-slate-800 bg-white"
                      id="login-email"
                      name="email"
                      placeholder="you@company.com"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (loginError) setLoginError("");
                      }}
                      required
                    />
                  </div>

                  {/* Password Input Field with toggle icon */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="login-password">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 pr-10 focus:outline-none focus:ring-2 focus:ring-[#14532D] focus:border-[#14532D] transition-colors placeholder:text-slate-400 tracking-wider text-slate-800 bg-white"
                        id="login-password"
                        name="password"
                        placeholder="••••••••"
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginError) setLoginError("");
                        }}
                        required
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Checkbox: Remember me */}
                  <div className="flex items-center pt-0.5">
                    <input
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-[#14532D] focus:ring-[#166534] border-slate-300 rounded cursor-pointer accent-[#14532D]"
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                    />
                    <label className="ml-2 block text-xs font-medium text-slate-700 cursor-pointer" htmlFor="remember-me">
                      Remember me
                    </label>
                  </div>

                  {/* Login CTA Button */}
                  <div className="pt-2">
                    <button
                      className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-[#14532D] hover:bg-[#0f3f22] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#14532D] transition-all duration-150 disabled:opacity-60 cursor-pointer"
                      type="submit"
                      disabled={loginLoading}
                    >
                      {loginLoading ? "Authenticating..." : "Login"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom Sign Up Callout & Button for New Users */}
              <div className="mt-6 pt-4 border-t border-slate-200/80 text-center">
                <p className="text-xs text-slate-600 mb-2.5">
                  New to CarbonChain? Create your organization account:
                </p>
                <button
                  type="button"
                  onClick={switchToSignup}
                  className="w-full py-2 px-4 rounded-lg border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up / Create Account</span>
                </button>
              </div>
            </section>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── CENTERED SIGN UP CARD ── */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {mode === "signup" && (
            <section
              aria-labelledby="signup-heading"
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between"
              data-purpose="signup-form-card"
            >
              <div>
                {/* Sign Up Header */}
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-[#14532D] tracking-tight" id="signup-heading">
                    Sign Up
                  </h2>
                  <p className="text-sm font-semibold text-slate-900 mt-1">Join CarbonChain</p>
                  <p className="text-xs text-slate-500 mt-0.5">Create your organization or individual account</p>
                </div>

                {/* Error Banner */}
                {signupError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">{signupError}</div>
                  </div>
                )}

                {/* Sign Up Form */}
                <form onSubmit={handleSignupSubmit} className="space-y-3.5" data-purpose="signup-form">
                  {/* Organization / Name Field (empty, not auto-filled with temporary names) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="org-name">
                      Organization / Individual Name
                    </label>
                    <input
                      ref={signupInputRef}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#14532D] focus:border-[#14532D] text-slate-800 transition-colors placeholder:text-slate-400 bg-white"
                      id="org-name"
                      name="org_name"
                      type="text"
                      placeholder="e.g. Tata Cleantech or Tata Industries"
                      value={signupOrgName}
                      onChange={(e) => {
                        setSignupOrgName(e.target.value);
                        if (signupError) setSignupError("");
                      }}
                      required
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="signup-email">
                      Email address
                    </label>
                    <input
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#14532D] focus:border-[#14532D] transition-colors placeholder:text-slate-400 text-slate-800 bg-white"
                      id="signup-email"
                      name="email"
                      placeholder="you@company.com"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value);
                        if (signupError) setSignupError("");
                      }}
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="signup-password">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 pr-10 focus:outline-none focus:ring-2 focus:ring-[#14532D] focus:border-[#14532D] transition-colors placeholder:text-slate-400 tracking-wider text-slate-800 bg-white"
                        id="signup-password"
                        name="password"
                        placeholder="••••••••"
                        type={showSignupPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={(e) => {
                          setSignupPassword(e.target.value);
                          if (signupError) setSignupError("");
                        }}
                        required
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Account Type & Capabilities Section */}
                  <div className="pt-1.5" data-purpose="capabilities-selection">
                    <p className="text-xs font-bold text-[#14532D] mb-0.5">Account Type &amp; Capabilities</p>
                    <p className="text-xs text-slate-600 mb-2">I want to:</p>
                    <div className="space-y-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                      {/* Capability 1: Create & sell */}
                      <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                        <input
                          checked={canCreateSell}
                          onChange={(e) => setCanCreateSell(e.target.checked)}
                          className="h-4 w-4 text-[#14532D] focus:ring-[#166534] border-slate-300 rounded cursor-pointer accent-[#14532D]"
                          name="capability_sell"
                          type="checkbox"
                        />
                        <span className="text-xs font-medium text-slate-700">Create &amp; sell carbon credits</span>
                      </label>
                      {/* Capability 2: Buy & retire */}
                      <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                        <input
                          checked={canBuyRetire}
                          onChange={(e) => setCanBuyRetire(e.target.checked)}
                          className="h-4 w-4 text-[#14532D] focus:ring-[#166534] border-slate-300 rounded cursor-pointer accent-[#14532D]"
                          name="capability_retire"
                          type="checkbox"
                        />
                        <span className="text-xs font-medium text-slate-700">Buy &amp; retire carbon credits</span>
                      </label>
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                      <span>Single unified account: organizations can do both generation and retirement.</span>
                    </div>
                  </div>

                  {/* Sign Up CTA Button */}
                  <div className="pt-2">
                    <button
                      className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-[#14532D] hover:bg-[#0f3f22] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#14532D] transition-all duration-150 disabled:opacity-60 cursor-pointer"
                      type="submit"
                      disabled={signupLoading}
                    >
                      {signupLoading ? "Creating account..." : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom Switch Helper Button */}
              <div className="mt-6 pt-4 border-t border-slate-200/80 text-center">
                <p className="text-xs text-slate-600 mb-2.5">
                  Already have an account?
                </p>
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="w-full py-2 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Return to Login</span>
                </button>
              </div>
            </section>
          )}

          {/* Quick sign in — spec §3.4 */}
          <div className="mt-5 pt-4 border-t border-slate-200/70">
            <p className="text-xs font-semibold text-slate-600 mb-2.5">Quick sign in</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleQuickSignIn("seller")}
                className="w-full text-left px-3 py-2 rounded border border-slate-300 hover:border-[#14532D] hover:bg-[#14532D]/5 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[#14532D]">Meridian Renewables Ltd</span>
                <span className="ml-2 text-slate-400 font-normal">Project Owner</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSignIn("buyer")}
                className="w-full text-left px-3 py-2 rounded border border-slate-300 hover:border-[#14532D] hover:bg-[#14532D]/5 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[#14532D]">Ironbridge Steel and Cement Ltd</span>
                <span className="ml-2 text-slate-400 font-normal">Buyer</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSignIn("verifier")}
                className="w-full text-left px-3 py-2 rounded border border-slate-300 hover:border-[#14532D] hover:bg-[#14532D]/5 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[#14532D]">Diya Mali, Verification Authority</span>
                <span className="ml-2 text-slate-400 font-normal">Verifier (VVB)</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Page Footer ── */}
      <footer className="w-full max-w-xl mx-auto mt-6 text-center text-xs text-slate-400 py-2">
        © 2024 CarbonChain Foundation. Standardized Carbon Credit Infrastructure.
      </footer>
    </div>
  );
}
