/**
 * CarbonChain Shared Design Tokens
 * Strictly plain hex values only. No gradients, no undefined variables.
 */

export const ROLE_ACCENTS = {
  seller: "#14452F",
  buyer: "#0F5C66",
  verifier: "#1F3A5F",
  admin: "#1F3A5F",
  default: "#14452F",
};

export const THEME = {
  pageBg: "#F4F7F5",
  cardBg: "#FFFFFF",
  border: "#E3E8E5",
  text: "#14201A",
  muted: "#5B6B63",
  money: "#0F5C66",
  tableHeaderBg: "#EEF3F0",
  tableRowHover: "#F7FAF8",
};

export const STATUS_COLORS = {
  Listed: { bg: "#E6F4EC", text: "#14452F", border: "#14452F" },
  Approved: { bg: "#E6F4EC", text: "#14452F", border: "#14452F" },
  Pending: { bg: "#FFF4D6", text: "#8A5A00", border: "#8A5A00" },
  "Under Review": { bg: "#FFF4D6", text: "#8A5A00", border: "#8A5A00" },
  "Sent Back for Review": { bg: "#FFF4D6", text: "#8A5A00", border: "#8A5A00" },
  Requested: { bg: "#FFF4D6", text: "#8A5A00", border: "#8A5A00" },
  Rejected: { bg: "#FDECEC", text: "#A12A2A", border: "#A12A2A" },
  "Sold out": { bg: "#EDEFEE", text: "#4A5550", border: "#4A5550" },
  "Sold Out": { bg: "#EDEFEE", text: "#4A5550", border: "#4A5550" },
  Sold: { bg: "#EDEFEE", text: "#4A5550", border: "#4A5550" },
  Concluded: { bg: "#E8EDF3", text: "#1F3A5F", border: "#1F3A5F" },
  Completed: { bg: "#E8EDF3", text: "#1F3A5F", border: "#1F3A5F" },
  Retired: { bg: "#E8EDF3", text: "#1F3A5F", border: "#1F3A5F" },
  Cancelled: { bg: "#EDEFEE", text: "#4A5550", border: "#4A5550" },
  Active: { bg: "#E6F4EC", text: "#14452F", border: "#14452F" },
};

export const STAT_CARD_THEMES = {
  credits: {
    topBorder: "#14452F",
    iconBg: "#E6F4EC",
    iconColor: "#14452F",
  },
  pending: {
    topBorder: "#8A5A00",
    iconBg: "#FFF4D6",
    iconColor: "#8A5A00",
  },
  rejected: {
    topBorder: "#A12A2A",
    iconBg: "#FDECEC",
    iconColor: "#A12A2A",
  },
  money: {
    topBorder: "#0F5C66",
    iconBg: "#E6F4F6",
    iconColor: "#0F5C66",
  },
  blocks: {
    topBorder: "#334155",
    iconBg: "#F1F5F9",
    iconColor: "#334155",
  },
};

/**
 * Returns the hex accent color for a user's role or a role string.
 */
export function getRoleAccent(userOrRole) {
  if (!userOrRole) return ROLE_ACCENTS.default;
  if (typeof userOrRole === "string") {
    const r = userOrRole.toLowerCase();
    if (r.includes("verif")) return ROLE_ACCENTS.verifier;
    if (r.includes("buy")) return ROLE_ACCENTS.buyer;
    if (r.includes("sell")) return ROLE_ACCENTS.seller;
    if (r.includes("admin")) return ROLE_ACCENTS.admin;
    return ROLE_ACCENTS.default;
  }
  const user = userOrRole;
  if (user.isVerifier || user.role === "Verifier") return ROLE_ACCENTS.verifier;
  const isSeller = Array.isArray(user.capabilities) && (user.capabilities.includes("sell") || user.capabilities.includes("create_sell"));
  const isBuyer = Array.isArray(user.capabilities) && (user.capabilities.includes("buy") || user.capabilities.includes("buy_retire"));
  if (isBuyer && !isSeller) return ROLE_ACCENTS.buyer;
  if (isSeller) return ROLE_ACCENTS.seller;
  if (isBuyer) return ROLE_ACCENTS.buyer;
  return ROLE_ACCENTS.default;
}
