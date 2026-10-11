import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight, Database, ExternalLink, Leaf } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { THEME } from "../styles/tokens";

export default function About() {
  React.useEffect(() => {
    document.title = "How CarbonChain maps to India's carbon market | CarbonChain";
  }, []);

  const MAPPING_ROWS = [
    {
      carbonChainStep: "Project Registration & Evidence Upload",
      carbonChainDesc: "Farmer or developer submits ground evidence photos, GPS coordinates, PDD, additionality statements and sector baseline calculations.",
      realWorldEquivalent: "Project developer on the Indian Carbon Market Portal",
      realWorldDesc: "Entity registration and project design documentation uploaded to the official ICM portal managed by the Bureau of Energy Efficiency (BEE)."
    },
    {
      carbonChainStep: "Independent Verification & MRV Review",
      carbonChainDesc: "Technical verifier inspects uploaded documentation, verifies SHA-256 fingerprints, validates formulas against sectoral grid factors and approves issuance.",
      realWorldEquivalent: "ACVA validation and BEE registration",
      realWorldDesc: "Accredited Carbon Verification Agency (ACVA) conducts third-party audit and submits verification report to BEE for formal project registration."
    },
    {
      carbonChainStep: "Credit Issuance & Tokenization",
      carbonChainDesc: "Each verified tonne of CO2 equivalent (tCO2e) is minted as a serialized unit with FIFO provenance and unique identifier.",
      realWorldEquivalent: "Carbon Credit Certificates",
      realWorldDesc: "BEE recommends and Ministry of Power / Central Government issues Carbon Credit Certificates (CCCs) under the Carbon Credit Trading Scheme (CCTS)."
    },
    {
      carbonChainStep: "Serial Tracking & Tamper-Evident Ledger",
      carbonChainDesc: "Every issuance, transfer, hold and retirement is immutably recorded in a SHA-256 hash-chained decentralized ledger block.",
      realWorldEquivalent: "Grid Controller of India registry",
      realWorldDesc: "Grid Controller of India Limited (Grid-India) acts as the official Indian Carbon Market Registry Administrator, maintaining holding accounts."
    },
    {
      carbonChainStep: "Secondary Marketplace & Trading",
      carbonChainDesc: "Marketplace listings allow verified corporate buyers to purchase units directly at transparent, per-tonne indicative prices.",
      realWorldEquivalent: "CERC-regulated power exchanges",
      realWorldDesc: "Trading of Carbon Credit Certificates takes place on power exchanges (such as IEX, PXIL, HPX) regulated by the Central Electricity Regulatory Commission (CERC)."
    }
  ];

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#F4F7F5" }}>
      <PageHeader
        eyebrow="REGULATORY ALIGNMENT"
        title="About India Market"
        subtitle="An overview of how each digital stage in CarbonChain correlates with the statutory institutions and regulatory mechanisms of India's Carbon Credit Trading Scheme (CCTS)."
        action={{ label: "Explore Marketplace", to: "/marketplace" }}
      />
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Two-column comparison table */}
        <div
          className="rounded-[8px] overflow-hidden shadow-xs"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E3E8E5" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead style={{ backgroundColor: "#EEF3F0" }}>
                <tr className="border-b border-[#E3E8E5] text-[#5B6B63] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5 w-1/2">CarbonChain Step</th>
                  <th className="py-3.5 px-5 w-1/2 border-l border-[#E3E8E5]" style={{ color: "#14452F" }}>
                    Real-World Equivalent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8E5] text-[#14201A]">
                {MAPPING_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F7FAF8] transition-colors">
                    {/* CarbonChain step */}
                    <td className="py-4 px-5 align-top">
                      <div className="font-semibold text-sm mb-1" style={{ color: "#14201A" }}>
                        {row.carbonChainStep}
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: "#5B6B63" }}>
                        {row.carbonChainDesc}
                      </div>
                    </td>

                    {/* Real-world equivalent */}
                    <td className="py-4 px-5 align-top border-l border-[#E3E8E5]">
                      <div className="font-semibold text-sm mb-1" style={{ color: "#14452F" }}>
                        {row.realWorldEquivalent}
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: "#5B6B63" }}>
                        {row.realWorldDesc}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Closing notice banner */}
        <div
          className="p-5 rounded-[8px] text-center"
          style={{ backgroundColor: "#E6F4EC", border: "1px solid #14452F" }}
        >
          <p className="text-sm font-semibold leading-relaxed" style={{ color: "#14452F" }}>
            CarbonChain demonstrates how a farmer-friendly front end connects to the official system.
          </p>
        </div>

        {/* Quick navigation buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/marketplace"
            className="btn-outline text-xs px-5 py-2.5 inline-flex items-center gap-1.5"
          >
            <span>Explore Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/dashboard"
            className="btn-neutral-outline text-xs px-5 py-2.5"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
