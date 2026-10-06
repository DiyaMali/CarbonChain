import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Plus, RefreshCw, CheckCircle2, Clock, XCircle, Eye, Download } from "lucide-react";
import { useAllProjects } from "../hooks/useLedger";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import ProjectTypeIcon from "../components/ProjectTypeIcon";
import { downloadProjectDetailsText, downloadProjectDetailsJson } from "../utils/exportProject";

const TABS = ["All", "Pending", "Approved", "Rejected"];

export default function MyProjects() {
  const { account } = useWallet();
  const { user } = useAuth();
  const { projects, loading, refetch } = useAllProjects();
  const [activeTab, setActiveTab] = useState("All");

  React.useEffect(() => { document.title = "My Projects | CarbonChain"; }, []);

  const myProjects = projects.filter((p) => p.owner === account || p.ownerUserId === user?.id);
  const filtered = activeTab === "All" ? myProjects : myProjects.filter((p) => p.status === activeTab);

  const counts = {
    All: myProjects.length,
    Pending: myProjects.filter((p) => p.status === "Pending").length,
    Approved: myProjects.filter((p) => p.status === "Approved").length,
    Rejected: myProjects.filter((p) => p.status === "Rejected").length,
  };

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-semibold mb-3">Please sign in</h1>
      <Link to="/login" className="btn-outline">Sign in</Link>
    </div>
  );

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-200 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-forest block mb-1">IPP Portfolio</span>
          <h1 className="text-2xl font-semibold text-charcoal">My Projects</h1>
          <p className="text-sm text-charcoal-muted mt-0.5">Projects you have submitted for VVB verification.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-neutral-outline text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link to="/submit" className="btn-outline text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Submit Project
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border border-gray-200 rounded overflow-hidden mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === tab ? "bg-forest text-white" : "bg-white text-charcoal-muted hover:bg-gray-50"
            }`}
          >
            {tab}
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === tab ? "bg-white/20 text-white" : "bg-gray-100 text-charcoal-muted"}`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded">
          <FileText className="w-8 h-8 text-charcoal-subtle mx-auto mb-3" />
          <p className="text-sm text-charcoal-muted mb-3">
            {myProjects.length === 0
              ? "You have not submitted any projects yet."
              : `No ${activeTab.toLowerCase()} projects.`}
          </p>
          {myProjects.length === 0 && (
            <Link to="/submit" className="btn-outline-sm">Submit your first project</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((proj) => (
            <div key={proj.id} className="clean-card p-5 flex items-start gap-4">
              <ProjectTypeIcon type={proj.projectType} size="md" imageUrl={proj.imageUrl} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <Link to={`/projects/${proj.slug || proj.id}`} className="hover:text-forest">
                    <h3 className="text-sm font-semibold text-charcoal">{proj.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadProjectDetailsText(proj, null, user)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                      title="Download official project submission details (.txt)"
                    >
                      <Download className="w-3 h-3 text-emerald-700" />
                      <span>Download Details</span>
                    </button>
                    <StatusBadge status={proj.status} />
                  </div>
                </div>
                <div className="text-xs text-charcoal-muted mt-0.5">
                  {proj.location} &bull; {proj.projectType} &bull; {proj.estimatedCO2.toLocaleString("en-IN")} tCO2e estimated
                </div>
                <div className="text-[11px] text-charcoal-subtle mt-1">
                  Submitted {new Date(proj.submittedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  {proj.status === "Approved" && proj.verifiedAmount > 0 && (
                    <span className="ml-2 text-emerald-700 font-medium">
                      Verified: {proj.verifiedAmount.toLocaleString("en-IN")} tCO2e
                    </span>
                  )}
                </div>
                {proj.verifierNote && (
                  <div className={`mt-2 text-xs p-2.5 rounded border ${proj.status === "Rejected" ? "bg-red-50 border-red-100 text-red-800" : "bg-emerald-50 border-emerald-100 text-emerald-800"}`}>
                    <span className="font-medium">VVB note:</span> {proj.verifierNote}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { Pending: "badge-pending", Approved: "badge-approved", Rejected: "badge-rejected" };
  const icons = { Pending: <Clock className="w-3 h-3" />, Approved: <CheckCircle2 className="w-3 h-3" />, Rejected: <XCircle className="w-3 h-3" /> };
  return (
    <span className={`${map[status] || "badge-pending"} flex items-center gap-1`}>
      {icons[status]}
      {status}
    </span>
  );
}
