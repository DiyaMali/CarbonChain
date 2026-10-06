/**
 * CarbonChain Ledger Service
 * Provides the on-chain carbon credit lifecycle using SHA-256 hash-chained blocks.
 * Hash-chained blocks provide cryptographic tamper-evidence.
 *
 * USE_DEMO_LEDGER=true  -> all pages use this service
 * USE_DEMO_LEDGER=false -> pages use the real ERC-721 contract
 */

import { CRI_PROJECTS } from "../data/criProjects.js";
import { deductWalletBalance, addWalletBalance } from "./walletBalanceService.js";
import { addNotification } from "./notificationService.js";
import {
  assertCanApproveRetirement,
  assertCanRequestRetirement,
  assertCanSubmitProject,
  assertCanBuy,
  canSell,
  canBuy,
  isVerifierUser,
} from "./roleService.js";

// ─── Storage keys ────────────────────────────────────────────────────────────
export const LEDGER_KEY = "cc_ledger_blocks";
export const PROJECTS_KEY = "cc_demo_projects";
export const CREDITS_KEY = "cc_demo_credits";
export const WALLETS_KEY = "cc_demo_wallets";
export const HOLDINGS_KEY = "cc_holdings";
export const RETIREMENTS_KEY = "cc_retirement_requests";
export const PURCHASES_KEY = "cc_purchases_history";
export const PLATFORM_FEE_PERCENT = 0.01; // 1% platform fee per spec §4 and §91
const SEEDED_KEY = "cc_demo_seeded_v33"; // Phase 2: complete spec §17 seed state

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
    capabilities: ["sell"],
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
    capabilities: ["buy"],
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

// Legacy ID aliases  -  some seed data references old IDs
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

// ─── Predefined Projects per Spec §17 ─────────────────────────────────────────
// Seven CRI projects (Approved, listed with CarbonChain tokens at indicative prices)
const CRI_SEED_PROJECTS = CRI_PROJECTS.map((cp) => {
  return {
    id: cp.demoLedgerId,
    registryId: cp.criId,
    slug: cp.slug,
    name: cp.name,
    hindiName: cp.hindiName,
    criStatus: cp.status, // "Listed" or "Planned"
    status: "Approved", // All 7 CRI projects approved & listed per spec §17
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
    ownerUserId: "usr_meridian",
    verifierNote: `Verified in CarbonChain. Standard validation protocol aligned with ${cp.methodology}.`,
    verifiedAmount: cp.estCreditsPerYear,
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

// Meridian Renewables Ltd seeded projects per spec §17:
// 2 SUBMITTED preset-style projects (in Verifier review queue)
// 1 REJECTED with reason (allows Edit & resubmit)
// 1 APPROVED_LISTED (with past sales to Ironbridge)
const MERIDIAN_SEED_PROJECTS = [
  // 1. Sinnar Solar Park - Pending Review
  {
    id: "proj_sinnar",
    registryId: "CC-NSK-2026-001",
    slug: "sinnar-solar-park-5mw",
    name: "Sinnar Solar Park (5 MW)",
    criStatus: "Planned",
    status: "Pending",
    projectType: "Solar",
    location: "Sinnar, Nashik, Maharashtra",
    state: "Maharashtra",
    estimatedCO2: 6241,
    verifiedAmount: 0,
    askingPrice: 450,
    listQuantity: 6000,
    description: "5 MW grid-connected ground mounted photovoltaic solar installation in the Sinnar industrial belt of Nashik district. Feeds clean zero-emission renewable energy into the western Maharashtra grid, reducing reliance on thermal power plants.",
    proofUrl: "https://carbonchain.network/registry/sinnar-solar",
    sdgs: [13, 7, 9, 12],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 7: { scale: 5, intensity: 4 }, 9: { scale: 4, intensity: 4 }, 12: { scale: 3, intensity: 3 } },
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    developer: "Meridian Renewables Ltd",
    delegateEntity: "Meridian Clean Power Division",
    delegateUrl: "https://carbonchain.network",
    validationBody: { name: "VCS Lead Signatory", id: "CRI-VVB-000007" },
    verificationBody: { name: "Diya Mali, Verification Authority", id: "CRI-VVB-000009" },
    scale: "small",
    methodology: "ACM0002  -  Grid-connected electricity generation from renewable sources",
    classification: "pa",
    listedDate: "Pending Review",
    registeredDate: "CarbonChain Network",
    creditingPeriod: "2026 - 2036",
    submittedAt: "2026-02-12T09:00:00Z",
    updatedAt: "2026-02-12T09:00:00Z",
    photoFile: "solar-sinnar.jpg",
    imageUrl: "/images/presets/solar-sinnar.jpg",
    documents: [
      { name: "Sinnar_Solar_Grid_Interconnection_Report.pdf", size: 3450000, type: "pdf", hash: "4a28f72c089b3f3b90ec721a361df4b4f53be93a4050aa3e12cbb5507ad98711" },
      { name: "Sinnar_PV_Generation_Model_P50_P90.xlsx", size: 1240000, type: "xlsx", hash: "7c12eb609fca940b5c1921359aa59f6ad9321ba99d255f056ecadfa54004c3e8" },
    ],
  },
  // 2. Dindori Grape-Belt Agroforestry - Pending Review
  {
    id: "proj_dindori",
    registryId: "CC-NSK-2026-002",
    slug: "dindori-grape-belt-agroforestry",
    name: "Dindori Grape-Belt Agroforestry Programme",
    criStatus: "Planned",
    status: "Pending",
    projectType: "Agroforestry",
    location: "Dindori, Nashik, Maharashtra",
    state: "Maharashtra",
    estimatedCO2: 1224,
    verifiedAmount: 0,
    askingPrice: 1800,
    listQuantity: 1200,
    description: "Multi-strata agroforestry and shelterbelt plantation across 200 hectares of smallholder grape vineyards in Dindori taluka. Improves soil organic carbon, enhances microclimate resilience, and sequesters atmospheric CO2.",
    proofUrl: "https://carbonchain.network/registry/dindori-agroforestry",
    sdgs: [13, 15, 1, 8],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 15: { scale: 5, intensity: 5 }, 1: { scale: 4, intensity: 4 }, 8: { scale: 4, intensity: 4 } },
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    developer: "Meridian Renewables Ltd",
    delegateEntity: "Meridian Agroforestry Hub",
    delegateUrl: "https://carbonchain.network",
    validationBody: { name: "Verra ARR Lead Auditor", id: "CRI-VVB-000005" },
    verificationBody: { name: "Diya Mali, Verification Authority", id: "CRI-VVB-000009" },
    scale: "small",
    methodology: "AR-ACM0003  -  Afforestation and reforestation of lands including agroforestry",
    classification: "pa",
    listedDate: "Pending Review",
    registeredDate: "CarbonChain Network",
    creditingPeriod: "2026 - 2046",
    submittedAt: "2026-02-14T11:30:00Z",
    updatedAt: "2026-02-14T11:30:00Z",
    photoFile: "agroforestry-dindori.jpg",
    imageUrl: "/images/presets/agroforestry-dindori.jpg",
    documents: [
      { name: "Dindori_Agroforestry_Biomass_Baseline_2026.pdf", size: 4890000, type: "pdf", hash: "9e1bc8202970bcfeb46ea60eec87cd7a1f5926ec97cb0a623910ef5e96a4b123" },
    ],
  },
  // 3. Satara Ridge Wind Farm - Rejected with reason
  {
    id: "proj_satara",
    registryId: "CC-STR-2026-003",
    slug: "satara-ridge-wind-farm-phase-1",
    name: "Satara Ridge Wind Farm Phase 1 (10 MW)",
    criStatus: "Planned",
    status: "Rejected",
    projectType: "Wind",
    location: "Satara district, Maharashtra",
    state: "Maharashtra",
    estimatedCO2: 17739,
    verifiedAmount: 0,
    askingPrice: 500,
    listQuantity: 17000,
    description: "10 MW wind power generation installation sited across the high wind-velocity corridors of Satara Ridge in western Maharashtra. Contributes clean power directly to the regional grid under Clean Development Mechanism protocols.",
    proofUrl: "https://carbonchain.network/registry/satara-wind",
    sdgs: [13, 7, 9, 12],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 7: { scale: 5, intensity: 5 }, 9: { scale: 4, intensity: 4 }, 12: { scale: 3, intensity: 3 } },
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    developer: "Meridian Renewables Ltd",
    delegateEntity: "Meridian Wind Operations",
    delegateUrl: "https://carbonchain.network",
    validationBody: { name: "Gold Standard VVB", id: "CRI-VVB-000008" },
    verificationBody: { name: "Diya Mali, Verification Authority", id: "CRI-VVB-000009" },
    scale: "large",
    methodology: "ACM0002  -  Grid-connected electricity generation from renewable sources",
    classification: "pa",
    listedDate: "Rejected",
    registeredDate: "CarbonChain Network",
    creditingPeriod: "2026 - 2036",
    submittedAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-05T15:00:00Z",
    verifierNote: "Quantity not supported. Turbine operational telemetry and grid interconnection logs for Q3/Q4 are missing from submission. Resubmit with metering logs.",
    photoFile: "wind-satara.jpg",
    imageUrl: "/images/presets/wind-satara.jpg",
    documents: [],
  },
  // 4. Trimbakeshwar-Igatpuri Hill Afforestation - Approved and Listed
  {
    id: "proj_trimbak",
    registryId: "CC-NSK-2026-004",
    slug: "trimbakeshwar-igatpuri-hill-afforestation",
    name: "Trimbakeshwar-Igatpuri Hill Afforestation",
    criStatus: "Listed",
    status: "Approved",
    projectType: "Afforestation",
    location: "Trimbakeshwar and Igatpuri, Nashik, Maharashtra",
    state: "Maharashtra",
    estimatedCO2: 2160,
    verifiedAmount: 2100,
    askingPrice: 1600,
    listQuantity: 2100,
    description: "Restoration of 500 hectares of degraded hill catchment areas in Trimbakeshwar and Igatpuri talukas of Nashik district. Indigenous broadleaf species planting stabilizes Upper Godavari watershed slopes while capturing carbon.",
    proofUrl: "https://carbonchain.network/registry/trimbakeshwar-afforestation",
    sdgs: [13, 15, 6, 8],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 15: { scale: 5, intensity: 5 }, 6: { scale: 4, intensity: 4 }, 8: { scale: 4, intensity: 4 } },
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    developer: "Meridian Renewables Ltd",
    delegateEntity: "Meridian Watershed Forestry",
    delegateUrl: "https://carbonchain.network",
    validationBody: { name: "NCCF Forest Certification Council", id: "CRI-VVB-000004" },
    verificationBody: { name: "Diya Mali, Verification Authority", id: "CRI-VVB-000009" },
    scale: "small",
    methodology: "AR-AMS0003  -  Afforestation and reforestation project activities",
    classification: "pa",
    listedDate: "Listed",
    registeredDate: "CarbonChain Network",
    creditingPeriod: "2026 - 2056",
    submittedAt: "2026-02-05T08:00:00Z",
    updatedAt: "2026-02-10T12:00:00Z",
    verifierNote: "Ecosystem restoration planting verified in Western Ghats buffer zone under AR-AMS0003 protocol.",
    photoFile: "afforestation-trimbakeshwar.jpg",
    imageUrl: "/images/presets/afforestation-trimbakeshwar.jpg",
    documents: [
      { name: "Trimbakeshwar_Canopy_Density_Audit_Report.pdf", size: 4120000, type: "pdf", hash: "1d8bf624a87c093c4e3663aef19f9d2cb3788a53167123984e9089f21345dc67" },
    ],
  },
];

const SEED_PROJECTS = [...CRI_SEED_PROJECTS, ...MERIDIAN_SEED_PROJECTS];

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

// ─── Seed credits (Approved projects listed on marketplace per spec §17) ──────
const SEED_CREDITS = [
  // 1. Piplantri Tree Plantation Project (CRI) - 4,800 tCO2e available (200 purchased by Ironbridge)
  {
    id: serialId(1),
    tokenIndex: 1,
    projectId: "proj_001",
    amount: 4800,
    price: 6960000,
    pricePerTonne: 1450,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-04-20T08:00:00Z",
  },
  // 2. Barhi Solar (CRI) - 250 tCO2e available
  {
    id: serialId(2),
    tokenIndex: 2,
    projectId: "proj_002",
    amount: 250,
    price: 112500,
    pricePerTonne: 450,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-03-05T08:00:00Z",
  },
  // 3. Deployment of Electric Reach Stackers (eRSTs) (CRI) - 3,000 tCO2e available
  {
    id: serialId(3),
    tokenIndex: 3,
    projectId: "proj_003",
    amount: 3000,
    price: 2700000,
    pricePerTonne: 900,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-03-10T08:00:00Z",
  },
  // 4. SHIELD Coastal Mangrove (CRI) - 5,000 tCO2e available
  {
    id: serialId(4),
    tokenIndex: 4,
    projectId: "proj_004",
    amount: 5000,
    price: 12000000,
    pricePerTonne: 2400,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-03-15T08:00:00Z",
  },
  // 5. Green Wings Agroforestry (CRI) - 15,000 tCO2e available (Ranked first on ties)
  {
    id: serialId(5),
    tokenIndex: 5,
    projectId: "proj_005",
    amount: 15000,
    price: 27000000,
    pricePerTonne: 1800,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-03-20T08:00:00Z",
  },
  // 6. Rajsamand Tree Plantation (CRI) - 3,500 tCO2e available
  {
    id: serialId(6),
    tokenIndex: 6,
    projectId: "proj_006",
    amount: 3500,
    price: 5600000,
    pricePerTonne: 1600,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-04-25T10:00:00Z",
  },
  // 7. Hyderabad Metro Rail (CRI) - 5,000 tCO2e available
  {
    id: serialId(7),
    tokenIndex: 7,
    projectId: "proj_007",
    amount: 5000,
    price: 4250000,
    pricePerTonne: 850,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2024-03-25T09:00:00Z",
  },
  // 8. Trimbakeshwar-Igatpuri Hill Afforestation (Meridian) - 1,950 available (150 sold to Ironbridge)
  {
    id: "CCI-TRIMBAK-000001",
    tokenIndex: 8,
    projectId: "proj_trimbak",
    amount: 1950,
    price: 3120000,
    pricePerTonne: 1600,
    owner: DEMO_WALLETS.ipp,
    ownerUserId: "usr_meridian",
    listed: true,
    retired: false,
    retiredAt: null,
    retireeName: "",
    onBehalfOf: "",
    reason: "",
    message: "",
    mintedAt: "2026-02-10T12:00:00Z",
  },
  // 9. Piplantri retired credit token for Ironbridge - 200 tCO2e permanently retired
  {
    id: "CCI-PIPL-000001",
    tokenIndex: 9,
    projectId: "proj_001",
    amount: 200,
    price: 290000,
    pricePerTonne: 1450,
    owner: DEMO_WALLETS.buyer,
    ownerUserId: "usr_ironbridge",
    listed: false,
    retired: true,
    retiredAt: "2026-01-25T11:30:00Z",
    retireeName: "Ironbridge Steel and Cement Ltd",
    onBehalfOf: "Ironbridge Steel and Cement Ltd",
    reason: "Corporate sustainability offset commitment FY24-25",
    message: "Offsets supporting community agroforestry and tree plantation in Piplantri.",
    approvalRef: "RET-2026-000108",
    mintedAt: "2024-04-20T08:00:00Z",
    purchasedAt: "2026-01-20T11:15:00Z",
  },
];

// ─── Seeded holdings per spec §17 ─────────────────────────────────────────────
const SEED_HOLDINGS = [
  {
    id: "hold_trimbak_001",
    holdingId: "hold_trimbak_001",
    projectId: "proj_trimbak",
    projectName: "Trimbakeshwar-Igatpuri Hill Afforestation",
    projectType: "Afforestation",
    location: "Trimbakeshwar and Igatpuri, Nashik, Maharashtra",
    buyerUserId: "usr_ironbridge",
    buyerWallet: DEMO_WALLETS.buyer,
    quantityPurchased: 150,
    quantityAvailable: 50,
    quantityPendingRetirement: 100,
    quantityRetired: 0,
    pricePerTonne: 1600,
    subtotal: 240000,
    platformFee: 2400,
    totalPaid: 242400,
    paymentRef: "PAY-20260215-98214",
    serialRange: "CCI-TRIMBAK-000001 to CCI-TRIMBAK-000150",
    purchasedAt: "2026-02-15T10:30:00Z",
  },
  {
    id: "hold_piplantri_001",
    holdingId: "hold_piplantri_001",
    projectId: "proj_001",
    projectName: "Piplantri Tree Plantation Project",
    projectType: "Forestry & REDD+",
    location: "Rajsamand District, Rajasthan, India",
    buyerUserId: "usr_ironbridge",
    buyerWallet: DEMO_WALLETS.buyer,
    quantityPurchased: 200,
    quantityAvailable: 0,
    quantityPendingRetirement: 0,
    quantityRetired: 200,
    pricePerTonne: 1450,
    subtotal: 290000,
    platformFee: 2900,
    totalPaid: 292900,
    paymentRef: "PAY-20260120-41052",
    serialRange: "CCI-PIPL-000001 to CCI-PIPL-000200",
    purchasedAt: "2026-01-20T11:15:00Z",
  },
];

// ─── Seeded retirement requests per spec §17 ──────────────────────────────────
const SEED_RETIREMENT_REQUESTS = [
  {
    id: "req_ret_001",
    holdingId: "hold_trimbak_001",
    projectId: "proj_trimbak",
    projectName: "Trimbakeshwar-Igatpuri Hill Afforestation",
    projectType: "Afforestation",
    buyerUserId: "usr_ironbridge",
    buyerWallet: DEMO_WALLETS.buyer,
    sellerUserId: "usr_meridian",
    sellerWallet: DEMO_WALLETS.ipp,
    quantity: 100,
    serialRange: "CCI-TRIMBAK-000001 to CCI-TRIMBAK-000100",
    retireeName: "Ironbridge Steel and Cement Ltd",
    onBehalfOf: "Ironbridge Infrastructure Division",
    onBehalfOfWallet: DEMO_WALLETS.buyer,
    reason: "FY25 Scope 1 kiln emissions decarbonization milestone",
    message: "Retirement towards corporate science-based decarbonization targets.",
    status: "Requested",
    requestedAt: "2026-02-20T14:00:00Z",
  },
  {
    id: "req_ret_002",
    approvalRef: "RET-2026-000108",
    certificateId: "RET-2026-000108",
    holdingId: "hold_piplantri_001",
    projectId: "proj_001",
    projectName: "Piplantri Tree Plantation Project",
    projectType: "Forestry & REDD+",
    buyerUserId: "usr_ironbridge",
    buyerWallet: DEMO_WALLETS.buyer,
    sellerUserId: "usr_meridian",
    sellerWallet: DEMO_WALLETS.ipp,
    quantity: 200,
    serialRange: "CCI-PIPL-000001 to CCI-PIPL-000200",
    retireeName: "Ironbridge Steel and Cement Ltd",
    onBehalfOf: "Ironbridge Steel and Cement Ltd",
    onBehalfOfWallet: DEMO_WALLETS.buyer,
    reason: "Corporate sustainability offset commitment FY24-25",
    message: "Community agroforestry and ecosystem restoration offset in Piplantri.",
    status: "Approved",
    requestedAt: "2026-01-22T09:00:00Z",
    approvedAt: "2026-01-25T11:30:00Z",
    verifierUserId: "usr_verifier",
    verifierWallet: DEMO_WALLETS.verifier,
    verifierNote: "Payment verified against PAY-20260120-41052. Serial range validated and permanently locked.",
  },
];

// ─── Seeded purchases history per spec §17 ───────────────────────────────────
const SEED_PURCHASES = [
  {
    id: "pur_001",
    paymentRef: "PAY-20260120-41052",
    paymentReference: "PAY-20260120-41052",
    buyerUserId: "usr_ironbridge",
    buyerWallet: DEMO_WALLETS.buyer,
    sellerUserId: "usr_meridian",
    sellerWallet: DEMO_WALLETS.ipp,
    creditId: serialId(1),
    projectId: "proj_001",
    projectName: "Piplantri Tree Plantation Project",
    projectType: "Forestry & REDD+",
    quantity: 200,
    amount: 200,
    pricePerTonne: 1450,
    pricePerTonnePaid: 1450,
    subtotal: 290000,
    platformFee: 2900,
    totalPaid: 292900,
    pricePaid: 292900,
    serialRange: "CCI-PIPL-000001 to CCI-PIPL-000200",
    purchasedAt: "2026-01-20T11:15:00Z",
  },
  {
    id: "pur_002",
    paymentRef: "PAY-20260215-98214",
    paymentReference: "PAY-20260215-98214",
    buyerUserId: "usr_ironbridge",
    buyerWallet: DEMO_WALLETS.buyer,
    sellerUserId: "usr_meridian",
    sellerWallet: DEMO_WALLETS.ipp,
    creditId: "CCI-TRIMBAK-000001",
    projectId: "proj_trimbak",
    projectName: "Trimbakeshwar-Igatpuri Hill Afforestation",
    projectType: "Afforestation",
    quantity: 150,
    amount: 150,
    pricePerTonne: 1600,
    pricePerTonnePaid: 1600,
    subtotal: 240000,
    platformFee: 2400,
    totalPaid: 242400,
    pricePaid: 242400,
    serialRange: "CCI-TRIMBAK-000001 to CCI-TRIMBAK-000150",
    purchasedAt: "2026-02-15T10:30:00Z",
  },
];

// ─── Seeded verifier history per spec §17 ─────────────────────────────────────
const SEED_VERIFIER_HISTORY = [
  {
    id: "vh_001",
    type: "PROJECT_REJECTED",
    action: "PROJECT_REJECTED",
    projectId: "proj_satara",
    projectName: "Satara Ridge Wind Farm Phase 1 (10 MW)",
    actor: DEMO_WALLETS.verifier,
    verifierUserId: "usr_verifier",
    reason: "Quantity not supported. Turbine operational telemetry and grid interconnection logs for Q3/Q4 are missing from submission. Resubmit with metering logs.",
    timestamp: "2026-02-05T15:00:00Z",
  },
  {
    id: "vh_002",
    type: "PROJECT_APPROVED",
    action: "PROJECT_APPROVED",
    projectId: "proj_trimbak",
    projectName: "Trimbakeshwar-Igatpuri Hill Afforestation",
    actor: DEMO_WALLETS.verifier,
    verifierUserId: "usr_verifier",
    verifiedQuantity: 2100,
    askingPrice: 1600,
    note: "Ecosystem restoration planting verified in Western Ghats buffer zone under AR-AMS0003 protocol.",
    timestamp: "2026-02-10T12:00:00Z",
  },
  {
    id: "vh_003",
    type: "RETIREMENT_APPROVED",
    action: "RETIREMENT_APPROVED",
    requestId: "req_ret_002",
    approvalRef: "RET-2026-000108",
    projectName: "Piplantri Tree Plantation Project",
    quantity: 200,
    buyerName: "Ironbridge Steel and Cement Ltd",
    actor: DEMO_WALLETS.verifier,
    verifierUserId: "usr_verifier",
    note: "Payment verified against PAY-20260120-41052. Serial range validated and permanently locked.",
    timestamp: "2026-01-25T11:30:00Z",
  },
];

// ─── Seeded notifications per spec §12 and §17 ────────────────────────────────
const SEED_NOTIFICATIONS = [
  // Meridian (Seller)
  {
    id: "notif_m_1",
    recipientRole: "seller",
    recipientUserId: "usr_meridian",
    recipientWallet: DEMO_WALLETS.ipp,
    type: "PROJECT_SUBMITTED",
    title: "Project Submitted for Review",
    message: 'Your project "Sinnar Solar Park (5 MW)" has been successfully submitted and is under verifier review.',
    link: "/my-projects",
    unread: true,
    createdAt: "2026-02-12T09:05:00Z",
  },
  {
    id: "notif_m_2",
    recipientRole: "seller",
    recipientUserId: "usr_meridian",
    recipientWallet: DEMO_WALLETS.ipp,
    type: "PROJECT_SUBMITTED",
    title: "Project Submitted for Review",
    message: 'Your project "Dindori Grape-Belt Agroforestry Programme" has been successfully submitted and is under verifier review.',
    link: "/my-projects",
    unread: true,
    createdAt: "2026-02-14T11:35:00Z",
  },
  {
    id: "notif_m_3",
    recipientRole: "seller",
    recipientUserId: "usr_meridian",
    recipientWallet: DEMO_WALLETS.ipp,
    type: "PROJECT_REJECTED",
    title: "Project Review Returned",
    message: 'Your project "Satara Ridge Wind Farm Phase 1 (10 MW)" was rejected: Quantity not supported. Turbine operational telemetry and grid interconnection logs for Q3/Q4 are missing from submission. Resubmit with metering logs.',
    link: "/my-projects",
    unread: true,
    createdAt: "2026-02-05T15:05:00Z",
  },
  {
    id: "notif_m_4",
    recipientRole: "seller",
    recipientUserId: "usr_meridian",
    recipientWallet: DEMO_WALLETS.ipp,
    type: "PROJECT_APPROVED",
    title: "Project Approved & Listed",
    message: 'Your project "Trimbakeshwar-Igatpuri Hill Afforestation" has been approved (2,100 tCO2e verified) and is now listed on the marketplace at Rs 1,600/tCO2e.',
    link: "/my-projects",
    unread: false,
    createdAt: "2026-02-10T12:05:00Z",
  },
  {
    id: "notif_m_5",
    recipientRole: "seller",
    recipientUserId: "usr_meridian",
    recipientWallet: DEMO_WALLETS.ipp,
    type: "CREDITS_SOLD",
    title: "Credits Purchased by Buyer",
    message: "Ironbridge Steel and Cement Ltd purchased 150 tCO2e of Trimbakeshwar-Igatpuri Hill Afforestation for Rs 2,40,000 (net payout Rs 2,37,600 after 1% platform fee).",
    link: "/transactions",
    unread: true,
    createdAt: "2026-02-15T10:35:00Z",
  },
  {
    id: "notif_m_6",
    recipientRole: "seller",
    recipientUserId: "usr_meridian",
    recipientWallet: DEMO_WALLETS.ipp,
    type: "CREDITS_RETIRED",
    title: "Credits Retired",
    message: '200 tCO2e of your project "Piplantri Tree Plantation Project" were retired by Ironbridge Steel and Cement Ltd. 200 of 5,000 tCO2e retired so far.',
    link: "/projects/piplantri-tree-plantation",
    unread: true,
    createdAt: "2026-01-25T11:35:00Z",
  },
  // Ironbridge (Buyer)
  {
    id: "notif_b_1",
    recipientRole: "buyer",
    recipientUserId: "usr_ironbridge",
    recipientWallet: DEMO_WALLETS.buyer,
    type: "PURCHASE_SUCCESSFUL",
    title: "Carbon Credits Purchased",
    message: 'Successfully purchased 200 tCO2e of "Piplantri Tree Plantation Project" for Rs 2,90,000. Payment Ref: PAY-20260120-41052.',
    link: "/my-credits",
    unread: false,
    createdAt: "2026-01-20T11:20:00Z",
  },
  {
    id: "notif_b_2",
    recipientRole: "buyer",
    recipientUserId: "usr_ironbridge",
    recipientWallet: DEMO_WALLETS.buyer,
    type: "RETIREMENT_APPROVED",
    title: "Retirement Approved",
    message: 'Your retirement request for 200 tCO2e of "Piplantri Tree Plantation Project" has been approved by the verification authority. Certificate RET-2026-000108 is now available.',
    link: "/certificate/RET-2026-000108",
    unread: true,
    createdAt: "2026-01-25T11:35:00Z",
  },
  {
    id: "notif_b_3",
    recipientRole: "buyer",
    recipientUserId: "usr_ironbridge",
    recipientWallet: DEMO_WALLETS.buyer,
    type: "PURCHASE_SUCCESSFUL",
    title: "Carbon Credits Purchased",
    message: 'Successfully purchased 150 tCO2e of "Trimbakeshwar-Igatpuri Hill Afforestation" for Rs 2,40,000. Payment Ref: PAY-20260215-98214.',
    link: "/my-credits",
    unread: true,
    createdAt: "2026-02-15T10:35:00Z",
  },
  {
    id: "notif_b_4",
    recipientRole: "buyer",
    recipientUserId: "usr_ironbridge",
    recipientWallet: DEMO_WALLETS.buyer,
    type: "RETIREMENT_REQUESTED",
    title: "Retirement Request Submitted",
    message: 'Your retirement request for 100 tCO2e of "Trimbakeshwar-Igatpuri Hill Afforestation" has been submitted for verifier review.',
    link: "/my-credits",
    unread: true,
    createdAt: "2026-02-20T14:05:00Z",
  },
  // Diya Mali (Verifier)
  {
    id: "notif_v_1",
    recipientRole: "verifier",
    recipientUserId: "usr_verifier",
    recipientWallet: DEMO_WALLETS.verifier,
    type: "PROJECT_SUBMITTED",
    title: "New Project Awaiting Review",
    message: 'Meridian Renewables Ltd submitted "Sinnar Solar Park (5 MW)" for verification (6,000 tCO2e requested).',
    link: "/verifier/queue",
    unread: true,
    createdAt: "2026-02-12T09:05:00Z",
  },
  {
    id: "notif_v_2",
    recipientRole: "verifier",
    recipientUserId: "usr_verifier",
    recipientWallet: DEMO_WALLETS.verifier,
    type: "PROJECT_SUBMITTED",
    title: "New Project Awaiting Review",
    message: 'Meridian Renewables Ltd submitted "Dindori Grape-Belt Agroforestry Programme" for verification (1,200 tCO2e requested).',
    link: "/verifier/queue",
    unread: true,
    createdAt: "2026-02-14T11:35:00Z",
  },
  {
    id: "notif_v_3",
    recipientRole: "verifier",
    recipientUserId: "usr_verifier",
    recipientWallet: DEMO_WALLETS.verifier,
    type: "RETIREMENT_REQUESTED",
    title: "New Retirement Request",
    message: 'Ironbridge Steel and Cement Ltd requested retirement of 100 tCO2e for "Trimbakeshwar-Igatpuri Hill Afforestation".',
    link: "/verifier/retirements",
    unread: true,
    createdAt: "2026-02-20T14:05:00Z",
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

function generateTxHash() {
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

// ─── Block builder ────────────────────────────────────────────────────────────
async function buildBlock(action, payload, prevHash, index) {
  const timestamp = new Date().toISOString();
  const content = JSON.stringify({ index, action, payload, prevHash, timestamp });
  const hash = await sha256(content);
  return { index, action, payload, prevHash, timestamp, hash, txHash: generateTxHash() };
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

// ─── Holdings persistence ─────────────────────────────────────────────────────
export function getHoldings(buyerWallet = null) {
  try {
    const raw = localStorage.getItem(HOLDINGS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!buyerWallet) return list;
    return list.filter((h) => !h.buyerWallet || h.buyerWallet.toLowerCase() === buyerWallet.toLowerCase());
  } catch {
    return [];
  }
}

export function saveHoldings(holdings) {
  localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings));
}

export function getHolding(holdingId) {
  return getHoldings().find((h) => h.id === holdingId) || null;
}

// ─── Retirement requests persistence ──────────────────────────────────────────
export function getRetirementRequests(filter = {}) {
  try {
    const raw = localStorage.getItem(RETIREMENTS_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (filter.status) {
      list = list.filter((r) => r.status.toLowerCase() === filter.status.toLowerCase());
    }
    if (filter.buyerWallet) {
      list = list.filter((r) => r.buyerWallet?.toLowerCase() === filter.buyerWallet.toLowerCase());
    }
    return list;
  } catch {
    return [];
  }
}

export function saveRetirementRequests(requests) {
  localStorage.setItem(RETIREMENTS_KEY, JSON.stringify(requests));
}

export function getRetirementRequest(requestId) {
  return getRetirementRequests().find((r) => r.id === requestId || r.approvalRef === requestId) || null;
}

// ─── Serial range helper ──────────────────────────────────────────────────────
export function generateSerialRange(projectCode, startIdx = 1, count = 1) {
  const cleanCode = (projectCode || "PRJ").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  const startNum = String(startIdx).padStart(6, "0");
  const endNum = String(startIdx + count - 1).padStart(6, "0");
  if (count <= 1) return `CCI-${cleanCode}-${startNum}`;
  return `CCI-${cleanCode}-${startNum} to CCI-${cleanCode}-${endNum}`;
}

// ─── Verifier history persistence ─────────────────────────────────────────────
export function getVerifierHistory() {
  try {
    const raw = localStorage.getItem("cc_verifier_history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVerifierHistory(history) {
  localStorage.setItem("cc_verifier_history", JSON.stringify(history));
}

// ─── Sales history for sellers ────────────────────────────────────────────────
export function getSalesHistory(sellerWallet = null) {
  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    const history = raw ? JSON.parse(raw) : [];
    if (!sellerWallet) return history;
    return history.filter((h) => !h.sellerWallet || h.sellerWallet.toLowerCase() === sellerWallet.toLowerCase());
  } catch {
    return [];
  }
}

// ─── Seed genesis blocks for complete lifecycle per spec §17 ─────────────────
async function seedGenesisBlocks(projects, credits, purchases = [], retirementRequests = []) {
  const ledger = [];

  // 1. Genesis block (Index 0)
  const genesisContent = JSON.stringify({ index: 0, action: "GENESIS", payload: { message: "CarbonChain SHA-256 tamper-evident ledger initialised" }, prevHash: "0".repeat(64), timestamp: "2024-01-01T00:00:00Z" });
  const genesisHash = await sha256(genesisContent);
  ledger.push({
    index: 0,
    action: "GENESIS",
    payload: { message: "CarbonChain SHA-256 tamper-evident ledger initialised" },
    prevHash: "0".repeat(64),
    timestamp: "2024-01-01T00:00:00Z",
    hash: genesisHash,
    txHash: "0x" + "0".repeat(64),
  });

  // 2. Project submission and verification blocks
  for (const proj of projects) {
    const prevHash = ledger[ledger.length - 1].hash;
    const idx = ledger.length;
    const ts = proj.submittedAt || "2024-03-01T09:00:00Z";
    const payload = { projectId: proj.id, name: proj.name, actor: proj.owner, projectType: proj.projectType, location: proj.location };
    const content = JSON.stringify({ index: idx, action: "PROJECT_SUBMITTED", payload, prevHash, timestamp: ts });
    const hash = await sha256(content);
    ledger.push({ index: idx, action: "PROJECT_SUBMITTED", payload, prevHash, timestamp: ts, hash, txHash: generateTxHash() });

    if (proj.status === "Approved") {
      const prevHash2 = ledger[ledger.length - 1].hash;
      const idx2 = ledger.length;
      const ts2 = proj.updatedAt || ts;
      const payload2 = { projectId: proj.id, name: proj.name, actor: DEMO_WALLETS.verifier, verifiedAmount: proj.verifiedAmount, note: proj.verifierNote };
      const content2 = JSON.stringify({ index: idx2, action: "PROJECT_APPROVED", payload: payload2, prevHash: prevHash2, timestamp: ts2 });
      const hash2 = await sha256(content2);
      ledger.push({ index: idx2, action: "PROJECT_APPROVED", payload: payload2, prevHash: prevHash2, timestamp: ts2, hash: hash2, txHash: generateTxHash() });
    } else if (proj.status === "Rejected") {
      const prevHash2 = ledger[ledger.length - 1].hash;
      const idx2 = ledger.length;
      const ts2 = proj.updatedAt || ts;
      const payload2 = { projectId: proj.id, name: proj.name, actor: DEMO_WALLETS.verifier, reason: proj.verifierNote };
      const content2 = JSON.stringify({ index: idx2, action: "PROJECT_REJECTED", payload: payload2, prevHash: prevHash2, timestamp: ts2 });
      const hash2 = await sha256(content2);
      ledger.push({ index: idx2, action: "PROJECT_REJECTED", payload: payload2, prevHash: prevHash2, timestamp: ts2, hash: hash2, txHash: generateTxHash() });
    }
  }

  // 3. Credit mint and listing blocks
  for (const credit of credits) {
    const prevHashM = ledger[ledger.length - 1].hash;
    const idxM = ledger.length;
    const payloadM = { creditId: credit.id, projectId: credit.projectId, amount: credit.amount, actor: credit.owner };
    const contentM = JSON.stringify({ index: idxM, action: "CREDIT_MINTED", payload: payloadM, prevHash: prevHashM, timestamp: credit.mintedAt || "2024-04-20T08:00:00Z" });
    const hashM = await sha256(contentM);
    ledger.push({ index: idxM, action: "CREDIT_MINTED", payload: payloadM, prevHash: prevHashM, timestamp: credit.mintedAt || "2024-04-20T08:00:00Z", hash: hashM, txHash: generateTxHash() });

    if (credit.listed) {
      const prevHashL = ledger[ledger.length - 1].hash;
      const idxL = ledger.length;
      const tsL = credit.mintedAt || "2024-04-20T08:00:00Z";
      const payloadL = { creditId: credit.id, price: credit.price, pricePerTonne: credit.pricePerTonne, actor: credit.owner };
      const contentL = JSON.stringify({ index: idxL, action: "CREDIT_LISTED", payload: payloadL, prevHash: prevHashL, timestamp: tsL });
      const hashL = await sha256(contentL);
      ledger.push({ index: idxL, action: "CREDIT_LISTED", payload: payloadL, prevHash: prevHashL, timestamp: tsL, hash: hashL, txHash: generateTxHash() });
    }
  }

  // 4. Past purchase blocks
  for (const pur of purchases) {
    const prevHashP = ledger[ledger.length - 1].hash;
    const idxP = ledger.length;
    const payloadP = {
      purchaseId: pur.id,
      creditId: pur.creditId,
      projectId: pur.projectId,
      quantity: pur.quantity,
      pricePerTonne: pur.pricePerTonne,
      subtotal: pur.subtotal,
      platformFee: pur.platformFee,
      totalPaid: pur.totalPaid,
      paymentReference: pur.paymentReference,
      serialRange: pur.serialRange,
      buyer: pur.buyerWallet,
      seller: pur.sellerWallet,
    };
    const contentP = JSON.stringify({ index: idxP, action: "CREDIT_PURCHASED", payload: payloadP, prevHash: prevHashP, timestamp: pur.purchasedAt });
    const hashP = await sha256(contentP);
    ledger.push({ index: idxP, action: "CREDIT_PURCHASED", payload: payloadP, prevHash: prevHashP, timestamp: pur.purchasedAt, hash: hashP, txHash: generateTxHash() });
  }

  // 5. Retirement request and approval blocks
  for (const req of retirementRequests) {
    const prevHashRq = ledger[ledger.length - 1].hash;
    const idxRq = ledger.length;
    const payloadRq = {
      requestId: req.id,
      holdingId: req.holdingId,
      projectId: req.projectId,
      quantity: req.quantity,
      serialRange: req.serialRange,
      retireeName: req.retireeName,
      buyer: req.buyerWallet,
      reason: req.reason,
    };
    const contentRq = JSON.stringify({ index: idxRq, action: "RETIREMENT_REQUESTED", payload: payloadRq, prevHash: prevHashRq, timestamp: req.requestedAt });
    const hashRq = await sha256(contentRq);
    ledger.push({ index: idxRq, action: "RETIREMENT_REQUESTED", payload: payloadRq, prevHash: prevHashRq, timestamp: req.requestedAt, hash: hashRq, txHash: generateTxHash() });

    if (req.status === "Approved") {
      const prevHashAp = ledger[ledger.length - 1].hash;
      const idxAp = ledger.length;
      const payloadAp = {
        requestId: req.id,
        approvalRef: req.approvalRef,
        quantity: req.quantity,
        projectId: req.projectId,
        retireeName: req.retireeName,
        verifier: req.verifierWallet,
        note: req.verifierNote,
      };
      const contentAp = JSON.stringify({ index: idxAp, action: "RETIREMENT_APPROVED", payload: payloadAp, prevHash: prevHashAp, timestamp: req.approvedAt });
      const hashAp = await sha256(contentAp);
      ledger.push({ index: idxAp, action: "RETIREMENT_APPROVED", payload: payloadAp, prevHash: prevHashAp, timestamp: req.approvedAt, hash: hashAp, txHash: generateTxHash() });
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
    localStorage.removeItem(HOLDINGS_KEY);
    localStorage.removeItem(RETIREMENTS_KEY);
    localStorage.removeItem(PURCHASES_KEY);
    localStorage.removeItem("cc_verifier_history");
    localStorage.removeItem("cc_verifier_processed");
    localStorage.removeItem("cc_notifications");
    for (let i = 1; i <= 32; i++) {
      localStorage.removeItem(`cc_demo_seeded_v${i}`);
    }

    saveProjects(SEED_PROJECTS);
    saveCredits(SEED_CREDITS);
    saveHoldings(SEED_HOLDINGS);
    saveRetirementRequests(SEED_RETIREMENT_REQUESTS);
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(SEED_PURCHASES));
    saveVerifierHistory(SEED_VERIFIER_HISTORY);
    localStorage.setItem("cc_notifications", JSON.stringify(SEED_NOTIFICATIONS));

    await seedGenesisBlocks(SEED_PROJECTS, SEED_CREDITS, SEED_PURCHASES, SEED_RETIREMENT_REQUESTS);

    localStorage.setItem(SEEDED_KEY, "true");
  }
}

// ─── Reset workspace data ─────────────────────────────────────────────────────
export async function resetDemoData() {
  localStorage.removeItem(LEDGER_KEY);
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(CREDITS_KEY);
  localStorage.removeItem(HOLDINGS_KEY);
  localStorage.removeItem(RETIREMENTS_KEY);
  localStorage.removeItem(PURCHASES_KEY);
  localStorage.removeItem("cc_verifier_history");
  localStorage.removeItem("cc_verifier_processed");
  localStorage.removeItem("cc_notifications");
  for (let i = 1; i <= 33; i++) {
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
export { getProjects };


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

/** Get all transaction events parsed from ledger blocks */
export function getAllTransactions() {
  const blocks = getLedger();
  const projects = getProjects();
  const txs = [];

  for (const b of blocks) {
    if (!b || !b.action) continue;
    const p = b.payload || {};
    const proj = projects.find((x) => x.id === p.projectId || x.name === p.name);
    const projName = p.name || proj?.name || p.projectName || "Carbon Project";

    let type = null;
    let qty = 0;
    let val = 0;
    let tokenId = p.creditId || p.serialRange || p.projectId || `BLK-${b.index}`;

    if (b.action === "CREDIT_PURCHASED" || b.action === "PURCHASED") {
      type = "Purchase";
      qty = p.quantity || p.amount || 0;
      val = p.totalPaid || p.subtotal || p.price || 0;
    } else if (b.action === "RETIREMENT_APPROVED" || b.action === "CREDIT_RETIRED") {
      type = "Retirement";
      qty = p.quantity || p.amount || 0;
      val = 0;
    } else if (b.action === "CREDIT_MINTED") {
      type = "Minting";
      qty = p.amount || 0;
      val = 0;
    } else if (b.action === "CREDIT_LISTED" || b.action === "LISTED") {
      type = "Listing";
      qty = p.amount || proj?.verifiedAmount || 0;
      val = p.price || 0;
    } else if (b.action === "PROJECT_SUBMITTED") {
      type = "Submission";
      qty = proj?.estimatedCO2 || 0;
      val = 0;
    } else if (b.action === "PROJECT_APPROVED") {
      type = "Approval";
      qty = p.verifiedAmount || proj?.verifiedAmount || 0;
      val = 0;
    }

    if (type) {
      txs.push({
        id: `tx_${b.index}_${b.action}`,
        date: b.timestamp ? new Date(b.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recent",
        timestamp: b.timestamp,
        type,
        project: projName,
        tokenId,
        quantity: qty,
        amount: qty,
        value: val,
        blockHash: b.hash,
        blockIndex: b.index,
        txHash: b.txHash || b.hash,
      });
    }
  }

  return txs.reverse();
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
export async function submitProject(arg1, arg2, arg3 = {}) {
  await delay(1500);

  let ownerWallet;
  let ownerUserId;
  let payload;

  if (arg1 && typeof arg1 === "object" && (!arg2 || typeof arg2 !== "string")) {
    // Called with single argument: submitProject(payload)
    payload = arg1;
    ownerWallet = payload.owner || payload.ownerWallet || DEMO_WALLETS.seller;
    ownerUserId = payload.ownerUserId || "usr_meridian";
  } else {
    // Called with: submitProject(ownerWallet, ownerUserId, payload)
    ownerWallet = arg1 || DEMO_WALLETS.seller;
    ownerUserId = arg2 || "usr_meridian";
    payload = arg3 || {};
  }

  const {
    name = "",
    projectType = "Solar",
    location = "",
    district = "Nashik",
    state = "Maharashtra",
    developer = "",
    estimatedCO2 = 0,
    description = "",
    proofUrl = "",
    imageUrl = "",
    sdgs = [13],
    sdgScores = { 13: { scale: 5, intensity: 5 } },
    photos = [],
    documents = [],
    scale = "small",
    methodology = "ACM0002",
    askingPrice = 450,
    listQuantity = null,
    quantityToList = null,
    estimatorInputs = {},
    estimatorBreakdown = null,
    startDate = "",
    contactPerson = "",
    phone = "",
  } = payload;

  // Capability enforcement per Patch P1 spec §2
  try {
    const rawUsers = typeof window !== "undefined" ? window.localStorage?.getItem("carbonchain_users") : null;
    const allUsers = rawUsers ? JSON.parse(rawUsers) : DEMO_ACCOUNTS;
    const callerUser = payload.user || allUsers.find(a => a.id === ownerUserId || a.walletAddress?.toLowerCase() === ownerWallet?.toLowerCase());
    if (callerUser && !canSell(callerUser)) {
      throw new Error("Your account is set up to buy and retire credits. Selling is not enabled for this account.");
    }
  } catch (err) {
    if (err.message.includes("Selling is not enabled")) throw err;
  }

  // Duplicate protection per Patch P1 spec §3
  const existingProjects = getProjects();
  const dupProj = existingProjects.find((p) => {
    if (String(p.status).toUpperCase() === "REJECTED") return false;
    const nameMatch = (p.name || "").trim().toLowerCase() === (name || "").trim().toLowerCase();
    const typeMatch = (p.projectType || "").trim().toLowerCase() === (projectType || "").trim().toLowerCase();
    const locMatch = (p.location || "").trim().toLowerCase() === (location || "").trim().toLowerCase();
    return nameMatch && typeMatch && locMatch;
  });

  if (dupProj) {
    throw new Error("This project is already registered or completed and cannot be submitted again.");
  }

  const id = `proj_${Date.now()}`;
  const now = new Date().toISOString();
  const estCO2 = Number(estimatedCO2);
  const targetQty = quantityToList !== null && quantityToList !== undefined ? quantityToList : listQuantity;
  const listQty = targetQty ? Math.min(Number(targetQty), estCO2) : estCO2;

  const newProject = {
    id,
    name,
    projectType,
    location,
    district,
    state,
    developer: developer || "Meridian Renewables Ltd",
    estimatedCO2: estCO2,
    listQuantity: listQty,
    quantityToList: listQty,
    askingPrice: Number(askingPrice) || 450,
    description,
    proofUrl: proofUrl || "",
    imageUrl: imageUrl || (photos[0]?.url || photos[0]?.dataUrl || ""),
    photos: photos.map((p) => ({
      name: p.name,
      size: p.size,
      sha256: p.sha256,
      category: "photo",
      url: p.url || p.dataUrl || "",
      dataUrl: p.dataUrl || p.url || "",
    })),
    documents: documents.map((d) => ({
      name: d.name,
      size: d.size,
      sha256: d.sha256,
      category: "document",
      type: d.type || "application/pdf",
      fileId: d.fileId || d.id,
    })),
    sdgs: sdgs || [13],
    sdgScores: sdgScores || { 13: { scale: 5, intensity: 5 } },
    scale,
    methodology: methodology || "ACM0002",
    estimatorInputs,
    estimatorBreakdown: estimatorBreakdown || null,
    startDate,
    contactPerson,
    phone,
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

  const block = await appendBlock("PROJECT_SUBMITTED", {
    projectId: id,
    name,
    projectType,
    location,
    estimatedCO2: estCO2,
    askingPrice: Number(askingPrice),
    actor: ownerWallet,
  });

  // Write FILES_FINGERPRINTED block if files were uploaded
  const allFiles = [...newProject.photos, ...newProject.documents];
  if (allFiles.length > 0) {
    await appendBlock("FILES_FINGERPRINTED", {
      projectId: id,
      filesCount: allFiles.length,
      fingerprints: allFiles.map((f) => ({ name: f.name, sha256: f.sha256 })),
      actor: ownerWallet,
    });
  }

  // Notify verifier per spec §12
  addNotification({
    recipientRole: "verifier",
    recipientUserId: "usr_verifier",
    type: "PROJECT_SUBMITTED",
    title: "New Project Submitted",
    message: `"${name}" (${estCO2.toLocaleString("en-IN")} tCO2e, ${projectType}) has been submitted for verification.`,
    link: "/verifier/queue",
    metadata: { projectId: id, name, estimatedCO2: estCO2 },
  });

  return { projectId: id, block, project: newProject };
}

/** Approve a project (verifier only per spec §9) */
export async function approveProject(projectId, verifierWallet, { verifiedAmount, note } = {}) {
  await delay(1500);
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === projectId || p.registryId === projectId);
  if (idx === -1) throw new Error("Project not found.");

  const proj = projects[idx];
  if (proj.status !== "Pending" && proj.status !== "Sent Back for Review") {
    throw new Error("Only pending projects can be approved.");
  }

  const cleanAmount = Number(verifiedAmount || proj.quantityToList || proj.estimatedCO2 || 1000);
  const pricePerTonne = Number(proj.askingPrice || 450); // seller's asking price per spec §9

  projects[idx] = {
    ...proj,
    status: "Approved",
    criStatus: "Listed",
    verifierNote: note || "Verified by Diya Mali, Verification Authority.",
    verifiedAmount: cleanAmount,
    returnReason: null,
    returnedAt: null,
    updatedAt: new Date().toISOString()
  };
  saveProjects(projects);

  // Issue tokens and automatically create listing on marketplace
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
      price: cleanAmount * pricePerTonne,
      pricePerTonne,
      listed: true,
      delistedReason: null,
      updatedAt: new Date().toISOString(),
    };
    saveCredits(credits);
    await appendBlock("CREDIT_LISTED", { creditId, price: credits[existingCreditIdx].price, pricePerTonne, actor: proj.owner, note: "Re-listed following verification" });
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
      ownerUserId: proj.ownerUserId || "usr_meridian",
      listed: true, // Automatically listed on marketplace per spec §9 & §153
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
    verifiedAmount: cleanAmount,
    pricePerTonne,
  });

  // Record to verifier history
  const history = getVerifierHistory();
  history.unshift({
    id: `vh_${Date.now()}`,
    type: "PROJECT_APPROVED",
    action: "PROJECT_APPROVED",
    projectId: proj.id,
    projectName: proj.name,
    actor: verifierWallet || DEMO_WALLETS.verifier,
    verifierUserId: "usr_verifier",
    verifiedQuantity: cleanAmount,
    askingPrice: pricePerTonne,
    note: note || "Verified by Diya Mali, Verification Authority.",
    timestamp: new Date().toISOString(),
    blockIndex: block.index,
  });
  saveVerifierHistory(history);

  // Notify seller per spec §9 and §12
  addNotification({
    recipientUserId: proj.ownerUserId || "usr_meridian",
    recipientWallet: proj.owner,
    type: "PROJECT_APPROVED",
    title: "Project Approved & Listed",
    message: `Your project "${proj.name}" has been approved (${cleanAmount.toLocaleString("en-IN")} tCO2e verified) and is now listed on the marketplace at ₹${pricePerTonne.toLocaleString("en-IN")}/tCO2e.`,
    link: "/my-projects",
    metadata: { projectId: proj.id, verifiedAmount: cleanAmount, pricePerTonne },
  });

  return { block, creditId, project: projects[idx] };
}

/** Reject a project (verifier only per spec §9) */
export async function rejectProject(projectId, verifierWallet, { reason, note } = {}) {
  await delay(1500);
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === projectId || p.registryId === projectId);
  if (idx === -1) throw new Error("Project not found.");
  
  const proj = projects[idx];
  if (proj.status !== "Pending" && proj.status !== "Sent Back for Review") {
    throw new Error("Only pending projects can be rejected.");
  }

  const combinedReason = reason
    ? `${reason}${note ? `: ${note}` : ''}`
    : (note || "Submission did not satisfy verification criteria.");

  projects[idx] = {
    ...proj,
    status: "Rejected",
    criStatus: "Rejected",
    verifierNote: combinedReason,
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

  const block = await appendBlock("PROJECT_REJECTED", {
    projectId: proj.id,
    name: proj.name,
    actor: verifierWallet || DEMO_WALLETS.verifier,
    reason: combinedReason,
  });

  // Record to verifier history
  const history = getVerifierHistory();
  history.unshift({
    id: `vh_${Date.now()}`,
    type: "PROJECT_REJECTED",
    action: "PROJECT_REJECTED",
    projectId: proj.id,
    projectName: proj.name,
    actor: verifierWallet || DEMO_WALLETS.verifier,
    verifierUserId: "usr_verifier",
    reason: combinedReason,
    timestamp: new Date().toISOString(),
    blockIndex: block.index,
  });
  saveVerifierHistory(history);

  // Notify seller per spec §9 and §12
  addNotification({
    recipientUserId: proj.ownerUserId || "usr_meridian",
    recipientWallet: proj.owner,
    type: "PROJECT_REJECTED",
    title: "Project Review Returned",
    message: `Your project "${proj.name}" was rejected: ${combinedReason}`,
    link: "/my-projects",
    metadata: { projectId: proj.id, reason: combinedReason },
  });

  return { block, project: projects[idx] };
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
  const returnReason = reason || note || "Undergoing verification re-audit by Diya Mali, Verification Authority.";

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

  // Remove matching IDs from cc_verifier_processed in localStorage so it re-appears in verifier review queue
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

  if (purchaseQty <= 0) {
    throw new Error("Purchase quantity must be at least 1 tCO2e.");
  }

  const seller = credit.owner;
  const pricePerTonnePaid = Number(credit.pricePerTonne || Math.round((credit.price || 0) / (availableAmount || 1)));
  const subtotal = purchaseQty * pricePerTonnePaid;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT);
  const totalPayable = subtotal + platformFee;
  const sellerPayout = subtotal; // Platform fee deducted from seller or charged to buyer as spec §4 & §100

  // Deduct money from buyer's wallet balance
  if (buyerWallet) {
    deductWalletBalance(buyerWallet, totalPayable);
    if (seller) {
      addWalletBalance(seller, sellerPayout);
    }
  }

  const purchasedAt = new Date().toISOString();
  const paymentReference = `PAY-${purchasedAt.slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Find project for serial generation and naming
  const projects = getProjects();
  const proj = projects.find((p) => p.id === credit.projectId || p.registryId === credit.projectId) || {};
  const serialRange = generateSerialRange(proj.id || credit.projectId, credit.tokenIndex || 1, purchaseQty);

  let resultingCredit = null;

  if (purchaseQty < availableAmount) {
    // Partial purchase: update the remaining available listing
    const remainingQty = availableAmount - purchaseQty;
    credits[idx] = {
      ...credit,
      amount: remainingQty,
      price: remainingQty * pricePerTonnePaid,
    };

    // Create an acquired credit for the buyer
    const newCreditId = `${credit.id}-pch-${Date.now()}`;
    resultingCredit = {
      ...credit,
      id: newCreditId,
      amount: purchaseQty,
      price: subtotal,
      pricePerTonne: pricePerTonnePaid,
      listed: false,
      owner: buyerWallet,
      ownerUserId: buyerUserId,
      purchasedAt,
      paidPrice: totalPayable,
      paidPricePerTonne: pricePerTonnePaid,
      paymentReference,
      serialRange,
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
      paidPrice: totalPayable,
      paidPricePerTonne: pricePerTonnePaid,
      paymentReference,
      serialRange,
    };
    credits[idx] = resultingCredit;
  }

  saveCredits(credits);

  // Write PURCHASED block per spec §4
  const block = await appendBlock("PURCHASED", {
    creditId: resultingCredit.id,
    originalCreditId: credit.id,
    projectId: credit.projectId,
    amount: purchaseQty,
    subtotal,
    platformFee,
    totalPayable,
    paymentReference,
    serialRange,
    buyer: buyerWallet,
    seller,
    purchasedAt,
  });

  // Track in buyer holdings per spec §4 & §10
  const holdings = getHoldings();
  const existingHoldingIdx = holdings.findIndex(
    (h) => (h.buyerWallet?.toLowerCase() === buyerWallet?.toLowerCase()) && (h.projectId === credit.projectId)
  );

  if (existingHoldingIdx !== -1) {
    const cur = holdings[existingHoldingIdx];
    const newPurchased = (cur.purchasedQty || cur.quantityPurchased || 0) + purchaseQty;
    const newAvailable = (cur.availableQty || cur.quantityAvailable || 0) + purchaseQty;
    cur.purchasedQty = newPurchased;
    cur.quantityPurchased = newPurchased;
    cur.availableQty = newAvailable;
    cur.quantityAvailable = newAvailable;
    cur.totalPaid = (cur.totalPaid || 0) + totalPayable;
  } else {
    holdings.push({
      id: `hold_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      buyerWallet,
      buyerUserId,
      projectId: credit.projectId,
      projectName: proj.name || credit.projectName || "Carbon Project",
      projectType: proj.projectType || credit.project?.projectType || "Clean Energy",
      purchasedQty: purchaseQty,
      quantityPurchased: purchaseQty,
      availableQty: purchaseQty,
      quantityAvailable: purchaseQty,
      pendingRetirementQty: 0,
      quantityPendingRetirement: 0,
      retiredQty: 0,
      quantityRetired: 0,
      pricePerTonnePaid,
      totalPaid: totalPayable,
      paymentReference,
      serialRange,
      purchasedAt,
      seller,
    });
  }
  saveHoldings(holdings);

  // Track in persistent purchases history
  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.unshift({
      id: `pch_${Date.now()}`,
      creditId: resultingCredit.id,
      projectId: credit.projectId,
      projectName: proj.name || credit.projectName || "Carbon Project",
      projectType: proj.projectType || credit.project?.projectType || "Clean Energy",
      amount: purchaseQty,
      subtotal,
      platformFee,
      pricePaid: totalPayable,
      pricePerTonnePaid,
      paymentReference,
      serialRange,
      buyerWallet,
      sellerWallet: seller,
      blockIndex: block.index,
      blockHash: block.hash,
      purchasedAt,
    });
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(history));
  } catch {}

  // Check if project is now Sold Out
  const activeListedUnits = credits
    .filter((c) => (c.projectId === credit.projectId) && c.listed && !c.retired)
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  if (activeListedUnits === 0) {
    const pIdx = projects.findIndex((p) => p.id === credit.projectId || p.registryId === credit.projectId);
    if (pIdx !== -1 && projects[pIdx].status === "Approved") {
      projects[pIdx].status = "Sold Out";
      saveProjects(projects);
      addNotification({
        recipientUserId: credit.ownerUserId || "usr_meridian",
        recipientWallet: seller,
        type: "PROJECT_SOLDOUT",
        title: "Project Sold Out",
        message: `All listed units of "${proj.name || 'your project'}" have been purchased.`,
        link: "/my-projects",
        metadata: { projectId: credit.projectId },
      });
    }
  }

  // Capability check per Patch P1 spec §2
  const rawUsers = typeof window !== "undefined" ? window.localStorage?.getItem("carbonchain_users") : null;
  const allUsers = rawUsers ? JSON.parse(rawUsers) : DEMO_ACCOUNTS;
  const buyerUser = allUsers.find(
    (a) => a.id === buyerUserId || a.walletAddress?.toLowerCase() === buyerWallet?.toLowerCase()
  );
  if (buyerUser && !canBuy(buyerUser)) {
    throw new Error("Your account is set up to create and sell credits. Buying is not enabled for this account.");
  }
  const buyerDisplayName = buyerUser?.organisation || buyerUser?.name || "Ironbridge Steel and Cement Ltd";

  // Notifications per spec §12 and Patch P1 spec §3
  addNotification({
    recipientUserId: credit.ownerUserId || "usr_meridian",
    recipientWallet: seller,
    type: "CREDITS_SOLD",
    title: "Credits Sold",
    message: `${buyerDisplayName} bought ${purchaseQty.toLocaleString("en-IN")} tCO2e of ${proj.name || 'project'}. ${activeListedUnits.toLocaleString("en-IN")} tCO2e remaining.`,
    link: "/transactions",
    metadata: { projectId: credit.projectId, quantity: purchaseQty, subtotal, paymentReference, remaining: activeListedUnits },
  });

  addNotification({
    recipientUserId: buyerUserId || "usr_ironbridge",
    recipientWallet: buyerWallet,
    type: "PURCHASE_SUCCESSFUL",
    title: "Purchase Successful",
    message: `Acquired ${purchaseQty.toLocaleString("en-IN")} tCO2e of "${proj.name || 'project'}". Payment Ref: ${paymentReference}.`,
    link: "/my-credits",
    metadata: { projectId: credit.projectId, quantity: purchaseQty, totalPayable, paymentReference },
  });

  return {
    block,
    credit: resultingCredit,
    purchaseAmount: purchaseQty,
    subtotal,
    platformFee,
    pricePaid: totalPayable,
    paymentReference,
    serialRange,
  };
}

/** Get purchase history for a buyer wallet */
export function getPurchasesHistory(buyerWallet) {
  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    const history = raw ? JSON.parse(raw) : [];
    if (!buyerWallet) return history;
    return history.filter((h) => !h.buyerWallet || h.buyerWallet?.toLowerCase() === buyerWallet.toLowerCase());
  } catch {
    return [];
  }
}

/** Request retirement (buyer flow per spec §11) */
export async function requestRetirement(
  holdingId,
  buyerWallet,
  { quantity, retireeName, onBehalfOfName = "", onBehalfOfWallet = "", message = "", reason }
) {
  await delay(1500);
  const qty = Number(quantity);
  if (!qty || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
    throw new Error("Retirement quantity must be a whole positive number of tonnes.");
  }
  if (!retireeName || !retireeName.trim()) {
    throw new Error("Retiree name is required.");
  }
  if (!reason || !reason.trim()) {
    throw new Error("Reason for retirement is required.");
  }

  const holdings = getHoldings();
  const hIdx = holdings.findIndex((h) => h.id === holdingId);
  if (hIdx === -1) throw new Error("Holding not found.");

  const holding = holdings[hIdx];
  if (holding.buyerWallet && buyerWallet && holding.buyerWallet.toLowerCase() !== buyerWallet.toLowerCase()) {
    throw new Error("Only the owner of this holding can request retirement.");
  }
  const available = holding.availableQty !== undefined ? holding.availableQty : holding.quantityAvailable || 0;
  if (qty > available) {
    throw new Error(`Requested quantity (${qty} tCO2e) exceeds available balance (${available} tCO2e).`);
  }

  // Lock quantity in holding
  const newAvail = Math.max(0, available - qty);
  const newPending = (holding.pendingRetirementQty !== undefined ? holding.pendingRetirementQty : holding.quantityPendingRetirement || 0) + qty;
  holding.availableQty = newAvail;
  holding.quantityAvailable = newAvail;
  holding.pendingRetirementQty = newPending;
  holding.quantityPendingRetirement = newPending;
  holdings[hIdx] = holding;
  saveHoldings(holdings);

  const reqId = `REQ-2026-${String(Date.now()).slice(-6)}`;
  const now = new Date().toISOString();
  const serialRange = holding.serialRange || `CCI-${holding.projectId}-000001`;

  const newRequest = {
    id: reqId,
    holdingId,
    projectId: holding.projectId,
    projectName: holding.projectName,
    projectType: holding.projectType,
    buyerWallet: buyerWallet || holding.buyerWallet,
    buyerUserId: holding.buyerUserId,
    quantity: qty,
    pricePerTonne: holding.pricePerTonnePaid || 150,
    amountPaid: qty * (holding.pricePerTonnePaid || 150),
    paymentReference: holding.paymentReference,
    serialRange,
    retireeName: retireeName.trim(),
    onBehalfOfName: (onBehalfOfName || "").trim(),
    onBehalfOfWallet: (onBehalfOfWallet || "").trim(),
    message: (message || "").slice(0, 200).trim(),
    reason: reason.trim(),
    status: "Requested",
    requestedAt: now,
  };

  const requests = getRetirementRequests();
  requests.unshift(newRequest);
  saveRetirementRequests(requests);

  const block = await appendBlock("RETIREMENT_REQUESTED", {
    requestId: reqId,
    projectId: holding.projectId,
    holdingId,
    quantity: qty,
    buyer: buyerWallet,
    retireeName,
    reason,
    timestamp: now,
  });

  // Notify verifier per spec §12
  addNotification({
    recipientRole: "verifier",
    recipientUserId: "usr_verifier",
    type: "RETIREMENT_REQUESTED",
    title: "New Retirement Request",
    message: `Buyer requested retirement of ${qty.toLocaleString("en-IN")} tCO2e for "${holding.projectName}". Review required.`,
    link: "/verifier/retirements",
    metadata: { requestId: reqId, projectId: holding.projectId, quantity: qty },
  });

  return { block, request: newRequest };
}

/** Cancel a pending retirement request (buyer only per spec §4 & §11) */
export async function cancelRetirementRequest(requestId, buyerWallet) {
  await delay(1200);
  const requests = getRetirementRequests();
  const rIdx = requests.findIndex((r) => r.id === requestId);
  if (rIdx === -1) throw new Error("Retirement request not found.");

  const req = requests[rIdx];
  if (req.status !== "Requested") {
    throw new Error("Only pending requests can be cancelled.");
  }
  if (req.buyerWallet && buyerWallet && req.buyerWallet.toLowerCase() !== buyerWallet.toLowerCase()) {
    throw new Error("Only the requester can cancel this retirement request.");
  }

  // Unlock quantity in holding
  const holdings = getHoldings();
  const hIdx = holdings.findIndex((h) => h.id === req.holdingId);
  if (hIdx !== -1) {
    holdings[hIdx].availableQty += req.quantity;
    holdings[hIdx].pendingRetirementQty = Math.max(0, (holdings[hIdx].pendingRetirementQty || 0) - req.quantity);
    saveHoldings(holdings);
  }

  req.status = "Cancelled";
  req.cancelledAt = new Date().toISOString();
  requests[rIdx] = req;
  saveRetirementRequests(requests);

  const block = await appendBlock("RETIREMENT_CANCELLED", {
    requestId,
    quantity: req.quantity,
    buyer: buyerWallet,
  });

  return { block, request: req };
}

/** Approve a retirement request (verifier only per spec §9, §11 & Patch P1) */
export async function approveRetirement(requestId, verifierWalletOrUser, options = {}) {
  await delay(1200);

  // Caller role enforcement per Patch P1 §1: only a Verifier can approve a retirement
  let caller = options?.user || options?.caller;
  let verifierWallet = verifierWalletOrUser;

  if (verifierWalletOrUser && typeof verifierWalletOrUser === "object") {
    caller = verifierWalletOrUser;
    verifierWallet = caller.walletAddress;
  }

  let isVerifierCaller = false;
  if (caller) {
    isVerifierCaller = Boolean(caller.isVerifier === true || caller.role === "Verifier");
  } else if (typeof verifierWallet === "string") {
    const isVerifierAddr = verifierWallet.toLowerCase() === DEMO_WALLETS.verifier.toLowerCase();
    const isKnownBuyerOrSeller =
      verifierWallet.toLowerCase() === DEMO_WALLETS.buyer.toLowerCase() ||
      verifierWallet.toLowerCase() === DEMO_WALLETS.seller.toLowerCase();

    if (isKnownBuyerOrSeller) {
      isVerifierCaller = false;
    } else if (isVerifierAddr) {
      isVerifierCaller = true;
    } else {
      const rawUsers = typeof window !== "undefined" ? window.localStorage?.getItem("carbonchain_users") : null;
      const allUsers = rawUsers ? JSON.parse(rawUsers) : DEMO_ACCOUNTS;
      const matchingUser = allUsers.find(
        (u) => u.walletAddress?.toLowerCase() === verifierWallet.toLowerCase() || u.id === verifierWallet
      );
      isVerifierCaller = Boolean(matchingUser?.isVerifier || matchingUser?.role === "Verifier");
    }
  }

  if (!isVerifierCaller) {
    throw new Error("Only a verifier can approve a retirement.");
  }

  const note = options?.note || (typeof options === "string" ? options : "");
  const requests = getRetirementRequests();
  const rIdx = requests.findIndex((r) => r.id === requestId);
  if (rIdx === -1) throw new Error("Retirement request not found.");

  const req = requests[rIdx];
  if (req.status !== "Requested") {
    throw new Error("Only pending requests can be approved.");
  }

  const now = new Date().toISOString();
  const approvalRef = `RET-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;

  // Update holding
  const holdings = getHoldings();
  const hIdx = holdings.findIndex((h) => h.id === req.holdingId);
  if (hIdx !== -1) {
    const curPending = holdings[hIdx].pendingRetirementQty !== undefined ? holdings[hIdx].pendingRetirementQty : holdings[hIdx].quantityPendingRetirement || 0;
    const curRetired = holdings[hIdx].retiredQty !== undefined ? holdings[hIdx].retiredQty : holdings[hIdx].quantityRetired || 0;
    const newPending = Math.max(0, curPending - req.quantity);
    const newRetired = curRetired + req.quantity;
    holdings[hIdx].pendingRetirementQty = newPending;
    holdings[hIdx].quantityPendingRetirement = newPending;
    holdings[hIdx].retiredQty = newRetired;
    holdings[hIdx].quantityRetired = newRetired;
    saveHoldings(holdings);
  }

  req.status = "Approved";
  req.approvalRef = approvalRef;
  req.approvedAt = now;
  req.verifierWallet = verifierWallet || DEMO_WALLETS.verifier;
  req.verifierNote = note || "Approved by Diya Mali, Verification Authority.";
  requests[rIdx] = req;
  saveRetirementRequests(requests);

  const block = await appendBlock("RETIREMENT_APPROVED", {
    requestId,
    approvalRef,
    quantity: req.quantity,
    projectId: req.projectId,
    retireeName: req.retireeName,
    verifier: verifierWallet || DEMO_WALLETS.verifier,
    note,
    timestamp: now,
  });

  // Record to verifier history
  const vHistory = getVerifierHistory();
  vHistory.unshift({
    id: `vh_${Date.now()}`,
    type: "RETIREMENT_APPROVED",
    action: "RETIREMENT_APPROVED",
    requestId,
    approvalRef,
    projectId: req.projectId,
    projectName: req.projectName,
    actor: verifierWallet || DEMO_WALLETS.verifier,
    verifierUserId: "usr_verifier",
    quantity: req.quantity,
    note: note || "Approved by Diya Mali, Verification Authority.",
    timestamp: now,
    blockIndex: block.index,
  });
  saveVerifierHistory(vHistory);

  // Check project completion and retirement totals per Patch P1 spec §3
  const projects = getProjects();
  const pIdx = projects.findIndex((p) => p.id === req.projectId || p.registryId === req.projectId);
  if (pIdx !== -1) {
    const proj = projects[pIdx];
    const totalIssued = proj.verifiedAmount || proj.estimatedCO2 || 0;
    const allApprovedReqs = requests.filter(
      (r) => (r.projectId === proj.id || r.projectId === proj.registryId) && r.status === "Approved"
    );
    const totalRetired = allApprovedReqs.reduce((sum, r) => sum + (r.quantity || 0), 0);

    const buyerName = req.retireeName || req.buyerName || "Ironbridge Steel and Cement Ltd";
    const formattedDate = new Date(now).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Notify seller per Patch P1 spec §3:
    // "N tCO2e of PROJECT were retired by BUYER NAME on DATE. Total retired: X of Y issued."
    addNotification({
      recipientUserId: proj.ownerUserId || "usr_meridian",
      recipientWallet: proj.owner,
      type: "CREDITS_RETIRED",
      title: "Credits Retired",
      message: `${req.quantity.toLocaleString("en-IN")} tCO2e of ${proj.name} were retired by ${buyerName} on ${formattedDate}. Total retired: ${totalRetired.toLocaleString("en-IN")} of ${totalIssued.toLocaleString("en-IN")} issued.`,
      link: `/projects/${proj.slug || proj.id}`,
      metadata: { projectId: proj.id, retiredQty: req.quantity, totalRetired, totalIssued },
    });

    // When ALL issued credits are retired, project becomes CONCLUDED per Patch P1 spec §3
    if (totalRetired >= totalIssued && totalIssued > 0) {
      projects[pIdx].status = "CONCLUDED";
      saveProjects(projects);
      await appendBlock("PROJECT_CONCLUDED", {
        projectId: proj.id,
        name: proj.name,
        totalRetired,
        totalIssued,
        timestamp: now,
      });

      addNotification({
        recipientUserId: proj.ownerUserId || "usr_meridian",
        recipientWallet: proj.owner,
        type: "PROJECT_CONCLUDED",
        title: "Project Concluded",
        message: `${proj.name} is concluded. All ${totalIssued.toLocaleString("en-IN")} tCO2e were sold and retired. These credits are permanently locked and no further credits can be issued or listed for this project.`,
        link: `/projects/${proj.slug || proj.id}`,
        metadata: { projectId: proj.id, totalIssued },
      });
    }
  }

  // Notify buyer per spec §12
  addNotification({
    recipientUserId: req.buyerUserId || "usr_ironbridge",
    recipientWallet: req.buyerWallet,
    type: "RETIREMENT_APPROVED",
    title: "Retirement Approved",
    message: `Your retirement of ${req.quantity.toLocaleString("en-IN")} tCO2e for "${req.projectName}" is approved. Certificate ${approvalRef} is ready.`,
    link: `/certificate/${approvalRef}`,
    metadata: { requestId, approvalRef, quantity: req.quantity },
  });

  return { block, request: req, approvalRef };
}

/** Reject a retirement request (verifier only per spec §9 & §11) */
export async function rejectRetirement(requestId, verifierWallet, { reason } = {}) {
  await delay(1500);
  if (!reason || !reason.trim()) {
    throw new Error("A reason is required to reject a retirement request.");
  }
  const requests = getRetirementRequests();
  const rIdx = requests.findIndex((r) => r.id === requestId);
  if (rIdx === -1) throw new Error("Retirement request not found.");

  const req = requests[rIdx];
  if (req.status !== "Requested") {
    throw new Error("Only pending requests can be rejected.");
  }

  // Unlock quantity in holding
  const holdings = getHoldings();
  const hIdx = holdings.findIndex((h) => h.id === req.holdingId);
  if (hIdx !== -1) {
    const curAvail = holdings[hIdx].availableQty !== undefined ? holdings[hIdx].availableQty : holdings[hIdx].quantityAvailable || 0;
    const curPending = holdings[hIdx].pendingRetirementQty !== undefined ? holdings[hIdx].pendingRetirementQty : holdings[hIdx].quantityPendingRetirement || 0;
    const newAvail = curAvail + req.quantity;
    const newPending = Math.max(0, curPending - req.quantity);
    holdings[hIdx].availableQty = newAvail;
    holdings[hIdx].quantityAvailable = newAvail;
    holdings[hIdx].pendingRetirementQty = newPending;
    holdings[hIdx].quantityPendingRetirement = newPending;
    saveHoldings(holdings);
  }

  req.status = "Rejected";
  req.rejectionReason = reason.trim();
  req.rejectedAt = new Date().toISOString();
  requests[rIdx] = req;
  saveRetirementRequests(requests);

  const block = await appendBlock("RETIREMENT_REJECTED", {
    requestId,
    quantity: req.quantity,
    reason: reason.trim(),
    verifier: verifierWallet || DEMO_WALLETS.verifier,
  });

  // Record to verifier history
  const rejVHistory = getVerifierHistory();
  rejVHistory.unshift({
    id: `vh_${Date.now()}`,
    type: "RETIREMENT_REJECTED",
    action: "RETIREMENT_REJECTED",
    requestId,
    projectId: req.projectId,
    projectName: req.projectName,
    actor: verifierWallet || DEMO_WALLETS.verifier,
    verifierUserId: "usr_verifier",
    quantity: req.quantity,
    reason: reason.trim(),
    timestamp: new Date().toISOString(),
    blockIndex: block.index,
  });
  saveVerifierHistory(rejVHistory);

  // Notify buyer per spec §12
  addNotification({
    recipientUserId: req.buyerUserId || "usr_ironbridge",
    recipientWallet: req.buyerWallet,
    type: "RETIREMENT_REJECTED",
    title: "Retirement Request Rejected",
    message: `Your retirement request for "${req.projectName}" was rejected: ${reason.trim()}`,
    link: "/my-credits",
    metadata: { requestId, reason },
  });

  return { block, request: req };
}

/**
 * Seller listing actions per spec §4, §6.2 and Patch P1 spec §3
 */
export async function updateListingPrice(creditId, ownerWallet, newPricePerTonne) {
  await delay(1200);
  const p = Number(newPricePerTonne);
  if (isNaN(p) || p <= 0) throw new Error("Price per tonne must be a positive number.");

  const credits = getCredits();
  const idx = credits.findIndex((c) => c.id === creditId);
  if (idx === -1) throw new Error("Listing not found.");

  const credit = credits[idx];
  const projects = getProjects();
  const proj = projects.find((pr) => pr.id === credit.projectId || pr.registryId === credit.projectId);
  if (proj && (proj.status === "CONCLUDED" || proj.status === "Concluded")) {
    throw new Error("This project is concluded and its credits are permanently retired.");
  }

  if (credit.owner !== ownerWallet) throw new Error("Only the owner can update the price.");
  if (credit.retired) throw new Error("This credit is retired and permanently locked.");

  credits[idx].pricePerTonne = p;
  credits[idx].price = (credits[idx].amount || 0) * p;
  saveCredits(credits);

  const block = await appendBlock("PRICE_UPDATED", {
    creditId,
    newPricePerTonne: p,
    newPrice: credits[idx].price,
    actor: ownerWallet,
  });

  return { block, credit: credits[idx] };
}

export async function updateListingQuantity(creditId, ownerWallet, newQty) {
  await delay(1200);
  const qty = Number(newQty);
  if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
    throw new Error("Quantity must be a positive whole number.");
  }

  const credits = getCredits();
  const idx = credits.findIndex((c) => c.id === creditId);
  if (idx === -1) throw new Error("Listing not found.");

  const credit = credits[idx];
  const projects = getProjects();
  const proj = projects.find((pr) => pr.id === credit.projectId || pr.registryId === credit.projectId);
  if (proj && (proj.status === "CONCLUDED" || proj.status === "Concluded")) {
    throw new Error("This project is concluded and its credits are permanently retired.");
  }

  if (credit.owner !== ownerWallet) throw new Error("Only the owner can adjust quantity.");
  if (credit.retired) throw new Error("This credit is retired and permanently locked.");

  credits[idx].amount = qty;
  credits[idx].price = qty * (credits[idx].pricePerTonne || 150);
  saveCredits(credits);

  const block = await appendBlock("QUANTITY_UPDATED", {
    creditId,
    newQuantity: qty,
    actor: ownerWallet,
  });

  return { block, credit: credits[idx] };
}

export async function unlistListing(creditId, ownerWallet) {
  await delay(1200);
  const credits = getCredits();
  const idx = credits.findIndex((c) => c.id === creditId);
  if (idx === -1) throw new Error("Listing not found.");

  const credit = credits[idx];
  if (credit.owner !== ownerWallet) throw new Error("Only the owner can unlist this credit.");

  credits[idx].listed = false;
  saveCredits(credits);

  const block = await appendBlock("UNLISTED", { creditId, actor: ownerWallet });
  return { block, credit: credits[idx] };
}

export async function relistListing(creditId, ownerWallet) {
  await delay(1200);
  const credits = getCredits();
  const idx = credits.findIndex((c) => c.id === creditId);
  if (idx === -1) throw new Error("Listing not found.");

  const credit = credits[idx];
  const projects = getProjects();
  const proj = projects.find((pr) => pr.id === credit.projectId || pr.registryId === credit.projectId);
  if (proj && (proj.status === "CONCLUDED" || proj.status === "Concluded")) {
    throw new Error("This project is concluded and its credits are permanently retired.");
  }

  if (credit.owner !== ownerWallet) throw new Error("Only the owner can relist this credit.");
  if (credit.retired) throw new Error("This credit is retired and permanently locked.");

  credits[idx].listed = true;
  saveCredits(credits);

  const block = await appendBlock("LISTED", { creditId, price: credit.price, actor: ownerWallet });
  return { block, credit: credits[idx] };
}

/** Resubmit a rejected project as a linked new version per spec §4 & §6.2 */
export async function resubmitRejectedProject(oldProjectId, ownerWallet, ownerUserId, updatedFields) {
  await delay(1500);
  const projects = getProjects();
  const oldProj = projects.find((p) => p.id === oldProjectId);
  if (!oldProj) throw new Error("Original project not found.");
  if (oldProj.status === "CONCLUDED" || oldProj.status === "Concluded") {
    throw new Error("This project is concluded and its credits are permanently retired.");
  }
  if (oldProj.status !== "Rejected") {
    throw new Error("Only rejected projects can be edited and resubmitted.");
  }

  const newId = `proj_${Date.now()}`;
  const now = new Date().toISOString();
  const estCO2 = Number(updatedFields.estimatedCO2 || oldProj.estimatedCO2);

  const newProject = {
    ...oldProj,
    ...updatedFields,
    id: newId,
    previousVersionId: oldProjectId,
    status: "Pending",
    verifierNote: "",
    submittedAt: now,
    updatedAt: now,
    estimatedCO2: estCO2,
  };

  projects.push(newProject);
  saveProjects(projects);

  const block = await appendBlock("PROJECT_SUBMITTED", {
    projectId: newId,
    previousVersionId: oldProjectId,
    name: newProject.name,
    actor: ownerWallet,
    note: "Resubmitted linked version after previous rejection",
  });

  addNotification({
    recipientRole: "verifier",
    recipientUserId: "usr_verifier",
    type: "PROJECT_SUBMITTED",
    title: "Project Resubmitted for Review",
    message: `"${newProject.name}" has been resubmitted with revisions following previous review.`,
    link: "/verifier/queue",
    metadata: { projectId: newId },
  });

  return { block, project: newProject };
}

/**
 * Retire a credit directly.
 * SPEC §3.2 & Patch P1 §1: "Only a verifier can approve a retirement."
 * Neither buyer nor seller has any direct retire button or retire function.
 */
export async function retireCredit() {
  throw new Error(
    "Only a verifier can approve a retirement. Direct retirement is not permitted."
  );
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
