/**
 * useLedger  -  React hook for reading CarbonChain ledger state.
 * Returns live data from ledgerService, with a refetch function.
 */
import { useState, useEffect, useCallback } from "react";
import {
  getAllProjects,
  getAllCredits,
  getProject,
  getCredit,
  getHistory,
  getAllLedgerBlocks,
  getPlatformStats,
  getWalletStats,
  computeImpactFactor,
} from "../services/ledgerService";

// ─── All projects ─────────────────────────────────────────────────────────────
export function useAllProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setProjects(getAllProjects());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { projects, loading, refetch: load };
}

// ─── All credits (with project data attached) ─────────────────────────────────
export function useAllCredits() {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const rawCredits = getAllCredits();
    const projects = getAllProjects();
    const projMap = Object.fromEntries(projects.map((p) => [p.id, p]));
    const enriched = rawCredits.map((c) => ({
      ...c,
      project: projMap[c.projectId] || null,
      impactFactor: projMap[c.projectId] ? computeImpactFactor(projMap[c.projectId].sdgScores) : 0,
    }));
    setCredits(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { credits, loading, refetch: load };
}

// ─── Listed credits (marketplace) ────────────────────────────────────────────
export function useMarketplaceCredits() {
  const { credits, loading, refetch } = useAllCredits();
  const listed = credits.filter((c) => c.listed && !c.retired);
  // Guarantee each unique project appears at most once on the marketplace
  const seen = new Set();
  const uniqueByProject = [];
  for (const c of listed) {
    const key = c.projectId || c.project?.name || c.id;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueByProject.push(c);
    }
  }
  return { credits: uniqueByProject, loading, refetch };
}

// ─── Single credit with history ───────────────────────────────────────────────
export function useCreditDetail(creditId) {
  const [credit, setCredit] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const raw = getCredit(creditId);
    if (raw) {
      const proj = getProject(raw.projectId);
      setCredit({ ...raw, project: proj, impactFactor: proj ? computeImpactFactor(proj.sdgScores) : 0 });
      setHistory(getHistory(creditId));
    }
    setLoading(false);
  }, [creditId]);

  useEffect(() => { load(); }, [load]);
  return { credit, history, loading, refetch: load };
}

// ─── Single project ───────────────────────────────────────────────────────────
export function useProjectDetail(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setProject(getProject(projectId));
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);
  return { project, loading, refetch: load };
}

// ─── Platform stats ───────────────────────────────────────────────────────────
export function usePlatformStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setStats(getPlatformStats());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { stats, loading, refetch: load };
}

// ─── Wallet stats ─────────────────────────────────────────────────────────────
export function useWalletLedgerStats(walletAddress) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (walletAddress) {
      setStats(getWalletStats(walletAddress));
    } else {
      setStats(null);
    }
    setLoading(false);
  }, [walletAddress]);

  useEffect(() => { load(); }, [load]);
  return { stats, loading, refetch: load };
}

// ─── Full ledger ──────────────────────────────────────────────────────────────
export function useLedgerBlocks() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setBlocks(getAllLedgerBlocks());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { blocks, loading, refetch: load };
}
