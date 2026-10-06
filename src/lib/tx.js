import { CHAIN_ID, EXPLORER, isContractConfigured } from "../config/contract";
import { parseContractError } from "./errors";

/**
 * Wraps smart contract write operations with complete lifecycle tracking and validation:
 * 1. Checks wallet connection and Amoy network (Chain ID 80002)
 * 2. Checks contract deployment address configuration
 * 3. Notifies 'WAITING_WALLET' state
 * 4. Sends transaction and notifies 'CONFIRMING' state with hash
 * 5. Waits for 1 confirmation and notifies 'SUCCESS' state
 * 6. Maps errors to user-friendly messages
 * 
 * @param {Function} contractCallFn - async (signer) => Promise<TransactionResponse>
 * @param {Object} walletContext - { account, chainId, switchNetwork, getSigner }
 * @param {Object} callbacks - { onStatusChange, onSuccess }
 */
export async function runContractWrite(contractCallFn, walletContext, callbacks = {}) {
  const { account, chainId, switchNetwork, getSigner } = walletContext;
  const { onStatusChange, onSuccess } = callbacks;

  const updateStatus = (status, data = {}) => {
    if (onStatusChange) {
      onStatusChange({ status, ...data });
    }
  };

  try {
    // 1. Check wallet connection
    if (!account) {
      const err = new Error("Please connect your wallet first.");
      updateStatus("ERROR", { message: err.message, errorType: "NO_WALLET" });
      throw err;
    }

    // 2. Check Amoy network
    if (Number(chainId) !== Number(CHAIN_ID)) {
      const err = new Error("Wrong network. Please switch to Polygon Amoy Testnet (Chain ID 80002).");
      updateStatus("ERROR", {
        message: err.message,
        errorType: "WRONG_NETWORK",
        switchNetwork,
      });
      throw err;
    }

    // 3. Check contract configuration
    if (!isContractConfigured()) {
      const err = new Error("Contract address is not configured yet. Please configure CONTRACT_ADDRESS in src/config/contract.js.");
      updateStatus("ERROR", { message: err.message, errorType: "UNCONFIGURED_CONTRACT" });
      throw err;
    }

    // 4. Get signer
    const signer = await getSigner();
    if (!signer) {
      const err = new Error("Unable to obtain signer from browser wallet.");
      updateStatus("ERROR", { message: err.message });
      throw err;
    }

    // 5. Waiting for wallet confirmation
    updateStatus("WAITING_WALLET", {
      message: "Waiting for wallet confirmation in MetaMask...",
    });

    // 6. Execute contract write
    const tx = await contractCallFn(signer);

    // 7. Confirming on blockchain
    updateStatus("CONFIRMING", {
      message: "Confirming on blockchain...",
      txHash: tx.hash,
      explorerUrl: `${EXPLORER}/tx/${tx.hash}`,
    });

    // 8. Wait for 1 confirmation
    const receipt = await tx.wait(1);

    // 9. Success
    const successData = {
      message: "Transaction confirmed successfully!",
      txHash: tx.hash,
      explorerUrl: `${EXPLORER}/tx/${tx.hash}`,
      receipt,
    };
    updateStatus("SUCCESS", successData);

    if (onSuccess) {
      await onSuccess(successData);
    }

    return {
      success: true,
      txHash: tx.hash,
      explorerUrl: `${EXPLORER}/tx/${tx.hash}`,
      receipt,
    };
  } catch (err) {
    console.error("Contract transaction failed:", err);
    const friendlyMessage = parseContractError(err);
    updateStatus("ERROR", {
      message: friendlyMessage,
      rawError: err,
    });
    throw new Error(friendlyMessage);
  }
}
