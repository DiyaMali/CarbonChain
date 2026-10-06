import { ethers } from "ethers";
import { PUBLIC_RPC_URLS, CHAIN_ID } from "../config/contract";

let cachedPublicProvider = null;

/**
 * Returns a working JsonRpcProvider by testing primary then fallback RPCs.
 */
export async function getPublicProvider() {
  if (cachedPublicProvider) {
    try {
      await cachedPublicProvider.getBlockNumber();
      return cachedPublicProvider;
    } catch {
      cachedPublicProvider = null;
    }
  }

  for (const rpcUrl of PUBLIC_RPC_URLS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, {
        chainId: CHAIN_ID,
        name: "amoy",
      });
      // Quick health check with timeout
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("RPC Timeout")), 3500)),
      ]);
      cachedPublicProvider = provider;
      return provider;
    } catch (err) {
      console.warn(`RPC ${rpcUrl} failed or timed out:`, err.message);
    }
  }

  // If both failed health check, still return the primary provider so queries can attempt
  return new ethers.JsonRpcProvider(PUBLIC_RPC_URLS[0]);
}

/**
 * Returns BrowserProvider for MetaMask or connected injected provider safely.
 */
export function getBrowserProvider() {
  if (
    typeof window !== "undefined" &&
    window.ethereum &&
    typeof window.ethereum.request === "function"
  ) {
    try {
      return new ethers.BrowserProvider(window.ethereum);
    } catch (err) {
      console.warn("Could not initialize BrowserProvider:", err);
      return null;
    }
  }
  return null;
}
