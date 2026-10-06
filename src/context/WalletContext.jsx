import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { USE_DEMO_LEDGER, USE_REAL_WALLET } from "../config/contract";
import { isVerifier as ledgerIsVerifier } from "../services/ledgerService";
import { getWalletBalance, addWalletBalance } from "../services/walletBalanceService";
import { useAuth } from "./AuthContext";
import ConnectWalletModal from "../components/ConnectWalletModal";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { user } = useAuth();

  const [walletSession, setWalletSession] = useState(null);
  const [account, setAccount] = useState(null);
  const [inrBalance, setInrBalance] = useState(0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [hasSkippedWallet, setHasSkippedWallet] = useState(false);
  const [pendingActionCallback, setPendingActionCallback] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const refreshBalance = useCallback(() => {
    if (account) {
      setInrBalance(getWalletBalance(account));
    } else {
      setInrBalance(0);
    }
  }, [account]);

  useEffect(() => {
    refreshBalance();
    const handleBalanceEvent = () => refreshBalance();
    window.addEventListener("cc_balance_updated", handleBalanceEvent);
    return () => window.removeEventListener("cc_balance_updated", handleBalanceEvent);
  }, [account, refreshBalance]);

  // Sync wallet state with authenticated user & session
  useEffect(() => {
    if (!user) {
      setAccount(null);
      setWalletSession(null);
      setHasSkippedWallet(false);
      setIsWalletModalOpen(false);
      setPendingActionCallback(null);
      return;
    }

    // Check if this account has an active connected wallet in THIS session
    const sessionActive = sessionStorage.getItem(`cc_wallet_session_active_${user.id}`);
    const storedSession = localStorage.getItem(`cc_wallet_session_${user.id}`);

    if (sessionActive && storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        if (parsed && parsed.address) {
          setWalletSession(parsed);
          setAccount(parsed.address);
          setHasSkippedWallet(false);
          return;
        }
      } catch (e) {
        console.warn("Failed to parse stored wallet session", e);
      }
    }

    // No active session for this user
    setAccount(null);
    setWalletSession(null);

    const wasSkipped = sessionStorage.getItem(`cc_wallet_skipped_${user.id}`) === "true";
    setHasSkippedWallet(wasSkipped);
  }, [user]);

  const openWalletModal = useCallback((callback = null) => {
    if (typeof callback === "function") {
      setPendingActionCallback(() => callback);
    } else {
      setPendingActionCallback(null);
    }
    setIsWalletModalOpen(true);
  }, []);

  const closeWalletModal = useCallback((skipped = false) => {
    setIsWalletModalOpen(false);
    if (skipped) {
      setHasSkippedWallet(true);
      if (user?.id) {
        sessionStorage.setItem(`cc_wallet_skipped_${user.id}`, "true");
      }
      setPendingActionCallback(null);
    }
  }, [user]);

  const connectWalletSession = useCallback((sessionData) => {
    if (!sessionData?.address) return;
    setWalletSession(sessionData);
    setAccount(sessionData.address);
    setHasSkippedWallet(false);
    setInrBalance(getWalletBalance(sessionData.address));

    if (user?.id) {
      sessionStorage.setItem(`cc_wallet_session_active_${user.id}`, "true");
      sessionStorage.removeItem(`cc_wallet_skipped_${user.id}`);
      localStorage.setItem(`cc_wallet_session_${user.id}`, JSON.stringify(sessionData));
    }
  }, [user]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setWalletSession(null);
    setHasSkippedWallet(false);
    setPendingActionCallback(null);
    setInrBalance(0);

    if (user?.id) {
      sessionStorage.removeItem(`cc_wallet_session_active_${user.id}`);
      localStorage.removeItem(`cc_wallet_session_${user.id}`);
      sessionStorage.removeItem(`cc_wallet_skipped_${user.id}`);
    }
  }, [user]);

  const addDemoFunds = useCallback((amount = 50000) => {
    if (!account) return 0;
    const newBal = addWalletBalance(account, amount);
    setInrBalance(newBal);
    return newBal;
  }, [account]);

  const isVerifierRole = account ? ledgerIsVerifier(account) : false;

  return (
    <WalletContext.Provider
      value={{
        account,
        walletSession,
        inrBalance,
        chainId: 80002,
        balance: "0",
        isCorrectNetwork: true,
        isConnecting,
        isVerifier: isVerifierRole,
        isAdmin: false,
        isDemoMode: true,
        isWalletModalOpen,
        hasSkippedWallet,
        pendingActionCallback,
        openWalletModal,
        closeWalletModal,
        connectWalletSession,
        connectWallet: openWalletModal,
        disconnectWallet,
        refreshBalance,
        addDemoFunds,
        switchNetwork: async () => {},
        getSigner: async () => null,
      }}
    >
      {children}
      <ConnectWalletModal />
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
}
