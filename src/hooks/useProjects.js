import { useState, useEffect, useCallback } from "react";
import { getReadOnlyContract } from "../lib/contract";
import { isContractConfigured, PROJECT_STATUS } from "../config/contract";
import { decodeMetadata } from "../lib/metadata";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isConfigured = isContractConfigured();

  const fetchProjects = useCallback(async () => {
    if (!isConfigured) {
      setProjects([]);
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

      const rawCount = await contract.projectCount().catch(() => 0n);
      const count = Number(rawCount);

      if (count === 0) {
        // Also check if id 0 exists in contract
        try {
          const zeroProj = await contract.getProject(0);
          if (zeroProj && zeroProj.name) {
            const decoded = decodeMetadata(zeroProj.metadataURI);
            setProjects([{
              id: 0,
              owner: zeroProj.owner,
              name: zeroProj.name,
              projectType: zeroProj.projectType,
              location: zeroProj.location,
              metadataURI: zeroProj.metadataURI,
              estimatedCO2: Number(zeroProj.estimatedCO2),
              status: Number(zeroProj.status),
              statusName: PROJECT_STATUS[Number(zeroProj.status)] || "Pending",
              reviewedBy: zeroProj.reviewedBy,
              reviewNote: zeroProj.reviewNote,
              submittedAt: Number(zeroProj.submittedAt),
              reviewedAt: Number(zeroProj.reviewedAt),
              tokenId: Number(zeroProj.tokenId),
              ...decoded,
            }]);
            setLoading(false);
            return;
          }
        } catch {
          // id 0 does not exist
        }

        setProjects([]);
        setLoading(false);
        return;
      }

      // IDs start at 1 up to count
      const fetchPromises = [];
      for (let i = 1; i <= count; i++) {
        fetchPromises.push(
          contract.getProject(i).catch((err) => {
            console.warn(`Failed to fetch project ${i}:`, err.message);
            return null;
          })
        );
      }

      const results = await Promise.all(fetchPromises);
      const loadedProjects = [];

      for (let i = 0; i < results.length; i++) {
        const p = results[i];
        if (!p || !p.owner) continue;

        const projId = Number(p.id !== undefined ? p.id : i + 1);
        const decoded = decodeMetadata(p.metadataURI);

        loadedProjects.push({
          id: projId,
          owner: p.owner,
          name: p.name,
          projectType: p.projectType,
          location: p.location,
          metadataURI: p.metadataURI,
          estimatedCO2: Number(p.estimatedCO2),
          status: Number(p.status),
          statusName: PROJECT_STATUS[Number(p.status)] || "Pending",
          reviewedBy: p.reviewedBy,
          reviewNote: p.reviewNote,
          submittedAt: Number(p.submittedAt),
          reviewedAt: Number(p.reviewedAt),
          tokenId: Number(p.tokenId),
          ...decoded,
        });
      }

      // Sort newest first
      loadedProjects.sort((a, b) => b.id - a.id);
      setProjects(loadedProjects);
    } catch (err) {
      console.error("Error fetching projects from contract:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}
