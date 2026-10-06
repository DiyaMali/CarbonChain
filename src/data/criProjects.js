/**
 * Official Carbon Registry - India (CRI) Project Dataset
 * Source attribution: "Project data: Carbon Registry India (registry.nccf.in), an initiative by NCCF. Snapshot taken 1 Oct 2026."
 * Registry home: https://registry.nccf.in/projects
 *
 * Rules:
 * - Do not invent any project facts.
 * - Missing values are explicitly "See CRI listing" or "Not available" or "Not set".
 * - No em dashes in UI copy.
 */

export const CRI_ATTRIBUTION = "Project data: Carbon Registry India (registry.nccf.in), an initiative by NCCF. Snapshot taken 1 Oct 2026.";
export const CRI_REGISTRY_HOME = "https://registry.nccf.in/projects";

export const CRI_PROJECTS = [
  // ─── Project 1 ─────────────────────────────────────────────────────────────
  {
    criId: "CRI30023IN",
    slug: "piplantri-tree-plantation",
    name: "Piplantri Tree Plantation Project",
    hindiName: null,
    status: "Listed",
    registryUrl: "https://registry.nccf.in/projects/ac41308c-6fa4-4c4b-accc-4656e36a2e5a",
    type: "Afforestation and reforestation",
    location: "Rajasthan, India",
    state: "Rajasthan",
    estCreditsPerYear: 56774,
    scale: "small",
    methodology: "AR-AMS0003",
    classification: "pa",
    listedDate: "19 Apr 2026",
    registeredDate: "Not set",
    creditingPeriod: "Not set",
    developer: "Terrablu Climate Technologies",
    delegateEntity: "Terrablu Climate Technologies Pvt Ltd",
    delegateUrl: "https://terrablu.life/",
    validationBody: {
      name: "VKU Certification Pvt. Ltd.",
      id: "CRI-VVB-000007",
      url: "https://www.vkucertification.com/",
    },
    verificationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    sdgs: [
      { number: 13, name: "Climate Action" },
      { number: 5, name: "Gender Equality" },
      { number: 6, name: "Clean Water & Sanitation" },
      { number: 8, name: "Decent Work & Economic Growth" },
      { number: 15, name: "Life on Land" },
    ],
    coordinates: null, // "not available"
    galleryCount: 2,
    galleryCaptions: [
      "Stakeholder Workshop: Mr. Motwani addressing local community",
      "Stakeholder Workshop: Dr. Paliwal addressing local community",
    ],
    historyCount: 20,
    image: "/images/projects/piplantri.jpg",
    description: [
      "The Piplantri Village Tree Plantation Carbon Credit Project implements a comprehensive and community-driven approach to enhance green cover and longterm carbon sequestration through afforestation, reforestation, and revegetation activities. By converting previously degraded or under-utilized land into biologically productive landscapes, the project increases biomass carbon stocks, improves ecosystem services, and contributes to climate change mitigation.",
      "Prior to the implementation of the project, no organized, large-scale, and systematically monitored plantation activity existed across the identified project areas, highlighting the project's additional and transformative nature.",
    ],
    objectives: [],
    impacts: [],
    coBenefits: [],
    documents: [
      { name: "Piplantri CR-I_PDD Ver 1.1.pdf", type: "pdd", date: "30 Mar 2026" },
      { name: "ESIA Preliminary Study", type: "supporting", date: "30 Mar 2026" },
      { name: "Legal Agreement - IPP & DE Contract", type: "supporting", date: "30 Mar 2026" },
      { name: "Piplantri CR-I_SCR Ver 1.0.pdf", type: "stakeholder report", date: "30 Mar 2026" },
      { name: "Consultation Documentation", type: "supporting", date: "30 Mar 2026" },
      { name: "Stakeholder Mapping Invitation", type: "supporting", date: "30 Mar 2026" },
      { name: "Village Boundry 1 (Aarna.kml)", type: "project document", date: "30 Mar 2026" },
      { name: "Village Boundry 2 (Gugleta.kml)", type: "project document", date: "30 Mar 2026" },
      { name: "Village Boundry 3 (Morwar.kml)", type: "project document", date: "30 Mar 2026" },
      { name: "Village Boundry 4 (Omthi.kml)", type: "project document", date: "30 Mar 2026" },
      { name: "Village Boundry 5 (Peepalantri Kalan.kml)", type: "project document", date: "30 Mar 2026" },
      { name: "Village Boundry 6 (Piplantri Khurd.kml)", type: "project document", date: "30 Mar 2026" },
      { name: "Plot 1 KML", type: "project document", date: "30 Mar 2026" },
      { name: "Plot 2 KML", type: "project document", date: "30 Mar 2026" },
      { name: "Plot 3 KML", type: "project document", date: "30 Mar 2026" },
    ],
    // Demo-only fields for simulated ledger integration
    demoLedgerId: "proj_001",
    demoTokenId: "CCI-MCU-000001",
  },

  // ─── Project 2 ─────────────────────────────────────────────────────────────
  {
    criId: "CRI140026IN",
    slug: "concor-solar-panels",
    name: "Installation of Solar Panels at Multi Modal Logistics Park at Barhi and CONCOR Bhawan",
    hindiName: null,
    status: "Planned",
    registryUrl: "https://registry.nccf.in/projects/3df495e1-b71a-4ac7-8995-46dbf977a40e",
    type: "Energy Industries",
    location: "Delhi, India",
    state: "Delhi",
    estCreditsPerYear: 250,
    scale: "micro",
    methodology: "ACM0002",
    classification: "pa",
    listedDate: "Not set",
    registeredDate: "Not set",
    creditingPeriod: "Not set",
    developer: "Container Corporation of India (CONCOR)",
    delegateEntity: "Container Corporation of India (CONCOR)",
    delegateUrl: "https://www.concorindia.co.in/?lang=en",
    validationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    verificationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    sdgs: [
      { number: 13, name: "Climate Action" },
      { number: 7, name: "Affordable & Clean Energy" },
      { number: 9, name: "Industry, Innovation & Infrastructure" },
      { number: 11, name: "Sustainable Cities & Communities" },
      { number: 12, name: "Responsible Consumption & Production" },
    ],
    coordinates: {
      lat: 29.1074,
      lng: 77.0246,
      mapsUrl: "https://www.google.com/maps?q=29.1074,77.0246",
      text: "29.1074 N, 77.0246 E",
    },
    galleryCount: 2,
    galleryCaptions: [],
    historyCount: 4,
    image: "/images/projects/concor-solar.jpg",
    description: [
      "The project has been developed with the aim of reducing Scope 2 GHG emissions associated with CONCOR's terminal operations by increasing the use of renewable energy and reducing dependence on grid electricity.",
    ],
    objectives: [
      "To transition towards sustainable power, generated through solar energy.",
      "To harness the potential of large vacant rooftop space at the terminal and CONCOR Bhawan.",
      "To reduce dependency on grid power and lower electricity bills, making operations more cost-effective.",
    ],
    impacts: [
      "The installation of rooftop solar PV systems is estimated to have the potential to reduce approximately 250 to 300 tonnes of CO2e annually, while contributing to CONCOR's broader transition towards low-carbon and sustainable logistics operations.",
    ],
    coBenefits: [],
    documents: [
      {
        name: "Concept Note_CONCOR_Installation of Solar Panels at Terminals and Corporate Office_14 september.docx",
        type: "project document",
        date: "22 Sep 2026",
      },
    ],
    demoLedgerId: "proj_002",
    demoTokenId: "CCI-MCU-000002",
  },

  // ─── Project 3 ─────────────────────────────────────────────────────────────
  {
    criId: "CRI130025IN",
    slug: "concor-electric-reach-stackers",
    name: "Deployment of Electric Reach Stackers (eRSTs) at CONCOR Terminals",
    hindiName: null,
    status: "Planned",
    registryUrl: "https://registry.nccf.in/projects/57c5e40b-eeca-4a50-9406-e0afad19fbea",
    type: "Transport",
    location: "Delhi, India",
    state: "Delhi",
    estCreditsPerYear: 3000,
    scale: "See CRI listing",
    methodology: "See CRI listing",
    classification: "See CRI listing",
    listedDate: "Not set",
    registeredDate: "Not set",
    creditingPeriod: "Not set",
    developer: "See CRI listing",
    delegateEntity: "See CRI listing",
    delegateUrl: "https://registry.nccf.in/projects/57c5e40b-eeca-4a50-9406-e0afad19fbea",
    validationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    verificationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    sdgs: [], // "See CRI listing"
    coordinates: null,
    galleryCount: 2,
    galleryCaptions: [],
    historyCount: 3,
    image: "/images/projects/concor-erst.jpg",
    description: [
      "The project aims to reduce greenhouse gas (GHG) emissions from container handling operations at CONCOR terminals by replacing conventional diesel-powered Reach Stackers (RSTs) with electric Reach Stackers (eRSTs).",
    ],
    objectives: [
      "To reduce fossil fuel consumption and GHG emissions by replacing diesel-powered RSTs with eRSTs.",
      "To demonstrate a scalable pathway for the electrification of cargo handling equipment and support wider adoption of low-carbon technologies across CONCOR terminals.",
    ],
    impacts: [
      "The project is expected to achieve approximately 3,000 tCO2e of GHG emission reductions annually, contributing to the decarbonisation of CONCOR's container handling operations.",
    ],
    coBenefits: [],
    documents: [],
    demoLedgerId: "proj_003",
    demoTokenId: "CCI-MCU-000003",
  },

  // ─── Project 4 ─────────────────────────────────────────────────────────────
  {
    criId: "CRI100025IN",
    slug: "shield-ajsa-mangrove-restoration",
    name: "SHIELD - AJSA Mangrove Restoration Project",
    hindiName: null,
    status: "Planned",
    registryUrl: "https://registry.nccf.in/projects",
    type: "Afforestation and reforestation",
    location: "Odisha, India (Krushnaprasad Block, Puri District)",
    state: "Odisha",
    estCreditsPerYear: 50000,
    scale: "small",
    methodology: "AR-AM0014",
    classification: "pa",
    listedDate: "Not set",
    registeredDate: "Not set",
    creditingPeriod: "Not set",
    developer: "Terrablu Climate Technologies",
    delegateEntity: "Terrablu Climate Technologies Pvt Ltd",
    delegateUrl: "https://terrablu.life/",
    validationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    verificationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    sdgs: [
      { number: 13, name: "Climate Action" },
    ],
    coordinates: {
      lat: 19.6270,
      lng: 85.2560,
      mapsUrl: "https://www.google.com/maps?q=19.627,85.256&z=17&t=k",
      text: "19.6270 N, 85.2560 E",
    },
    galleryCount: 3,
    galleryCaptions: [],
    historyCount: 3,
    image: "/images/projects/shield-mangrove.jpg",
    description: [
      "Project SHIELD is a 3-year mangrove restoration and coastal ecosystem conservation project proposed across 20 villages in Krushnaprasad Block, Puri District, Odisha. The project has currently planted approximately 80,000 indigenous mangrove saplings, with a planned restoration area of approximately 1,000 hectares.",
      "The project aims to restore degraded coastal ecosystems, enhance natural protection against cyclones and coastal erosion, sequester carbon, conserve biodiversity and protect Olive Ridley turtle nesting habitats. It will also engage local communities through Eco Clubs, awareness programmes, sustainable fisheries and livelihood activities.",
    ],
    objectives: [
      "Restore mangrove ecosystems and strengthen coastal resilience.",
      "Enhance carbon sequestration through mangrove restoration and conservation.",
      "Protect biodiversity, including Olive Ridley turtle nesting habitats.",
      "Improve fisheries and local livelihoods through sustainable resource management.",
      "Strengthen community participation through Eco Clubs, awareness and capacity-building activities.",
    ],
    impacts: [
      "Restoration of approximately 1000 hectares of mangrove ecosystem.",
      "Establishment of 80,000 mangrove saplings.",
      "Increased carbon sequestration through mangrove biomass and ecosystem restoration.",
      "Creation of a natural coastal bio-shield against cyclones, storm surges and erosion.",
      "Improvement in coastal and marine biodiversity.",
      "Protection of Olive Ridley turtle nesting habitats.",
      "Improvement of aquatic habitat through fish-bone channels and better water exchange.",
      "Long-term improvement in ecosystem health through continuous monitoring and maintenance.",
    ],
    coBenefits: [],
    documents: [],
    demoLedgerId: "proj_004",
    demoTokenId: "CCI-MCU-000004",
  },

  // ─── Project 5 ─────────────────────────────────────────────────────────────
  {
    criId: "CRI90022IN",
    slug: "green-wings-agroforestry",
    name: "Green Wings Agroforestry Project",
    hindiName: null,
    status: "Planned",
    registryUrl: "https://registry.nccf.in/projects",
    type: "Afforestation and reforestation",
    location: "Maharashtra, India (Parola Taluka, District Jalgaon)",
    state: "Maharashtra",
    estCreditsPerYear: 15000,
    scale: "micro",
    methodology: "AR-ACM0003",
    classification: "pa",
    listedDate: "Not set",
    registeredDate: "Not set",
    creditingPeriod: "Not set",
    developer: "Terrablu Climate Technologies",
    delegateEntity: "Terrablu Climate Technologies Pvt Ltd",
    delegateUrl: "https://terrablu.life/",
    validationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    verificationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    sdgs: [
      { number: 13, name: "Climate Action" },
    ],
    coordinates: {
      lat: 20.8820,
      lng: 75.1240,
      mapsUrl: "https://www.google.com/maps?q=20.882,75.124&z=17&t=k",
      text: "20.8820 N, 75.1240 E",
    },
    galleryCount: 3,
    galleryCaptions: [],
    historyCount: 3,
    image: "/images/projects/green-wings.jpg",
    description: [
      "The proposed project is an Agroforestry-Based Carbon Credit Project implemented across agricultural landholdings of approximately 1,700 farmers associated with Devendra Nursery in Parola Taluka, District Jalgaon, Maharashtra. The project aims to formally register, monitor and quantify the carbon sequestration potential of existing and future agroforestry plantations established on participating farmers' landholdings.",
      "The project will promote and maintain a diversified mix of timber, fruit-bearing, bamboo and multipurpose tree species, including Bamboo, Tulda Bamboo, Teak, Mahua, Mahogany, Red Sandalwood, White Sandalwood, Melia Dubia, Mango, Lemon and Pomegranate. These plantations will contribute to long-term carbon sequestration through the accumulation of biomass while providing additional economic benefits to participating farmers through timber, fruit, non-timber forest produce and carbon-credit revenue sharing.",
      "The project objectives include increasing tree cover, enhancing carbon sequestration, promoting sustainable agroforestry practices, improving soil health and water retention, reducing soil erosion, supporting biodiversity and strengthening the long-term productivity and climate resilience of agricultural landscapes. The project will include farmer identification and enrollment, plot-level geo-tagging and baseline data collection, plantation and tree-count assessment, periodic monitoring of tree survival and growth, carbon quantification, documentation, third-party verification and issuance of carbon credits under an applicable carbon standard and methodology.",
      "The expected environmental impact includes increased atmospheric carbon dioxide removal through biomass growth, enhanced biodiversity, improved local microclimatic conditions, improved soil and water retention, reduced soil erosion and potential improvement in groundwater recharge. The project is also expected to establish a scalable nursery-led agroforestry carbon model while creating a sustainable additional income stream for participating farmer families.",
    ],
    objectives: [],
    impacts: [],
    coBenefits: [],
    documents: [],
    demoLedgerId: "proj_005",
    demoTokenId: "CCI-MCU-000005",
  },

  // ─── Project 6 ─────────────────────────────────────────────────────────────
  {
    criId: "CRI70023IN",
    slug: "rajsamand-district-tree-plantation",
    name: "Rajsamand District Tree Plantation Carbon Credit Project",
    hindiName: "प्रकृति-संरक्षित समृद्ध राजसमन्द",
    status: "Planned",
    registryUrl: "https://registry.nccf.in/projects",
    type: "Afforestation and reforestation",
    location: "Rajasthan, India (Rajsamand District)",
    state: "Rajasthan",
    estCreditsPerYear: 20000,
    scale: "small",
    methodology: "AR-ACM0003",
    classification: "poa",
    listedDate: "Not set",
    registeredDate: "Not set",
    creditingPeriod: "Not set",
    developer: "Terrablu Climate Technologies",
    delegateEntity: "Terrablu Climate Technologies Pvt Ltd",
    delegateUrl: "https://terrablu.life/",
    validationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    verificationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    sdgs: [
      { number: 13, name: "Climate Action" },
      { number: 5, name: "Gender Equality" },
      { number: 8, name: "Decent Work & Economic Growth" },
      { number: 15, name: "Life on Land" },
    ],
    coordinates: null,
    galleryCount: 2,
    galleryCaptions: [],
    historyCount: 3,
    image: "/images/projects/rajsamand.jpg",
    description: [
      "The Rajsamand District Tree Plantation Carbon Credit Project is a large-scale afforestation and reforestation initiative implemented across multiple villages in Rajsamand District, Rajasthan. The project aims to restore degraded and underutilized land through systematic plantation activities, thereby contributing to climate change mitigation, biodiversity enhancement, and sustainable rural development.",
      "Under this initiative, a diverse mix of native and site-appropriate tree species has been planted across identified land parcels in consultation with local communities and governing bodies. The project emphasizes ecological suitability, survival rate optimization, and long-term carbon sequestration potential. Plantation activities have been carried out following scientifically designed spacing, pit preparation, and maintenance protocols to ensure healthy biomass growth.",
      "The primary objective of the project is to remove carbon dioxide (CO2) from the atmosphere through enhanced carbon sequestration in biomass and soil. The sequestered carbon will be quantified, monitored, and verified in accordance with recognized carbon standards, enabling the generation of verified carbon credits.",
      "In addition to climate benefits, the project delivers multiple co-benefits aligned with sustainable development goals (SDGs), including:",
    ],
    objectives: [],
    impacts: [],
    coBenefits: [
      "Improvement in local biodiversity and ecosystem restoration",
      "Prevention of soil erosion and enhancement of soil fertility",
      "Livelihood generation through plantation, maintenance, and monitoring activities",
      "Increased awareness and participation of local communities in climate action",
    ],
    documents: [],
    demoLedgerId: "proj_006",
    demoTokenId: "CCI-MCU-000006",
  },

  // ─── Project 7 ─────────────────────────────────────────────────────────────
  {
    criId: "CRI60018IN",
    slug: "hyderabad-metro-rail",
    name: "Hyderabad Metro Rail (MRTS) Project",
    hindiName: null,
    status: "Planned",
    registryUrl: "https://registry.nccf.in/projects",
    type: "Transport",
    location: "Telangana, India",
    state: "Telangana",
    estCreditsPerYear: 196932,
    scale: "large",
    methodology: "ACM0016",
    classification: "pa",
    listedDate: "Not set",
    registeredDate: "Not set",
    creditingPeriod: "Not set",
    developer: "LTMRHL",
    delegateEntity: "L&T Metro Rail (Hyderabad) Limited",
    delegateUrl: "https://registry.nccf.in/projects",
    validationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    verificationBody: {
      name: "Not yet assigned",
      id: null,
      url: null,
    },
    sdgs: [
      { number: 13, name: "Climate Action" },
    ],
    coordinates: null,
    galleryCount: 2,
    galleryCaptions: [],
    historyCount: 2,
    image: "/images/projects/hyderabad-metro.jpg",
    description: [
      "The project involves the development and operation of the Hyderabad Metro Rail, a rail-based Mass Rapid Transit System (MRTS) designed to provide efficient and sustainable urban transportation. The network spans approximately 69.2 km across three corridors with 57 stations, improving connectivity across key areas of the city. The project replaces or reduces dependence on conventional transport modes such as private vehicles, buses, and intermediate public transport.",
      "It operates on an electricity-based system, incorporating energy-efficient technologies such as regenerative braking and modern signalling systems. Additionally, rooftop solar installations contribute to meeting part of the project's energy demand. By enabling a modal shift to low-emission public transport, the project significantly reduces greenhouse gas emissions and urban traffic congestion. Overall, the project enhances urban mobility while supporting climate change mitigation and sustainable development objectives.",
    ],
    objectives: [],
    impacts: [],
    coBenefits: [],
    documents: [],
    demoLedgerId: "proj_007",
    demoTokenId: "CCI-MCU-000007",
  },
];

/**
 * Look up project by slug, CRI ID, or demo ledger ID
 */
export function getCriProject(slugOrId) {
  if (!slugOrId) return null;
  const target = String(slugOrId).toLowerCase().trim();
  return (
    CRI_PROJECTS.find(
      (p) =>
        p.slug.toLowerCase() === target ||
        p.criId.toLowerCase() === target ||
        p.demoLedgerId.toLowerCase() === target
    ) || null
  );
}

/**
 * Look up project by exact CRI ID
 */
export function getCriProjectByCriId(criId) {
  if (!criId) return null;
  return CRI_PROJECTS.find((p) => p.criId.toLowerCase() === String(criId).toLowerCase().trim()) || null;
}

/**
 * Compute official CRI summary statistics
 */
export function getCriSummaryStats() {
  const total = CRI_PROJECTS.length;
  const planned = CRI_PROJECTS.filter((p) => p.status === "Planned").length;
  const listed = CRI_PROJECTS.filter((p) => p.status === "Listed").length;
  return { total, planned, listed };
}
