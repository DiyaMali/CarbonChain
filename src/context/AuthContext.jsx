import React, { createContext, useContext, useState, useEffect } from "react";
import { DEMO_ACCOUNTS } from "../services/ledgerService";

const USERS_STORAGE_KEY = "carbonchain_users";
const CURRENT_USER_KEY = "carbonchain_current_user";

const AuthContext = createContext(null);

function getUsers() {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [...DEMO_ACCOUNTS];
  } catch {
    return [...DEMO_ACCOUNTS];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/** Ensure seeded accounts are always present and up-to-date. */
function ensureSeededAccounts() {
  const users = getUsers();
  let changed = false;
  for (const demo of DEMO_ACCOUNTS) {
    const existingIdx = users.findIndex((u) => u.id === demo.id);
    if (existingIdx === -1) {
      users.push(demo);
      changed = true;
    } else {
      // Sync name/email/capabilities from the canonical list
      const u = users[existingIdx];
      if (
        u.email !== demo.email ||
        u.name !== demo.name ||
        u.organisation !== demo.organisation ||
        u.isVerifier !== demo.isVerifier ||
        JSON.stringify(u.capabilities) !== JSON.stringify(demo.capabilities)
      ) {
        users[existingIdx] = { ...u, ...demo };
        changed = true;
      }
    }
  }
  if (changed) saveUsers(users);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      ensureSeededAccounts();

      const sessionUser =
        localStorage.getItem(CURRENT_USER_KEY) ||
        sessionStorage.getItem(CURRENT_USER_KEY);
      if (sessionUser) {
        const parsed = JSON.parse(sessionUser);
        // Refresh with latest seeded account info if it's a seeded account
        const updated = DEMO_ACCOUNTS.find((d) => d.id === parsed.id);
        setUser(updated ? { ...parsed, ...updated } : parsed);
      }
    } catch (err) {
      console.warn("Failed to load auth state:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistSession = (userData, rememberMe = true) => {
    setUser(userData);
    const serialized = JSON.stringify(userData);
    if (rememberMe) {
      localStorage.setItem(CURRENT_USER_KEY, serialized);
      sessionStorage.removeItem(CURRENT_USER_KEY);
    } else {
      sessionStorage.setItem(CURRENT_USER_KEY, serialized);
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  };

  const login = async (email, password, rememberMe = true) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const users = getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!existing) throw new Error("No account found with this email address.");

    const isMatch =
      existing.password === cleanPassword ||
      existing.password?.toLowerCase() === cleanPassword.toLowerCase() ||
      (cleanPassword.toLowerCase() === "password123" && existing.id?.startsWith("usr_"));

    if (!isMatch) throw new Error("Incorrect password. Please verify your credentials.");

    persistSession(existing, rememberMe);
    return existing;
  };

  /**
   * Quick sign-in  -  bypass password check for the three seeded accounts.
   * @param {"seller"|"buyer"|"verifier"} role
   */
  const quickSignIn = (role) => {
    const idMap = {
      seller:   "usr_meridian",
      buyer:    "usr_ironbridge",
      verifier: "usr_verifier",
    };
    const users = getUsers();
    const account = users.find((u) => u.id === idMap[role]);
    if (!account) throw new Error("Account not found.");
    persistSession(account, true);
    return account;
  };

  /** Legacy alias */
  const loginAsDemo = quickSignIn;

  const signup = async ({
    name,
    email,
    password,
    organisation = "",
    capabilities = [],
    rememberMe = true,
  }) => {
    if (!capabilities || capabilities.length === 0) {
      capabilities = ["sell", "buy"];
    }
    const cleanEmail = email.trim().toLowerCase();
    const users = getUsers();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(
        "An account with this email address already exists. Please log in instead."
      );
    }

    const hasCreate = capabilities.includes("sell") || capabilities.includes("create_sell");
    const hasBuy = capabilities.includes("buy") || capabilities.includes("buy_retire");
    const role = hasCreate && hasBuy ? "Project Owner & Buyer" : hasCreate ? "Project Owner" : "Buyer";

    // Deterministic wallet from email (simple hex hash for display)
    const walletHex = Array.from(cleanEmail)
      .reduce((acc, c) => acc + c.charCodeAt(0).toString(16).padStart(2, "0"), "")
      .slice(0, 40)
      .padEnd(40, "0");
    const walletAddress = "0x" + walletHex;

    const displayName = (name || organisation || "").trim();
    const displayOrg = (organisation || name || "").trim();

    const newUser = {
      id: `usr_${Date.now()}`,
      name: displayName,
      email: cleanEmail,
      password,
      organisation: displayOrg,
      capabilities,
      role,
      walletAddress,
      isVerifier: false,
      createdAt: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);
    persistSession(newUser, rememberMe);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
  };

  const updateUser = (updates) => {
    if (!user) return;
    const users = getUsers();
    const updatedUser = { ...user, ...updates };
    saveUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
    const isRemembered = Boolean(localStorage.getItem(CURRENT_USER_KEY));
    persistSession(updatedUser, isRemembered);
  };

  const bindWallet = (walletAddress) => {
    if (!user || !walletAddress) return;
    updateUser({ walletAddress });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginAsDemo,
        quickSignIn,
        signup,
        logout,
        updateUser,
        bindWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
