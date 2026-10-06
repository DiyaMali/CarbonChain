import { ethers } from "ethers";
import { CONTRACT_ADDRESS, isContractConfigured } from "../config/contract";
import { CARBON_CREDIT_ABI } from "../abi/carbonCreditAbi";
import { getPublicProvider } from "./provider";

/**
 * Returns a read-only instance of the CarbonCredit contract using public RPC provider.
 */
export async function getReadOnlyContract() {
  if (!isContractConfigured()) {
    return null;
  }
  const provider = await getPublicProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CARBON_CREDIT_ABI, provider);
}

/**
 * Returns a write-enabled instance of the CarbonCredit contract using a signer.
 */
export function getWriteContract(signer) {
  if (!isContractConfigured()) {
    throw new Error("Contract address is not configured yet.");
  }
  if (!signer) {
    throw new Error("Wallet signer is required for contract write operations.");
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CARBON_CREDIT_ABI, signer);
}
