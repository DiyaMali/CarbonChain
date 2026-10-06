/**
 * CarbonChain  -  Role & capability enforcement (service layer).
 * All functions check the caller's role and throw friendly errors on violations.
 * Import and call these before any action that is capability-gated.
 *
 * Access matrix per spec §3.2.
 */

// ─── Capability helpers ───────────────────────────────────────────────────────
export function canSell(user) {
  if (!user) return false;
  if (user.isVerifier) return false;
  return (
    Array.isArray(user.capabilities) &&
    (user.capabilities.includes("sell") || user.capabilities.includes("create_sell"))
  );
}

export function canBuy(user) {
  if (!user) return false;
  if (user.isVerifier) return false;
  return (
    Array.isArray(user.capabilities) &&
    (user.capabilities.includes("buy") || user.capabilities.includes("buy_retire"))
  );
}

export function isVerifierUser(user) {
  return Boolean(user?.isVerifier || user?.role === "Verifier");
}

export const isSellUser = canSell;
export const isBuyUser = canBuy;

// ─── Assertion helpers (throw on violation) ───────────────────────────────────

export function assertCanSubmitProject(user) {
  if (!user) throw new Error("You must be signed in to submit a project.");
  if (isVerifierUser(user))
    throw new Error("Verifiers cannot submit projects. This action is for selling accounts.");
  if (!canSell(user))
    throw new Error(
      "Your account is set up to buy and retire credits. Selling is not enabled for this account."
    );
}

export function assertCanBuy(user) {
  if (!user) throw new Error("You must be signed in to buy credits.");
  if (isVerifierUser(user))
    throw new Error("Verifiers cannot buy credits.");
  if (!canBuy(user))
    throw new Error(
      "Your account is set up to create and sell credits. Buying is not enabled for this account."
    );
}

export function assertCanRequestRetirement(user) {
  if (!user) throw new Error("You must be signed in to request retirement.");
  if (isVerifierUser(user))
    throw new Error("Verifiers cannot request retirement. Only buyers can.");
  if (!canBuy(user))
    throw new Error(
      "Your account is set up to create and sell credits. Retirement requests are for buying accounts."
    );
}

export function assertCanApproveProject(user) {
  if (!user) throw new Error("You must be signed in.");
  if (!isVerifierUser(user))
    throw new Error("Only a verifier can approve or reject projects.");
}

export function assertCanApproveRetirement(user) {
  if (!user) throw new Error("You must be signed in.");
  if (!isVerifierUser(user))
    throw new Error("Only a verifier can approve a retirement.");
}

export function assertCanRetireDirect(user) {
  // Spec Patch P1: Direct retirement is blocked; only verifier can approve retirement requests
  throw new Error(
    "Only a verifier can approve a retirement. Direct retirement is not permitted."
  );
}

export function assertCanSetPrice(user, projectOwnerId) {
  if (!user) throw new Error("You must be signed in.");
  if (isVerifierUser(user))
    throw new Error("Verifiers cannot manage project listings.");
  if (!canSell(user))
    throw new Error("Your account is not registered for selling.");
  if (user.id !== projectOwnerId)
    throw new Error("You can only manage your own projects.");
}

// ─── Route guard helper ────────────────────────────────────────────────────────
/**
 * Returns the redirect target if `user` is not allowed on `path`,
 * or null if access is granted.
 */
export function routeGuard(user, path) {
  if (!user) return "/login";

  // Verifier-only routes
  if (path.startsWith("/verifier")) {
    if (!isVerifierUser(user)) return "/dashboard";
  }

  // Sell-only routes
  if (["/submit", "/my-projects"].includes(path)) {
    if (isVerifierUser(user)) return "/verifier/queue";
    if (!canSell(user)) return "/dashboard";
  }

  // Buy-only routes
  if (["/my-credits", "/impact"].includes(path)) {
    if (isVerifierUser(user)) return "/verifier/queue";
    if (!canBuy(user)) return "/dashboard";
  }

  // Retire route (buy only)
  if (path.startsWith("/retire/")) {
    if (isVerifierUser(user)) return "/verifier/queue";
    if (!canBuy(user)) return "/dashboard";
  }

  return null; // access granted
}

// ─── Navbar items per role ────────────────────────────────────────────────────
/**
 * Returns the ordered list of nav items for the given user.
 * Each item: { to, label, icon?, badge? }
 */
export function getNavItems(user) {
  if (!user) return [];

  if (isVerifierUser(user)) {
    return [
      { to: "/verifier/queue",      label: "Review Queue",         badgeKey: "pendingProjects" },
      { to: "/verifier/retirements",label: "Retirement Requests",  badgeKey: "pendingRetirements" },
      { to: "/verifier/history",    label: "Review History" },
      { to: "/verifier/ledger",     label: "Ledger" },
      { to: "/notifications",       label: "Notifications",        badgeKey: "unread" },
    ];
  }

  const sell = canSell(user);
  const buy  = canBuy(user);
  const items = [{ to: "/dashboard", label: "Dashboard" }];

  if (sell) {
    items.push(
      { to: "/submit",                 label: "Submit Project" },
      { to: "/my-projects",            label: "My Projects" },
      { to: "/transactions?tab=sales", label: "Sales" },
    );
  }

  if (buy) {
    items.push(
      { to: "/marketplace", label: "Marketplace" },
      { to: "/my-credits",  label: "My Credits" },
      { to: "/impact",      label: "Impact" },
    );
  }

  items.push({ to: "/transactions",  label: "Transactions" });
  items.push({ to: "/notifications", label: "Notifications", badgeKey: "unread" });

  // Deduplicate by `to`
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.to)) return false;
    seen.add(item.to);
    return true;
  });
}
