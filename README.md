# CarbonChain

> **Blockchain-Powered Transparent Carbon Credit Trading** on Polygon Amoy Testnet.

CarbonChain turns verified carbon credits into unique ERC-721 tokens on the Polygon Amoy testnet. Each token corresponds to a verified project batch, with its `amount` field holding certified tonnes of CO2e (1 MCU = 1 tCO2e). The complete lifecycle comprises: project submission, verifier audit and token minting, marketplace listing, purchase, and permanent on-chain retirement to prevent double counting.

The platform architecture directly mirrors **Carbon Registry India (CRI)**:
- **Project Owner:** IPP (Independent Power Producer)
- **Verifier:** VVB (Validation and Verification Body)
- **Buyer:** TO (Trajectory / Obligated Entity)
- **Credit:** MCU (Market Carbon Unit, 1 MCU = 1 tCO2e)

> **Identity Note:** Auth is a demo layer and the wallet is the real identity.

---

## Tech Stack

- **Frontend:** React 18, Vite, React Router v6
- **Styling:** Tailwind CSS (clean, minimal aesthetic, forest green `#1F4D3A` & cream `#F6F2E8` palette)
- **Blockchain:** ethers.js v6 (`BrowserProvider` for wallet transactions, `JsonRpcProvider` for public reads)
- **Metadata:** On-chain UTF-8 safe base64 data URIs (`data:application/json;base64,...`)
- **Authentication:** Demo localStorage auth layer (unified account model, role preference selection)
- **Verification & QR:** `qrcode.react` (`QRCodeSVG`)
- **Network:** Polygon Amoy Testnet (Chain ID `80002`)

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Contract Address

The smart contract address is configured in `src/config/contract.js`:

```javascript
export const CONTRACT_ADDRESS = "0xYourDeployedAddressHere";
```

Alternatively, specify it in your `.env` file:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedAddressHere
```

If the address remains the placeholder, the app displays a prominent top warning banner on every page: *"Contract not configured yet"*, and disables all write buttons while maintaining full public read functionality.

### 3. Run Development Server

```bash
npm run dev
```

The app will be accessible at [http://localhost:5173](http://localhost:5173).

### 4. Build for Production

```bash
npm run build
```

---

## Network Details (Polygon Amoy Testnet)

- **Network Name:** Polygon Amoy Testnet
- **Chain ID:** `80002` (Hex: `0x13882`)
- **Native Currency:** POL (18 decimals)
- **RPC Endpoints:**
  - `https://polygon-amoy-bor-rpc.publicnode.com`
  - `https://polygon-amoy.drpc.org`
- **Block Explorer:** [https://amoy.polygonscan.com](https://amoy.polygonscan.com)
- **Amoy Faucet:** [https://faucet.polygon.technology/](https://faucet.polygon.technology/)

---

## 3-Minute Live Demo Script

Follow this sequence to demonstrate the entire transparent lifecycle:

### Step 1: Submit Project (Wallet A &bull; IPP / Project Owner)
1. Sign in as **Rajesh Sharma** (or register as *Project Owner*).
2. Connect MetaMask with **Wallet A** on Polygon Amoy.
3. Navigate to **Submit Project** (`/submit`).
4. Click **"Fill with Demo Data"** in the top right:
   - Name: *Green Wings Agroforestry Project*
   - Type: *Agroforestry*
   - Location: *Jalgaon, Maharashtra*
   - Estimated CO2: *15,000 tonnes*
   - SDGs: *13 (Climate Action, locked), 15, 1, 8*
5. Click **Submit Project to Blockchain**.
6. Confirm transaction in MetaMask; wait 1 block confirmation.
7. Notice the success panel with assigned Project ID and PolygonScan link.

### Step 2: Audit & Mint (Verifier Wallet &bull; VVB Auditor)
1. Switch MetaMask to an address with `isVerifier(address) === true`.
2. Open **Verifier Queue** (`/verifier`).
3. Expand the newly submitted *Green Wings Agroforestry Project*.
4. Inspect decoded description, SDGs, and the external audit proof link.
5. Click **Approve**:
   - Confirm verified amount (e.g. 15,000 tonnes).
   - Enter audit note: *"Audited and verified against CRI methodology standards."*
6. Confirm transaction; the smart contract atomically mints an ERC-721 token batch.

### Step 3: List on Marketplace (Wallet A &bull; Token Owner)
1. Switch back to **Wallet A** and navigate to **My Credits** (`/my-credits`).
2. Under the **Owned** tab, click **List for Sale** on the newly minted credit.
3. Enter listing price in POL (e.g., `5.0` POL) and click **Confirm Listing**.
4. Confirm transaction in MetaMask; the credit moves to the **Listed** tab.

### Step 4: Buy Credit (Wallet B &bull; Obligated Entity / Buyer)
1. Switch MetaMask to a second address (**Wallet B**).
2. Open the public **Marketplace** (`/marketplace`).
3. Locate the *Green Wings Agroforestry Project* listing.
4. Click **Buy Credit**; review price, volume, seller address, and platform fee.
5. Click **Confirm Purchase**; contract escrow transfers POL to the seller and the token to Wallet B.

### Step 5: Permanent Retirement & Certificate (Wallet B &bull; Buyer)
1. Under **My Credits** for Wallet B, open the **Owned** tab.
2. Click **Retire** on the credit.
3. Review the permanent lock warning: *"Retirement is permanent. This credit can never be sold or transferred again."*
4. Fill retirement details:
   - Retiree Name: *Tata Steel Jamshedpur Works*
   - On Behalf Of: *Logistics Division*
   - Reason: *Mandatory Scope 1 & 2 Emissions Offset FY2025*
5. Confirm transaction in MetaMask.
6. The app automatically redirects to the **Retirement Certificate** (`/certificate/:tokenId`).
7. Click **"Print or Save as PDF"** to demonstrate print-ready output.

### Step 6: Scan QR Code & Double-Counting Prevention Proof
1. Scan the verification QR code on the certificate using a phone or open the link.
2. The public **Credit Detail** page (`/credit/:tokenId`) displays:
   - Status badge: **Retired**
   - Full history timeline: *Minted &rarr; Listed &rarr; Purchased &rarr; Retired* with actors, prices, and timestamps.
   - Proof that action buttons (List, Buy) are permanently disabled and the credit is locked on-chain.

---

## Build Phases Summary

1. **Phase 1: Foundation** - Scaffold, theme, routing, navbar, contract config with placeholder banner, public read provider, Landing page with live chain counts.
2. **Phase 2: Auth and Wallet** - Demo localStorage auth, signup & login with role preference, wallet connect, network switch to Polygon Amoy, role detection, Dashboard shell.
3. **Phase 3: Core Flow** - On-chain base64 metadata, unified transaction wrapper, Submit Project with demo prefill, My Projects portfolio, Verifier Dashboard.
4. **Phase 4: Trading** - Public Marketplace with filters and sorting, interactive Buy flow with ERC-721 guard, Credit Detail page with history timeline and QR verification, My Credits management.
5. **Phase 5: Retirement & Polish** - Irreversible on-chain retirement flow, printable Retirement Certificate, Environmental Impact dashboard, Admin role management, full polish pass.
