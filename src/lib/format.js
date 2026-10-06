import { ethers } from "ethers";

/**
 * Shorten Ethereum address to 0x1027...958A
 */
export function shortenAddress(address, chars = 4) {
  if (!address) return "";
  let addr = address;
  if (typeof addr === "object") {
    addr = addr.address || addr.walletAddress || "";
  }
  addr = String(addr || "").trim();
  if (!addr || addr.startsWith("[object")) return "";
  if (addr.length <= chars * 2 + 2) return addr;
  return `${addr.substring(0, chars + 2)}...${addr.substring(addr.length - chars)}`;
}

/**
 * Format wei to POL string (e.g. 1.25 POL)
 */
export function formatPol(wei, decimals = 4) {
  if (wei === undefined || wei === null) return "0";
  try {
    const etherStr = ethers.formatEther(wei.toString());
    const [intPart, decPart] = etherStr.split(".");
    if (!decPart) return intPart;
    const trimmedDec = decPart.substring(0, decimals).replace(/0+$/, "");
    return trimmedDec ? `${intPart}.${trimmedDec}` : intPart;
  } catch {
    return "0";
  }
}

/**
 * Format unix timestamp (seconds) into standard readable date
 */
export function formatTimestamp(timestampSec) {
  if (!timestampSec) return "N/A";
  try {
    const sec = typeof timestampSec === "bigint" ? Number(timestampSec) : Number(timestampSec);
    if (!sec || isNaN(sec)) return "N/A";
    const date = new Date(sec * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
}

/**
 * Format CO2 tonnes with comma separators
 */
export function formatCO2(tonnes) {
  if (tonnes === undefined || tonnes === null) return "0";
  try {
    const n = typeof tonnes === "bigint" ? Number(tonnes) : Number(tonnes);
    return new Intl.NumberFormat("en-US").format(n);
  } catch {
    return String(tonnes);
  }
}
