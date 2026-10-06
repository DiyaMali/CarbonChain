import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Settings, 
  UserCheck, 
  UserX, 
  Percent, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { getReadOnlyContract, getWriteContract } from "../lib/contract";
import { runContractWrite } from "../lib/tx";
import { shortenAddress } from "../lib/format";
import { isContractConfigured, EXPLORER } from "../config/contract";
import TxStatusModal from "../components/TxStatusModal";

export default function Admin() {
  const walletContext = useWallet();
  const { account, isAdmin, connectWallet } = walletContext;

  const [feeBps, setFeeBps] = useState(0);
  const [feeRecipient, setFeeRecipient] = useState("");
  const [newFeeBps, setNewFeeBps] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [loading, setLoading] = useState(true);

  // Verifier management state
  const [verifierTargetAddress, setVerifierTargetAddress] = useState("");
  const [targetVerifierStatus, setTargetVerifierStatus] = useState(null);
  const [checkingTarget, setCheckingTarget] = useState(false);

  const [txState, setTxState] = useState({ status: "IDLE" });

  const configured = isContractConfigured();

  useEffect(() => {
    document.title = "Platform Administration | CarbonChain";
  }, []);

  const fetchAdminData = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const contract = await getReadOnlyContract();
      if (!contract) {
        setLoading(false);
        return;
      }

      const [rawFee, recipient] = await Promise.all([
        contract.feeBps().catch(() => 0n),
        contract.feeRecipient().catch(() => ethers.ZeroAddress),
      ]);

      const currentBps = Number(rawFee);
      setFeeBps(currentBps);
      setNewFeeBps(String(currentBps));
      setFeeRecipient(recipient);
      setNewRecipient(recipient);
    } catch (err) {
      console.warn("Could not fetch admin settings:", err.message);
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Check verifier status of target address
  const handleCheckTargetStatus = async () => {
    const cleanAddr = verifierTargetAddress.trim();
    if (!cleanAddr || !ethers.isAddress(cleanAddr)) {
      alert("Please enter a valid Ethereum address (0x...).");
      return;
    }

    try {
      setCheckingTarget(true);
      const contract = await getReadOnlyContract();
      if (!contract) return;
      const status = await contract.isVerifier(cleanAddr);
      setTargetVerifierStatus(status);
    } catch (err) {
      console.warn("Failed to check verifier status:", err.message);
    } finally {
      setCheckingTarget(false);
    }
  };

  // Grant VERIFIER_ROLE
  const handleGrantVerifier = async () => {
    const cleanAddr = verifierTargetAddress.trim();
    if (!cleanAddr || !ethers.isAddress(cleanAddr)) {
      alert("Please enter a valid Ethereum address to grant the verifier role.");
      return;
    }

    try {
      await runContractWrite(
        async (signer) => {
          const contract = getWriteContract(signer);
          const verifierRoleHash = await contract.VERIFIER_ROLE();
          return await contract.grantRole(verifierRoleHash, cleanAddr);
        },
        walletContext,
        {
          onStatusChange: setTxState,
          onSuccess: async () => {
            setTargetVerifierStatus(true);
          },
        }
      );
    } catch (err) {
      console.warn("Grant role error caught:", err.message);
    }
  };

  // Revoke VERIFIER_ROLE
  const handleRevokeVerifier = async () => {
    const cleanAddr = verifierTargetAddress.trim();
    if (!cleanAddr || !ethers.isAddress(cleanAddr)) {
      alert("Please enter a valid Ethereum address to revoke the verifier role.");
      return;
    }

    if (!confirm(`Are you sure you want to revoke the verifier role from ${shortenAddress(cleanAddr)}?`)) {
      return;
    }

    try {
      await runContractWrite(
        async (signer) => {
          const contract = getWriteContract(signer);
          const verifierRoleHash = await contract.VERIFIER_ROLE();
          return await contract.revokeRole(verifierRoleHash, cleanAddr);
        },
        walletContext,
        {
          onStatusChange: setTxState,
          onSuccess: async () => {
            setTargetVerifierStatus(false);
          },
        }
      );
    } catch (err) {
      console.warn("Revoke role error caught:", err.message);
    }
  };

  // Update Fee Bps (Hard capped at 1000 bps / 10.00%)
  const handleUpdateFeeBps = async (e) => {
    e.preventDefault();
    const bpsNum = Number(newFeeBps);
    if (isNaN(bpsNum) || bpsNum < 0 || bpsNum > 1000 || !Number.isInteger(bpsNum)) {
      alert("Platform fee must be a whole number between 0 and 1000 basis points (0% to 10.00% max).");
      return;
    }

    try {
      await runContractWrite(
        async (signer) => {
          const contract = getWriteContract(signer);
          return await contract.setFeeBps(BigInt(bpsNum));
        },
        walletContext,
        {
          onStatusChange: setTxState,
          onSuccess: async () => {
            setFeeBps(bpsNum);
          },
        }
      );
    } catch (err) {
      console.warn("Update feeBps error caught:", err.message);
    }
  };

  // Update Fee Recipient
  const handleUpdateRecipient = async (e) => {
    e.preventDefault();
    const cleanRecipient = newRecipient.trim();
    if (!cleanRecipient || !ethers.isAddress(cleanRecipient)) {
      alert("Please enter a valid Ethereum address for fee recipient.");
      return;
    }

    try {
      await runContractWrite(
        async (signer) => {
          const contract = getWriteContract(signer);
          return await contract.setFeeRecipient(cleanRecipient);
        },
        walletContext,
        {
          onStatusChange: setTxState,
          onSuccess: async () => {
            setFeeRecipient(cleanRecipient);
          },
        }
      );
    } catch (err) {
      console.warn("Update fee recipient error caught:", err.message);
    }
  };

  // Non-Admin access denied view
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="clean-card p-12 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-charcoal">
            Administrator Access Required
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed max-w-md mx-auto">
            This administration control panel is restricted to accounts with the <strong className="text-charcoal font-semibold">DEFAULT_ADMIN_ROLE</strong> on the Polygon Amoy smart contract.
            {account ? (
              <span> Connected address <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{shortenAddress(account, 6)}</code> does not possess administrator rights.</span>
            ) : (
              <span> Please connect the contract deployer or administrator wallet.</span>
            )}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {!account ? (
              <button onClick={connectWallet} className="btn-outline text-xs">
                Connect Wallet
              </button>
            ) : (
              <Link to="/dashboard" className="btn-neutral-outline text-xs">
                &larr; Return to Dashboard
              </Link>
            )}
            <Link to="/" className="btn-text text-xs">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <TxStatusModal txState={txState} onClose={() => setTxState({ status: "IDLE" })} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-forest font-semibold">
              On-Chain Administration
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              Default Admin Role
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-charcoal">
            Platform Administration
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Manage verifier credentials and configure marketplace fees on Polygon Amoy.
          </p>
        </div>

        <button
          onClick={() => fetchAdminData()}
          disabled={loading}
          className="btn-neutral-outline text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Settings</span>
        </button>
      </div>

      {/* SECTION 1: VERIFIER ROLE MANAGEMENT */}
      <div className="clean-card p-6 sm:p-8 space-y-6">
        <div className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-forest" />
            <h2 className="text-base font-semibold text-charcoal">
              Verifier Role Management (VVB Accreditation)
            </h2>
          </div>
          <p className="text-xs text-charcoal-muted mt-1">
            Grant or revoke the on-chain <code className="font-mono text-xs">VERIFIER_ROLE</code> required to audit and approve carbon projects.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">
              Auditor / Verifier Wallet Address
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={verifierTargetAddress}
                onChange={(e) => {
                  setVerifierTargetAddress(e.target.value);
                  setTargetVerifierStatus(null);
                }}
                placeholder="0x..."
                className="flex-1 px-3.5 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-forest focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleCheckTargetStatus}
                disabled={checkingTarget || !verifierTargetAddress.trim()}
                className="btn-neutral-outline text-xs px-4 py-2 whitespace-nowrap"
              >
                {checkingTarget ? "Checking..." : "Check Status"}
              </button>
            </div>
          </div>

          {/* Target Status Display */}
          {targetVerifierStatus !== null && (
            <div className={`p-3 rounded text-xs flex items-center justify-between border ${
              targetVerifierStatus
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-gray-50 border-gray-200 text-charcoal-muted"
            }`}>
              <div className="flex items-center gap-2">
                {targetVerifierStatus ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                )}
                <span>
                  Address status: <strong>{targetVerifierStatus ? "Active Accredited Verifier" : "Not a Verifier"}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGrantVerifier}
              disabled={!verifierTargetAddress.trim() || !configured}
              className="btn-outline text-xs py-2 px-4 flex items-center gap-1.5 font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Grant VERIFIER_ROLE</span>
            </button>

            <button
              type="button"
              onClick={handleRevokeVerifier}
              disabled={!verifierTargetAddress.trim() || !configured}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-700 bg-transparent hover:bg-red-50 text-xs font-medium rounded transition-colors"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Revoke VERIFIER_ROLE</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: MARKETPLACE FEE CONFIGURATION */}
      <div className="clean-card p-6 sm:p-8 space-y-6">
        <div className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-forest" />
            <h2 className="text-base font-semibold text-charcoal">
              Marketplace Fee Configuration
            </h2>
          </div>
          <p className="text-xs text-charcoal-muted mt-1">
            Current Fee: <strong className="font-mono text-charcoal">{(feeBps / 100).toFixed(2)}%</strong> ({feeBps} bps). Hard UI maximum cap is 1,000 bps (10.00%).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fee BPS Form */}
          <form onSubmit={handleUpdateFeeBps} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">
                New Platform Fee (Basis Points)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="1"
                  value={newFeeBps}
                  onChange={(e) => setNewFeeBps(e.target.value)}
                  placeholder="e.g. 250 (2.50%)"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-forest focus:outline-none font-mono"
                />
              </div>
              <p className="text-[11px] text-charcoal-subtle mt-1">
                Converted: {(Number(newFeeBps || 0) / 100).toFixed(2)}% of total transaction value.
              </p>
            </div>

            <button
              type="submit"
              disabled={!configured}
              className="btn-outline text-xs py-2 px-4 font-semibold"
            >
              Update Fee Basis Points
            </button>
          </form>

          {/* Fee Recipient Form */}
          <form onSubmit={handleUpdateRecipient} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">
                Fee Treasury Recipient Address
              </label>
              <input
                type="text"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="0x..."
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-forest focus:outline-none font-mono text-xs"
              />
              <p className="text-[11px] text-charcoal-subtle mt-1 truncate">
                Current: {feeRecipient || "None configured"}
              </p>
            </div>

            <button
              type="submit"
              disabled={!configured}
              className="btn-neutral-outline text-xs py-2 px-4 hover:border-forest hover:text-forest"
            >
              Update Recipient Address
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
