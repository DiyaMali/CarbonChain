# CarbonChain: Frontend Build Prompt (paste into Antigravity)

You are building the complete frontend for **CarbonChain**, a blockchain platform for transparent carbon credit trading. The smart contract is already written and tested. Your job is to build the website that talks to it. Build in the phases listed in section 10 and stop after each phase so I can test it.

Do not invent features, contract functions, or data that are not described here. If something is unclear or a contract call behaves unexpectedly, stop and tell me what you saw instead of working around it.

---

## 1. What the product is

CarbonChain turns every verified carbon credit into a unique ERC-721 token on the Polygon Amoy testnet. 1 token = 1 verified project batch, and its `amount` field holds the tonnes of CO2e. The full lifecycle is: submit project, verifier approves (token is minted), owner lists it, buyer purchases, buyer retires it. A retired credit is permanently locked and can never be traded again. That lock is what stops double counting.

The lifecycle mirrors India's Carbon Registry (CRI): the project owner is an IPP, the verifier is a VVB, the buyer is a TO, and a credit is an MCU (1 MCU = 1 tCO2e). Use these terms in the About section.

**Account model (important):** there are NOT separate logins per role. Any signed-in user can submit projects, buy credits, list credits, and retire credits. The only special role is **Verifier**, which is granted on-chain. Show the Verifier area only when `isVerifier(wallet)` returns true.

---

## 2. Tech stack

- React + Vite, React Router
- Tailwind CSS (core utility classes only)
- ethers v6 (`BrowserProvider` for wallet writes, `JsonRpcProvider` for public reads)
- Firebase Auth (email and password) and Firestore (off-chain profile and project details)
- `qrcode.react` for QR codes
- Do NOT use Firebase Storage (it needs a paid plan). Proof documents are provided as a URL the owner pastes in.
- No localStorage dependence for anything important.

---

## 3. Contract reference

Create `src/config/contract.js`:

```js
export const CONTRACT_ADDRESS = "0xPASTE_DEPLOYED_ADDRESS_HERE";
export const CHAIN_ID = 80002;
export const CHAIN_NAME = "Polygon Amoy Testnet";
export const NATIVE_SYMBOL = "POL";
export const PUBLIC_RPC_URLS = [
  "https://polygon-amoy-bor-rpc.publicnode.com",
  "https://polygon-amoy.drpc.org"
];
export const EXPLORER = "https://amoy.polygonscan.com";
// Enum order of ProjectStatus in the contract. Verify against the .sol file.
export const PROJECT_STATUS = { 0: "Pending", 1: "Approved", 2: "Rejected" };
```

If `CONTRACT_ADDRESS` still contains the placeholder, show a clear banner on every page: "Contract not configured yet" and disable all write buttons. The contract is being deployed separately and the address will be pasted in later.

The ABI is in `src/abi/carbonCreditAbi.js` (already provided, ethers v6 human-readable format). Export `CARBON_CREDIT_ABI` from it.

### Functions

**Writes**
| Function | Who | Notes |
|---|---|---|
| `submitProject(name, projectType, location, metadataURI, estimatedCO2)` | anyone | `estimatedCO2` is whole tonnes (uint). Returns projectId. |
| `approveProject(projectId, verifiedAmount, note)` | verifier | Mints the NFT. `verifiedAmount` is whole tonnes and may differ from the estimate. |
| `rejectProject(projectId, note)` | verifier | Note is required in the UI. |
| `listCredit(tokenId, priceWei)` | token owner | Price is entered in POL, converted with `parseEther`. |
| `cancelListing(tokenId)` | token owner | |
| `buyCredit(tokenId)` | anyone but seller | **payable**: send `value = credit.price`. |
| `retireCredit(tokenId, retireeName, onBehalfOfName, onBehalfOfWallet, message, reason)` | token owner | `onBehalfOfWallet` is the zero address `0x000...000` if not used. |
| `grantRole(role, account)` / `revokeRole` | admin | Use `VERIFIER_ROLE()` for the role value. |
| `setFeeBps(bps)` / `setFeeRecipient(addr)` | admin | |

**Reads**
`getProject(id)`, `getCredit(tokenId)`, `getHistory(tokenId)`, `projectCount()`, `creditCount()`, `isRetired(tokenId)`, `isVerifier(addr)`, `hasRole(role, addr)`, `VERIFIER_ROLE()`, `DEFAULT_ADMIN_ROLE()`, `feeBps()`, `feeRecipient()`, `ownerOf(tokenId)`, `balanceOf(addr)`.

### Data shapes

- **Project:** `id, owner, name, projectType, location, metadataURI, estimatedCO2, status, reviewedBy, reviewNote, submittedAt, reviewedAt, tokenId` (`tokenId` is 0 until approved).
- **Credit:** `tokenId, projectId, amount, creator, mintedAt, listed, price, retired, retiredBy, retireeName, onBehalfOfName, onBehalfOfWallet, message, reason, retiredAt`.
- **HistoryEntry:** `action (string), actor, counterparty, price, timestamp`.
- `creator` is the original project owner. The **current owner** comes from `ownerOf(tokenId)`. The seller of a listed credit is its current owner.
- Timestamps are unix seconds. Prices are wei (18 decimals). Format with `formatEther`.

### There are no "list all" functions

Load data by looping from `1` to `projectCount()` or `creditCount()` (IDs start at 1; confirm by checking whether id 0 exists and handle both). Fetch in parallel with `Promise.all`, cache in React state, and show skeleton loaders. Filter on the client:
- Marketplace: `listed && !retired`
- My Credits: `ownerOf(tokenId) === wallet`, split into Owned (not listed, not retired), Listed, Retired
- My Projects: `project.owner === wallet`
- Verifier queue: `status === Pending`

### Public reads

All read-only pages (Landing, Marketplace browsing, Credit Detail, Public Verification) must work **without a wallet** using a `JsonRpcProvider` on `PUBLIC_RPC_URLS` (try the first, fall back to the second). Only transactions need MetaMask.

---

## 4. Auth and wallet

1. **Firebase email/password** signup and login. Signup collects: full name, organisation (optional), email, password.
2. After login, prompt **Connect Wallet** (MetaMask). If the wallet is on the wrong network, offer a one-click switch to Polygon Amoy (`wallet_switchEthereumChain`, falling back to `wallet_addEthereumChain` with chain id 80002, currency POL, an RPC from the list, explorer `https://amoy.polygonscan.com`).
3. Save a Firestore doc `users/{uid}` with `{ name, organisation, email, walletAddress }`. Warn (do not block) if the connected wallet differs from the saved one.
4. Show the connected wallet (shortened), network, and POL balance in the top bar. Update on account or chain change.
5. Show a **Verifier** badge and nav item only when `isVerifier(wallet)` is true. Show an **Admin** page only when `hasRole(DEFAULT_ADMIN_ROLE, wallet)` is true.

**Firestore `projects/{projectId}`** stores rich off-chain details for each on-chain project: `{ description, proofUrl, imageUrl (optional), sdgs: [], beneficiaries (optional), createdBy }`. When submitting a project: write the Firestore doc first, then pass `metadataURI = "firestore:projects/{docId}"` to `submitProject`. When displaying a project, read the Firestore doc if the URI starts with `firestore:`; if the doc is missing, still render the on-chain fields.

---

## 5. Pages and exact behaviour

### 5.1 Landing page (public)
- Plain, calm hero. Heading around 32 to 40 px, NOT oversized. Title: "CarbonChain" with the line "Blockchain-Powered Transparent Carbon Credit Trading". One short paragraph. Two text-style links: "Browse marketplace" and "Sign in".
- **The problem**: a small section citing research figures with a source line under each: global carbon credit market valued at $933 billion in 2025; about 78% of the top 50 offset projects found likely worthless; over 90% of rainforest credits from the largest certifier found not to represent real reductions; World Bank data that 85% of traditional carbon markets lack proper tracking. Add the official definition of double counting: "the same verified, certificated and transferable emissions unit counted towards the mitigation goal of more than one jurisdiction or entity" (source: Carbon Registry India glossary).
- **How it works**: five steps: Submit, Verify, Tokenize, Trade, Retire. Plain numbered list with simple line icons (no emoji).
- **Same company, both sides of the trade**: short text on how groups like Adani, Tata and JSW both generate and need credits, which is why tamper-proof records matter.
- **Live from the blockchain**: show real numbers only, read from the contract: projects submitted (`projectCount`), credits minted (`creditCount`), credits retired and total tCO2e retired (computed by looping). If the contract is not configured or has zero data, show "No data yet". Never show placeholder or made-up numbers.
- **Built on India's registry model**: the CRI term mapping table (IPP, VVB, TO, MCU).
- **About and research** (same page, anchor section): India's Carbon Credit Trading Scheme context, tech stack in one line, honest limitation ("CarbonChain proves records were not altered after submission; it cannot independently confirm a real-world claim, which would need satellite or IoT data. This is future scope."), and the references list:
  1. Saraji et al., "A Blockchain-based Carbon Credit Ecosystem" (2021)
  2. "Carbon Emission Monitoring and Credit Trading: The Blockchain and IoT Approach," IEEE (2021)
  3. Khanna and Maheshwari, "Blockchain Powered NFTs: A Paradigm Shift in Carbon Credit Transactions" (2024)
  4. "Carbon credits and environmental impact tracking: The role of blockchain," Bharati Vidyapeeth's College of Engineering, Pune (2025)
- Footer with project title and the college name (DBATU).

### 5.2 Auth pages
Sign up, Log in, Connect Wallet screen as described in section 4.

### 5.3 Dashboard (signed in, one for every user)
- Top: wallet, network, POL balance.
- Summary cards (from chain, for this wallet): projects submitted, credits owned, credits listed, credits retired, total tCO2e retired.
- Quick actions: Submit project, Browse marketplace, My credits.
- Recent activity: last 10 entries combined from this wallet's projects and credits (use `getHistory`), each with a PolygonScan link where a tx hash is known.

### 5.4 Submit Project
Form fields: project name, project type (select: Agroforestry, Afforestation, Solar, Wind, Transport, Waste, Other), location, estimated CO2 (whole tonnes), description, proof document URL, optional image URL, SDGs (multi-select; SDG 13 is always included and locked on). Validate everything. Show "Confirming on blockchain..." while the transaction is mined, then a success panel with the project ID and a "View on PolygonScan" link.

### 5.5 My Projects
List of this wallet's projects with status badges (Pending amber, Approved green, Rejected red with the verifier's note). Approved projects link to their credit.

### 5.6 Verifier Dashboard (verifiers only)
- **Pending queue**: expandable rows showing every submitted detail (on-chain fields, Firestore description, proof link opens in a new tab).
- **Approve** opens a small form: verified amount (prefilled with the estimate, editable) and a note. Calls `approveProject`.
- **Reject** requires a note. Calls `rejectProject`.
- **Review history**: past decisions by this verifier.
- Because the contract enforces roles, if a non-verifier somehow calls these, show a friendly access-denied message.

### 5.7 Marketplace (public to browse)
- Grid of cards for credits where `listed && !retired`. Each card: project name, project type, location, tCO2e amount, price in POL, price per tonne, a "Verified on-chain" label, seller (shortened), and a Buy button.
- Filters: project type, location text search, price range, minimum quantity. Sort by price or amount.
- Show the platform fee from `feeBps()` as "Platform fee: x%" near the price on the detail and buy panels.
- **Buy flow**: confirm dialog showing price and fee, then `buyCredit(tokenId, { value: price })`. If the user is not signed in or has no wallet, prompt them. Disable Buy if the connected wallet is the seller.

### 5.8 Credit Detail page (`/credit/:tokenId`, public, the strongest demo page)
- Project info: name, type, location, description, SDGs, proof link.
- **Blockchain record**: token ID, contract address, creator, current owner, minted date, status badge (Approved/Listed, Sold is not a state so use Owned, Listed, or Retired).
- **Full history timeline** from `getHistory(tokenId)`: Minted, Listed, Purchased, Transferred, Retired, each with actor, price where relevant, and date.
- **Retirement record** if retired: who retired it, on behalf of whom, message, reason, date.
- **QR code** (`qrcode.react`) linking to this page's public URL, with a short caption "Scan to verify this credit".
- **View on PolygonScan** button: contract token page `https://amoy.polygonscan.com/token/{CONTRACT_ADDRESS}?a={tokenId}`.
- Action buttons shown only to the current owner: List for sale, Cancel listing, Retire. Buy button for others when listed.

### 5.9 My Credits
Tabs: **Owned**, **Listed**, **Retired**. Per card actions: List for sale (price input in POL), Cancel listing, Retire. Shows that the same account can be both buyer and seller.

### 5.10 Retire Credit flow
A dedicated screen or large dialog:
1. A clear warning: "Retirement is permanent. This credit can never be sold or transferred again."
2. Fields: retiree name (required), on behalf of name (optional), on behalf of wallet (optional, validate as an address, otherwise zero address), message (optional), reason for retiring (required).
3. Confirm button, "Confirming on blockchain..." state.
4. Success: show the **Retirement Certificate**: a clean printable page with credit ID, project, tCO2e, retiree name, on behalf of, reason, date, token ID, contract address, a QR code to the public credit page, and a PolygonScan link. Include a "Print or save as PDF" button using `window.print()` with a print stylesheet.

### 5.11 My Environmental Impact
Total tCO2e retired by this wallet, a table broken down by project, and the list of certificates. This reframes the platform as impact tracking, not only trading.

### 5.12 Admin (admin wallet only)
Small page: grant or revoke `VERIFIER_ROLE` for an address, view and change `feeBps` (with a hard cap in the UI at 1000 bps) and `feeRecipient`.

### 5.13 Public Verification
The Credit Detail page already serves as this. Make sure `/credit/:tokenId` renders fully with no login, no wallet, and no Firestore auth (set Firestore rules for `projects` to public read).

---

## 6. Transactions and errors

Wrap every write in one helper that: checks wallet and network, sends the tx, shows "Waiting for wallet confirmation", then "Confirming on blockchain...", waits for 1 confirmation, then shows success with a **View on PolygonScan** link to `https://amoy.polygonscan.com/tx/{hash}`. Add this link after every successful action.

Map errors to plain language:
- User rejected: "You cancelled the transaction."
- `AccessControlUnauthorizedAccount`: "Your wallet does not have permission for this action."
- `ERC721IncorrectOwner` or `ERC721InsufficientApproval`: "This wallet is not allowed to move this credit." (If this appears during `buyCredit`, stop and report it to me.)
- Insufficient funds: "Not enough POL to pay for this transaction and its network fee."
- Anything else: show the short reason, and log the full error to the console.

After any successful write, refetch the affected data.

---

## 7. Design rules (strict)

- Palette: white and cream backgrounds, black or near-black text, light grey borders, ONE accent colour: deep forest green (about `#1F4D3A`), used sparingly. Cream about `#F6F2E8`.
- Clean, minimal, generous white space, card layout for credits.
- Status badges: Pending amber, Approved green, Listed blue, Retired grey, Rejected red. Small, flat, text-sized.
- **Buttons are outlined or text-style** (forest green border and text, light fill on hover, small corner radius). Avoid heavy solid blobs and pill shapes.
- Normal-sized headings. No giant hero text.
- **Forbidden:** purple gradients, emoji used as icons, em dashes anywhere in the copy, scroll-triggered or parallax animations, cursor effects, stock or AI-generated photos, fake testimonials, fake counters, fake metrics, any "made with AI" label.
- Icons: simple line icons (lucide-react) only.
- Loading states: skeletons for data, "Confirming on blockchain..." for transactions.
- Fully responsive. Wallet address always shortened (`0x1027...958A`) with a copy button.
- Add a favicon (simple leaf or link mark in forest green) and a page title per route.

---

## 8. Demo data to use (real project)

For seeding and screenshots, use this real project from the CRI registry rather than a made-up one:
- **Name:** Green Wings Agroforestry Project
- **Type:** Agroforestry
- **Location:** Jalgaon, Maharashtra
- **Estimated CO2:** 15000 tonnes
- **Description:** Agroforestry programme with about 1,700 farmers, listed on Carbon Registry India.
- **SDGs:** 13 (Climate Action), 15 (Life on Land), 1 (No Poverty), 8 (Decent Work)

Do not hard-code this into the app. Only use it as the example in placeholder text and in a short "demo script" section of the README (submit, approve, list, buy, retire).

---

## 9. File structure

```
src/
  abi/carbonCreditAbi.js
  config/contract.js
  lib/ (provider.js, contract.js, format.js, tx.js, errors.js)
  context/ (AuthContext.jsx, WalletContext.jsx)
  hooks/ (useCredits.js, useProjects.js)
  components/ (Navbar, StatusBadge, CreditCard, TxButton, SkeletonCard, QrBlock, ...)
  pages/ (Landing, Login, Signup, ConnectWallet, Dashboard, SubmitProject, MyProjects,
          VerifierDashboard, Marketplace, CreditDetail, MyCredits, RetireCredit,
          Certificate, Impact, Admin)
```
Also create a `.env.example` for the Firebase keys and a README with setup steps.

---

## 10. Build phases (stop after each one)

1. **Foundation:** project scaffold, theme, routing, navbar, contract config with the placeholder banner, public read provider, Landing page with live chain counts.
2. **Auth and wallet:** Firebase signup and login, wallet connect, network switch, role detection, Dashboard shell.
3. **Core flow:** Submit Project, My Projects, Verifier Dashboard (approve and reject), the transaction helper and error mapping.
4. **Trading:** Marketplace, Credit Detail with history timeline, QR and PolygonScan links, List, Cancel, Buy, My Credits.
5. **Retire and polish:** Retire flow, Certificate, Impact page, Admin page, favicon, responsive pass, README with the demo script.

At the end of each phase, list what works, what is stubbed, and what I should test by hand.

## 11. Out of scope

DeFi, staking, yield, price speculation, token swaps, EU CBAM, satellite or AI verification (mention only as future scope in the About section), and any mainnet deployment.
