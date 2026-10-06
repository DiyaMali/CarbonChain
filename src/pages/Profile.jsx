import React from "react";
import { Link } from "react-router-dom";
import {
  User,
  Building,
  Mail,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Layers,
  SendHorizonal
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { canSell, canBuy, isVerifierUser } from "../services/roleService";
import { shortenAddress } from "../utils/walletUtils";

export default function Profile() {
  const { user } = useAuth();
  const { account } = useWallet();
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    document.title = "Account Profile | CarbonChain";
  }, []);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-stone-900 mb-3">Please sign in</h1>
        <Link to="/login" className="btn-outline text-xs">
          Sign In
        </Link>
      </div>
    );
  }

  const isSeller = canSell(user);
  const isBuyer = canBuy(user);
  const isVerifier = isVerifierUser(user);

  const effectiveWallet = account || user.walletAddress || "0x0000000000000000000000000000000000000000";

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-[#14532D] block mb-1">
          Account Administration
        </span>
        <h1 className="text-2xl font-semibold text-stone-900">Organisation Profile</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Review your registered identity, deterministic wallet address, and assigned ledger capabilities.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="clean-card p-6 bg-white border border-stone-200 rounded-lg space-y-6 shadow-xs">
        {/* Identity Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#0F3822] text-white text-base font-bold flex items-center justify-center border border-emerald-700/40 shrink-0">
              {(user.organisation || user.name || "CC").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 leading-tight">
                {user.organisation || user.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-stone-500">{user.email}</span>
                <span className="text-stone-300">&bull;</span>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
          {isVerifier && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#005337] text-[#39ce94] text-xs font-mono font-bold tracking-wider uppercase border border-[#39ce94]/30 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>Verification Authority</span>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded border border-stone-100 bg-stone-50/60 space-y-1">
            <span className="text-stone-400 uppercase tracking-wider text-[10px] block font-mono">
              Organisation Name
            </span>
            <div className="font-semibold text-stone-900 text-sm">
              {user.organisation || user.name}
            </div>
          </div>

          <div className="p-3.5 rounded border border-stone-100 bg-stone-50/60 space-y-1">
            <span className="text-stone-400 uppercase tracking-wider text-[10px] block font-mono">
              Registered Contact
            </span>
            <div className="font-semibold text-stone-900 text-sm">
              {user.name}
            </div>
          </div>

          <div className="p-3.5 rounded border border-stone-100 bg-stone-50/60 space-y-1">
            <span className="text-stone-400 uppercase tracking-wider text-[10px] block font-mono">
              Email Address
            </span>
            <div className="font-semibold text-stone-900 text-sm font-mono">
              {user.email}
            </div>
          </div>

          <div className="p-3.5 rounded border border-stone-100 bg-stone-50/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 uppercase tracking-wider text-[10px] block font-mono">
                Assigned Wallet
              </span>
              <button
                type="button"
                onClick={() => handleCopy(effectiveWallet)}
                className="text-[11px] text-[#14532D] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-stone-800 break-all">
              {effectiveWallet}
            </div>
          </div>
        </div>

        {/* ── Capabilities (Read-Only per Patch P1 spec §2) ── */}
        <div className="pt-4 border-t border-stone-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Account Capabilities
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Capabilities are configured during account setup and are enforced across all routes and services.
              </p>
            </div>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
              Read-Only
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Sell Capability Card */}
            <div
              className={`p-4 rounded border transition-colors ${
                isSeller
                  ? "border-emerald-300 bg-emerald-50/40 text-emerald-950"
                  : "border-stone-200 bg-stone-50/50 text-stone-400"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SendHorizonal className={`w-4 h-4 ${isSeller ? "text-emerald-700" : "text-stone-400"}`} />
                    <span className="font-semibold text-xs text-stone-900">
                      Create and Sell Credits
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    Submit carbon reduction projects, manage listings, adjust pricing, and receive purchase settlements.
                  </p>
                </div>
                {isSeller ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-500 border border-stone-200 shrink-0">
                    <XCircle className="w-3 h-3 text-stone-400" />
                    Disabled
                  </span>
                )}
              </div>
            </div>

            {/* Buy Capability Card */}
            <div
              className={`p-4 rounded border transition-colors ${
                isBuyer
                  ? "border-emerald-300 bg-emerald-50/40 text-emerald-950"
                  : "border-stone-200 bg-stone-50/50 text-stone-400"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Layers className={`w-4 h-4 ${isBuyer ? "text-emerald-700" : "text-stone-400"}`} />
                    <span className="font-semibold text-xs text-stone-900">
                      Buy and Retire Credits
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">
                    Acquire carbon credits on the marketplace, hold inventory, submit retirement requests, and access official certificates.
                  </p>
                </div>
                {isBuyer ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-500 border border-stone-200 shrink-0">
                    <XCircle className="w-3 h-3 text-stone-400" />
                    Disabled
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>Member since {new Date(user.createdAt || Date.now()).toLocaleDateString("en-IN")}</span>
          <Link to="/dashboard" className="btn-neutral-outline text-xs px-3 py-1.5">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
