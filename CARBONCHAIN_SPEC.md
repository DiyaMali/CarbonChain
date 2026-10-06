# CarbonChain: Final Build Specification

For: Antigravity. Owner: Diya Mali (DBATU). Venue: Nashik, Maharashtra.
This file is the single source of truth and replaces any earlier spec or prompt where they conflict.

## 0. Working rules
- Work ADDITIVELY on the existing React + Vite + Tailwind project. Do not delete or rename existing pages, routes, components, images or data. Never change the seven seeded CRI projects (section 13).
- Build in the phases of section 19. After each phase stop and report: what works, what is stubbed, what to click.
- If this file conflicts with existing code and the conflict is not safe to resolve, stop and ask.
- If a previous phase is only partly built, finish it as described here.

## 1. Quality rules (every screen)
- No purple gradients, no filled shape buttons (buttons are OUTLINED, small corner radius), no big hero text, no emoji icons (use lucide-react or monogram tiles), no em dashes in UI copy, no heavy scroll or cursor animations, no stock or AI-generated images, no fake reviews, metrics or counters.
- Every number is computed from the ledger or from entered data. Nothing important shows 0 after seeding.
- Must not look AI generated: plain layouts, real photos, left-aligned text, generous white space.
- Font: Inter everywhere. Only the "CarbonChain" wordmark on the main page keeps its serif style.
- Palette: green and cream, one deep forest green accent, white and gray surfaces.
- Badges: Pending amber, Listed or Approved green, Sold blue, Retired gray, Completed gray, Rejected red, Requested amber, Cancelled gray.
- Texts: "Confirm in your wallet", "Confirming on ledger...". Responsive at 390, 768, 1440 px. Accessible dialogs. Favicon and page title on every route.
- Currency: Rs with Indian grouping (en-IN). Quantities: whole tonnes of CO2e (tCO2e).

## 2. Wording (the product must feel real)
- Remove every user-facing: demo, simulated, sandbox, dummy, fake, "Fill with demo data", "Use a demo account", "Demo ledger", "Demo network", "Reset demo data", "Contract not configured", POL balance, Amoy pill, PolygonScan, Firebase, Firestore.
- Replace with: "CarbonChain Ledger: SHA-256 hash-chained, tamper-evident records"; "Quick sign in"; "CarbonChain Network"; "Fill it"; "Reset workspace data"; "View ledger record" (opens /ledger/:blockIndex); plain actions (Connect, Submit, Pay).
- KEEP (factual): CRI source line, "Indicative price" labels, About "Honest limitations" box, photo credits. Never claim real money moves or that CRI issued these credits.
- Terms: IPP = Independent Project Proponent; VVB = Validation and Verification Body; TO = Transactional Organisation; MCU = Marketable Carbon Unit (1 MCU = 1 tCO2e).
- Keep flag name USE_DEMO_LEDGER in code only. Keep the real Solidity contract in the repo untouched.

## 3. Accounts and ACCESS (strict)
### 3.1 Three logins (names in `src/config/accounts.js`)
| Login | Name | Capability |
|---|---|---|
| 1 | Meridian Renewables Ltd | SELL only |
| 2 | Ironbridge Steel and Cement Ltd | BUY only |
| 3 | Diya Mali, Verification Authority | Verifier |

- Fictional organisations only. No real company or person names as accounts or counterparties.
- Capabilities are chosen at signup (checkboxes: "Create and sell credits", "Buy and retire credits"; one or both) and ENFORCED everywhere. A new signup with both ticked can do both. To give a seeded account both, change its config.
- Label the third role "Verification Authority" or "Verifier (VVB)", never "Government".

### 3.2 Access matrix (enforce in the service layer, route guards AND hidden links)
| Action | Sell account | Buy account | Verifier |
|---|---|---|---|
| Submit, edit, resubmit own project | Yes | No | No |
| Set price, adjust quantity, unlist own listing | Yes | No | No |
| Approve or reject a project | No | No | Yes |
| Buy credits | No | Yes | No |
| Request retirement (own purchased credits only) | No | Yes | No |
| Cancel own pending request | No | Yes | No |
| Approve or reject a retirement | No | No | Yes |
| Retire a credit directly | NOBODY | NOBODY | only by approving a request |
| Open verifier pages | No | No | Yes |

- Retirement is executed ONLY by the verifier's approval of a request. Neither buyer nor seller has any retire button or retire function. Direct calls from non-verifiers throw an error.
- Seller cannot retire its own unsold or issued credits and cannot buy its own credits. Buyer cannot see the Submit Project page.
- Service functions check the caller's role and capability and throw friendly errors, for example: "Your account is registered for buying only. Project submission is for selling accounts." and "Only a verifier can approve retirements."
- Verifier cannot submit, buy or request retirement.
- Public (no login): Landing, Marketplace, project pages, verification page, How It Works, About, Research, Login or Get Started.

### 3.3 Navbars
- Sell account: Dashboard, Submit Project, My Projects, Sales, Transactions, Notifications.
- Buy account: Marketplace, Dashboard, My Credits, Transactions, Impact, Notifications.
- Both capabilities: union of the two.
- Verifier: Review Queue (badge), Retirement Requests (badge), Review History, Ledger, Notifications.
- Dashboard: Selling section for sell accounts (Projects submitted, Listed, Credits sold, Revenue); Buying section for buy accounts (Purchased, Available, Pending retirement, Retired); verifier stats in section 9.

### 3.4 Quick sign in
Login page, below the form: "Quick sign in" with three outlined buttons showing the three account names. Normal signup and login still work (accounts in localStorage).

### 3.5 Wallet modal and payment sheet (sell and buy accounts)
- After signup and every login, if no wallet connected this session, show "Connect your wallet" modal (centered, 440px max, bottom sheet on mobile, focus trap, Skip for now). Lines: Secure, Fast, Decentralized.
- Options as a payment-method chooser: MetaMask (Recommended), WalletConnect (placeholder QR with continue button), Coinbase Wallet, Other wallet (address 0x + 40 hex). Monogram tiles, no brand logos.
- Flow: connecting spinner (about 1.2 s) > approval screen (Reject, Connect) > success with short address and copy. Footer: "Network: CarbonChain Network."
- Address deterministic per account (0x + 40 hex of SHA-256 of email). Logout clears the connection.
- If skipped: dismissible banner "Connect a wallet to buy or sell credits". Actions (Buy, Submit, Request retirement) open the modal first.
- Navbar: "Connect wallet" button, or chip with monogram and short address (Copy, Switch, Disconnect).
- Flag `USE_REAL_WALLET = false`; leave a TODO for `eth_requestAccounts`.
- Every ledger action goes through "Confirm in your wallet" (about 1.5 s) then "Confirming on ledger..." (about 1.5 s).
- Payment sheet (buy): order summary, "Pay with" selector with the connected wallet selected, disabled row "Other payment methods, coming soon", button "Pay Rs X" (or "Connect wallet to pay").

## 4. Data and rules
- Entities: Account, Project submission, Listing, Credit serials, Purchase, Holding, Retirement request, Notification, Ledger block.
- Serials: one per tonne, `CCI-{projectCode}-000001`, issued on approval, allocated FIFO on purchase.
- Project status: SUBMITTED > APPROVED_LISTED > SOLD_OUT (all sold) > COMPLETED (all retired); or SUBMITTED > REJECTED. Rejected can be edited and resubmitted as a NEW linked version; the old rejection stays in history.
- Retirement request: REQUESTED > APPROVED | REJECTED; buyer may CANCEL while REQUESTED. Approval reference `RET-YYYY-000123`. Payment reference `PAY-YYYYMMDD-xxxxx`.
- Rules (friendly errors):
  - Whole tonnes, minimum 1. Purchase cannot exceed available quantity (partial purchases allowed).
  - Retirement request cannot exceed available quantity; quantity under a pending request is locked; REJECTED or CANCELLED returns it.
  - APPROVED retirement is permanent: "This credit is retired and permanently locked." No resale, no transfer, no relisting.
  - Listed quantity cannot be below sold, or above verified quantity.
  - Platform fee 1 percent of subtotal, deducted from seller payout, shown as its own line (config constant). GST not modelled.
  - COMPLETED project is locked: cannot be relisted, edited or resubmitted.
  - DUPLICATE BLOCK: a new submission with the same name, type and location (case-insensitive) as any existing non-rejected project, or as a COMPLETED one, is blocked with: "This project is already registered or completed and cannot be submitted again."
- Ledger blocks (hash-chained, genesis prevHash 64 zeros): PROJECT_SUBMITTED, FILES_FINGERPRINTED, PROJECT_APPROVED, PROJECT_REJECTED, CREDITS_ISSUED, LISTED, UNLISTED, PRICE_UPDATED, PURCHASED, RETIREMENT_REQUESTED, RETIREMENT_CANCELLED, RETIREMENT_APPROVED, RETIREMENT_REJECTED, PROJECT_COMPLETED. Keep the integrity check and the hidden tamper action.

## 5. Pricing and marketplace
- All prices are Rs per tCO2e. Never show a whole-project amount as the price.
- Card: image, status label, name, ID, 2-line description, type, location, est. credits per year, "Rs 1,850 per tCO2e", "5,000 tCO2e available", Impact Factor badge, validation and verification body boxes, Buy button. Card and "View Details" open the project page.
- Filters: status, type, location, search, price range, minimum quantity; sort: newest, price, quantity. Count row computed ("Total, Planned, Listed"). Green Wings (Jalgaon) first on ties.
- Quantity input (steppers, whole tonnes, max available). Live lines: Subtotal = quantity x price; Platform fee (1%); Total payable. Example: 120 x Rs 1,850 = Rs 2,22,000.
- "Last traded price" from real PURCHASED blocks (hide if none). No arrows, percentages or charts. Optional seller bulk discount tier.
- Indicative bands (label "Indicative market range"; exchange assumption about Rs 85 to 90 per USD in config; sources: 2025 and 2026 public market summaries, no India-specific series found):
  - Solar, wind: Rs 300 to 700. Transport, waste: Rs 450 to 1,300. Agroforestry, afforestation, mangrove: Rs 1,300 to 3,000.
- Price far outside the band: gentle warning to the seller and a flag for the verifier. Never block.
- Project value line: credits per year x price (for example "15,000 x Rs 1,800 = Rs 2.70 crore per year").

## 6. Seller flow (sell accounts)
### 6.1 Submit Project
Fields: name, type (Agroforestry, Afforestation, Mangrove, Solar, Wind, Transport, Waste, Other), location (village or city, district, state), start date, contact person, phone, description, methodology, scale, estimator (section 8), estimated annual credits (prefilled, editable), quantity to list (not above estimate), asking price per tCO2e with the band shown, photos (section 7), documents (section 7), optional proof links, SDGs (13 locked, at least 4). Buttons: "Fill it", "Submit for verification".
- Validation with friendly messages; duplicate block per section 4.
- On submit: "Confirm in your wallet", ledger blocks, then a **green success popup** (green check, top-center toast or small modal, stays about 6 s, dismissible):
  "Your project has been successfully submitted. Track its review in My Projects. Once the verifier approves it, it will appear on the marketplace."
  Buttons: "View in My Projects" (opens the Pending review tab) and "Submit another". Notify the verifier.
- Use the same green popup style for other successful actions (approve, reject, buy, request retirement, retirement approval).
### 6.2 My Projects
Tabs: All, Pending review, Listed, Rejected, Sold out, Completed (counts computed). Card: cover photo, name, status timeline (Submitted > Under review > Approved and listed, or Rejected with reason), listed, sold, retired, remaining, revenue, estimated vs verified quantity. Actions: Edit price, Adjust quantity, Unlist, Relist, Edit and resubmit (rejected). Completed projects show a lock note and no actions.
### 6.3 Sales
Transactions tab "Sales": buyer, quantity, subtotal, fee, amount received, date, payment reference, ledger link.

## 7. Uploads (from the computer)
- Photos: JPG or PNG, up to 5, 5 MB each. Resize to 1600 px max side, JPEG about 0.82. Thumbnails, remove, drag to reorder, first is cover.
- Documents: PDF, DOC, DOCX, XLS, XLSX, up to 5, 10 MB each, with name, size, icon, remove.
- Store bytes in IndexedDB (`carbonchain-files`); metadata and SHA-256 in the submission. Fingerprints are written to the FILES_FINGERPRINTED block.
- Verifier: photo lightbox, open or download documents, green "Fingerprint matches ledger" tick or red mismatch.
- Limitation (About and README): files live in the browser, so use all accounts in the same browser profile.

## 8. Credit Estimator and "Fill it"
- Principle: the estimator gives a first estimate with the formula visible. Only the verifier confirms the number. Always show "Estimated by seller" and "Verified by authority" separately.
- Factors editable, labelled "Default value, adjust per your methodology" (`config/factors.js`). Grid factor 0.75 tCO2 per MWh. Indicative, never presented as certified.
| Type | Inputs | tCO2e per year |
|---|---|---|
| Solar, wind | MW, utilisation % | MW x 8,760 x utilisation x grid factor |
| Agroforestry, afforestation, mangrove | hectares, survival %, t/ha/yr | hectares x survival x t/ha/yr |
| Transport | diesel litres replaced, electricity MWh | litres x 2.68 / 1000, minus MWh x grid factor |
| Waste | tonnes diverted, factor | tonnes x factor |
| Other | direct entry | as entered |
- Nature types also take a buffer % (default 10, mirrors CRI Buffer Pool): net = gross x (1 - buffer). Show a step-by-step "How this was calculated" panel. Round down.
- "Fill it" fills every field for the selected type with a Nashik or Maharashtra preset (fictional projects at real places; the seven CRI projects are NOT changed). Pressing again cycles to the next type. Uses the signed-in organisation as seller. Loads the preset photos.
| Type | Project | Location | Inputs | Net est. | Price | List |
|---|---|---|---|---|---|---|
| Solar | Sinnar Solar Park (5 MW) | Sinnar, Nashik | 5 MW, 19% | 6,241 | Rs 450 | 6,000 |
| Wind | Satara Ridge Wind Farm Phase 1 (10 MW) | Satara district | 10 MW, 27% | 17,739 | Rs 500 | 17,000 |
| Agroforestry | Dindori Grape-Belt Agroforestry Programme | Dindori, Nashik | 200 ha, 85%, 8 t/ha, buffer 10% | 1,224 | Rs 1,800 | 1,200 |
| Afforestation | Trimbakeshwar-Igatpuri Hill Afforestation | Trimbakeshwar and Igatpuri, Nashik | 500 ha, 80%, 6 t/ha, buffer 10% | 2,160 | Rs 1,600 | 2,100 |
| Mangrove | Raigad Coast Mangrove Restoration | Raigad, Konkan | 100 ha, 80%, 12 t/ha, buffer 10% | 864 | Rs 2,400 | 850 |
| Transport | Nashik City Electric Bus Fleet | Nashik city | 6,00,000 L, 800 MWh | 1,008 | Rs 900 | 1,000 |
| Waste | Nashik Organic Waste Composting | Nashik city | 5,000 t, 0.4 | 2,000 | Rs 700 | 2,000 |
- Methodology suggestions (editable): ACM0002 (solar, wind), AR-ACM0003 (agroforestry), AR-AMS0003 (afforestation), AR-AM0014 (mangrove), ACM0016 (transport), AMS-III.F (waste). Indicative SDGs: solar and wind 13, 7, 9, 12; agroforestry 13, 15, 1, 8; afforestation 13, 15, 6, 8; mangrove 13, 14, 15, 1; transport 13, 11, 9, 3; waste 13, 11, 12, 3. Short local descriptions (Nashik grape belt, Godavari catchment, Konkan coast, city fleet). Never claim certification.
- Impact Factor only where 4 or more SDGs: "Impact Factor (indicative)", tooltip "CRI SDG method: Scale x Intensity (1 to 5) per SDG, top 4 summed, divided by 100. Scores here are indicative." Otherwise "Impact Factor: pending SDG scoring".

## 9. Verifier flow
- **Review Queue:** submitted date, seller, project, type, location, quantity, asking price, flags. Expand: full submission, estimator breakdown, photos, documents with fingerprint check. Checklist (all ticked to enable Approve): documents and photos reviewed, quantity within estimator range, location and type consistent, methodology valid, seller details complete.
  - Approve: verified quantity (not above requested), note, wallet confirm. Result: APPROVED_LISTED, serials issued, listing created AUTOMATICALLY at the seller's price and quantity (appears on the marketplace). Notify seller.
  - Reject: reason required (Documents missing, Quantity not supported, Details inconsistent, Duplicate submission, Other) plus text. Not listed. Notify seller with the reason.
- **Retirement Requests:** buyer, project, quantity, serial range, retiree, on behalf of, message, reason. Payment verification panel lists covering purchases (reference, buyer wallet, paid vs quantity x price + fee, date, block link) with auto-checks: payer equals requester, amount matches, serials belong to buyer, not already retired, no other pending request.
  - Approve only if all checks pass: wallet confirm, serials RETIRED forever, RETIREMENT_APPROVED, certificate issued, notify buyer and seller. If this retires the project's last remaining unit, set COMPLETED and write PROJECT_COMPLETED.
  - Reject: reason required; quantity returns; notify buyer.
- **Review History:** all decisions with filters and block links. **Ledger page:** hash chain, search, `/ledger/:blockIndex`, integrity check.
- Stats (computed): Pending project reviews, Pending retirement requests, Approved projects, Credits retired.

## 10. Buyer flow (buy accounts)
1. Marketplace and quantity (section 5), payment sheet, receipt (payment reference, project, quantity, serial range, amount, seller, ledger link; buttons "View my credits", "Request retirement"). Green success popup. Notify seller.
2. My Credits tabs: Holdings (per project: Purchased, Available, Pending retirement, Retired, amount paid, serials; actions Request retirement, View project), Retirement requests (status chips, verifier reason), Retired (certificate links).
3. Transactions: Purchases tab (date, project, quantity, amount, reference, receipt). Impact page: totals purchased, retired, pending; by project; certificates; empty state.

## 11. Retirement request and certificate
- "Request retirement" (reuse the existing retire route and form; its submit creates a request, never a retirement): holding summary, quantity (1 to available), retiree name (required), on behalf of name, on behalf of wallet (optional, validated), message (200 max with counter), reason (required). Warning: "Retirement is permanent once approved by a verifier." Wallet confirm, then green popup: "Retirement request sent to the verifier. You will be notified of the decision." Cancel allowed while REQUESTED.
- Certificate `/certificate/:id` (public): only for approved retirements. Approval reference, project, code, tCO2e, serial range, retiree, on behalf of, reason, message, date, verifier name, ledger block, QR to `/verify/:id`, print or save as PDF (print stylesheet). Otherwise a friendly message.
- Public page `/verify/:id`: ID, project, quantity, issue date, status, ledger block and hashes, integrity status.

## 12. Notifications (bell with unread count, last 5 dropdown, `/notifications` page, in-app only)
| Recipient | Events |
|---|---|
| Seller | Project submitted (confirmation); approved and listed; rejected (with reason); credits sold (quantity, amount); **credits retired by a buyer ("X tCO2e of your project were retired. Y of N tCO2e retired so far.")**; sold out; **project completed ("All N tCO2e of this project are sold and retired. The project is closed and cannot be listed or submitted again.")** |
| Buyer | Purchase successful; retirement request sent; retirement approved (certificate ready); retirement rejected (reason) |
| Verifier | New project submitted; new retirement request |
Each links to the relevant page. Completed projects also show the closed note on their project page and in My Projects.

## 13. Project pages (every project, same rich CRI-style layout)
- Route `/projects/:slug`, public. Header (ID in monospace, name, location, status badge, Back, "View on CRI" for CRI projects). Four tiles: Estimated credits per year, Credits issued, Credits retired, Project type (CRI projects show the CRI snapshot, captioned "CRI registry snapshot"; seller projects show ledger values).
- Sections: About (description, objectives, expected impact) > Project Information (developer, methodology, scale, annual estimate, estimator breakdown, buffer, estimated vs verified, type, classification, crediting period, start, listed and registered dates; "Not set" when empty) > SDGs (chips, Impact Factor rule) > Photo Gallery (lightbox; CRI projects add "CRI lists N photos") > Location (coordinates and "Open in Google Maps" when available, else "Coordinates not available") > Stakeholders (IPP, Delegate Entity, Validation Body, Verification Body) > Issuances, Retirements, Project History > Certification Documents (CRI: list with "View on CRI", no downloads; seller projects: preview or download with fingerprint tick).
- Panel "CarbonChain trading": price per tCO2e, available quantity, quantity input, live total, Buy (buy accounts only), last traded price. For CRI projects add: "Credits listed here are issued through CarbonChain. They are not MCUs issued by CRI."
- Attribution on CRI projects: "Project data: Carbon Registry India (registry.nccf.in), an initiative by NCCF. Snapshot taken 1 Oct 2026."
- No empty sections for seller-submitted projects; unknown slug shows "Project not found".
### 13.1 The seven CRI projects (seeded, DO NOT change)
Data stays in `src/data/criProjects.js`. Piplantri CRI30023IN (Rajasthan, 56,774, Listed); CONCOR Solar CRI140026IN (Delhi, 250); CONCOR eRST CRI130025IN (Delhi, 3,000); SHIELD Mangrove CRI100025IN (Odisha, 50,000); Green Wings CRI90022IN (Jalgaon, Maharashtra, 15,000); Rajsamand CRI70023IN (Rajasthan, 20,000); Hyderabad Metro CRI60018IN (Telangana, 196,932). All Planned except Piplantri.
Rules: show the real CRI status separately from the ledger status; never say "verified by CRI" (use "Verified in CarbonChain"); never put a fictional organisation on these projects (developers: Terrablu Climate Technologies, CONCOR, L&T Metro Rail Hyderabad); images in `public/images/projects/` with a cream placeholder fallback; trading tokens are CarbonChain ledger tokens with indicative prices, never above the annual estimate.

## 14. Landing and public pages
- Order: Hero > problem stats (existing sources) > official double counting definition (CRI glossary) > solution > five steps (Submit, Verify, Tokenize, Trade, Retire) > "Same company, both sides of the trade" (generic example) > "Built on India's registry model" (correct expansions) > live ledger stats > marketplace preview (Green Wings first) > final CTA.
- Step copy: Verify = "A verifier reviews the evidence and approves or rejects the project." Retire = "Retirement is approved by a verifier after payment is confirmed, then locked permanently."
- Pitch line: "CarbonChain mirrors the account structure and credit lifecycle of India's Carbon Registry (IPP, VVB, TO, MCU), made transparent and automated."
- Hero: normal-size headline, outlined buttons. **Fix only the hero video or image element:** both wind turbines fully visible tip to base. Use `object-fit: contain`, `object-position: center bottom`, width 100%, height auto, min-height not fixed, overflow visible; transparent text background; media z-index 0, text z-index 10; check 390, 768, 1440 px. If the file itself crops them, report the filename and size instead of masking it.
- How It Works and About: flowcharts (inline SVG or Mermaid): (a) lifecycle with both verifier checkpoints and rejection branches; (b) swimlanes Seller, Verifier, Buyer with the access matrix summary (only the verifier retires); (c) tamper evidence. About also holds: problem and market data, architecture (production design: ERC-721 on Polygon), CCTS and CRI context, price and estimator method with the indicative disclaimer, future scope (satellite and IoT, buffer pool, CCTS track, real settlement), Honest limitations, four research references, file-storage note.

## 15. Images
- CRI images already exist; do not change.
- New distinct preset photos in `public/images/presets/` (supplied by Diya): `solar-sinnar.jpg`, `wind-satara.jpg`, `agroforestry-dindori.jpg`, `afforestation-trimbakeshwar.jpg`, `mangrove-raigad.jpg`, `transport-nashik.jpg`, `waste-nashik.jpg`; optional `-2.jpg` extras. No reuse across projects.
- Missing file: cream placeholder with type icon and name, never a broken image; list missing names in the report. Credits in `src/data/photoCredits.js` shown under galleries.

## 16. Routes
Public: `/`, `/marketplace`, `/projects/:slug`, `/how-it-works`, `/about`, `/research`, `/login`, `/signup`, `/verify/:id`, `/certificate/:id`, `/ledger/:blockIndex`, `/privacy`, `/terms`.
Sell: `/dashboard`, `/submit`, `/my-projects`, `/transactions`, `/notifications`, `/profile`.
Buy: `/dashboard`, `/marketplace`, `/my-credits`, `/retire/:holdingId` (creates a request), `/transactions`, `/impact`, `/notifications`, `/profile`.
Verifier: `/verifier/queue`, `/verifier/retirements`, `/verifier/history`, `/verifier/ledger`, `/notifications`, `/profile`.
Guard every route by capability; wrong role redirects to the dashboard with a clear message.

## 17. Seed state (through real service functions so the hash chain is valid)
- Seven CRI projects listed with CarbonChain tokens at indicative prices.
- Meridian (sell): 2 SUBMITTED preset-style projects with photos (Verifier queue not empty), 1 REJECTED with reason, 1 APPROVED_LISTED, and one project with sales so Sales and Revenue show data.
- Ironbridge (buy): two past purchases with payment references, one retirement request in REQUESTED, one APPROVED retirement with certificate (seller notified).
- Verifier: 2 to 3 past decisions. Notifications consistent with all of this. Nothing shows 0.

## 18. Acceptance tests (run with the browser agent; report pass or fail with screenshots)
1. Sign in as Ironbridge (buy): no Submit link; open `/submit` directly: blocked with message. No retire button anywhere.
2. Sign in as Meridian (sell): no Buy, no Request retirement; open `/verifier/queue`: redirected.
3. Meridian presses "Fill it" repeatedly (all 7 types match section 8), uploads 2 photos and 1 PDF, submits: green popup appears with "View in My Projects"; project shows Pending review; verifier notified. Submitting the same name, type and location again is blocked.
4. Verifier: fingerprints green; Approve blocked until checklist ticked; reject one with reason; approve one with lower verified quantity.
5. Marketplace as Ironbridge: approved project listed at price per tonne with available quantity; rejected one absent. Meridian sees the reason and can Edit and resubmit.
6. Ironbridge buys 150 tonnes: total = quantity x price + fee; receipt, serial range, availability reduced, Meridian notified of the sale.
7. Ironbridge requests retirement of 100 of 150 (50 available, 100 pending); requesting 60 more is blocked.
8. Verifier reviews the request: payment checks green; reject one with reason (quantity returns); request again; approve. Meridian gets the "retired" notification with running total.
9. Retire all remaining units of one project: Meridian gets the "project completed" notification; project shows Completed and locked; resubmitting it is blocked; relisting is blocked.
10. Retired serials cannot be listed, bought, requested again ("permanently locked").
11. Ledger integrity green; tamper action turns it red.
12. All seven CRI pages and 3 seller project pages fully populated; CRI figures unchanged.
13. Hero at 390, 768, 1440 px: both turbines fully visible.
14. Search UI for the words in section 2: none remain. Inter everywhere (except wordmark). No em dashes, no filled buttons, no emoji.

## 19. Phases (stop and report after each)
1. Accounts, capabilities, access matrix, service-layer checks, route guards, role navbars, Quick sign in, Inter, wording pass 1.
2. Ledger extensions (states, serials, holdings, payments, requests, new blocks, COMPLETED rule, duplicate block), IndexedDB file store, estimator and price-band config, notifications store.
3. Seller: Submit form, uploads, estimator, "Fill it", green success popup, My Projects, Sales.
4. Verifier: queue, approve and reject, auto-listing, history, ledger page, stats.
5. Buyer: per-tonne marketplace, payment sheet, receipt, holdings, transactions.
6. Retirement: request flow, verifier retirement queue with payment checks, approval, certificate, verification page, Impact, seller notifications including completion.
7. Project pages for all projects, landing updates, flowcharts, hero fix.
8. Polish: seed state, accessibility, responsive, wording pass 2, run section 18 and report.

## Appendix: short presenter notes
- Estimator: indicative first estimate; the verifier confirms the final number.
- Price: per tonne in an indicative range; total = quantity x price.
- Double counting: unique serials; retirement is approved only by the verifier and then locked forever.
- Honesty line: a working prototype with a simulated settlement layer; production design is an ERC-721 contract on Polygon. The seven registry projects are real CRI listings; credits for trading are issued within CarbonChain and prices are indicative.
- Limit: the system proves records were not altered; it cannot prove real-world claims without satellite or IoT data.
- Fee model: CRI charges IPPs Rs 25,000 one-time plus Rs 15,000 annual (plus GST); CarbonChain uses a 1 percent transaction fee.
- Owner to-do: supply the seven preset photos, confirm organisation names and Inter, and for a real launch add a custom domain, favicon, privacy and terms pages.
