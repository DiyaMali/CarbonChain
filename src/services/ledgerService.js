/**
 * CarbonChain Demo Ledger Service
 * Simulates the on-chain carbon credit lifecycle using localStorage.
 * Hash-chained blocks (SHA-256 via Web Crypto) provide tamper-evidence.
 *
 * USE_DEMO_LEDGER=true  -> all pages use this service
 * USE_DEMO_LEDGER=false -> pages use the real ERC-721 contract
 */

import { CRI_PROJECTS } from "../data/criProjects.js";
import { deductWalletBalance, addWalletBalance } from "./walletBalanceService";

// ─── Storage keys ────────────────────────────────────────────────────────────
const LEDGER_KEY = "cc_ledger_blocks";
const PROJECTS_KEY = "cc_demo_projects";
const CREDITS_KEY = "cc_demo_credits";
const WALLETS_KEY = "cc_demo_wallets";
const SEEDED_KEY = "cc_demo_seeded_v30"; // Phase 1: updated account names per spec §3.1

// ─── Wallet addresses (one per built-in account) ─────────────────────────────
export const DEMO_WALLETS = {
  ipp:      "0xA3f1b8c4d5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0", // Meridian Renewables Ltd
  seller:   "0xA3f1b8c4d5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0", // alias
  buyer:    "0xB4c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0", // Ironbridge Steel and Cement Ltd
  verifier: "0xC5d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1", // Diya Mali, Verification Authority
};

// ─── Seeded accounts (per spec §3.1) ─────────────────────────────────────────
export const DEMO_ACCOUNTS = [
  {
    id: "usr_meridian",
    name: "Meridian Renewables Ltd",
    email: "meridian@carbonchain.in",
    password: "Password123",
    organisation: "Meridian Renewables Ltd",
    capabilities: ["create_sell"],
    role: "Project Owner",
    walletAddress: DEMO_WALLETS.ipp,
    isVerifier: false,
    createdAt: "2025-01-10T08:00:00Z",
  },
  {
    id: "usr_ironbridge",
    name: "Ironbridge Steel and Cement Ltd",
    email: "ironbridge@carbonchain.in",
    password: "Password123",
    organisation: "Ironbridge Steel and Cement Ltd",
    capabilities: ["buy_retire"],
    role: "Buyer",
    walletAddress: DEMO_WALLETS.buyer,
    isVerifier: false,
    createdAt: "2025-01-12T09:00:00Z",
  },
  {
    id: "usr_verifier",
    name: "Diya Mali, Verification Authority",
    email: "diya.mali@carbonchain.in",
    password: "Password123",
    organisation: "Diya Mali, Verification Authority",
    capabilities: [],
    role: "Verifier",
    walletAddress: DEMO_WALLETS.verifier,
    isVerifier: true,
    createdAt: "2025-01-05T08:00:00Z",
  },
];

// Legacy ID aliases — some seed data references old IDs
export const LEGACY_ID_MAP = {
  usr_ipp_demo:      "usr_meridian",
  usr_buyer_demo:    "usr_ironbridge",
  usr_verifier_demo: "usr_verifier",
};

// ─── Image Resolver Helper ───────────────────────────────────────────────────
export function resolveProjectImage(proj) {
  const existing = proj?.imageUrl || proj?.image;
  // If valid image URL provided and it is not an expired/internal aida link
  if (
    existing &&
    typeof existing === "string" &&
    !existing.includes("aida-public") &&
    (existing.startsWith("http://") ||
      existing.startsWith("https://") ||
      existing.startsWith("/images/") ||
      existing.startsWith("data:"))
  ) {
    return existing;
  }

  const str = (
    (proj?.name || "") +
    " " +
    (proj?.id || "") +
    " " +
    (proj?.registryId || "") +
    " " +
    (proj?.projectType || "")
  ).toLowerCase();

  if (str.includes("solar") || str.includes("barhi") || str.includes("photovoltaic") || str.includes("002") || str.includes("081")) {
    return "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80";
  }
  if (str.includes("wind") || str.includes("turbine") || str.includes("kutch") || str.includes("coastal wind") || str.includes("074")) {
    return "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80";
  }
  if (str.includes("biogas") || str.includes("methane") || str.includes("bio-cng") || str.includes("bellary") || str.includes("033")) {
    return "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=1200&q=80";
  }
  if (str.includes("shield") || str.includes("mangrove") || str.includes("004")) {
    return "/images/projects/shield-mangrove.jpg";
  }
  if (str.includes("piplantri") || str.includes("001")) {
    return "/images/projects/piplantri.jpg";
  }
  if (str.includes("reach stacker") || str.includes("erst") || str.includes("003")) {
    return "/images/projects/concor-erst.jpg";
  }
  if (str.includes("green wings") || str.includes("agroforestry") || str.includes("watershed") || str.includes("005") || str.includes("uttarakhand") || str.includes("059")) {
    return "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80";
  }
  if (str.includes("राजसमन्द") || str.includes("rajsamand") || str.includes("006")) {
    return "/images/projects/rajsamand.jpg";
  }
  if (str.includes("hyderabad") || str.includes("metro") || str.includes("007") || str.includes("transport")) {
    return "/images/projects/hyderabad-metro.jpg";
  }

  return "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80";
}

// ─── Predefined Demo Projects ────────────────────────────────────────────────
// Exactly 11 realistic projects:
// - 5 Verified / Marketplace
// - 6 Pending Verification / Verifier Queue (Solar, Afforestation, Waste/Biogas, Wind, Agroforestry)
const CRI_SEED_PROJECTS = CRI_PROJECTS.map((cp) => {
  const isPending = cp.demoLedgerId === "proj_004" || cp.demoLedgerId === "proj_005";
  return {
    id: cp.demoLedgerId,
    registryId: cp.criId,
    slug: cp.slug,
    name: cp.name,
    hindiName: cp.hindiName,
    criStatus: cp.status, // "Listed" or "Planned"
    status: isPending ? "Pending" : "Approved",
    projectType: cp.type,
    location: cp.location,
    state: cp.state,
    estimatedCO2: cp.estCreditsPerYear,
    description: cp.description.join(" "),
    proofUrl: cp.registryUrl,
    sdgs: cp.sdgs.map((s) => s.number),
    sdgScores: cp.sdgs.reduce((acc, s) => {
      acc[s.number] = { scale: 4, intensity: 4 };
      return acc;
    }, {}),
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_ipp_demo",
    verifierNote: isPending
      ? null
      : `Verified in CarbonChain demo. Standard validation protocol aligned with ${cp.methodology}.`,
    verifiedAmount: isPending ? 0 : cp.estCreditsPerYear,
    submittedAt: "2024-03-01T09:00:00Z",
    updatedAt: "2024-04-15T14:00:00Z",
    imageUrl: cp.image,
    developer: cp.developer,
    delegateEntity: cp.delegateEntity,
    delegateUrl: cp.delegateUrl,
    validationBody: cp.validationBody,
    verificationBody: cp.verificationBody,
    scale: cp.scale,
    methodology: cp.methodology,
    classification: cp.classification,
    listedDate: cp.listedDate,
    registeredDate: cp.registeredDate,
    creditingPeriod: cp.creditingPeriod,
    galleryCount: cp.galleryCount,
    historyCount: cp.historyCount,
    documents: cp.documents,
    coordinates: cp.coordinates,
  };
});

const SHOWCASE_SEED_PROJECTS = [
  {
    id: "proj_081",
    registryId: "CC-IND-2026-081",
    slug: "maharashtra-solar-power-grid",
    name: "Maharashtra Solar Power Grid Expansion",
    hindiName: "महाराष्ट्र सौर ऊर्जा ग्रिड विस्तार",
    criStatus: "Planned",
    status: "Pending",
    projectType: "Solar Energy",
    location: "Satara District, Maharashtra, India",
    state: "Maharashtra",
    estimatedCO2: 1000,
    description: "Modern high capacity photovoltaic solar farm supplying zero-emission electricity to the western regional grid.",
    proofUrl: "https://registry.nccf.in/projects",
    sdgs: [7, 8, 9, 13],
    sdgScores: { 7: { scale: 5, intensity: 5 }, 13: { scale: 5, intensity: 5 }, 8: { scale: 4, intensity: 4 } },
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_ipp_demo",
    verifierNote: null,
    verifiedAmount: 0,
    submittedAt: "2024-04-01T08:00:00Z",
    updatedAt: "2024-04-01T08:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
    developer: "Tata Industries Ltd.",
    delegateEntity: "Tata Power Renewables",
    delegateUrl: "https://tatapower.com",
    validationBody: { name: "VCS Lead Signatory", id: "CRI-VVB-000007" },
    verificationBody: { name: "EnviroCheck Services", id: "CRI-VVB-000009" },
    scale: "large",
    methodology: "ACM0002",
    classification: "pa",
    listedDate: "Planned",
    registeredDate: "Polygon Amoy",
    creditingPeriod: "2024 - 2026",
    documents: [],
  },
  {
    id: "proj_074",
    registryId: "CC-IND-2026-074",
    slug: "gujarat-coastal-wind-energy",
    name: "Gujarat Coastal Wind Energy Project Phase II",
    hindiName: "गुजरात तटीय पवन ऊर्जा परियोजना",
    criStatus: "Planned",
    status: "Pending",
    projectType: "Wind Generation",
    location: "Kutch District, Gujarat, India",
    state: "Gujarat",
    estimatedCO2: 2500,
    description: "48.5 MW interconnected wind farm harnessing coastal gusts across Gujarat salt marsh corridors.",
    proofUrl: "https://registry.nccf.in/projects",
    sdgs: [7, 9, 13],
    sdgScores: { 7: { scale: 5, intensity: 5 }, 13: { scale: 5, intensity: 5 } },
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_ipp_demo",
    verifierNote: null,
    verifiedAmount: 0,
    submittedAt: "2024-04-02T10:00:00Z",
    updatedAt: "2024-04-02T10:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80",
    developer: "Reliance New Energy Ltd.",
    delegateEntity: "Reliance Green Power",
    delegateUrl: "https://ril.com",
    validationBody: { name: "Gold Standard VVB", id: "CRI-VVB-000008" },
    verificationBody: { name: "EnviroCheck Services", id: "CRI-VVB-000009" },
    scale: "large",
    methodology: "Gold Standard GS-4421",
    classification: "pa",
    listedDate: "Planned",
    registeredDate: "Polygon Amoy",
    creditingPeriod: "2024 - 2026",
    documents: [],
  },
  {
    id: "proj_059",
    registryId: "CC-IND-2026-059",
    slug: "uttarakhand-community-agroforestry",
    name: "Uttarakhand Community Agroforestry & Watershed Restoration",
    hindiName: "उत्तराखंड सामुदायिक कृषि वानिकी परियोजना",
    criStatus: "Planned",
    status: "Pending",
    projectType: "Forestry & REDD+",
    location: "Nainital, Uttarakhand, India",
    state: "Uttarakhand",
    estimatedCO2: 800,
    description: "Community-driven agroforestry and canopy reforestation restoring Himalayan watershed slopes.",
    proofUrl: "https://registry.nccf.in/projects",
    sdgs: [6, 8, 13, 15],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 15: { scale: 5, intensity: 5 }, 6: { scale: 4, intensity: 4 } },
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_ipp_demo",
    verifierNote: null,
    verifiedAmount: 0,
    submittedAt: "2024-04-03T11:00:00Z",
    updatedAt: "2024-04-03T11:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    developer: "Adani Green Foundations",
    delegateEntity: "Adani Climate Foundation",
    delegateUrl: "https://adanigreen.com",
    validationBody: { name: "Verra ARR-092 VVB", id: "CRI-VVB-000005" },
    verificationBody: { name: "EnviroCheck Services", id: "CRI-VVB-000009" },
    scale: "small",
    methodology: "Verra ARR-092 • VM0047",
    classification: "pa",
    listedDate: "Planned",
    registeredDate: "Polygon Amoy",
    creditingPeriod: "2024 - 2026",
    documents: [],
  },
  {
    id: "proj_033",
    registryId: "CC-IND-2026-033",
    slug: "karnataka-methane-bio-cng",
    name: "Karnataka Rural Methane Capture & Bio-CNG Facility",
    hindiName: "कर्नाटक ग्रामीण मीथेन बायो-सीएनजी सुविधा",
    criStatus: "Planned",
    status: "Pending",
    projectType: "Biogas / Methane",
    location: "Bellary, Karnataka, India",
    state: "Karnataka",
    estimatedCO2: 1200,
    description: "Agricultural waste-to-energy anaerobic digestion capturing fugitive methane for compressed bio-gas.",
    proofUrl: "https://registry.nccf.in/projects",
    sdgs: [7, 12, 13],
    sdgScores: { 7: { scale: 5, intensity: 5 }, 13: { scale: 5, intensity: 5 } },
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_ipp_demo",
    verifierNote: null,
    verifiedAmount: 0,
    submittedAt: "2024-04-04T12:00:00Z",
    updatedAt: "2024-04-04T12:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=1200&q=80",
    developer: "JSW Energy Eco-Solutions",
    delegateEntity: "JSW Green Initiatives",
    delegateUrl: "https://jsw.in",
    validationBody: { name: "UN CDM VVB", id: "CRI-VVB-000006" },
    verificationBody: { name: "EnviroCheck Services", id: "CRI-VVB-000009" },
    scale: "small",
    methodology: "UN CDM-3108 • AMS-III.D",
    classification: "pa",
    listedDate: "Planned",
    registeredDate: "Polygon Amoy",
    creditingPeriod: "2024 - 2026",
    documents: [],
  },
];

const SEED_PROJECTS = [...CRI_SEED_PROJECTS, ...SHOWCASE_SEED_PROJECTS];

// Credit serial number helper
const serialId = (n) => `CCI-MCU-${String(n).padStart(6, "0")}`;

// ─── SDG impact factor calculation ───────────────────────────────────────────
export function computeImpactFactor(sdgScores) {
  if (!sdgScores || Object.keys(sdgScores).length === 0) return 0;
  const scores = Object.entries(sdgScores).map(([, v]) => v.scale * v.intensity);
  const top4 = scores.sort((a, b) => b - a).slice(0, 4);
  const sum = top4.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / 100) * 100) / 100;
}

// SDG name lookup
export const SDG_NAMES = {
  1: "SDG 1: No Poverty",
  5: "SDG 5: Gender Equality",
  6: "SDG 6: Clean Water",
  7: "SDG 7: Affordable & Clean Energy",
  8: "SDG 8: Decent Work & Economic Growth",
  9: "SDG 9: Industry Innovation",
  11: "SDG 11: Sustainable Cities",
  12: "SDG 12: Responsible Consumption",
  13: "SDG 13: Climate Action",
  14: "SDG 14: Life Below Water",
  15: "SDG 15: Life on Land",
};

// ─── Seed credits (Approved projects listed on demo marketplace) ──────────────
// Price is in INR (illustrative)
const SEED_CREDITS = [
  // 1. Piplantri Tree Plantation Project - LISTED
  {
    id: serialId(1),
    tokenIndex: 1,
    projectId: "proj_001",
    amount: 5000,
    price: 850000, // Rs 170/tCO2e
    pricePerTonne: 170,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_ipp_demo",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-04-20T08:00:00Z",
  },
  // 2. Installation of Solar Panels at Multi Modal Logistics Park at Barhi and CONCOR Bhawan - LISTED
  {
    id: serialId(2),
    tokenIndex: 2,
    projectId: "proj_002",
    amount: 250,
    price: 42500, // Rs 170/tCO2e
    pricePerTonne: 170,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_ipp_demo",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-03-05T08:00:00Z",
  },
  // 3. Deployment of Electric Reach Stackers (eRSTs) at CONCOR Terminals - LISTED
  {
    id: serialId(3),
    tokenIndex: 3,
    projectId: "proj_003",
    amount: 3000,
    price: 450000, // Rs 150/tCO2e
    pricePerTonne: 150,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_ipp_demo",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-03-10T08:00:00Z",
  },
  // 6. Rajsamand District Tree Plantation Carbon Credit Project - LISTED
  {
    id: serialId(6),
    tokenIndex: 6,
    projectId: "proj_006",
    amount: 3500,
    price: 595000, // Rs 170/tCO2e
    pricePerTonne: 170,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_ipp_demo",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-04-25T10:00:00Z",
  },
  // 7. Hyderabad Metro Rail (MRTS) Project - LISTED
  {
    id: serialId(7),
    tokenIndex: 7,
    projectId: "proj_007",
    amount: 5000,
    price: 700000, // Rs 140/tCO2e
    pricePerTonne: 140,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_ipp_demo",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-03-25T09:00:00Z",
  },
  // 8. Piplantri - RETIRED for buyer demo / certificates
  {
    id: serialId(8),
    tokenIndex: 8,
    projectId: "proj_001",
    amount: 2000,
    price: 340000,
    pricePerTonne: 170,
    owner: DEMO_WALLETS.buyer,
    ownerUserId: "usr_buyer_demo",
    listed: false,
    retired: true,
    retiredAt: "2024-06-01T12:00:00Z",
    retireeName: "Kiran Mehta",
    onBehalfOf: "EcoBuy Solutions Pvt Ltd",
    reason: "FY24 Corporate Scope 1 & 2 carbon offset commitments",
    message: "Offsets supporting community agroforestry and tree plantation in Piplantri.",
    mintedAt: "2024-04-20T08:00:00Z",
  },
];

// ─── Utility: SHA-256 hash ────────────────────────────────────────────────────
async function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fakeTxHash() {
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

// ─── Block builder ────────────────────────────────────────────────────────────
async function buildBlock(action, payload, prevHash, index) {
  const timestamp = new Date().toISOString();
  const content = JSON.stringify({ index, action, payload, prevHash, timestamp });
  const hash = await sha256(content);
  return { index, action, payload, prevHash, timestamp, hash, txHash: fakeTxHash() };
}

// ─── Ledger persistence ───────────────────────────────────────────────────────
function getLedger() {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLedger(blocks) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(blocks));
}

async function appendBlock(action, payload) {
  const ledger = getLedger();
  const prevHash = ledger.length === 0 ? "0".repeat(64) : ledger[ledger.length - 1].hash;
  const block = await buildBlock(action, payload, prevHash, ledger.length);
  ledger.push(block);
  saveLedger(ledger);
  return block;
}

// ─── Projects persistence ─────────────────────────────────────────────────────
function getProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.map((p) => ({
      ...p,
      imageUrl: resolveProjectImage(p),
    }));
  } catch {
    return [];
  }
}

function saveProjects(projects) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// ─── Credits persistence ──────────────────────────────────────────────────────
function getCredits() {
  try {
    const raw = localStorage.getItem(CREDITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCredits(credits) {
  localStorage.setItem(CREDITS_KEY, JSON.stringify(credits));
}

// ─── Seed genesis blocks for each seeded credit ───────────────────────────────
async function seedGenesisBlocks(projects, credits) {
  const ledger = [];

  // Genesis block
  const genesisContent = JSON.stringify({ index: 0, action: "GENESIS", payload: { message: "CarbonChain demo ledger initialised" }, prevHash: "0".repeat(64), timestamp: "2024-01-01T00:00:00Z" });
  const genesisHash = await sha256(genesisContent);
  ledger.push({
    index: 0,
    action: "GENESIS",
    payload: { message: "CarbonChain demo ledger initialised" },
    prevHash: "0".repeat(64),
    timestamp: "2024-01-01T00:00:00Z",
    hash: genesisHash,
    txHash: "0x" + "0".repeat(64),
  });

  // Project submission blocks
  for (const proj of projects) {
    const prevHash = ledger[ledger.length - 1].hash;
    const idx = ledger.length;
    const ts = proj.submittedAt;
    const payload = { projectId: proj.id, name: proj.name, actor: proj.owner };
    const content = JSON.stringify({ index: idx, action: "PROJECT_SUBMITTED", payload, prevHash, timestamp: ts });
    const hash = await sha256(content);
    ledger.push({ index: idx, action: "PROJECT_SUBMITTED", payload, prevHash, timestamp: ts, hash, txHash: fakeTxHash() });

    // Approved projects get approval block
    if (proj.status === "Approved") {
      const prevHash2 = ledger[ledger.length - 1].hash;
      const idx2 = ledger.length;
      const ts2 = proj.updatedAt;
      const payload2 = { projectId: proj.id, name: proj.name, actor: DEMO_WALLETS.verifier, note: proj.verifierNote };
      const content2 = JSON.stringify({ index: idx2, action: "PROJECT_APPROVED", payload: payload2, prevHash: prevHash2, timestamp: ts2 });
      const hash2 = await sha256(content2);
      ledger.push({ index: idx2, action: "PROJECT_APPROVED", payload: payload2, prevHash: prevHash2, timestamp: ts2, hash: hash2, txHash: fakeTxHash() });
    } else if (proj.status === "Rejected") {
      const prevHash2 = ledger[ledger.length - 1].hash;
      const idx2 = ledger.length;
      const ts2 = proj.updatedAt;
      const payload2 = { projectId: proj.id, name: proj.name, actor: DEMO_WALLETS.verifier, note: proj.verifierNote };
      const content2 = JSON.stringify({ index: idx2, action: "PROJECT_REJECTED", payload: payload2, prevHash: prevHash2, timestamp: ts2 });
      const hash2 = await sha256(content2);
      ledger.push({ index: idx2, action: "PROJECT_REJECTED", payload: payload2, prevHash: prevHash2, timestamp: ts2, hash: hash2, txHash: fakeTxHash() });
    }
  }

  // Credit blocks
  for (const credit of credits) {
    // MINTED
    const prevHashM = ledger[ledger.length - 1].hash;
    const idxM = ledger.length;
    const payloadM = { creditId: credit.id, projectId: credit.projectId, amount: credit.amount, actor: credit.owner };
    const contentM = JSON.stringify({ index: idxM, action: "CREDIT_MINTED", payload: payloadM, prevHash: prevHashM, timestamp: credit.mintedAt });
    const hashM = await sha256(contentM);
    ledger.push({ index: idxM, action: "CREDIT_MINTED", payload: payloadM, prevHash: prevHashM, timestamp: credit.mintedAt, hash: hashM, txHash: fakeTxHash() });

    // LISTED (if listed or was ever listed)
    if (credit.listed || credit.retired) {
      const prevHashL = ledger[ledger.length - 1].hash;
      const idxL = ledger.length;
      const tsL = credit.purchasedAt
        ? new Date(new Date(credit.purchasedAt).getTime() - 7 * 24 * 3600 * 1000).toISOString()
        : new Date(new Date(credit.mintedAt).getTime() + 2 * 24 * 3600 * 1000).toISOString();
      const payloadL = { creditId: credit.id, price: credit.price, pricePerTonne: credit.pricePerTonne, actor: credit.listed ? credit.owner : DEMO_WALLETS.ipp };
      const contentL = JSON.stringify({ index: idxL, action: "CREDIT_LISTED", payload: payloadL, prevHash: prevHashL, timestamp: tsL });
      const hashL = await sha256(contentL);
      ledger.push({ index: idxL, action: "CREDIT_LISTED", payload: payloadL, prevHash: prevHashL, timestamp: tsL, hash: hashL, txHash: fakeTxHash() });
    }

    // PURCHASED
    if (credit.purchasedAt) {
      const prevHashP = ledger[ledger.length - 1].hash;
      const idxP = ledger.length;
      const payloadP = { creditId: credit.id, amount: credit.amount, price: credit.price, buyer: credit.owner, seller: DEMO_WALLETS.ipp };
      const contentP = JSON.stringify({ index: idxP, action: "CREDIT_PURCHASED", payload: payloadP, prevHash: prevHashP, timestamp: credit.purchasedAt });
      const hashP = await sha256(contentP);
      ledger.push({ index: idxP, action: "CREDIT_PURCHASED", payload: payloadP, prevHash: prevHashP, timestamp: credit.purchasedAt, hash: hashP, txHash: fakeTxHash() });
    }

    // RETIRED
    if (credit.retired && credit.retiredAt) {
      const prevHashR = ledger[ledger.length - 1].hash;
      const idxR = ledger.length;
      const payloadR = { creditId: credit.id, amount: credit.amount, retireeName: credit.retireeName, onBehalfOf: credit.onBehalfOf, reason: credit.reason, actor: credit.owner };
      const contentR = JSON.stringify({ index: idxR, action: "CREDIT_RETIRED", payload: payloadR, prevHash: prevHashR, timestamp: credit.retiredAt });
      const hashR = await sha256(contentR);
      ledger.push({ index: idxR, action: "CREDIT_RETIRED", payload: payloadR, prevHash: prevHashR, timestamp: credit.retiredAt, hash: hashR, txHash: fakeTxHash() });
    }
  }

  saveLedger(ledger);
}

// ─── One-time seeding ─────────────────────────────────────────────────────────
export async function seedIfNeeded(force = false) {
  const currentKey = localStorage.getItem(SEEDED_KEY);
  const existing = getProjects();

  // Reseed only if forced, or never seeded, or no projects exist
  if (force || currentKey !== "true" || !existing || existing.length === 0) {
    localStorage.removeItem(LEDGER_KEY);
    localStorage.removeItem(PROJECTS_KEY);
    localStorage.removeItem(CREDITS_KEY);
    localStorage.removeItem("cc_verifier_history");
    localStorage.removeItem("cc_verifier_processed");
    for (let i = 1; i <= 30; i++) {
      localStorage.removeItem(`cc_demo_seeded_v${i}`);
    }

    saveProjects(SEED_PROJECTS);
    saveCredits(SEED_CREDITS);
    await seedGenesisBlocks(SEED_PROJECTS, SEED_CREDITS);

    localStorage.setItem(SEEDED_KEY, "true");
  }
}

// ─── Reset demo data ──────────────────────────────────────────────────────────
export async function resetDemoData() {
  localStorage.removeItem(LEDGER_KEY);
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(CREDITS_KEY);
  localStorage.removeItem("cc_verifier_history");
  localStorage.removeItem("cc_verifier_processed");
  for (let i = 1; i <= 30; i++) {
    localStorage.removeItem(`cc_demo_seeded_v${i}`);
  }
  localStorage.removeItem(SEEDED_KEY);
  await seedIfNeeded(true);
}

// ─── Helper: simulate ledger confirmation delay ───────────────────────────────
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/** Get all projects */
export function getAllProjects() {
  return getProjects();
}

/** Get a single project */
export function getProject(projectId) {
  return getProjects().find((p) => p.id === projectId) || null;
}

/** Get all credits */
export function getAllCredits() {
  return getCredits();
}

/** Get a single credit */
export function getCredit(creditId) {
  return getCredits().find((c) => c.id === creditId) || null;
}

/** Get ledger blocks for a specific credit */
export function getHistory(creditId) {
  return getLedger().filter(
    (b) => b.payload && b.payload.creditId === creditId
  );
}

/** Get all ledger blocks */
export function getAllLedgerBlocks() {
  return getLedger();
}

/** Get a single ledger block by index */
export function getLedgerBlock(index) {
  return getLedger()[index] || null;
}

/** Platform stats computed from ledger */
export function getPlatformStats() {
  const projects = getProjects();
  const credits = getCredits();
  const retiredCredits = credits.filter((c) => c.retired);

  return {
    projectCount: projects.length,
    approvedProjects: projects.filter((p) => p.status === "Approved").length,
    pendingProjects: projects.filter((p) => p.status === "Pending").length,
    creditCount: credits.length,
    listedCredits: credits.filter((c) => c.listed && !c.retired).length,
    retiredCount: retiredCredits.length,
    retiredTonnes: retiredCredits.reduce((sum, c) => sum + (c.amount || 0), 0),
    blockCount: getLedger().length,
  };
}

/** Stats for a specific wallet/user */
export function getWalletStats(walletAddress) {
  if (!walletAddress) return null;
  const credits = getCredits();
  const projects = getProjects();

  const myCredits = credits.filter((c) => c.owner === walletAddress && !c.retired);
  const myRetired = credits.filter((c) => c.retired && c.owner === walletAddress);
  const myListed = credits.filter((c) => c.listed && !c.retired && c.owner === walletAddress);
  const myProjects = projects.filter((p) => p.owner === walletAddress);

  // Recent activity from ledger
  const ledger = getLedger();
  const recentActivity = ledger
    .filter((b) => b.payload && (b.payload.actor === walletAddress || b.payload.buyer === walletAddress || b.payload.seller === walletAddress))
    .slice(-10)
    .reverse();

  return {
    submittedProjectsCount: myProjects.length,
    ownedCreditsCount: myCredits.length,
    listedCreditsCount: myListed.length,
    retiredCreditsCount: myRetired.length,
    retiredTonnes: myRetired.reduce((sum, c) => sum + (c.amount || 0), 0),
    recentActivity,
    myProjects,
    myCredits,
    myRetired,
    myListed,
  };
}

/** Check if a wallet address is a verifier */
export function isVerifier(walletAddress) {
  const user = DEMO_ACCOUNTS.find((a) => a.walletAddress === walletAddress);
  return user ? user.isVerifier : false;
}

// ─── WRITE OPERATIONS (async, add ledger block, simulate delay) ───────────────

/** Submit a new project */
export async function submitProject(ownerWallet, ownerUserId, { name, projectType, location, estimatedCO2, description, proofUrl, imageUrl, sdgs, sdgScores }) {
  await delay(1500);
  const id = `proj_${Date.now()}`;
  const now = new Date().toISOString();
  const newProject = {
    id,
    name,
    projectType,
    location,
    estimatedCO2: Number(estimatedCO2),
    description,
    proofUrl: proofUrl || "",
    imageUrl: imageUrl || "",
    sdgs: sdgs || [13],
    sdgScores: sdgScores || { 13: { scale: 5, intensity: 5 } },
    status: "Pending",
    owner: ownerWallet,
    ownerUserId,
    verifierNote: "",
    verifiedAmount: 0,
    submittedAt: now,
    updatedAt: now,
    imageType: projectType.toLowerCase(),
  };
  const projects = getProjects();
  projects.push(newProject);
  saveProjects(projects);

  const block = await appendBlock("PROJECT_SUBMITTED", { projectId: id, name, actor: ownerWallet });
  return { projectId: id, block, project: newProject };
}

/** Approve a project (verifier only) */
export async function approveProject(projectId, verifierWallet, { verifiedAmount, note }) {
  await delay(1500);
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === projectId || p.registryId === projectId);
  if (idx === -1) throw new Error("Project not found.");

  const proj = projects[idx];
  if (proj.status !== "Pending" && proj.status !== "Sent Back for Review") {
    throw new Error("Only pending or returned projects can be approved.");
  }

  const cleanAmount = Number(verifiedAmount || proj.estimatedCO2);
  const pricePerTonne = 150; // default illustrative price

  projects[idx] = {
    ...proj,
    status: "Approved",
    criStatus: "Listed",
    verifierNote: note || "Verified by Lead MRV Auditor Mira Iyer.",
    verifiedAmount: cleanAmount,
    returnReason: null,
    returnedAt: null,
    updatedAt: new Date().toISOString()
  };
  saveProjects(projects);

  // Check if credit already exists for this project (e.g. if previously approved and sent back)
  const credits = getCredits();
  const existingCreditIdx = credits.findIndex(
    (c) => (c.projectId === proj.id || c.projectId === proj.registryId) && !c.retired
  );

  let creditId;
  if (existingCreditIdx !== -1) {
    creditId = credits[existingCreditIdx].id;
    credits[existingCreditIdx] = {
      ...credits[existingCreditIdx],
      amount: cleanAmount,
      price: cleanAmount * (credits[existingCreditIdx].pricePerTonne || pricePerTonne),
      listed: true,
      delistedReason: null,
      updatedAt: new Date().toISOString(),
    };
    saveCredits(credits);
    await appendBlock("CREDIT_LISTED", { creditId, price: credits[existingCreditIdx].price, pricePerTonne, actor: proj.owner, note: "Re-listed following verifier re-audit" });
  } else {
    const nextIndex = credits.length + 1;
    creditId = serialId(nextIndex);
    const newCredit = {
      id: creditId,
      tokenIndex: nextIndex,
      projectId: proj.id,
      amount: cleanAmount,
      price: cleanAmount * pricePerTonne,
      pricePerTonne,
      owner: proj.owner,
      ownerUserId: proj.ownerUserId,
      listed: true, // Automatically listed on marketplace for trading
      retired: false,
      retiredAt: null,
      retireeName: "",
      onBehalfOf: "",
      reason: "",
      message: "",
      mintedAt: new Date().toISOString(),
    };
    credits.push(newCredit);
    saveCredits(credits);
    await appendBlock("CREDIT_MINTED", { creditId, projectId: proj.id, amount: newCredit.amount, actor: proj.owner });
    await appendBlock("CREDIT_LISTED", { creditId, price: newCredit.price, pricePerTonne, actor: proj.owner });
  }

  const block = await appendBlock("PROJECT_APPROVED", {
    projectId: proj.id,
    actor: verifierWallet || DEMO_WALLETS.verifier,
    note,
    verifiedAmount: cleanAmount
  });

  return { block, creditId };
}

/** Reject a project (verifier only) */
export async function rejectProject(projectId, verifierWallet, { note }) {
  await delay(1500);
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === projectId || p.registryId === projectId);
  if (idx === -1) throw new Error("Project not found.");
  
  const proj = projects[idx];
  if (proj.status !== "Pending" && proj.status !== "Sent Back for Review") {
    throw new Error("Only pending or returned projects can be rejected.");
  }

  projects[idx] = {
    ...proj,
    status: "Rejected",
    criStatus: "Rejected",
    verifierNote: note || "",
    updatedAt: new Date().toISOString()
  };
  saveProjects(projects);

  // Delist any active credits for this project
  const credits = getCredits();
  const updatedCredits = credits.map((c) => {
    if ((c.projectId === proj.id || c.projectId === proj.registryId) && !c.retired) {
      return { ...c, listed: false, delistedReason: "Project rejected by verifier" };
    }
    return c;
  });
  saveCredits(updatedCredits);

  const block = await appendBlock("PROJECT_REJECTED", { projectId: proj.id, actor: verifierWallet || DEMO_WALLETS.verifier, note });
  return { block };
}

/** Send a project back for review from Marketplace to Verifier Queue (verifier only) */
export async function sendBackForReview(projectId, verifierWallet, { reason, note } = {}) {
  await delay(1200);
  const projects = getProjects();
  const idx = projects.findIndex(
    (p) =>
      p.id === projectId ||
      p.registryId === projectId ||
      (p.slug && p.slug === projectId) ||
      (p.name && p.name.toLowerCase() === String(projectId).toLowerCase())
  );
  if (idx === -1) throw new Error("Project not found in system.");

  const proj = projects[idx];
  const now = new Date().toISOString();
  const returnReason = reason || note || "Undergoing verification re-audit by Lead MRV Auditor Mira Iyer.";

  projects[idx] = {
    ...proj,
    status: "Sent Back for Review",
    criStatus: "Under Review",
    verifierNote: returnReason,
    returnReason: returnReason,
    returnedAt: now,
    updatedAt: now,
  };
  saveProjects(projects);

  // Delist active credits for this project from marketplace
  const credits = getCredits();
  let delistedAny = false;
  const updatedCredits = credits.map((c) => {
    if ((c.projectId === proj.id || c.projectId === proj.registryId) && c.listed && !c.retired) {
      delistedAny = true;
      return { ...c, listed: false, delistedReason: "Project sent back for review" };
    }
    return c;
  });
  if (delistedAny) {
    saveCredits(updatedCredits);
  }

  // Remove matching IDs from cc_verifier_processed in localStorage so it re-appears in Mira's queue
  try {
    const raw = localStorage.getItem("cc_verifier_processed");
    if (raw) {
      const processed = JSON.parse(raw);
      const filtered = processed.filter(
        (id) =>
          id !== proj.id &&
          id !== proj.registryId &&
          id !== proj.id?.toUpperCase() &&
          id !== proj.registryId?.toUpperCase()
      );
      localStorage.setItem("cc_verifier_processed", JSON.stringify(filtered));
    }
  } catch {}

  const block = await appendBlock("PROJECT_SENT_BACK_FOR_REVIEW", {
    projectId: proj.id,
    actor: verifierWallet || DEMO_WALLETS.verifier,
    reason: returnReason,
    timestamp: now,
  });

  return { block, project: projects[idx] };
}

/** List a credit on the marketplace */
export async function listCredit(creditId, ownerWallet, { price, pricePerTonne }) {
  await delay(1500);
  const credits = getCredits();
  const idx = credits.findIndex((c) => c.id === creditId);
  if (idx === -1) throw new Error("Credit not found.");
  if (credits[idx].retired) throw new Error("This credit is retired and locked permanently.");
  if (credits[idx].owner !== ownerWallet) throw new Error("Only the owner can list this credit.");

  credits[idx] = { ...credits[idx], listed: true, price: Number(price), pricePerTonne: Number(pricePerTonne) };
  saveCredits(credits);

  const block = await appendBlock("CREDIT_LISTED", { creditId, price, pricePerTonne, actor: ownerWallet });
  return { block };
}

/** Cancel a credit listing */
export async function cancelListing(creditId, ownerWallet) {
  await delay(1200);
  const credits = getCredits();
  const idx = credits.findIndex((c) => c.id === creditId);
  if (idx === -1) throw new Error("Credit not found.");
  if (credits[idx].owner !== ownerWallet) throw new Error("Only the owner can cancel this listing.");

  credits[idx] = { ...credits[idx], listed: false };
  saveCredits(credits);

  const block = await appendBlock("CREDIT_DELISTED", { creditId, actor: ownerWallet });
  return { block };
}

/** Buy a credit */
export async function buyCredit(creditId, buyerWallet, buyerUserId, requestedAmount) {
  await delay(1500);
  const credits = getCredits();
  const idx = credits.findIndex((c) => c.id === creditId);
  if (idx === -1) throw new Error("Credit not found.");

  const credit = credits[idx];
  if (!credit.listed) throw new Error("This credit is not listed for sale.");
  if (credit.retired) throw new Error("This credit is retired and locked permanently.");
  if (credit.owner === buyerWallet) throw new Error("You cannot buy your own credit.");

  const availableAmount = Number(credit.amount || 1);
  const purchaseQty = requestedAmount && Number(requestedAmount) > 0
    ? Math.min(Number(requestedAmount), availableAmount)
    : availableAmount;

  const seller = credit.owner;
  const pricePerTonnePaid = Number(credit.pricePerTonne || Math.round((credit.price || 0) / (availableAmount || 1)));
  const pricePaid = purchaseQty * pricePerTonnePaid;

  // Deduct money from buyer's wallet balance
  if (buyerWallet) {
    deductWalletBalance(buyerWallet, pricePaid);
    if (seller) {
      addWalletBalance(seller, pricePaid);
    }
  }

  const purchasedAt = new Date().toISOString();
  let resultingCredit = null;

  if (purchaseQty < availableAmount) {
    // Partial purchase: update the remaining available listing
    const remainingQty = availableAmount - purchaseQty;
    credits[idx] = {
      ...credit,
      amount: remainingQty,
      price: remainingQty * pricePerTonnePaid,
    };

    // Create a new acquired credit for the buyer
    const newCreditId = `${credit.id}-pch-${Date.now()}`;
    resultingCredit = {
      ...credit,
      id: newCreditId,
      amount: purchaseQty,
      price: pricePaid,
      pricePerTonne: pricePerTonnePaid,
      listed: false,
      owner: buyerWallet,
      ownerUserId: buyerUserId,
      purchasedAt,
      paidPrice: pricePaid,
      paidPricePerTonne: pricePerTonnePaid,
    };
    credits.push(resultingCredit);
  } else {
    // Full purchase: transfer existing credit
    resultingCredit = {
      ...credit,
      listed: false,
      owner: buyerWallet,
      ownerUserId: buyerUserId,
      purchasedAt,
      paidPrice: pricePaid,
      paidPricePerTonne: pricePerTonnePaid,
    };
    credits[idx] = resultingCredit;
  }

  saveCredits(credits);

  const block = await appendBlock("CREDIT_PURCHASED", {
    creditId: resultingCredit.id,
    originalCreditId: credit.id,
    amount: purchaseQty,
    price: pricePaid,
    pricePerTonne: pricePerTonnePaid,
    buyer: buyerWallet,
    seller,
    purchasedAt,
  });

  // Track in persistent purchases history
  try {
    const raw = localStorage.getItem("cc_purchases_history");
    const history = raw ? JSON.parse(raw) : [];
    history.unshift({
      id: `pch_${Date.now()}`,
      creditId: resultingCredit.id,
      projectId: credit.projectId,
      projectName: credit.project?.name || credit.projectName || "Carbon Project",
      projectType: credit.project?.projectType || "Clean Energy",
      amount: purchaseQty,
      pricePaid,
      pricePerTonnePaid,
      buyerWallet,
      sellerWallet: seller,
      blockIndex: block.index,
      blockHash: block.hash,
      purchasedAt,
    });
    localStorage.setItem("cc_purchases_history", JSON.stringify(history));
  } catch {}

  return { block, credit: resultingCredit, purchaseAmount: purchaseQty, pricePaid };
}

/** Get purchase history for a buyer wallet */
export function getPurchasesHistory(buyerWallet) {
  try {
    const raw = localStorage.getItem("cc_purchases_history");
    const history = raw ? JSON.parse(raw) : [];
    if (!buyerWallet) return history;
    return history.filter((h) => !h.buyerWallet || h.buyerWallet?.toLowerCase() === buyerWallet.toLowerCase());
  } catch {
    return [];
  }
}

/** Get all transaction events (purchases, retirements, listings, mints) from ledger and purchase store */
export function getAllTransactions(buyerWallet = null) {
  const ledger = getLedger();
  const purchases = getPurchasesHistory(buyerWallet);
  const credits = getCredits();
  const projects = getProjects();

  // Combine and format transactions from ledger blocks
  const txs = ledger
    .filter((b) => b.action && b.action !== "GENESIS")
    .map((b) => {
      const payload = b.payload || {};
      const credit = credits.find((c) => c.id === payload.creditId) || {};
      const proj = projects.find((p) => p.id === payload.projectId || p.id === credit.projectId) || {};

      let type = "TRANSACTION";
      let quantity = payload.amount || credit.amount || 0;
      let amountPaid = payload.price || credit.price || 0;
      let status = "Confirmed";

      if (b.action === "CREDIT_PURCHASED") {
        type = "Purchase";
      } else if (b.action === "CREDIT_RETIRED") {
        type = "Retirement";
      } else if (b.action === "CREDIT_LISTED") {
        type = "Listing";
      } else if (b.action === "CREDIT_DELISTED") {
        type = "Delisted";
      } else if (b.action === "CREDIT_MINTED") {
        type = "Minting";
      } else if (b.action === "PROJECT_APPROVED") {
        type = "Verification";
        quantity = payload.verifiedAmount || 0;
      } else if (b.action === "PROJECT_SUBMITTED") {
        type = "Submission";
      }

      return {
        id: `tx_block_${b.index}`,
        blockIndex: b.index,
        blockHash: b.hash,
        txHash: b.txHash || `0x${b.hash.slice(0, 40)}`,
        shortTxHash: b.txHash ? `${b.txHash.slice(0, 6)}...${b.txHash.slice(-4)}` : `${b.hash.slice(0, 6)}...${b.hash.slice(-4)}`,
        action: b.action,
        type,
        date: new Date(b.timestamp).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        timestamp: b.timestamp,
        project: proj.name || payload.name || credit.project?.name || "Carbon Credit Project",
        projectType: proj.projectType || credit.project?.projectType || "Clean Energy",
        tokenId: payload.creditId || credit.id || `#${b.index + 1040}`,
        quantity,
        amountPaid,
        status,
        actor: payload.actor || payload.buyer || "",
        buyer: payload.buyer || payload.actor || "",
        seller: payload.seller || "",
      };
    })
    .reverse();

  return txs;
}

/** Retire a credit */
export async function retireCredit(creditId, ownerWallet, { retireeName, onBehalfOfName, onBehalfOfWallet, message, reason }) {
  await delay(1800);
  const credits = getCredits();
  const idx = credits.findIndex((c) => c.id === creditId);
  if (idx === -1) throw new Error("Credit not found.");

  const credit = credits[idx];
  if (credit.retired) throw new Error("This credit is retired and locked permanently.");
  if (credit.owner !== ownerWallet) throw new Error("Only the owner can retire this credit.");
  if (credit.listed) throw new Error("Cancel the marketplace listing before retiring this credit.");

  credits[idx] = {
    ...credit,
    listed: false,
    retired: true,
    retiredAt: new Date().toISOString(),
    retireeName: retireeName || "",
    onBehalfOf: onBehalfOfName || "",
    onBehalfOfWallet: onBehalfOfWallet || "",
    reason: reason || "",
    message: message || "",
  };
  saveCredits(credits);

  const block = await appendBlock("CREDIT_RETIRED", { creditId, amount: credit.amount, retireeName, onBehalfOf: onBehalfOfName, reason, actor: ownerWallet });
  return { block };
}

// ─── TAMPER EVIDENCE ──────────────────────────────────────────────────────────

/** Verify chain integrity by recomputing all hashes */
export async function verifyChainIntegrity() {
  const blocks = getLedger();
  if (blocks.length === 0) return { intact: true, checked: 0 };

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const prevHash = i === 0 ? "0".repeat(64) : blocks[i - 1].hash;

    if (b.prevHash !== prevHash) {
      return { intact: false, failedAt: i, reason: `Block ${i}: prevHash mismatch` };
    }

    // Recompute hash
    const content = JSON.stringify({ index: b.index, action: b.action, payload: b.payload, prevHash: b.prevHash, timestamp: b.timestamp });
    const recomputed = await sha256(content);
    if (recomputed !== b.hash) {
      return { intact: false, failedAt: i, reason: `Block ${i}: hash mismatch (tampered?)` };
    }
  }

  return { intact: true, checked: blocks.length };
}

/** DEV ONLY: Tamper with a block to demo tamper detection */
export function tamperBlock(index, newValue) {
  const blocks = getLedger();
  if (!blocks[index]) return false;
  blocks[index] = { ...blocks[index], payload: { ...blocks[index].payload, _tampered: newValue || "TAMPERED" } };
  saveLedger(blocks);
  return true;
}
