/**
 * CarbonChain Wallet Balance Service
 * Manages simulated wallet funds in INR (₹) per address.
 */

const BALANCES_KEY = "cc_wallet_inr_balances";
const DEFAULT_INITIAL_BALANCE = 500000; // ₹5,00,000 default balance

export function getWalletBalance(address) {
  if (!address) return 0;
  const key = address.toLowerCase();
  try {
    const raw = localStorage.getItem(BALANCES_KEY);
    const store = raw ? JSON.parse(raw) : {};
    if (store[key] === undefined) {
      store[key] = DEFAULT_INITIAL_BALANCE;
      localStorage.setItem(BALANCES_KEY, JSON.stringify(store));
    }
    return Number(store[key]);
  } catch {
    return DEFAULT_INITIAL_BALANCE;
  }
}

export function deductWalletBalance(address, amount) {
  if (!address) return 0;
  const key = address.toLowerCase();
  const current = getWalletBalance(address);
  const cost = Number(amount);
  if (current < cost) {
    throw new Error(`Insufficient funds: Required Rs ${cost.toLocaleString("en-IN")}, but available balance is Rs ${current.toLocaleString("en-IN")}.`);
  }
  const next = Math.max(0, current - cost);
  try {
    const raw = localStorage.getItem(BALANCES_KEY);
    const store = raw ? JSON.parse(raw) : {};
    store[key] = next;
    localStorage.setItem(BALANCES_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("cc_balance_updated", { detail: { address: key, balance: next } }));
  } catch {}
  return next;
}

export function addWalletBalance(address, amount) {
  if (!address) return 0;
  const key = address.toLowerCase();
  const current = getWalletBalance(address);
  const next = current + Number(amount);
  try {
    const raw = localStorage.getItem(BALANCES_KEY);
    const store = raw ? JSON.parse(raw) : {};
    store[key] = next;
    localStorage.setItem(BALANCES_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("cc_balance_updated", { detail: { address: key, balance: next } }));
  } catch {}
  return next;
}
