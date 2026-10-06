/**
 * Wallet Utilities
 * Deterministic EVM address derivation (0x + 40 hex chars) from email using SHA-256.
 */

export async function deriveAddressFromEmail(email) {
  if (!email) return "0x71C8A33827C9484931a7836881729013098319B4";
  const clean = email.trim().toLowerCase();
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(clean);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return "0x" + hashHex.slice(0, 40);
  } catch {
    // Deterministic fallback if Web Crypto is unavailable
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
      hash = ((hash << 5) - hash) + clean.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0").repeat(5).slice(0, 40);
    return "0x" + hex;
  }
}

export function isValidEvmAddress(address) {
  return typeof address === "string" && /^0x[0-9a-fA-F]{40}$/.test(address.trim());
}

export function shortenAddress(address) {
  if (!address) return "";
  const str = String(address).trim();
  if (str.length <= 10) return str;
  return `${str.slice(0, 6)}...${str.slice(-4)}`;
}
