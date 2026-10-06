import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getReadOnlyContract } from "../lib/contract";
import { isContractConfigured } from "../config/contract";
import { decodeMetadata } from "../lib/metadata";

export function useCredits() {
  const [credits, setCredits] = useState([]);
  const [feeBps, setFeeBps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isConfigured = isContractConfigured();

  const fetchCredits = useCallback(async () => {
    if (!isConfigured) {
      setCredits([]);
      setFeeBps(0);
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

      // Read creditCount and feeBps
      const [rawCount, rawFeeBps] = await Promise.all([
        contract.creditCount().catch(() => 0n),
        contract.feeBps().catch(() => 0n),
      ]);

      const count = Number(rawCount);
      const bps = Number(rawFeeBps);
      setFeeBps(bps);

      if (count === 0) {
        // Also check if id 0 exists
        try {
          const zeroCredit = await contract.getCredit(0);
          if (zeroCredit && zeroCredit.amount > 0n) {
            const [currentOwner, project] = await Promise.all([
              contract.ownerOf(0).catch(() => zeroCredit.creator),
              contract.getProject(zeroCredit.projectId).catch(() => null),
            ]);
            const decoded = project ? decodeMetadata(project.metadataURI) : {};

            setCredits([{
              tokenId: 0,
              projectId: Number(zeroCredit.projectId),
              amount: Number(zeroCredit.amount),
              creator: zeroCredit.creator,
              owner: currentOwner,
              mintedAt: Number(zeroCredit.mintedAt),
              listed: Boolean(zeroCredit.listed),
              priceWei: zeroCredit.price,
              pricePol: ethers.formatEther(zeroCredit.price || 0n),
              pricePerTonnePol: Number(zeroCredit.amount) > 0 
                ? (Number(ethers.formatEther(zeroCredit.price || 0n)) / Number(zeroCredit.amount)).toFixed(4)
                : "0",
              retired: Boolean(zeroCredit.retired),
              retiredBy: zeroCredit.retiredBy,
              retireeName: zeroCredit.retireeName,
              onBehalfOfName: zeroCredit.onBehalfOfName,
              onBehalfOfWallet: zeroCredit.onBehalfOfWallet,
              message: zeroCredit.message,
              reason: zeroCredit.reason,
              retiredAt: Number(zeroCredit.retiredAt),
              projectName: project?.name || `Project #${zeroCredit.projectId}`,
              projectType: project?.projectType || "Standard",
              location: project?.location || "India",
              ...decoded,
            }]);
            setLoading(false);
            return;
          }
        } catch {
          // Token 0 does not exist
        }

        setCredits([]);
        setLoading(false);
        return;
      }

      // Loop 1 to count
      const creditPromises = [];
      const ownerPromises = [];

      for (let i = 1; i <= count; i++) {
        creditPromises.push(contract.getCredit(i).catch(() => null));
        ownerPromises.push(contract.ownerOf(i).catch(() => null));
      }

      const [creditResults, ownerResults] = await Promise.all([
        Promise.all(creditPromises),
        Promise.all(ownerPromises),
      ]);

      // Collect projectIds to fetch projects efficiently
      const projectIdsToFetch = new Set();
      creditResults.forEach((c) => {
        if (c && c.projectId) projectIdsToFetch.add(Number(c.projectId));
      });

      const projectMap = {};
      await Promise.all(
        Array.from(projectIdsToFetch).map(async (pId) => {
          try {
            const p = await contract.getProject(pId);
            if (p) {
              projectMap[pId] = {
                name: p.name,
                projectType: p.projectType,
                location: p.location,
                metadataURI: p.metadataURI,
                ...decodeMetadata(p.metadataURI),
              };
            }
          } catch (err) {
            console.warn(`Failed to fetch project ${pId} for credit:`, err.message);
          }
        })
      );

      const loadedCredits = [];
      for (let i = 0; i < creditResults.length; i++) {
        const c = creditResults[i];
        if (!c) continue;

        const tokenId = Number(c.tokenId !== undefined ? c.tokenId : i + 1);
        const owner = ownerResults[i] || c.creator;
        const pId = Number(c.projectId);
        const proj = projectMap[pId] || {};

        const priceWei = c.price || 0n;
        const pricePol = ethers.formatEther(priceWei);
        const amountNum = Number(c.amount || 0);
        const pricePerTonne = amountNum > 0 ? (Number(pricePol) / amountNum).toFixed(5) : "0";

        loadedCredits.push({
          tokenId,
          projectId: pId,
          amount: amountNum,
          creator: c.creator,
          owner,
          mintedAt: Number(c.mintedAt),
          listed: Boolean(c.listed),
          priceWei,
          pricePol,
          pricePerTonnePol: pricePerTonne,
          retired: Boolean(c.retired),
          retiredBy: c.retiredBy,
          retireeName: c.retireeName,
          onBehalfOfName: c.onBehalfOfName,
          onBehalfOfWallet: c.onBehalfOfWallet,
          message: c.message,
          reason: c.reason,
          retiredAt: Number(c.retiredAt),
          projectName: proj.name || `Project #${pId}`,
          projectType: proj.projectType || "General",
          location: proj.location || "India",
          description: proj.description || "",
          proofUrl: proj.proofUrl || "",
          imageUrl: proj.imageUrl || "",
          sdgs: proj.sdgs || [13],
        });
      }

      // Sort by tokenId descending (newest first)
      loadedCredits.sort((a, b) => b.tokenId - a.tokenId);
      setCredits(loadedCredits);
    } catch (err) {
      console.error("Error loading credits from contract:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    credits,
    feeBps,
    feePercent: (feeBps / 100).toFixed(2),
    loading,
    error,
    refetch: fetchCredits,
  };
}
