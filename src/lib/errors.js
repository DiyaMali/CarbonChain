/**
 * Maps raw blockchain / ethers errors into user-friendly plain English messages.
 */
export function parseContractError(err) {
  console.error("Full transaction error:", err);

  const message = err?.message || String(err || "");
  const errCode = err?.code;
  const reason = err?.reason || "";

  // User rejection
  if (
    errCode === "ACTION_REJECTED" ||
    errCode === 4001 ||
    message.includes("user rejected") ||
    message.includes("User denied")
  ) {
    return "You cancelled the transaction.";
  }

  // Insufficient funds
  if (
    errCode === "INSUFFICIENT_FUNDS" ||
    message.includes("insufficient funds") ||
    reason.includes("insufficient funds")
  ) {
    return "Not enough POL to pay for this transaction and its network fee.";
  }

  // Access control
  if (
    message.includes("AccessControlUnauthorizedAccount") ||
    reason.includes("AccessControlUnauthorizedAccount")
  ) {
    return "Your wallet does not have permission for this action.";
  }

  // Incorrect owner or approval
  if (
    message.includes("ERC721IncorrectOwner") ||
    reason.includes("ERC721IncorrectOwner") ||
    message.includes("ERC721InsufficientApproval") ||
    reason.includes("ERC721InsufficientApproval")
  ) {
    return "This wallet is not allowed to move this credit.";
  }

  // Custom contract revert or short error
  if (reason) {
    return reason;
  }

  if (err?.shortMessage) {
    return err.shortMessage;
  }

  // Extract from execution reverted message if available
  const match = message.match(/reverted with reason string '([^']+)'/);
  if (match && match[1]) {
    return match[1];
  }

  return "Transaction failed. Please check your wallet and try again.";
}
