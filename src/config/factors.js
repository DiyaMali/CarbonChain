/**
 * CarbonChain  -  Credit Estimator Factors & Methodologies
 * Per spec §5, §8, §129, §148.
 *
 * All factors are editable in the UI, labelled:
 * "Default value, adjust per your methodology".
 * Indicative first estimate; only the verifier confirms the final number.
 */

export const DEFAULT_FACTORS = {
  // Grid emission factor for Indian western/regional grid (tCO2 / MWh)
  gridFactor: 0.75,

  // Nature projects risk buffer pool deduction % (mirrors CRI Buffer Pool)
  natureBufferPercent: 10,

  // Diesel fuel combustion emission factor (kg CO2 / litre) -> 2.68 kg = 0.00268 t
  dieselFactorKgPerLitre: 2.68,

  // Waste anaerobic composting diversion factor (tCO2e avoided per tonne wet waste)
  wasteDefaultFactor: 0.4,

  // Hours per non-leap year
  hoursPerYear: 8760,
};

/**
 * Indicative price ranges per spec §5:
 * Solar, wind: Rs 300 to 700.
 * Transport, waste: Rs 450 to 1,300.
 * Agroforestry, afforestation, mangrove: Rs 1,300 to 3,000.
 */
export const INDICATIVE_PRICE_BANDS = {
  Solar: { min: 300, max: 700, label: "Rs 300 - 700" },
  Wind: { min: 300, max: 700, label: "Rs 300 - 700" },
  Agroforestry: { min: 1300, max: 3000, label: "Rs 1,300 - 3,000" },
  Afforestation: { min: 1300, max: 3000, label: "Rs 1,300 - 3,000" },
  Mangrove: { min: 1300, max: 3000, label: "Rs 1,300 - 3,000" },
  Transport: { min: 450, max: 1300, label: "Rs 450 - 1,300" },
  Waste: { min: 450, max: 1300, label: "Rs 450 - 1,300" },
  Other: { min: 300, max: 3000, label: "Rs 300 - 3,000" },
};

/**
 * Checks if asking price is within the indicative band.
 * Returns warning string if outside, or null if inside.
 * Spec §5: Price far outside the band gives a gentle warning to seller, never blocks.
 */
export function checkPriceBand(type, pricePerTonne) {
  const band = INDICATIVE_PRICE_BANDS[type] || INDICATIVE_PRICE_BANDS.Other;
  const p = Number(pricePerTonne);
  if (isNaN(p) || p <= 0) return null;
  if (p < band.min) {
    return `Asking price (Rs ${p.toLocaleString("en-IN")}) is below the typical market range of ${band.label} for ${type} projects. This will be flagged for verifier review.`;
  }
  if (p > band.max) {
    return `Asking price (Rs ${p.toLocaleString("en-IN")}) is above the typical market range of ${band.label} for ${type} projects. This will be flagged for verifier review.`;
  }
  return null;
}

export function getPriceBand(type) {
  return INDICATIVE_PRICE_BANDS[type] || INDICATIVE_PRICE_BANDS.Other || { min: 300, max: 3000, label: "Rs 300 - 3,000" };
}



/**
 * Calculates estimated credits per year based on project type and inputs.
 * Returns { netCredits, grossCredits, steps: Array<{ label, value }> }
 */
export function calculateEstimatedCredits(type, inputs, factors = DEFAULT_FACTORS) {
  const gridFactor = Number(factors.gridFactor || DEFAULT_FACTORS.gridFactor);
  const bufferPct = Number(factors.natureBufferPercent ?? DEFAULT_FACTORS.natureBufferPercent);

  switch (type) {
    case "Solar":
    case "Wind": {
      const mw = Number(inputs.capacityMW || 0);
      const util = Number(inputs.utilisationPercent || 0) / 100;
      // Formula: MW * 8,760 * utilisation * gridFactor
      const annualMWh = mw * DEFAULT_FACTORS.hoursPerYear * util;
      const credits = annualMWh * gridFactor;
      const net = Math.floor(credits);
      return {
        grossCredits: net,
        netCredits: net,
        steps: [
          { label: "Installed Capacity", value: `${mw} MW` },
          { label: "Hours per Year", value: "8,760 hrs" },
          { label: "Capacity Utilisation Factor (CUF)", value: `${(util * 100).toFixed(1)}%` },
          { label: "Annual Generation", value: `${annualMWh.toLocaleString("en-IN", { maximumFractionDigits: 1 })} MWh` },
          { label: "Regional Grid Emission Factor", value: `${gridFactor} tCO2/MWh` },
          { label: "Formula", value: `${mw} × 8,760 × ${(util).toFixed(2)} × ${gridFactor}` },
          { label: "Annual Net Carbon Offset", value: `${net.toLocaleString("en-IN")} tCO2e/yr` },
        ],
      };
    }

    case "Agroforestry":
    case "Afforestation":
    case "Mangrove": {
      const ha = Number(inputs.hectares || 0);
      const surv = Number(inputs.survivalRatePercent || 0) / 100;
      const tPerHa = Number(inputs.tPerHaYr || 0);
      const buf = bufferPct / 100;
      // Formula: hectares * survival * t/ha/yr * (1 - buffer)
      const gross = ha * surv * tPerHa;
      const net = Math.floor(gross * (1 - buf));
      return {
        grossCredits: Math.floor(gross),
        netCredits: net,
        bufferDeduction: Math.floor(gross * buf),
        steps: [
          { label: "Total Project Area", value: `${ha.toLocaleString("en-IN")} hectares` },
          { label: "Sapling / Canopy Survival Rate", value: `${(surv * 100).toFixed(0)}%` },
          { label: "Biomass Sequestration Rate", value: `${tPerHa} tCO2e/ha/yr` },
          { label: "Gross Biomass Absorption", value: `${Math.floor(gross).toLocaleString("en-IN")} tCO2e/yr` },
          { label: "Buffer Pool Reserve (Risk Buffer)", value: `${bufferPct}% (-${Math.floor(gross * buf).toLocaleString("en-IN")} tCO2e)` },
          { label: "Formula", value: `${ha} × ${(surv).toFixed(2)} × ${tPerHa} × (1 - ${buf.toFixed(2)})` },
          { label: "Net Marketable Carbon Credits", value: `${net.toLocaleString("en-IN")} tCO2e/yr` },
        ],
      };
    }

    case "Transport": {
      const dieselL = Number(inputs.dieselLitresReplaced || 0);
      const elecMWh = Number(inputs.electricityMWhUsed || 0);
      // Formula: litres * 2.68 / 1000 - MWh * gridFactor
      const avoided = (dieselL * DEFAULT_FACTORS.dieselFactorKgPerLitre) / 1000;
      const chargingEmissions = elecMWh * gridFactor;
      const net = Math.max(0, Math.floor(avoided - chargingEmissions));
      return {
        grossCredits: Math.floor(avoided),
        netCredits: net,
        chargingDeduction: Math.floor(chargingEmissions),
        steps: [
          { label: "Diesel Fuel Displaced", value: `${dieselL.toLocaleString("en-IN")} litres/yr` },
          { label: "Diesel Emission Factor", value: `${DEFAULT_FACTORS.dieselFactorKgPerLitre} kg CO2/L` },
          { label: "Gross Displaced Emissions", value: `${Math.floor(avoided).toLocaleString("en-IN")} tCO2e` },
          { label: "EV Fleet Charging Electricity", value: `${elecMWh.toLocaleString("en-IN")} MWh` },
          { label: "Grid Charging Emissions", value: `-${Math.floor(chargingEmissions).toLocaleString("en-IN")} tCO2e` },
          { label: "Formula", value: `(${dieselL.toLocaleString()} × 2.68 / 1,000) - (${elecMWh} × ${gridFactor})` },
          { label: "Net Avoided Emissions", value: `${net.toLocaleString("en-IN")} tCO2e/yr` },
        ],
      };
    }

    case "Waste": {
      const tonnes = Number(inputs.tonnesDiverted || 0);
      const factor = Number(inputs.wasteFactor || DEFAULT_FACTORS.wasteDefaultFactor);
      // Formula: tonnes * factor
      const net = Math.floor(tonnes * factor);
      return {
        grossCredits: net,
        netCredits: net,
        steps: [
          { label: "Organic Waste Diverted from Landfill", value: `${tonnes.toLocaleString("en-IN")} tonnes/yr` },
          { label: "Methane Avoidance Factor", value: `${factor} tCO2e/tonne` },
          { label: "Formula", value: `${tonnes.toLocaleString()} × ${factor}` },
          { label: "Net Avoided Emissions", value: `${net.toLocaleString("en-IN")} tCO2e/yr` },
        ],
      };
    }

    default: {
      const val = Math.floor(Number(inputs.directCredits || 0));
      return {
        grossCredits: val,
        netCredits: val,
        steps: [{ label: "Direct Entered CO2e", value: `${val.toLocaleString("en-IN")} tCO2e/yr` }],
      };
    }
  }
}
