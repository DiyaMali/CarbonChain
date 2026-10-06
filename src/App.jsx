import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import { isVerifierUser, canSell, canBuy } from "./services/roleService";
import PlaceholderBanner from "./components/PlaceholderBanner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import EnterpriseLayout from "./components/EnterpriseLayout";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ConnectWallet from "./pages/ConnectWallet";
import SubmitProject from "./pages/SubmitProject";
import MyProjects from "./pages/MyProjects";
import VerifierDashboard from "./pages/VerifierDashboard";
import VerifierRetirements from "./pages/VerifierRetirements";
import VerifierHistory from "./pages/VerifierHistory";
import VerifierLedger from "./pages/VerifierLedger";
import Marketplace from "./pages/Marketplace";
import CreditDetail from "./pages/CreditDetail";
import MyCredits from "./pages/MyCredits";
import RetireCredit from "./pages/RetireCredit";
import Certificate from "./pages/Certificate";
import Impact from "./pages/Impact";
import Admin from "./pages/Admin";
import LedgerBlock from "./pages/LedgerBlock";
import PublicVerify from "./pages/PublicVerify";
import ProjectDetail from "./pages/ProjectDetail";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import { ToastProvider } from "./context/ToastContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// ── Route-guard wrappers ─────────────────────────────────────────────────────

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireSell({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (isVerifierUser(user)) return <Navigate to="/verifier/queue" replace />;
  if (!canSell(user)) {
    return (
      <Navigate
        to="/dashboard"
        state={{
          message: "Your account is set up to buy and retire credits. Selling is not enabled for this account.",
        }}
        replace
      />
    );
  }
  return children;
}

function RequireBuy({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (isVerifierUser(user)) return <Navigate to="/verifier/queue" replace />;
  if (!canBuy(user)) {
    return (
      <Navigate
        to="/dashboard"
        state={{
          message: "Your account is set up to create and sell credits. Buying is not enabled for this account.",
        }}
        replace
      />
    );
  }
  return children;
}

function RequireVerifier({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isVerifierUser(user)) {
    return (
      <Navigate
        to="/dashboard"
        state={{
          message: "The verifier section is restricted to authorized verification authorities.",
        }}
        replace
      />
    );
  }
  return children;
}

function BlockedPage({ reason }) {
  const navigate = useNavigate();
  const messages = {
    sell: "Project submission is for selling accounts. Your account is registered for buying only.",
    buy:  "Buying credits is for buying accounts. Your account is registered for selling only.",
    verifier: "This section is for verifiers only.",
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="max-w-md">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Access not permitted</h1>
        <p className="text-sm text-gray-600 mb-6">{messages[reason]}</p>
        <button
          onClick={() => navigate(-1)}
          className="btn-outline text-sm"
        >
          Go back
        </button>
      </div>
    </div>
  );
}

// ── Pages that use the full sidebar enterprise layout ──────────────────────────
const ENTERPRISE_PREFIXES = [
  "/dashboard",
  "/marketplace",
  "/my-projects",
  "/my-credits",
  "/transactions",
  "/ledger",
  "/impact",
  "/submit",
  "/verifier",
  "/admin",
  "/profile",
  "/notifications",
  "/projects/",
  "/credit/",
  "/retire/",
  "/certificate/",
];

function AppRoutes() {
  const location = useLocation();
  const path = location.pathname;

  const isEnterprise = ENTERPRISE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix)
  );

  if (isEnterprise) {
    return (
      <EnterpriseLayout>
        <Routes>
          {/* ── Public / shared routes in EnterpriseLayout ── */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/credit/:tokenId" element={<CreditDetail />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/certificate/:tokenId" element={<Certificate />} />
          <Route path="/ledger/:blockIndex" element={<LedgerBlock />} />

          {/* ── Authenticated shared routes ── */}
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/transactions" element={<RequireAuth><Transactions /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
          <Route path="/ledger" element={<RequireAuth><Transactions /></RequireAuth>} />

          {/* ── Sell-only routes ── */}
          <Route path="/submit" element={<RequireSell><SubmitProject /></RequireSell>} />
          <Route path="/my-projects" element={<RequireSell><MyProjects /></RequireSell>} />

          {/* ── Buy-only routes ── */}
          <Route path="/my-credits" element={<RequireBuy><MyCredits /></RequireBuy>} />
          <Route path="/impact" element={<RequireBuy><Impact /></RequireBuy>} />
          <Route path="/retire/:tokenId" element={<RequireBuy><RetireCredit /></RequireBuy>} />

          {/* ── Verifier-only routes ── */}
          <Route path="/verifier" element={<RequireVerifier><VerifierDashboard /></RequireVerifier>} />
          <Route path="/verifier/queue" element={<RequireVerifier><VerifierDashboard /></RequireVerifier>} />
          <Route path="/verifier/retirements" element={<RequireVerifier><VerifierRetirements /></RequireVerifier>} />
          <Route path="/verifier/history" element={<RequireVerifier><VerifierHistory /></RequireVerifier>} />
          <Route path="/verifier/ledger" element={<RequireVerifier><VerifierLedger /></RequireVerifier>} />
        </Routes>
      </EnterpriseLayout>
    );
  }

  // Auth pages
  const isAuthPage = path === "/login" || path === "/signup" || path === "/auth";
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth" element={<Login />} />
      </Routes>
    );
  }

  // Public pages
  return (
    <div className="h-screen flex flex-col bg-white overflow-y-auto">
      <PlaceholderBanner />
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/connect-wallet" element={<ConnectWallet />} />
          <Route path="/verify/:tokenId" element={<PublicVerify />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
