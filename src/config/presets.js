/**
 * CarbonChain  -  Nashik & Maharashtra Presets ("Fill it" button)
 * Per spec §8, §138-148.
 *
 * Fictional projects at real places across Nashik and Maharashtra.
 * The seven seeded CRI projects are NOT changed.
 * Pressing "Fill it" cycles through the types.
 */

export const PRESET_PROJECTS = [
  {
    type: "Solar",
    name: "Sinnar Solar Park (5 MW)",
    location: "Sinnar, Nashik, Maharashtra",
    district: "Nashik",
    state: "Maharashtra",
    inputs: { capacityMW: 5, utilisationPercent: 19 },
    estimatedCO2: 6241,
    listQuantity: 6000,
    askingPrice: 450,
    methodology: "ACM0002  -  Grid-connected electricity generation from renewable sources",
    scale: "small",
    sdgs: [13, 7, 9, 12],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 7: { scale: 5, intensity: 4 }, 9: { scale: 4, intensity: 4 }, 12: { scale: 3, intensity: 3 } },
    description: "5 MW grid-connected ground mounted photovoltaic solar installation in the Sinnar industrial belt of Nashik district. Feeds clean zero-emission renewable energy into the western Maharashtra grid, reducing reliance on thermal power plants.",
    photoFile: "solar-sinnar.jpg",
    photoUrl: "/images/presets/solar-sinnar.jpg",
    proofUrl: "https://carbonchain.network/registry/sinnar-solar",
  },
  {
    type: "Wind",
    name: "Satara Ridge Wind Farm Phase 1 (10 MW)",
    location: "Satara district, Maharashtra",
    district: "Satara",
    state: "Maharashtra",
    inputs: { capacityMW: 10, utilisationPercent: 27 },
    estimatedCO2: 17739,
    listQuantity: 17000,
    askingPrice: 500,
    methodology: "ACM0002  -  Grid-connected electricity generation from renewable sources",
    scale: "large",
    sdgs: [13, 7, 9, 12],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 7: { scale: 5, intensity: 5 }, 9: { scale: 4, intensity: 4 }, 12: { scale: 3, intensity: 3 } },
    description: "10 MW wind power generation installation sited across the high wind-velocity corridors of Satara Ridge in western Maharashtra. Contributes clean power directly to the regional grid under Clean Development Mechanism protocols.",
    photoFile: "wind-satara.jpg",
    photoUrl: "/images/presets/wind-satara.jpg",
    proofUrl: "https://carbonchain.network/registry/satara-wind",
  },
  {
    type: "Agroforestry",
    name: "Dindori Grape-Belt Agroforestry Programme",
    location: "Dindori, Nashik, Maharashtra",
    district: "Nashik",
    state: "Maharashtra",
    inputs: { hectares: 200, survivalRatePercent: 85, tPerHaYr: 8, natureBufferPercent: 10 },
    estimatedCO2: 1224,
    listQuantity: 1200,
    askingPrice: 1800,
    methodology: "AR-ACM0003  -  Afforestation and reforestation of lands including agroforestry",
    scale: "small",
    sdgs: [13, 15, 1, 8],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 15: { scale: 5, intensity: 4 }, 1: { scale: 4, intensity: 4 }, 8: { scale: 4, intensity: 3 } },
    description: "Community agroforestry project partnering with smallholder grape farmers in the Dindori valley of Nashik. Intercrops indigenous shade trees and nitrogen-fixing species along vineyard perimeters, sequestering carbon while enhancing soil microbiome health.",
    photoFile: "agroforestry-dindori.jpg",
    photoUrl: "/images/presets/agroforestry-dindori.jpg",
    proofUrl: "https://carbonchain.network/registry/dindori-agroforestry",
  },
  {
    type: "Afforestation",
    name: "Trimbakeshwar-Igatpuri Hill Afforestation",
    location: "Trimbakeshwar and Igatpuri, Nashik, Maharashtra",
    district: "Nashik",
    state: "Maharashtra",
    inputs: { hectares: 500, survivalRatePercent: 80, tPerHaYr: 6, natureBufferPercent: 10 },
    estimatedCO2: 2160,
    listQuantity: 2100,
    askingPrice: 1600,
    methodology: "AR-AMS0003  -  Afforestation and reforestation project activities implemented on degraded lands",
    scale: "large",
    sdgs: [13, 15, 6, 8],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 15: { scale: 5, intensity: 5 }, 6: { scale: 4, intensity: 4 }, 8: { scale: 3, intensity: 3 } },
    description: "Canopy restoration and ecological afforestation across degraded slopes of the Western Ghats catchment in Trimbakeshwar and Igatpuri talukas. Stabilizes Godavari headwaters watershed, prevents monsoon topsoil erosion, and enhances endemic biodiversity.",
    photoFile: "afforestation-trimbakeshwar.jpg",
    photoUrl: "/images/presets/afforestation-trimbakeshwar.jpg",
    proofUrl: "https://carbonchain.network/registry/trimbakeshwar-afforestation",
  },
  {
    type: "Mangrove",
    name: "Raigad Coast Mangrove Restoration",
    location: "Raigad, Konkan, Maharashtra",
    district: "Raigad",
    state: "Maharashtra",
    inputs: { hectares: 100, survivalRatePercent: 80, tPerHaYr: 12, natureBufferPercent: 10 },
    estimatedCO2: 864,
    listQuantity: 850,
    askingPrice: 2400,
    methodology: "AR-AM0014  -  Afforestation and reforestation of degraded tidal wetland and mangrove habitats",
    scale: "small",
    sdgs: [13, 14, 15, 1],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 14: { scale: 5, intensity: 5 }, 15: { scale: 4, intensity: 4 }, 1: { scale: 4, intensity: 3 } },
    description: "Tidal wetland conservation along the estuarine mudflats of the Raigad Konkan coastline. Reintroduces native Rhizophora and Avicennia mangrove species, delivering high-density blue carbon sequestration and shielding coastal villages from storm surges.",
    photoFile: "mangrove-raigad.jpg",
    photoUrl: "/images/presets/mangrove-raigad.jpg",
    proofUrl: "https://carbonchain.network/registry/raigad-mangrove",
  },
  {
    type: "Transport",
    name: "Nashik City Electric Bus Fleet",
    location: "Nashik city, Maharashtra",
    district: "Nashik",
    state: "Maharashtra",
    inputs: { dieselLitresReplaced: 600000, electricityMWhUsed: 800 },
    estimatedCO2: 1008,
    listQuantity: 1000,
    askingPrice: 900,
    methodology: "ACM0016  -  Mass rapid transit and bus route electrification projects",
    scale: "small",
    sdgs: [13, 11, 9, 3],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 11: { scale: 5, intensity: 5 }, 9: { scale: 4, intensity: 4 }, 3: { scale: 4, intensity: 3 } },
    description: "Electrification initiative transitioning municipal bus transit routes across Nashik urban corridors to zero-emission battery-electric buses. Displaces over 600,000 litres of diesel combustion annually, improving urban air quality and particulate metrics.",
    photoFile: "transport-nashik.jpg",
    photoUrl: "/images/presets/transport-nashik.jpg",
    proofUrl: "https://carbonchain.network/registry/nashik-electric-bus",
  },
  {
    type: "Waste",
    name: "Nashik Organic Waste Composting",
    location: "Nashik city, Maharashtra",
    district: "Nashik",
    state: "Maharashtra",
    inputs: { tonnesDiverted: 5000, wasteFactor: 0.4 },
    estimatedCO2: 2000,
    listQuantity: 2000,
    askingPrice: 700,
    methodology: "AMS-III.F  -  Avoidance of methane emissions through controlled biological treatment of biomass",
    scale: "small",
    sdgs: [13, 11, 12, 3],
    sdgScores: { 13: { scale: 5, intensity: 5 }, 11: { scale: 5, intensity: 4 }, 12: { scale: 4, intensity: 4 }, 3: { scale: 4, intensity: 3 } },
    description: "Decentralized municipal compost facility processing segregated organic and agricultural market waste from Nashik wholesale mandis. Prevents anaerobic landfill decomposition and fugitive methane venting, yielding organic agricultural fertilizer.",
    photoFile: "waste-nashik.jpg",
    photoUrl: "/images/presets/waste-nashik.jpg",
    proofUrl: "https://carbonchain.network/registry/nashik-waste-compost",
  },
];

/**
 * Returns preset by project type or index
 */
export function getPresetByType(type) {
  return PRESET_PROJECTS.find((p) => p.type.toLowerCase() === (type || "").toLowerCase()) || PRESET_PROJECTS[0];
}

/**
 * Cycles to the next preset given current index or type
 */
export function getNextPreset(currentTypeOrIndex) {
  let currentIndex = 0;
  if (typeof currentTypeOrIndex === "number") {
    currentIndex = currentTypeOrIndex;
  } else if (typeof currentTypeOrIndex === "string") {
    const idx = PRESET_PROJECTS.findIndex((p) => p.type.toLowerCase() === currentTypeOrIndex.toLowerCase());
    if (idx !== -1) currentIndex = idx;
  }
  const nextIndex = (currentIndex + 1) % PRESET_PROJECTS.length;
  return { preset: PRESET_PROJECTS[nextIndex], index: nextIndex };
}

export const NASHIK_PRESETS = PRESET_PROJECTS;

export function cyclePreset(currentTypeOrIndex) {
  return getNextPreset(currentTypeOrIndex).preset;
}

