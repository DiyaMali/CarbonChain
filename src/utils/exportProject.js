/**
 * CarbonChain Project Export & Download Utility
 * Provides download options for submitted project details in Formatted Text, JSON, and Printable PDF format.
 */

import { computeImpactFactor, SDG_NAMES } from "../services/ledgerService";

/**
 * Generate formatted text receipt content
 */
export function generateProjectTextReceipt(project, block = null, user = null) {
  const timestamp = project.submittedAt ? new Date(project.submittedAt).toUTCString() : new Date().toUTCString();
  const impactFactor = project.sdgScores ? computeImpactFactor(project.sdgScores) : 0;

  const sdgLines = (project.sdgs || [])
    .map((sdgId) => {
      const name = SDG_NAMES[sdgId] || `SDG ${sdgId}`;
      const score = project.sdgScores?.[sdgId];
      if (score) {
        return `  - ${name} (Scale: ${score.scale}/5, Intensity: ${score.intensity}/5)`;
      }
      return `  - ${name}`;
    })
    .join("\n");

  const blockIndex = block?.index ?? project.blockIndex ?? "Pending Consensus";
  const blockHash = block?.hash ?? project.blockHash ?? "SHA-256 Hash Generated on Ledger Append";
  const prevHash = block?.prevHash ?? project.prevHash ?? "0x7a89f...consensus";
  const txHash = block?.txHash ?? project.txHash ?? "0x" + Array.from({ length: 64 }, () => "f").join("");
  const submitter = user?.name ? `${user.name} (${user.organisation || user.role || "IPP"})` : (project.developer || "Authorized Project Proponent");
  const wallet = project.owner || user?.walletAddress || "0xA1b2c3D4e5f6A7b8C9d0e1F2a3B4c5D6e7F8a9b0";

  return `================================================================================
                    CARBONCHAIN ECOLOGICAL LEDGER
            OFFICIAL PROJECT SUBMISSION DOSSIER & RECEIPT
================================================================================
REGISTRY STATUS    : SUBMITTED (PENDING VVB AUDIT)
SUBMISSION ID      : ${project.id || "N/A"}
REGISTRY TRACKING  : ${project.registryId || `CC-IND-${new Date().getFullYear()}-${project.id?.slice(-4) || "001"}`}
SUBMISSION DATE    : ${timestamp}
CONSENSUS NETWORK  : Polygon Amoy / CarbonChain Immutable Hash-Chain

--------------------------------------------------------------------------------
1. PROJECT IDENTIFICATION & METRICS
--------------------------------------------------------------------------------
Project Name       : ${project.name || "N/A"}
Project Type       : ${project.projectType || "N/A"}
Location           : ${project.location || "N/A"}
Estimated CO2      : ${Number(project.estimatedCO2 || 0).toLocaleString("en-IN")} tCO2e
Impact Factor      : ${impactFactor > 0 ? impactFactor.toFixed(2) : "Standard Baseline"}
Project Developer  : ${submitter}
Proponent Wallet   : ${wallet}

--------------------------------------------------------------------------------
2. SUSTAINABLE DEVELOPMENT GOALS (SDGs) & CO-BENEFITS
--------------------------------------------------------------------------------
${sdgLines || "  - SDG 13: Climate Action"}

--------------------------------------------------------------------------------
3. PROJECT DESCRIPTION & AUDIT METHODOLOGY
--------------------------------------------------------------------------------
Description:
${project.description || "No description provided."}

Proof Document URL : ${project.proofUrl || "https://cri.nccf.in"}
Crediting Standard : Carbon Registry India (CRI / NCCF) Framework v1.0
Classification     : Project Activity (PA)

--------------------------------------------------------------------------------
4. IMMUTABLE LEDGER RECORD (SHA-256 HASH-CHAIN)
--------------------------------------------------------------------------------
Ledger Block Index : Block #${blockIndex}
Block Hash (SHA256): ${blockHash}
Previous Block Hash: ${prevHash}
Transaction Hash   : ${txHash}
Action Recorded    : PROJECT_SUBMITTED

--------------------------------------------------------------------------------
5. VERIFICATION NOTICE & NEXT STEPS
--------------------------------------------------------------------------------
This project has been registered on the CarbonChain ledger. It is currently
queued for review by accredited Validation and Verification Bodies (VVB).
Upon audit approval, Marketable Carbon Units (MCUs) will be minted on-chain.

Certified by:
CarbonChain Foundation Standardized Carbon Credit Infrastructure
Official URL: https://cri.nccf.in
================================================================================
`;
}

/**
 * Download Project Submission details as a clean, formatted text file
 */
export function downloadProjectDetailsText(project, block = null, user = null) {
  const content = generateProjectTextReceipt(project, block, user);
  const safeName = (project.name || "Project").replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const filename = `CarbonChain_Submission_${safeName}_${project.id || "receipt"}.txt`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download Project Submission details as a structured JSON ledger payload
 */
export function downloadProjectDetailsJson(project, block = null, user = null) {
  const impactFactor = project.sdgScores ? computeImpactFactor(project.sdgScores) : 0;
  const payload = {
    protocol: "CarbonChain Ecological Ledger v2.4",
    registryFramework: "CRI / NCCF India",
    receiptType: "PROJECT_SUBMISSION_DOSSIER",
    exportedAt: new Date().toISOString(),
    project: {
      id: project.id,
      registryId: project.registryId || `CC-IND-${new Date().getFullYear()}-${project.id?.slice(-4) || "001"}`,
      name: project.name,
      projectType: project.projectType,
      location: project.location,
      estimatedCO2_tCO2e: Number(project.estimatedCO2 || 0),
      impactFactor,
      description: project.description,
      proofUrl: project.proofUrl,
      imageUrl: project.imageUrl,
      sdgs: project.sdgs || [13],
      sdgScores: project.sdgScores || {},
      status: project.status || "Pending",
      submittedAt: project.submittedAt || new Date().toISOString(),
      developer: user?.name ? `${user.name} (${user.organisation || user.role || "IPP"})` : project.developer,
      ownerWallet: project.owner || user?.walletAddress,
    },
    ledgerRecord: {
      action: "PROJECT_SUBMITTED",
      blockIndex: block?.index ?? project.blockIndex ?? null,
      blockHash: block?.hash ?? project.blockHash ?? null,
      prevHash: block?.prevHash ?? project.prevHash ?? null,
      txHash: block?.txHash ?? project.txHash ?? null,
      consensusNetwork: "Polygon Amoy / Local Hash-Chain",
      cryptographicStandard: "SHA-256 Immutable Audit Trail",
    },
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const safeName = (project.name || "Project").replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const filename = `CarbonChain_Submission_${safeName}_${project.id || "data"}.json`;

  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Print / Save PDF view for Project Submission Dossier
 */
export function printProjectSubmissionDossier(project, block = null, user = null) {
  const content = generateProjectTextReceipt(project, block, user);
  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) {
    alert("Please allow pop-ups to print or save the PDF receipt.");
    return;
  }

  const impactFactor = project.sdgScores ? computeImpactFactor(project.sdgScores) : 0;
  const blockIndex = block?.index ?? project.blockIndex ?? "Pending";
  const blockHash = block?.hash ?? project.blockHash ?? "Hash chained on ledger";
  const timestamp = project.submittedAt ? new Date(project.submittedAt).toLocaleDateString("en-IN", { dateStyle: "long", timeStyle: "medium" }) : new Date().toLocaleString();

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>CarbonChain Project Submission - ${project.name || "Receipt"}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 40px;
      color: #181E1B;
      background: #FFFFFF;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #14532D;
      padding-bottom: 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      width: 44px;
      height: 44px;
      background: #14532D;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    .badge {
      background: #DCFCE7;
      color: #14532D;
      border: 1px solid #86EFAC;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      color: #14532D;
    }
    .status-box {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 25px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 25px;
    }
    .card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 14px;
    }
    .label {
      font-size: 11px;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .value {
      font-size: 14px;
      font-weight: 600;
      color: #0F172A;
    }
    .mono {
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
    }
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #E2E8F0;
      font-size: 11px;
      color: #94A3B8;
      text-align: center;
    }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #14532D; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div class="brand">
      <div class="logo">🌿</div>
      <div>
        <h1>CarbonChain Ecological Ledger</h1>
        <div style="font-size: 12px; color: #64748B;">Official Project Registration Record &bull; CRI Methodology v1.0</div>
      </div>
    </div>
    <div class="badge">Block #${blockIndex} Verified</div>
  </div>

  <div class="status-box">
    <div style="font-weight: 700; color: #14532D; font-size: 16px; margin-bottom: 4px;">
      ✓ Project Successfully Submitted to Ledger
    </div>
    <div style="font-size: 12px; color: #166534;">
      Registration timestamp: ${timestamp} &bull; Queued for Validation and Verification Body (VVB) Review.
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="label">Project Name</div>
      <div class="value">${project.name || "N/A"}</div>
    </div>
    <div class="card">
      <div class="label">Project Type & Location</div>
      <div class="value">${project.projectType || "N/A"} &bull; ${project.location || "N/A"}</div>
    </div>
    <div class="card">
      <div class="label">Estimated Sequestration</div>
      <div class="value" style="color: #14532D;">${Number(project.estimatedCO2 || 0).toLocaleString("en-IN")} tCO2e</div>
    </div>
    <div class="card">
      <div class="label">Impact Factor (SDG Benefit)</div>
      <div class="value">${impactFactor > 0 ? impactFactor.toFixed(2) : "1.00 (Standard)"}</div>
    </div>
  </div>

  <div class="card" style="margin-bottom: 20px;">
    <div class="label">Project Description</div>
    <div style="font-size: 13px; color: #334155; line-height: 1.6;">${project.description || "N/A"}</div>
  </div>

  <div class="card" style="margin-bottom: 20px;">
    <div class="label">Cryptographic Ledger Proof</div>
    <div style="font-size: 12px; margin-bottom: 6px;"><strong>Block Hash:</strong> <span class="mono">${blockHash}</span></div>
    <div style="font-size: 12px; margin-bottom: 6px;"><strong>Proof URL:</strong> <a href="${project.proofUrl || "#"}" target="_blank" style="color: #14532D;">${project.proofUrl || "N/A"}</a></div>
    <div style="font-size: 12px;"><strong>Proponent Wallet:</strong> <span class="mono">${project.owner || user?.walletAddress || "0xA1b2c3D4e5f6A7b8C9d0e1F2a3B4c5D6e7F8a9b0"}</span></div>
  </div>

  <div class="footer">
    &copy; 2024-2026 CarbonChain Foundation. Standardized Carbon Credit Infrastructure. All records tamper-evident and SHA-256 hash-chained.
  </div>

  <script>
    window.onload = function() {
      // Auto trigger print dialog after document is ready
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}

/**
 * Download an immutable Ledger Block record directly to the user's computer (.json)
 */
export function downloadLedgerBlockRecord(block, project = null) {
  if (!block) return;
  const ledgerData = {
    registry: "CarbonChain Ecological Ledger",
    recordType: "IMMUTABLE_BLOCK_AUDIT_RECORD",
    downloadedAt: new Date().toISOString(),
    block: {
      index: block.index,
      action: block.action,
      timestamp: block.timestamp,
      isoDate: new Date(block.timestamp).toISOString(),
      blockHash: block.hash,
      previousHash: block.prevHash,
      transactionHash: block.txHash,
      cryptographicAlgorithm: "SHA-256 Hash Chain",
      consensusNetwork: "Polygon Amoy / CarbonChain Main Ledger",
      payload: block.payload || {},
    },
    ...(project ? {
      projectSummary: {
        id: project.id,
        name: project.name,
        projectType: project.projectType,
        location: project.location,
        estimatedCO2_tCO2e: project.estimatedCO2,
        developer: project.developer,
        owner: project.owner,
        submittedAt: project.submittedAt,
      }
    } : {}),
  };

  const jsonString = JSON.stringify(ledgerData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `CarbonChain_Ledger_Record_Block_${block.index}.json`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}
