import { useState, useEffect, useCallback } from "react";
import { getReadOnlyContract } from "../lib/contract";
import { isContractConfigured } from "../config/contract";

export function useWalletStats(account) {
  const [stats, setStats] = useState({
    submittedProjectsCount: 0,
    ownedCreditsCount: 0,
    listedCreditsCount: 0,
    retiredCreditsCount: 0,
    retiredTonnes: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const isConfigured = isContractConfigured();

  const fetchWalletStats = useCallback(async () => {
    if (!isConfigured || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const contract = await getReadOnlyContract();
      if (!contract) {
        setLoading(false);
        return;
      }

      const lowerAccount = account.toLowerCase();

      // Read project count and credit count
      const [rawProjects, rawCredits] = await Promise.all([
        contract.projectCount().catch(() => 0n),
        contract.creditCount().catch(() => 0n),
      ]);

      const projectCount = Number(rawProjects);
      const creditCount = Number(rawCredits);

      // Loop projects for this owner
      let userProjectsCount = 0;
      if (projectCount > 0) {
        const projectPromises = [];
        for (let i = 1; i <= projectCount; i++) {
          projectPromises.push(contract.getProject(i).catch(() => null));
        }
        const projectResults = await Promise.all(projectPromises);
        for (const p of projectResults) {
          if (p && p.owner && p.owner.toLowerCase() === lowerAccount) {
            userProjectsCount += 1;
          }
        }
      }

      // Loop credits for this wallet
      let owned = 0;
      let listed = 0;
      let retired = 0;
      let retiredTonnes = 0;
      const activityEntries = [];

      if (creditCount > 0) {
        const creditPromises = [];
        const ownerPromises = [];
        for (let i = 1; i <= creditCount; i++) {
          creditPromises.push(contract.getCredit(i).catch(() => null));
          ownerPromises.push(contract.ownerOf(i).catch(() => null));
        }

        const [creditResults, ownerResults] = await Promise.all([
          Promise.all(creditPromises),
          Promise.all(ownerPromises),
        ]);

        for (let i = 0; i < creditResults.length; i++) {
          const c = creditResults[i];
          const currentOwner = ownerResults[i];
          if (!c) continue;

          const isCurrentOwner = currentOwner && currentOwner.toLowerCase() === lowerAccount;
          const isRetirer = c.retiredBy && c.retiredBy.toLowerCase() === lowerAccount;

          if (isCurrentOwner) {
            owned += 1;
            if (c.listed && !c.retired) {
              listed += 1;
            }
          }

          if (c.retired && isRetirer) {
            retired += 1;
            retiredTonnes += Number(c.amount || 0);
          }

          // Fetch recent history if user was involved
          if (isCurrentOwner || isRetirer || (c.creator && c.creator.toLowerCase() === lowerAccount)) {
            activityEntries.push({
              tokenId: Number(c.tokenId),
              projectId: Number(c.projectId),
              action: c.retired ? "Retired" : c.listed ? "Listed for Sale" : "Minted / Transferred",
              amount: Number(c.amount),
              timestamp: Number(c.retired ? c.retiredAt : c.mintedAt),
            });
          }
        }
      }

      // Sort recent activity descending
      activityEntries.sort((a, b) => b.timestamp - a.timestamp);

      setStats({
        submittedProjectsCount: userProjectsCount,
        ownedCreditsCount: owned,
        listedCreditsCount: listed,
        retiredCreditsCount: retired,
        retiredTonnes,
        recentActivity: activityEntries.slice(0, 10),
      });
    } catch (err) {
      console.warn("Could not fetch wallet on-chain stats:", err);
    } finally {
      setLoading(false);
    }
  }, [account, isConfigured]);

  useEffect(() => {
    fetchWalletStats();
  }, [fetchWalletStats]);

  return {
    ...stats,
    loading,
    refetch: fetchWalletStats,
  };
}
