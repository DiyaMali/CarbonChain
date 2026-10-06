import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  ChevronRight,
  Shield,
  Zap,
  Globe,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { deriveAddressFromEmail, isValidEvmAddress, shortenAddress } from "../utils/walletUtils";
import { USE_REAL_WALLET } from "../config/wallet";

export default function ConnectWalletModal() {
  const {
    isWalletModalOpen,
    closeWalletModal,
    connectWalletSession,
    pendingActionCallback,
  } = useWallet();
  const { user } = useAuth();
  const toast = useToast();

  // Internal modal states: "list" | "connecting" | "approve" | "qr" | "other" | "success"
  const [view, setView] = useState("list");
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [cancelMessage, setCancelMessage] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [customAddressError, setCustomAddressError] = useState("");
  const [connectedAddress, setConnectedAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  // Reset modal state whenever opened
  useEffect(() => {
    if (isWalletModalOpen) {
      setView("list");
      setSelectedWallet(null);
      setCancelMessage("");
      setCustomAddress("");
      setCustomAddressError("");
      setCopied(false);
    }
  }, [isWalletModalOpen]);

  // Keyboard navigation & accessibility: ESC to dismiss
  useEffect(() => {
    if (!isWalletModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isWalletModalOpen]);

  const handleDismiss = () => {
    closeWalletModal(true);
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleDismiss();
    }
  };

  // Select a wallet provider from the list
  const handleSelectWallet = async (walletKey) => {
    setCancelMessage("");
    if (walletKey === "other") {
      setSelectedWallet({ key: "other", name: "Other Wallet", monogram: "O" });
      setView("other");
      return;
    }

    if (walletKey === "walletconnect") {
      setSelectedWallet({ key: "walletconnect", name: "WalletConnect", monogram: "W" });
      setView("qr");
      return;
    }

    // MetaMask or Coinbase Wallet
    const walletConfig =
      walletKey === "metamask"
        ? { key: "metamask", name: "MetaMask", monogram: "M" }
        : { key: "coinbase", name: "Coinbase Wallet", monogram: "C" };

    setSelectedWallet(walletConfig);

    if (USE_REAL_WALLET && walletKey === "metamask") {
      // TODO: Real wallet path for MetaMask on-chain connection
      // try {
      //   const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      //   if (accounts && accounts[0]) {
      //     finalizeConnection(walletConfig, accounts[0]);
      //   }
      // } catch (err) {
      //   setCancelMessage("Connection rejected by MetaMask.");
      //   setView("list");
      // }
      // return;
    }

    // Simulated connection spinner (~1.2s)
    setView("connecting");
    setTimeout(() => {
      setView("approve");
    }, 1200);
  };

  // Reject approval in wallet
  const handleRejectApproval = () => {
    setCancelMessage("Connection cancelled.");
    setView("list");
  };

  // Finalize wallet connection
  const finalizeConnection = async (wallet, targetAddr = null) => {
    let finalAddress = targetAddr;
    if (!finalAddress) {
      if (user?.email) {
        finalAddress = await deriveAddressFromEmail(user.email);
      } else {
        finalAddress = "0x71C8A33827C9484931a7836881729013098319B4";
      }
    }

    const sessionData = {
      provider: wallet.name,
      address: finalAddress,
      connectedAt: new Date().toISOString(),
    };

    connectWalletSession(sessionData);
    setConnectedAddress(finalAddress);
    setView("success");
    toast.success(`Wallet connected: ${shortenAddress(finalAddress)}`);

    // Show temporary toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Connect button clicked on approval screen
  const handleApproveConnection = () => {
    finalizeConnection(selectedWallet);
  };

  // Simulate scan for WalletConnect QR
  const handleSimulateScan = () => {
    setView("connecting");
    setTimeout(() => {
      setView("approve");
    }, 1000);
  };

  // Other wallet submission
  const handleOtherWalletSubmit = (e) => {
    e.preventDefault();
    setCustomAddressError("");
    const clean = customAddress.trim();
    if (!isValidEvmAddress(clean)) {
      setCustomAddressError("Please enter a valid EVM address starting with 0x followed by 40 hex characters.");
      return;
    }
    finalizeConnection(selectedWallet, clean);
  };

  const handleFillDemoAddress = () => {
    setCustomAddress("0x71C8A33827C9484931a7836881729013098319B4");
    setCustomAddressError("");
  };

  const handleCopy = () => {
    if (!connectedAddress) return;
    navigator.clipboard.writeText(connectedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    closeWalletModal(false);
    if (typeof pendingActionCallback === "function") {
      pendingActionCallback();
    }
  };

  if (!isWalletModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0F2A1D]/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-[440px] rounded-t-2xl sm:rounded-xl shadow-xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* VIEW 1: CHOOSE A WALLET (LIST) */}
        {view === "list" && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h2 id="wallet-modal-title" className="text-xl font-semibold text-[#0F2A1D] tracking-tight">
                  Connect your wallet
                </h2>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Your wallet is used to pay for carbon credits and to hold the tokens you own.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Benefit lines */}
            <div className="flex items-center justify-between py-2.5 px-3 my-3 bg-[#FAFBF9] rounded-lg border border-stone-200/70 text-[11px] text-stone-700">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-[#14532D]" />
                Secure
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-[#14532D]" />
                Fast
              </span>
              <span className="text-stone-300">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-[#14532D]" />
                Decentralized
              </span>
            </div>

            {/* Cancel notice if rejected earlier */}
            {cancelMessage && (
              <div className="mb-3 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                <span>{cancelMessage}</span>
              </div>
            )}

            {/* Choose-a-wallet list styled like payment method selector */}
            <div className="space-y-2.5 my-3">
              {/* MetaMask - Pre-highlighted */}
              <button
                type="button"
                onClick={() => handleSelectWallet("metamask")}
                className="w-full text-left p-3 rounded-lg border-2 border-[#14532D] bg-[#F7F9F6] hover:bg-[#EFF3ED] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-[#14532D] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    M
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#0F2A1D]">MetaMask</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#14532D]/10 text-[#14532D] uppercase tracking-wide">
                        Recommended
                      </span>
                    </div>
                    <div className="text-xs text-stone-600 mt-0.5">Popular browser extension and mobile wallet</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#14532D] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* WalletConnect */}
              <button
                type="button"
                onClick={() => handleSelectWallet("walletconnect")}
                className="w-full text-left p-3 rounded-lg border border-stone-200 hover:border-[#14532D]/60 hover:bg-stone-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-stone-100 border border-stone-200 text-[#0F2A1D] flex items-center justify-center font-bold text-sm">
                    W
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-stone-900">WalletConnect</div>
                    <div className="text-xs text-stone-500 mt-0.5">Scan with a mobile wallet</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Coinbase Wallet */}
              <button
                type="button"
                onClick={() => handleSelectWallet("coinbase")}
                className="w-full text-left p-3 rounded-lg border border-stone-200 hover:border-[#14532D]/60 hover:bg-stone-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-stone-100 border border-stone-200 text-[#0F2A1D] flex items-center justify-center font-bold text-sm">
                    C
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-stone-900">Coinbase Wallet</div>
                    <div className="text-xs text-stone-500 mt-0.5">Connect with Coinbase</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Other wallet */}
              <button
                type="button"
                onClick={() => handleSelectWallet("other")}
                className="w-full text-left p-3 rounded-lg border border-stone-200 hover:border-[#14532D]/60 hover:bg-stone-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-stone-900">Other wallet</div>
                    <div className="text-xs text-stone-500 mt-0.5">Enter a wallet address</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Footer note */}
            <div className="text-center pt-2 pb-1 border-t border-stone-100 mt-4">
              <p className="text-[11px] text-stone-400 font-mono">
                Network: Polygon. Prototype environment, no real funds are used.
              </p>
              <button
                type="button"
                onClick={handleDismiss}
                className="mt-3 text-xs text-stone-600 hover:text-[#0F2A1D] underline hover:no-underline font-medium cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: CONNECTING SCREEN (MetaMask / Coinbase) */}
        {view === "connecting" && (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-[#14532D] text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-sm">
              {selectedWallet?.monogram || "M"}
            </div>
            <h3 className="text-base font-semibold text-[#0F2A1D]">
              Connecting to {selectedWallet?.name}...
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Opening secure cryptographic communication channel
            </p>
            <div className="my-6 flex justify-center">
              <Loader2 className="w-6 h-6 text-[#14532D] animate-spin" />
            </div>
            <button
              type="button"
              onClick={() => setView("list")}
              className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-md text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* VIEW 3: APPROVAL SCREEN */}
        {view === "approve" && (
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-[#14532D] text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-xs">
              {selectedWallet?.monogram || "M"}
            </div>
            <h3 className="text-base font-semibold text-center text-[#0F2A1D]">
              Approve the connection in your wallet
            </h3>
            <p className="text-xs text-center text-stone-600 mt-1">
              Connect with <strong>CarbonChain</strong>
            </p>

            <div className="my-5 p-3.5 bg-stone-50 rounded-lg border border-stone-200/80 space-y-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Requested Permissions
              </div>
              <div className="flex items-start gap-2.5 text-xs text-stone-700">
                <Check className="w-4 h-4 text-[#14532D] flex-shrink-0 mt-0.5" />
                <span>View your wallet address</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-stone-700">
                <Check className="w-4 h-4 text-[#14532D] flex-shrink-0 mt-0.5" />
                <span>Request payments for carbon credits</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRejectApproval}
                className="w-1/2 py-2.5 px-4 rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors text-center cursor-pointer"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={handleApproveConnection}
                className="w-1/2 py-2.5 px-4 rounded-md border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-xs font-semibold transition-colors text-center cursor-pointer"
              >
                Connect
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: WALLETCONNECT QR SCREEN */}
        {view === "qr" && (
          <div className="p-6 text-center">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setView("list")}
                className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <h3 className="text-sm font-semibold text-[#0F2A1D]">WalletConnect</h3>
              <div className="w-8" />
            </div>

            <div className="p-4 bg-white rounded-xl border border-stone-200 inline-block shadow-xs mb-3">
              <QRCodeSVG
                value="wc:carbonchain-prototype-session-amoy"
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>

            <p className="text-xs text-stone-600 font-medium mb-1">
              Scan with your mobile wallet
            </p>
            <p className="text-[11px] text-stone-400">
              Open any compatible mobile wallet and scan to connect
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSimulateScan}
                className="w-full py-2.5 px-4 rounded-md border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                Continue to Connect
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className="w-full py-2 px-4 rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* VIEW 5: OTHER WALLET ADDRESS INPUT */}
        {view === "other" && (
          <form onSubmit={handleOtherWalletSubmit} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setView("list")}
                className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <h3 className="text-sm font-semibold text-[#0F2A1D]">Enter a wallet address</h3>
              <div className="w-8" />
            </div>

            <p className="text-xs text-stone-600 mb-3">
              Provide any EVM address (42 characters starting with 0x) to interact with the ledger.
            </p>

            <div className="space-y-1 mb-2">
              <label htmlFor="custom-address" className="text-[11px] font-semibold uppercase tracking-wider text-stone-600 block">
                Wallet Address (EVM)
              </label>
              <input
                id="custom-address"
                type="text"
                value={customAddress}
                onChange={(e) => {
                  setCustomAddress(e.target.value);
                  setCustomAddressError("");
                }}
                placeholder="0x..."
                className="w-full px-3 py-2 rounded-md border border-stone-300 font-mono text-xs text-stone-900 focus:outline-none focus:border-[#14532D] focus:ring-1 focus:ring-[#14532D]"
                autoFocus
              />
              {customAddressError && (
                <div className="text-[11px] text-red-600 mt-1 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{customAddressError}</span>
                </div>
              )}
            </div>

            <div className="mb-5 text-right">
              <button
                type="button"
                onClick={handleFillDemoAddress}
                className="text-[11px] text-[#14532D] hover:underline font-medium cursor-pointer"
              >
                Use a sample address
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView("list")}
                className="w-1/2 py-2 px-4 rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 px-4 rounded-md border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-xs font-semibold transition-colors cursor-pointer"
              >
                Connect
              </button>
            </div>
          </form>
        )}

        {/* VIEW 6: SUCCESS SCREEN */}
        {view === "success" && (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-[#14532D]" />
            </div>

            <h3 className="text-base font-semibold text-[#0F2A1D]">
              Wallet connected
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {selectedWallet?.name || "Web3 Wallet"}
            </p>

            <div className="my-5 p-3 rounded-lg bg-[#FAFBF9] border border-stone-200 inline-flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-stone-800">
                {shortenAddress(connectedAddress)}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 text-stone-400 hover:text-stone-700 transition-colors rounded"
                title="Copy address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              className="w-full py-2.5 px-4 rounded-md border border-[#14532D] text-[#14532D] hover:bg-[#14532D]/5 text-xs font-semibold transition-colors cursor-pointer"
            >
              Continue
            </button>
          </div>
        )}
      </div>

      {/* Small notification toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0F2A1D] text-white px-4 py-2 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 border border-emerald-600/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Wallet connected</span>
        </div>
      )}
    </div>
  );
}
