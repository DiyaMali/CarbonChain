import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Download,
  Printer,
  FileCode,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { submitProject, computeImpactFactor, SDG_NAMES } from "../services/ledgerService";
import {
  downloadLedgerBlockRecord,
} from "../utils/exportProject";
import { USE_DEMO_LEDGER } from "../config/contract";

const PROJECT_TYPES = ["Agroforestry", "Afforestation", "Solar", "Wind", "Transport", "Waste", "Other"];

const AVAILABLE_SDGS = [
  { id: 13, name: "SDG 13: Climate Action", locked: true },
  { id: 15, name: "SDG 15: Life on Land" },
  { id: 1, name: "SDG 1: No Poverty" },
  { id: 7, name: "SDG 7: Affordable & Clean Energy" },
  { id: 8, name: "SDG 8: Decent Work & Economic Growth" },
  { id: 9, name: "SDG 9: Industry Innovation" },
  { id: 11, name: "SDG 11: Sustainable Cities" },
  { id: 12, name: "SDG 12: Responsible Consumption" },
  { id: 5, name: "SDG 5: Gender Equality" },
];

export default function SubmitProject() {
  const navigate = useNavigate();
  const { account, isDemoMode, connectWallet } = useWallet();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    projectType: "Agroforestry",
    location: "",
    estimatedCO2: "",
    description: "",
    proofUrl: "",
    imageUrl: "",
    sdgs: [13],
    sdgScores: { 13: { scale: 5, intensity: 5 } },
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  React.useEffect(() => { document.title = "Submit Project | CarbonChain"; }, []);

  const handleFillDemo = () => {
    setFormData({
      name: "Green Wings Agroforestry Project",
      projectType: "Agroforestry",
      location: "Jalgaon, Maharashtra",
      estimatedCO2: "15000",
      description: "Agroforestry programme engaging about 1,700 farmers across Jalgaon district. Combines food crops with tree species to sequester carbon while improving livelihoods. Listed on Carbon Registry India.",
      proofUrl: "https://cri.nccf.in/projects/green-wings-agroforestry",
      imageUrl: "/images/projects/green-wings.jpg",
      sdgs: [13, 15, 1, 8],
      sdgScores: { 13: { scale: 5, intensity: 5 }, 15: { scale: 4, intensity: 4 }, 1: { scale: 3, intensity: 3 }, 8: { scale: 3, intensity: 3 } },
    });
    setFormErrors({});
  };

  const handleToggleSdg = (sdgId) => {
    if (sdgId === 13) return;
    setFormData((prev) => {
      const exists = prev.sdgs.includes(sdgId);
      const newSdgs = exists ? prev.sdgs.filter((id) => id !== sdgId) : [...prev.sdgs, sdgId];
      const newScores = { ...prev.sdgScores };
      if (!exists) newScores[sdgId] = { scale: 3, intensity: 3 };
      else delete newScores[sdgId];
      return { ...prev, sdgs: newSdgs, sdgScores: newScores };
    });
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Project name is required.";
    if (!formData.location.trim()) errors.location = "Project location is required.";
    const co2Num = Number(formData.estimatedCO2);
    if (!formData.estimatedCO2 || isNaN(co2Num) || co2Num <= 0 || !Number.isInteger(co2Num)) {
      errors.estimatedCO2 = "Estimated CO2 must be a positive whole number of tonnes.";
    }
    if (!formData.description.trim() || formData.description.trim().length < 15) {
      errors.description = "Please provide a clear description (at least 15 characters).";
    }
    if (!formData.proofUrl.trim()) {
      errors.proofUrl = "Proof document URL is required.";
    } else {
      try { new URL(formData.proofUrl.trim()); } catch { errors.proofUrl = "Please provide a valid URL."; }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const effectiveWallet = account || (isDemoMode && user?.walletAddress);
    if (!effectiveWallet) {
      alert("Please set up your wallet first.");
      navigate("/connect-wallet");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitProject(effectiveWallet, user?.id, {
        name: formData.name.trim(),
        projectType: formData.projectType,
        location: formData.location.trim(),
        estimatedCO2: Number(formData.estimatedCO2),
        description: formData.description.trim(),
        proofUrl: formData.proofUrl.trim(),
        imageUrl: formData.imageUrl.trim(),
        sdgs: formData.sdgs,
        sdgScores: formData.sdgScores,
      });
      setSubmitted({
        projectId: result.projectId,
        projectName: formData.name,
        block: result.block,
        project: result.project || {
          id: result.projectId,
          name: formData.name,
          projectType: formData.projectType,
          location: formData.location,
          estimatedCO2: Number(formData.estimatedCO2),
          description: formData.description,
          proofUrl: formData.proofUrl,
          imageUrl: formData.imageUrl,
          sdgs: formData.sdgs,
          sdgScores: formData.sdgScores,
          status: "Pending",
          submittedAt: new Date().toISOString(),
          owner: effectiveWallet,
          developer: user?.name ? `${user.name} (${user.organisation || user.role || "IPP"})` : "Project Proponent",
        },
      });
    } catch (err) {
      setFormErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const impactFactor = computeImpactFactor(formData.sdgScores);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
      {/* Loading overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded p-8 max-w-sm w-full text-center shadow">
            <Loader2 className="w-8 h-8 text-forest animate-spin mx-auto mb-3" />
            <div className="text-sm font-semibold text-charcoal">Confirming on ledger...</div>
            <div className="text-xs text-charcoal-muted mt-1">Adding block to hash chain</div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-200 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-forest block mb-1">IPP Project Registration</span>
          <h1 className="text-2xl font-semibold text-charcoal">Submit Carbon Credit Project</h1>
          <p className="text-xs text-charcoal-muted mt-1">Register your emission reduction batch for accredited VVB verification.</p>
        </div>
        <button type="button" onClick={handleFillDemo} className="btn-neutral-outline text-xs flex items-center gap-1.5 self-start">
          <Sparkles className="w-3.5 h-3.5 text-forest" />
          Fill with demo data
        </button>
      </div>

      {/* Success Banner with Download Options */}
      {submitted && (
        <div className="clean-card bg-emerald-50/80 border-emerald-300 p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="text-base font-semibold text-emerald-950">Project submitted to ledger!</h3>
                <p className="text-xs text-emerald-800 leading-relaxed mt-1">
                  <strong>{submitted.projectName}</strong> is now registered and queued for accredited VVB audit.
                  {submitted.block && ` Block #${submitted.block?.index} appended to the hash chain.`}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono">
                {submitted.block && (
                  <>
                    <Link
                      to={`/ledger/${submitted.block.index}`}
                      className="inline-flex items-center gap-1.5 text-forest underline hover:text-forest-hover font-semibold"
                    >
                      View ledger record #{submitted.block.index}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => downloadLedgerBlockRecord(submitted.block, submitted.project)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#14532D] hover:bg-[#0F3822] text-white rounded font-sans font-medium transition-colors shadow-2xs cursor-pointer"
                      title="Download ledger record file directly to your computer (.json)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download ledger record #{submitted.block.index}
                    </button>
                  </>
                )}
                <Link to="/my-projects" className="btn-text font-sans text-xs ml-auto">Go to My Projects &rarr;</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {!account && !user?.walletAddress && (
        <div className="mb-6 p-4 rounded bg-cream border border-gray-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-forest flex-shrink-0" />
            <span>Set up your wallet to submit a project.</span>
          </div>
          <Link to="/connect-wallet" className="btn-outline-sm whitespace-nowrap">Set up wallet</Link>
        </div>
      )}

      {formErrors.submit && (
        <div className="mb-6 p-3.5 rounded bg-red-50 border border-red-200 text-red-800 text-xs">{formErrors.submit}</div>
      )}

      <form onSubmit={handleSubmit} className="clean-card p-6 sm:p-8 space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (formErrors.name) setFormErrors({ ...formErrors, name: null }); }}
            placeholder="e.g. Green Wings Agroforestry Project"
            className={`w-full px-3.5 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-forest ${formErrors.name ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"}`}
          />
          {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
        </div>

        {/* Type + CO2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">Project Type <span className="text-red-500">*</span></label>
            <select
              value={formData.projectType}
              onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-forest bg-white"
            >
              {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">Estimated CO2 (whole tonnes) <span className="text-red-500">*</span></label>
            <input
              type="number" min="1" step="1"
              value={formData.estimatedCO2}
              onChange={(e) => { setFormData({ ...formData, estimatedCO2: e.target.value }); if (formErrors.estimatedCO2) setFormErrors({ ...formErrors, estimatedCO2: null }); }}
              placeholder="e.g. 15000"
              className={`w-full px-3.5 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-forest font-mono ${formErrors.estimatedCO2 ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"}`}
            />
            {formErrors.estimatedCO2 && <p className="text-xs text-red-600 mt-1">{formErrors.estimatedCO2}</p>}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">Location <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => { setFormData({ ...formData, location: e.target.value }); if (formErrors.location) setFormErrors({ ...formErrors, location: null }); }}
            placeholder="e.g. Jalgaon, Maharashtra"
            className={`w-full px-3.5 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-forest ${formErrors.location ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"}`}
          />
          {formErrors.location && <p className="text-xs text-red-600 mt-1">{formErrors.location}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">Project Description <span className="text-red-500">*</span></label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => { setFormData({ ...formData, description: e.target.value }); if (formErrors.description) setFormErrors({ ...formErrors, description: null }); }}
            placeholder="Describe the methodology, affected land or capacity, and local environmental impact..."
            className={`w-full px-3.5 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-forest ${formErrors.description ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"}`}
          />
          {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
        </div>

        {/* Proof URL */}
        <div>
          <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">Proof / Registry URL <span className="text-red-500">*</span></label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-subtle" />
            <input
              type="url"
              value={formData.proofUrl}
              onChange={(e) => { setFormData({ ...formData, proofUrl: e.target.value }); if (formErrors.proofUrl) setFormErrors({ ...formErrors, proofUrl: null }); }}
              placeholder="https://cri.nccf.in/projects/..."
              className={`w-full pl-9 pr-3.5 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-forest ${formErrors.proofUrl ? "border-red-400 bg-red-50/20" : "border-gray-300 bg-white"}`}
            />
          </div>
          {formErrors.proofUrl && <p className="text-xs text-red-600 mt-1">{formErrors.proofUrl}</p>}
        </div>

        {/* Project Photo URL */}
        <div>
          <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-1.5">Project Photo URL / Path</label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-subtle" />
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="/images/projects/... or https://..."
              className="w-full pl-9 pr-3.5 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-forest bg-white"
            />
          </div>
          <p className="text-[11px] text-charcoal-muted mt-1">Local path (e.g. /images/projects/green-wings.jpg) or external image URL</p>
          {formData.imageUrl && (
            <div className="mt-2.5 h-36 w-full max-w-sm rounded border border-gray-200 overflow-hidden bg-cream-light">
              <img
                src={formData.imageUrl}
                alt="Project preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          )}
        </div>

        {/* SDGs */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-charcoal uppercase tracking-wider">UN SDGs Contributed</label>
            {impactFactor > 0 && (
              <span className="text-[11px] font-medium text-forest border border-forest/20 rounded px-2 py-0.5 bg-forest-light/30">
                Impact Factor: {impactFactor}
              </span>
            )}
          </div>
          <p className="text-xs text-charcoal-muted mb-3">SDG 13 (Climate Action) is mandatory. Select additional goals:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_SDGS.map((sdg) => {
              const isSelected = formData.sdgs.includes(sdg.id);
              return (
                <button
                  type="button"
                  key={sdg.id}
                  disabled={sdg.locked}
                  onClick={() => handleToggleSdg(sdg.id)}
                  className={`p-2.5 px-3 rounded border text-left text-xs transition-colors flex items-center justify-between ${
                    isSelected ? "border-forest bg-forest-light text-forest font-medium" : "border-gray-200 text-charcoal hover:border-gray-300"
                  } ${sdg.locked ? "cursor-default opacity-90" : "cursor-pointer"}`}
                >
                  <span>{sdg.name}</span>
                  {sdg.locked && <Lock className="w-3.5 h-3.5 text-forest" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-charcoal-subtle">
            Metadata is encoded into the ledger block directly.
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-outline px-6 py-2.5 text-sm flex items-center gap-2 self-stretch sm:self-auto justify-center"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Confirming on ledger..." : "Submit Project"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
