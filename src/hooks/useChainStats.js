import { useState, useEffect, useCallback } from "react";
import { getReadOnlyContract } from "../lib/contract";
import { isContractConfigured } from "../config/contract";

export function useChainStats() {
  const [stats, setStats] = useState({
    projectCount: 0,
    creditCount: 0,
    retiredCount: 0,
    retiredTonnes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isConfigured = isContractConfigured();

  const fetchStats = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const contract = await getReadOnlyContract();
      if (!contract) {
        setLoading(false);
        return;
      }

      const [rawProjects, rawCredits] = await Promise.all([
        contract.projectCount().catch(() => 0n),
        contract.creditCount().catch(() => 0n),
      ]);

      const projects = Number(rawProjects);
      const credits = Number(rawCredits);

      let retiredCount = 0;
      let retiredTonnes = 0;

      if (credits > 0) {
        // Fetch credits in parallel
        const creditPromises = [];
        for (let i = 1; i <= credits; i++) {
          creditPromises.push(
            contract.getCredit(i).catch(() => null)
          );
        }

        const creditResults = await Promise.all(creditPromises);
        for (const c of creditResults) {
          if (c && c.retired) {
            retiredCount += 1;
            retiredTonnes += Number(c.amount || 0);
          }
        }
      }

      setStats({
        projectCount: projects,
        creditCount: credits,
        retiredCount,
        retiredTonnes,
      });
    } catch (err) {
      console.warn("Error fetching chain stats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const hasData = isConfigured && (stats.projectCount > 0 || stats.creditCount > 0);

  return {
    ...stats,
    loading,
    error,
    isConfigured,
    hasData,
    refetch: fetchStats,
  };
}
