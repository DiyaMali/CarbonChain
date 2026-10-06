import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import {
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Lock,
  Loader2,
  ImageIcon,
  Upload,
  X,
  Plus,
  HelpCircle,
  FileCheck,
  Shield,
  Clock,
  ArrowRight,
  Info,
  Calendar,
  Phone,
  User,
  MapPin,
  Tag,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { submitProject, computeImpactFactor, SDG_NAMES } from "../services/ledgerService";
import { cyclePreset, getPresetByType, NASHIK_PRESETS } from "../config/presets";
import {
  calculateEstimatedCredits,
  getPriceBand,
  DEFAULT_FACTORS,
} from "../config/factors";
import {
  processAndStorePhoto,
  processAndStoreDocument,
} from "../services/fileStore";
import { isSellUser } from "../services/roleService";

const PROJECT_TYPES = [
  "Agroforestry",
  "Afforestation",
  "Mangrove",
  "Solar",
  "Wind",
  "Transport",
  "Waste",
  "Other",
];

const AVAILABLE_SDGS = [
  { id: 13, name: "SDG 13: Climate Action", locked: true },
  { id: 15, name: "SDG 15: Life on Land" },
  { id: 1, name: "SDG 1: No Poverty" },
  { id: 7, name: "SDG 7: Affordable & Clean Energy" },
  { id: 8, name: "SDG 8: Decent Work & Economic Growth" },
  { id: 9, name: "SDG 9: Industry Innovation" },
  { id: 11, name: "SDG 11: Sustainable Cities" },
  { id: 12, name: "SDG 12: Responsible Consumption" },
  { id: 6, name: "SDG 6: Clean Water & Sanitation" },
  { id: 14, name: "SDG 14: Life Below Water" },
  { id: 3, name: "SDG 3: Good Health & Well-being" },
  { id: 5, name: "SDG 5: Gender Equality" },
];

export default function SubmitProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { account, isDemoMode, connectWallet } = useWallet();
  const { user } = useAuth();

  // Route guard check
  const canSell = isSellUser(user);

  // Core Form State
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState("Solar");
  const [location, setLocation] = useState("");
  const [district, setDistrict] = useState("Nashik");
  const [state, setState] = useState("Maharashtra");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [contactPerson, setContactPerson] = useState(user?.name || "Kavita Rao");
  const [phone, setPhone] = useState("+91 98230 45678");
  const [description, setDescription] = useState("");
  const [methodology, setMethodology] = useState("ACM0002 - Grid-connected electricity generation");
  const [scale, setScale] = useState("small");
  const [proofUrl, setProofUrl] = useState("");

  // Estimator Inputs State
  const [estimatorInputs, setEstimatorInputs] = useState({
    capacityMW: 5,
    utilisationPercent: 19,
    hectares: 200,
    survivalRatePercent: 85,
    tPerHaYr: 8,
    natureBufferPercent: 10,
    litresReplaced: 600000,
    electricityMWh: 800,
    tonnesDiverted: 5000,
    wasteFactor: 0.4,
    directEntry: 1000,
  });

  // Credits & Pricing State
  const [estimatedAnnualCredits, setEstimatedAnnualCredits] = useState(6241);
  const [quantityToList, setQuantityToList] = useState(6000);
  const [askingPrice, setAskingPrice] = useState(450);

  // SDGs State (13 locked, minimum 4 required)
  const [sdgs, setSdgs] = useState([13, 7, 9, 12]);
  const [sdgScores, setSdgScores] = useState({
    13: { scale: 5, intensity: 5 },
    7: { scale: 5, intensity: 4 },
    9: { scale: 4, intensity: 4 },
    12: { scale: 3, intensity: 3 },
  });

  // Uploaded Files State
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Submission Flow & UI State
  const [formErrors, setFormErrors] = useState({});
  const [submittingStep, setSubmittingStep] = useState(null); // null | "wallet" | "ledger"
  const [submissionError, setSubmissionError] = useState(null);
  const [successModal, setSuccessModal] = useState(null); // stores submitted project info

  useEffect(() => {
    document.title = "Submit Project | CarbonChain";
  }, []);

  // Update estimate whenever estimator inputs or project type change
  useEffect(() => {
    const calc = calculateEstimatedCredits(projectType, estimatorInputs);
    setEstimatedAnnualCredits(calc.netCredits);
    if (!quantityToList || quantityToList > calc.netCredits) {
      setQuantityToList(calc.netCredits);
    }
  }, [projectType, estimatorInputs]);

  // Recalculate price band info
  const priceBand = getPriceBand(projectType);
  const isPriceOutsideBand = askingPrice < priceBand.min || askingPrice > priceBand.max;

  // Compute live project value line
  const annualRevenue = (estimatedAnnualCredits || 0) * (askingPrice || 0);
  const formatAnnualRevenue = (val) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} crore`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} lakh`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  // "Fill it" Preset Cycler per spec §8 & §138-148
  const handleFillIt = () => {
    const nextPreset = cyclePreset(projectType);
    setProjectType(nextPreset.type);
    setName(nextPreset.name);
    setLocation(nextPreset.location);
    setDistrict(nextPreset.district || "Nashik");
    setState(nextPreset.state || "Maharashtra");
    setDescription(nextPreset.description);
    setMethodology(nextPreset.methodology);
    setScale(nextPreset.scale || "small");
    setAskingPrice(nextPreset.askingPrice);
    setEstimatorInputs((prev) => ({ ...prev, ...(nextPreset.inputs || {}) }));
    setEstimatedAnnualCredits(nextPreset.estimatedCO2);
    setQuantityToList(nextPreset.listQuantity);
    setProofUrl(nextPreset.proofUrl || "");
    setSdgs(nextPreset.sdgs);
    setSdgScores(nextPreset.sdgScores);

    // Pre-populate preset photo
    if (nextPreset.photoUrl) {
      setPhotos([
        {
          id: `preset_${Date.now()}`,
          name: nextPreset.photoFile,
          size: 2450000,
          type: "image/jpeg",
          sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          dataUrl: nextPreset.photoUrl,
        },
      ]);
    }

    setFormErrors({});
    setSubmissionError(null);
  };

  // Photo Uploader Handler (max 5, 5MB each, indexedDB store)
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (photos.length + files.length > 5) {
      setFormErrors((prev) => ({ ...prev, photos: "Maximum 5 photos allowed." }));
      return;
    }
    setUploadingPhoto(true);
    setFormErrors((prev) => ({ ...prev, photos: null }));
    try {
      const added = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds 5 MB limit.`);
        }
        const record = await processAndStorePhoto(file);
        added.push(record);
      }
      setPhotos((prev) => [...prev, ...added]);
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, photos: err.message }));
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Document Uploader Handler (max 5, 10MB each, indexedDB store)
  const handleDocUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (documents.length + files.length > 5) {
      setFormErrors((prev) => ({ ...prev, documents: "Maximum 5 documents allowed." }));
      return;
    }
    setUploadingDoc(true);
    setFormErrors((prev) => ({ ...prev, documents: null }));
    try {
      const added = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds 10 MB limit.`);
        }
        const record = await processAndStoreDocument(file);
        added.push(record);
      }
      setDocuments((prev) => [...prev, ...added]);
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, documents: err.message }));
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  const handleRemoveDoc = (id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // SDG Checkbox Toggle (SDG 13 locked)
  const handleToggleSdg = (sdgId) => {
    if (sdgId === 13) return;
    setSdgs((prev) => {
      const exists = prev.includes(sdgId);
      const nextSdgs = exists ? prev.filter((id) => id !== sdgId) : [...prev, sdgId];
      const nextScores = { ...sdgScores };
      if (!exists) {
        nextScores[sdgId] = { scale: 4, intensity: 4 };
      } else {
        delete nextScores[sdgId];
      }
      setSdgScores(nextScores);
      return nextSdgs;
    });
  };

  // Validate form before submission
  const validate = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Project name is required.";
    if (!location.trim()) errors.location = "Project location is required.";
    if (!description.trim() || description.trim().length < 25) {
      errors.description = "Please provide a detailed description (at least 25 characters).";
    }
    if (!methodology.trim()) errors.methodology = "Methodology is required.";
    if (!estimatedAnnualCredits || estimatedAnnualCredits <= 0) {
      errors.estimatedAnnualCredits = "Estimated credits must be greater than zero.";
    }
    if (!quantityToList || quantityToList <= 0) {
      errors.quantityToList = "Quantity to list must be at least 1 tCO2e.";
    } else if (quantityToList > estimatedAnnualCredits) {
      errors.quantityToList = `Quantity to list cannot exceed annual estimate (${estimatedAnnualCredits.toLocaleString("en-IN")} tCO2e).`;
    }
    if (!askingPrice || askingPrice <= 0) {
      errors.askingPrice = "Asking price per tCO2e must be a positive amount.";
    }
    if (sdgs.length < 4) {
      errors.sdgs = "Please select at least 4 Sustainable Development Goals (SDGs).";
    }
    return errors;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFormErrors({});

    const effectiveWallet = account || user?.walletAddress;
    if (!effectiveWallet) {
      connectWallet();
      return;
    }

    try {
      // Step 1: Wallet confirmation (about 1.5 s)
      setSubmittingStep("wallet");
      await new Promise((r) => setTimeout(r, 1400));

      // Step 2: Confirming on ledger (about 1.5 s)
      setSubmittingStep("ledger");

      const submissionPayload = {
        name: name.trim(),
        projectType,
        location: location.trim(),
        district,
        state,
        startDate,
        contactPerson,
        phone,
        description: description.trim(),
        methodology: methodology.trim(),
        scale,
        estimatedCO2: Number(estimatedAnnualCredits),
        quantityToList: Number(quantityToList),
        askingPrice: Number(askingPrice),
        proofUrl: proofUrl.trim(),
        imageUrl: photos[0]?.dataUrl || photos[0]?.imageUrl || "/images/presets/solar-sinnar.jpg",
        photos: photos.map((p) => ({
          name: p.name,
          size: p.size,
          sha256: p.sha256,
          url: p.dataUrl,
        })),
        documents: documents.map((d) => ({
          name: d.name,
          size: d.size,
          type: d.type,
          sha256: d.sha256,
          fileId: d.id,
        })),
        sdgs,
        sdgScores,
        estimatorBreakdown: calculateEstimatedCredits(projectType, estimatorInputs),
        owner: effectiveWallet,
        ownerUserId: user?.id || "usr_meridian",
        developer: user?.organisation || user?.name || "Meridian Renewables Ltd",
      };

      const result = await submitProject(
        effectiveWallet,
        user?.id || "usr_meridian",
        submissionPayload
      );

      // Trigger green success popup per spec §6.1 & §111
      setSubmittingStep(null);
      setSuccessModal({
        project: result.project,
        block: result.block,
      });
    } catch (err) {
      setSubmittingStep(null);
      setSubmissionError(err.message || "Failed to submit project.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!canSell) {
    return (
      <Navigate
        to="/dashboard"
        state={{
          message: "Your account is set up to buy and retire credits. Selling is not enabled for this account.",
        }}
        replace
      />
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── GREEN SUCCESS POPUP per Patch P1 spec §4 ── */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="clean-card bg-white max-w-lg w-full p-6 shadow-2xl border-2 border-emerald-500 rounded-lg relative">
            <button
              onClick={() => setSuccessModal(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-base font-semibold text-stone-900">
                  Project submitted successfully
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Your project has been sent to the verifier for review. Track its status in My Projects. It will appear on the Marketplace once approved.
                </p>

                <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-sans">Submission ID:</span>
                    <strong className="text-stone-900">{successModal.project?.id || "PRJ-" + Date.now()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-sans">Project:</span>
                    <span className="text-stone-800 truncate max-w-[200px]">{successModal.project?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-sans">Requested Volume:</span>
                    <span className="text-stone-800">{(successModal.project?.quantityToList || successModal.project?.estimatedCO2 || 0).toLocaleString("en-IN")} tCO2e</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-sans">Asking Price:</span>
                    <span className="text-stone-800">₹{(successModal.project?.askingPrice || 450).toLocaleString("en-IN")} / tCO2e</span>
                  </div>
                  {successModal.block && (
                    <div className="flex justify-between pt-1 border-t border-stone-200">
                      <span className="text-stone-500 font-sans">Ledger Block:</span>
                      <Link to={`/ledger/${successModal.block.index}`} className="text-[#14532D] font-mono hover:underline">
                        Block #{successModal.block.index}
                      </Link>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-3 pt-2">
                  <Link
                    to="/my-projects"
                    className="btn-outline text-xs flex-1 text-center py-2"
                  >
                    Go to My Projects
                  </Link>
                  <button
                    onClick={() => {
                      setSuccessModal(null);
                      setName("");
                      setLocation("");
                      setDescription("");
                      setProofUrl("");
                    }}
                    className="btn-neutral-outline text-xs px-4 py-2 cursor-pointer"
                  >
                    Submit another project
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WALLET / LEDGER CONFIRMATION OVERLAY ── */}
      {submittingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-xs">
          <div className="clean-card bg-white max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <Loader2 className="w-8 h-8 text-[#14532D] animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-stone-900">
                {submittingStep === "wallet" ? "Confirm in your wallet" : "Confirming on ledger..."}
              </h3>
              <p className="text-xs text-stone-500">
                {submittingStep === "wallet"
                  ? "Please approve the cryptographic project submission in your wallet..."
                  : "Calculating SHA-256 block hash and committing to tamper-evident ledger..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-stone-200 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#14532D] block mb-1">
            Project Proponent (IPP)
          </span>
          <h1 className="text-2xl font-semibold text-stone-900">Submit Project for Verification</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Register your emission reduction project with evidence and calculated baseline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleFillIt}
            className="btn-outline text-xs flex items-center gap-1.5"
            title="Cycles through Nashik and Maharashtra preset projects"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#14532D]" />
            Fill it
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {submissionError && (
        <div className="mb-6 p-4 rounded border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Submission Blocked</p>
            <p className="mt-0.5">{submissionError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── SECTION 1: PROJECT IDENTITY ── */}
        <div className="clean-card p-6 bg-white border border-stone-200 rounded">
          <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider text-xs text-stone-500 mb-4">
            1. Project Identification
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sinnar Solar Park (5 MW)"
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
              />
              {formErrors.name && <p className="text-rose-600 text-[11px] mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Project Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Project Scale
              </label>
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
              >
                <option value="small">Small-scale (standard simplified baseline)</option>
                <option value="large">Large-scale (rigorous continuous telemetry)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Specific Location (Village / Taluka, District, State) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sinnar industrial area, Nashik, Maharashtra"
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
              />
              {formErrors.location && <p className="text-rose-600 text-[11px] mt-1">{formErrors.location}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Crediting Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Contact Person &amp; Phone
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Officer name"
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
                />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Methodology Specification <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                placeholder="e.g. ACM0002 - Grid-connected electricity generation"
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Project Description &amp; Scope <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe project operations, technology, local ecosystem impacts, and emissions additionality..."
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
              />
              {formErrors.description && <p className="text-rose-600 text-[11px] mt-1">{formErrors.description}</p>}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: CREDIT ESTIMATOR per spec §8 ── */}
        <div className="clean-card p-6 bg-white border border-stone-200 rounded">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider text-xs text-stone-500">
                2. Credit Estimator
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                First estimate with visible formulas. Verified authority confirms final issuance.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-stone-100 rounded text-stone-600 border border-stone-200">
              Grid Factor: {DEFAULT_FACTORS.gridEmissionFactor} tCO2/MWh
            </span>
          </div>

          {/* Conditional Estimator Inputs based on Project Type */}
          {(projectType === "Solar" || projectType === "Wind") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 border border-stone-200 rounded mb-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Installed Capacity (MW)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={estimatorInputs.capacityMW}
                  onChange={(e) =>
                    setEstimatorInputs({ ...estimatorInputs, capacityMW: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Capacity Utilisation Factor (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="100"
                  value={estimatorInputs.utilisationPercent}
                  onChange={(e) =>
                    setEstimatorInputs({ ...estimatorInputs, utilisationPercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded focus:outline-none"
                />
              </div>
            </div>
          )}

          {(projectType === "Agroforestry" || projectType === "Afforestation" || projectType === "Mangrove") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-stone-50 border border-stone-200 rounded mb-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Area (Hectares)</label>
                <input
                  type="number"
                  min="1"
                  value={estimatorInputs.hectares}
                  onChange={(e) =>
                    setEstimatorInputs({ ...estimatorInputs, hectares: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Survival Rate (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={estimatorInputs.survivalRatePercent}
                  onChange={(e) =>
                    setEstimatorInputs({ ...estimatorInputs, survivalRatePercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Sequestration Rate (t/ha/yr)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={estimatorInputs.tPerHaYr}
                  onChange={(e) =>
                    setEstimatorInputs({ ...estimatorInputs, tPerHaYr: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Nature Buffer Pool (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={estimatorInputs.natureBufferPercent}
                  onChange={(e) =>
                    setEstimatorInputs({ ...estimatorInputs, natureBufferPercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded focus:outline-none"
                />
              </div>
            </div>
          )}

          {projectType === "Transport" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 border border-stone-200 rounded mb-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Diesel Replaced (Litres/yr)</label>
                <input
                  type="number"
                  min="1000"
                  value={estimatorInputs.litresReplaced}
                  onChange={(e) =>
                    setEstimatorInputs({ ...estimatorInputs, litresReplaced: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Grid Electricity Consumed (MWh/yr)</label>
                <input
                  type="number"
                  min="0"
                  value={estimatorInputs.electricityMWh}
                  onChange={(e) =>
                    setEstimatorInputs({ ...estimatorInputs, electricityMWh: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded focus:outline-none"
                />
              </div>
            </div>
          )}

          {projectType === "Waste" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 border border-stone-200 rounded mb-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Waste Diverted (Tonnes/yr)</label>
                <input
                  type="number"
                  min="100"
                  value={estimatorInputs.tonnesDiverted}
                  onChange={(e) =>
                    setEstimatorInputs({ ...estimatorInputs, tonnesDiverted: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Avoidance Factor (tCO2e/t)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={estimatorInputs.wasteFactor}
                  onChange={(e) =>
                    setEstimatorInputs({ ...estimatorInputs, wasteFactor: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded focus:outline-none"
                />
              </div>
            </div>
          )}

          {projectType === "Other" && (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded mb-4">
              <label className="block text-xs font-medium text-stone-700 mb-1">Direct Estimate Entry (tCO2e/yr)</label>
              <input
                type="number"
                min="1"
                value={estimatorInputs.directEntry}
                onChange={(e) =>
                  setEstimatorInputs({ ...estimatorInputs, directEntry: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded focus:outline-none"
              />
            </div>
          )}

          {/* Step-by-Step Calculation Formula Panel */}
          {(() => {
            const calc = calculateEstimatedCredits(projectType, estimatorInputs);
            return (
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-[#14532D]">
                  <FileCheck className="w-4 h-4" />
                  <span>How this was calculated ({calc.formula})</span>
                </div>
                <div className="text-stone-600 space-y-0.5 text-[11px] font-mono">
                  {calc.steps?.map((step, idx) => (
                    <div key={idx}>
                      • {typeof step === "object" && step !== null ? `${step.label}: ${step.value}` : step}
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs font-medium">
                  <span className="text-stone-600">Calculated Net Estimate:</span>
                  <span className="font-mono font-bold text-[#14532D]">
                    {calc.netCredits.toLocaleString("en-IN")} tCO2e / year
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Form Inputs for Quantity & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-stone-200">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Estimated Annual Credits (tCO2e) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={estimatedAnnualCredits}
                onChange={(e) => setEstimatedAnnualCredits(parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
              />
              <span className="text-[10px] text-stone-400">Prefilled from estimator, editable</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Quantity to List (tCO2e) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={estimatedAnnualCredits}
                value={quantityToList}
                onChange={(e) => setQuantityToList(parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
              />
              <span className="text-[10px] text-stone-400">Cannot exceed annual estimate</span>
              {formErrors.quantityToList && (
                <p className="text-rose-600 text-[11px] mt-1">{formErrors.quantityToList}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Asking Price (₹ / tCO2e) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="10"
                value={askingPrice}
                onChange={(e) => setAskingPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none font-mono"
              />
              <span className="text-[10px] text-stone-500 block">
                Indicative market range: ₹{priceBand.min} to ₹{priceBand.max}
              </span>
            </div>
          </div>

          {/* Gentle Indicative Range Warning if Outside Band per spec §104 */}
          {isPriceOutsideBand && (
            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
              <span>
                Note: Asking price (₹{askingPrice}) is outside the typical indicative range (₹{priceBand.min} - ₹{priceBand.max} / tCO2e). This will not block your submission, but will be flagged for the verifier to review.
              </span>
            </div>
          )}

          {/* Project Value Line per spec §105 */}
          <div className="mt-4 p-3 bg-stone-100 rounded text-xs flex flex-wrap items-center justify-between gap-2 border border-stone-200">
            <span className="text-stone-600">Annual Project Value (Gross):</span>
            <span className="font-mono font-bold text-stone-900">
              {quantityToList.toLocaleString("en-IN")} × ₹{askingPrice} = {formatAnnualRevenue(annualRevenue)} per year
            </span>
          </div>
        </div>

        {/* ── SECTION 3: UPLOADS & EVIDENCE per spec §7 ── */}
        <div className="clean-card p-6 bg-white border border-stone-200 rounded">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider text-xs text-stone-500">
                3. Verification Evidence &amp; Uploads
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Upload project site photos and documentation. Files are cryptographically fingerprinted with SHA-256.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Photos (up to 5, 5MB each) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-stone-700">
                  Site Photos (JPG / PNG, max 5, cover photo first)
                </label>
                <span className="text-[11px] text-stone-400">{photos.length} of 5 photos</span>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                  {photos.map((p, idx) => (
                    <div key={p.id} className="relative group border border-stone-200 rounded overflow-hidden aspect-video bg-stone-50">
                      <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-semibold rounded">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded hover:bg-black transition"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] font-mono text-white px-1.5 py-0.5 truncate">
                        {p.sha256 ? `${p.sha256.slice(0, 8)}...` : p.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 5 && (
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-stone-300 rounded hover:border-[#14532D] cursor-pointer bg-stone-50/50 transition">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 text-[#14532D] animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 text-stone-400 mb-1" />
                      <span className="text-xs font-medium text-stone-700">Choose site photos</span>
                      <span className="text-[10px] text-stone-400">JPG or PNG up to 5 MB (auto-resized)</span>
                    </>
                  )}
                </label>
              )}
              {formErrors.photos && <p className="text-rose-600 text-[11px] mt-1">{formErrors.photos}</p>}
            </div>

            {/* Documents (up to 5, 10MB each) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-stone-700">
                  Verification Documents (PDF, DOCX, XLSX, max 5)
                </label>
                <span className="text-[11px] text-stone-400">{documents.length} of 5 documents</span>
              </div>

              {documents.length > 0 && (
                <div className="space-y-2 mb-3">
                  {documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-200 rounded text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-[#14532D] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-stone-800 truncate">{d.name}</p>
                          <p className="text-[10px] font-mono text-stone-400">
                            {(d.size / 1024 / 1024).toFixed(2)} MB • SHA-256: {d.sha256?.slice(0, 16)}...
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(d.id)}
                        className="text-stone-400 hover:text-stone-700 p-1"
                        title="Remove document"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {documents.length < 5 && (
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-stone-300 rounded hover:border-[#14532D] cursor-pointer bg-stone-50/50 transition">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    onChange={handleDocUpload}
                    className="hidden"
                    disabled={uploadingDoc}
                  />
                  {uploadingDoc ? (
                    <Loader2 className="w-5 h-5 text-[#14532D] animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-stone-400 mb-1" />
                      <span className="text-xs font-medium text-stone-700">Attach audit reports, GIS files, or spreadsheets</span>
                      <span className="text-[10px] text-stone-400">Up to 10 MB per document</span>
                    </>
                  )}
                </label>
              )}
              {formErrors.documents && <p className="text-rose-600 text-[11px] mt-1">{formErrors.documents}</p>}
            </div>

            {/* Optional Proof URL */}
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Optional External Proof URL / Registry Link
              </label>
              <input
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded focus:border-[#14532D] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 4: SUSTAINABLE DEVELOPMENT GOALS (SDGs) ── */}
        <div className="clean-card p-6 bg-white border border-stone-200 rounded">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider text-xs text-stone-500">
                4. Sustainable Development Goals (SDGs)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                SDG 13 is locked. Select at least 4 goals to compute indicative Impact Factor.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-stone-700">
                Impact Factor (indicative):{" "}
                <span className="font-mono font-bold text-[#14532D]">
                  {sdgs.length >= 4 ? computeImpactFactor(sdgScores) : "pending"}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {AVAILABLE_SDGS.map((sdg) => {
              const checked = sdgs.includes(sdg.id);
              return (
                <label
                  key={sdg.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded border text-xs cursor-pointer transition ${
                    checked
                      ? "border-[#14532D] bg-emerald-50/50 text-[#14532D]"
                      : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={sdg.locked}
                    onChange={() => handleToggleSdg(sdg.id)}
                    className="rounded border-stone-300 text-[#14532D] focus:ring-0"
                  />
                  <span className="font-medium truncate">{sdg.name}</span>
                  {sdg.locked && (
                    <span className="ml-auto text-[10px] text-stone-400 font-mono">locked</span>
                  )}
                </label>
              );
            })}
          </div>
          {formErrors.sdgs && <p className="text-rose-600 text-[11px] mt-2">{formErrors.sdgs}</p>}
        </div>

        {/* ── SUBMIT BAR ── */}
        <div className="pt-4 flex items-center justify-between gap-4 border-t border-stone-200">
          <Link to="/my-projects" className="btn-neutral-outline text-xs">
            Cancel
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submittingStep !== null}
              className="btn-outline text-xs px-6 py-2.5 font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Submit for verification
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
