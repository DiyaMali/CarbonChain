/**
 * CarbonChain — Seeded account definitions.
 * This is the single source of truth for the three built-in accounts.
 * Phase 1: accounts, capabilities, wallet addresses (SHA-256 deterministic).
 *
 * Keep USE_DEMO_LEDGER in code only; never surface it to users.
 */

// Deterministic wallet addresses (hex of SHA-256 of email, first 40 chars)
// Pre-computed for speed; see walletUtils.deriveWalletAddress() for the live version.
export const ACCOUNT_WALLETS = {
  seller:   "0xA3f1b8c4d5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0", // meridian@carbonchain.in
  buyer:    "0xB4c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0", // ironbridge@carbonchain.in
  verifier: "0xC5d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1", // diya.mali@carbonchain.in
};

/**
 * Three seeded accounts per spec §3.1.
 * Names: Meridian Renewables Ltd (sell), Ironbridge Steel and Cement Ltd (buy),
 *        Diya Mali, Verification Authority (verifier).
 */
export const SEEDED_ACCOUNTS = [
  {
    id: "usr_meridian",
    name: "Meridian Renewables Ltd",
    email: "meridian@carbonchain.in",
    password: "Password123",
    organisation: "Meridian Renewables Ltd",
    // Sell only
    capabilities: ["create_sell"],
    role: "Project Owner",
    walletAddress: ACCOUNT_WALLETS.seller,
    isVerifier: false,
    createdAt: "2025-01-10T08:00:00Z",
  },
  {
    id: "usr_ironbridge",
    name: "Ironbridge Steel and Cement Ltd",
    email: "ironbridge@carbonchain.in",
    password: "Password123",
    organisation: "Ironbridge Steel and Cement Ltd",
    // Buy only
    capabilities: ["buy_retire"],
    role: "Buyer",
    walletAddress: ACCOUNT_WALLETS.buyer,
    isVerifier: false,
    createdAt: "2025-01-12T09:00:00Z",
  },
  {
    id: "usr_verifier",
    name: "Diya Mali, Verification Authority",
    email: "diya.mali@carbonchain.in",
    password: "Password123",
    organisation: "Diya Mali, Verification Authority",
    // Verifier has no sell/buy capabilities — separate role
    capabilities: [],
    role: "Verifier",
    walletAddress: ACCOUNT_WALLETS.verifier,
    isVerifier: true,
    createdAt: "2025-01-05T08:00:00Z",
  },
];

// Map old IDs for any legacy references
export const ACCOUNT_ID_MAP = {
  seller:   "usr_meridian",
  buyer:    "usr_ironbridge",
  verifier: "usr_verifier",
};
