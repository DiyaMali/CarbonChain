// CarbonCreditNFT ABI in ethers v6 human-readable format.
// Save as: src/abi/carbonCreditAbi.js
// Usage:   new Contract(CONTRACT_ADDRESS, CARBON_CREDIT_ABI, signerOrProvider)

const CREDIT =
  "tuple(uint256 tokenId, uint256 projectId, uint256 amount, address creator, uint256 mintedAt, bool listed, uint256 price, bool retired, address retiredBy, string retireeName, string onBehalfOfName, address onBehalfOfWallet, string message, string reason, uint256 retiredAt)";

const PROJECT =
  "tuple(uint256 id, address owner, string name, string projectType, string location, string metadataURI, uint256 estimatedCO2, uint8 status, address reviewedBy, string reviewNote, uint256 submittedAt, uint256 reviewedAt, uint256 tokenId)";

const HISTORY =
  "tuple(string action, address actor, address counterparty, uint256 price, uint256 timestamp)";

export const CARBON_CREDIT_ABI = [
  // ---- writes ----
  "function submitProject(string name, string projectType, string location, string metadataURI, uint256 estimatedCO2) returns (uint256)",
  "function approveProject(uint256 projectId, uint256 verifiedAmount, string note) returns (uint256)",
  "function rejectProject(uint256 projectId, string note)",
  "function listCredit(uint256 tokenId, uint256 priceWei)",
  "function cancelListing(uint256 tokenId)",
  "function buyCredit(uint256 tokenId) payable",
  "function retireCredit(uint256 tokenId, string retireeName, string onBehalfOfName, address onBehalfOfWallet, string message, string reason)",
  "function setFeeBps(uint256 bps)",
  "function setFeeRecipient(address recipient)",
  "function grantRole(bytes32 role, address account)",
  "function revokeRole(bytes32 role, address account)",

  // ---- reads ----
  `function getProject(uint256 projectId) view returns (${PROJECT})`,
  `function getCredit(uint256 tokenId) view returns (${CREDIT})`,
  `function getHistory(uint256 tokenId) view returns (${HISTORY}[])`,
  "function projectCount() view returns (uint256)",
  "function creditCount() view returns (uint256)",
  "function isRetired(uint256 tokenId) view returns (bool)",
  "function isVerifier(address account) view returns (bool)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function VERIFIER_ROLE() view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function feeBps() view returns (uint256)",
  "function feeRecipient() view returns (address)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",

  // ---- events ----
  "event ProjectSubmitted(uint256 indexed projectId, address indexed owner, string name, uint256 estimatedCO2)",
  "event ProjectApproved(uint256 indexed projectId, uint256 indexed tokenId, address indexed verifier, uint256 amount)",
  "event ProjectRejected(uint256 indexed projectId, address indexed verifier, string note)",
  "event CreditListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event ListingCancelled(uint256 indexed tokenId, address indexed seller)",
  "event CreditPurchased(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
  "event CreditRetired(uint256 indexed tokenId, address indexed retiredBy, string retireeName, string onBehalfOfName)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",

  // ---- custom errors (so ethers can decode revert reasons) ----
  "error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)",
  "error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner)",
  "error ERC721InsufficientApproval(address operator, uint256 tokenId)",
  "error ERC721NonexistentToken(uint256 tokenId)",
  "error ReentrancyGuardReentrantCall()",
];
