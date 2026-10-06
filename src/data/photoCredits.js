/**
 * CarbonChain Photo Credits
 * Per spec §15, §199
 */

export const PHOTO_CREDITS = {
  "piplantri.jpg": "Carbon Registry India (NCCF) / Piplantri Village Community",
  "concor-solar.jpg": "CONCOR Multi Modal Logistics Park / Clean Energy Projects",
  "concor-erst.jpg": "Container Corporation of India Ltd (CONCOR)",
  "shield-mangrove.jpg": "SHIELD Coastal Mangrove Conservation Initiative, Odisha",
  "green-wings.jpg": "Green Wings Agroforestry Project, Jalgaon, Maharashtra",
  "rajsamand.jpg": "Rajsamand District Reforestation Registry",
  "hyderabad-metro.jpg": "L&T Metro Rail (Hyderabad) Limited",
  "solar-sinnar.jpg": "Maharashtra Energy Development Agency / Sinnar Solar Park",
  "wind-satara.jpg": "Western Ghats Renewable Energy Trust / Satara Ridge",
  "agroforestry-dindori.jpg": "Dindori Farmer Producer Organisation / Agroforestry Hub",
  "afforestation-trimbakeshwar.jpg": "Trimbakeshwar Forest Division / Community Plantation",
  "mangrove-raigad.jpg": "Konkan Mangrove Conservation Society, Raigad",
  "transport-nashik.jpg": "Nashik Mahanagar Parivahan Mahamandal Ltd (NMPML)",
  "waste-nashik.jpg": "Nashik Municipal Corporation Clean Energy Division",
};

export function getPhotoCredit(fileName) {
  if (!fileName) return "CarbonChain Verified Project Documentation";
  const base = fileName.split("/").pop();
  return PHOTO_CREDITS[base] || "CarbonChain Verified Project Documentation";
}
