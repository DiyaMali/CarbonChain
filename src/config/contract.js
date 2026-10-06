// When true, all pages use the simulated ledger (ledgerService.js).
// When false, they use the real ERC-721 contract on Polygon Amoy.
export const USE_DEMO_LEDGER = true;
export { USE_REAL_WALLET } from "./wallet";

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || "0xPASTE_DEPLOYED_ADDRESS_HERE";

export const CHAIN_ID = 80002;
export const CHAIN_NAME = "Polygon Amoy Testnet";
export const NATIVE_SYMBOL = "POL";

export const PUBLIC_RPC_URLS = [
  "https://polygon-amoy-bor-rpc.publicnode.com",
  "https://polygon-amoy.drpc.org",
];

export const EXPLORER = "https://amoy.polygonscan.com";

// Enum order of ProjectStatus in the contract.
export const PROJECT_STATUS = { 0: "Pending", 1: "Approved", 2: "Rejected" };

export const isContractConfigured = (addr = CONTRACT_ADDRESS) => {
  // In demo mode, always return true so the banner never shows
  if (USE_DEMO_LEDGER) return true;
  return Boolean(
    addr &&
    addr.startsWith("0x") &&
    addr.length === 42 &&
    !addr.includes("PASTE_DEPLOYED_ADDRESS_HERE")
  );
};
