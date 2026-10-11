import React, { useState } from "react";
import { Sun, Wind, Trees, Recycle } from "lucide-react";
import { resolveProjectImage } from "../services/ledgerService";

/**
 * Shared ProjectThumbnail component:
 * - Fixed 96x96 rounded tile on list pages (object-fit: cover)
 * - Error handler that swaps in a sector icon tile (solar, wind, tree, recycle)
 *   tinted with the status colour so broken alt text is never shown
 * - loading="lazy" and meaningful alt text ("<Project Name> ground photo")
 * - Supports ground photos uploaded by sellers (first photo used)
 * - Supports detail page captions ("Sample photo for prototype")
 * - Plain hex values only, no em dashes
 */
export default function ProjectThumbnail({
  project,
  src,
  alt,
  name,
  projectType,
  status,
  variant = "list", // "list" (96x96) | "detail" | "card" | "custom"
  className = "",
  caption, // string or boolean. If true, defaults to "Sample photo for prototype"
}) {
  const [hasError, setHasError] = useState(false);

  const displayName = name || project?.name || "Project";
  const meaningfulAlt = alt || `${displayName} ground photo`;

  // 1. Resolve image source
  let resolvedSrc = src;
  if (!resolvedSrc) {
    if (project?.photos && Array.isArray(project.photos) && project.photos.length > 0) {
      const first = project.photos[0];
      resolvedSrc = first?.url || first?.dataUrl || first?.imageUrl;
    }
  }
  if (!resolvedSrc) {
    resolvedSrc = project?.imageUrl || project?.image || resolveProjectImage(project);
  }

  // 2. Resolve sector icon and label
  const typeStr = (
    projectType ||
    project?.projectType ||
    project?.category ||
    project?.type ||
    displayName ||
    ""
  ).toLowerCase();

  let SectorIcon = Sun;
  let sectorLabel = "Solar";

  if (typeStr.includes("wind")) {
    SectorIcon = Wind;
    sectorLabel = "Wind";
  } else if (
    typeStr.includes("agro") ||
    typeStr.includes("forest") ||
    typeStr.includes("tree") ||
    typeStr.includes("mangrove") ||
    typeStr.includes("afforestation")
  ) {
    SectorIcon = Trees;
    sectorLabel = "Forestry";
  } else if (
    typeStr.includes("biogas") ||
    typeStr.includes("waste") ||
    typeStr.includes("recycle") ||
    typeStr.includes("methane") ||
    typeStr.includes("transport")
  ) {
    SectorIcon = Recycle;
    sectorLabel = "Recycle";
  }

  // 3. Resolve status tint colors (plain hex values from tokens)
  const statusStr = (
    status ||
    project?.status ||
    project?.criStatus ||
    project?.stage ||
    "Listed"
  ).toLowerCase();

  let tileBg = "#E6F4EC";
  let tileColor = "#14452F";
  let tileBorder = "#C3E7D3";

  if (statusStr.includes("pend") || statusStr.includes("review")) {
    tileBg = "#FFF4D6";
    tileColor = "#8A5A00";
    tileBorder = "#FFE699";
  } else if (statusStr.includes("reject")) {
    tileBg = "#FDECEC";
    tileColor = "#A12A2A";
    tileBorder = "#F8C8C8";
  } else if (statusStr.includes("sold")) {
    tileBg = "#EDEFEE";
    tileColor = "#4A5550";
    tileBorder = "#DCDFE0";
  } else if (statusStr.includes("conclude")) {
    tileBg = "#E8EDF3";
    tileColor = "#1F3A5F";
    tileBorder = "#CBD5E1";
  }

  const isDetail = variant === "detail";
  const isCard = variant === "card";

  // Base sizing container classes
  let containerClasses = "";
  if (variant === "list") {
    containerClasses = "w-24 h-24 min-w-[96px] min-h-[96px] max-w-[96px] max-h-[96px] rounded-[8px]";
  } else if (isDetail) {
    containerClasses = "w-full rounded-[8px]";
  } else if (isCard) {
    containerClasses = "w-full h-full";
  }

  const effectiveCaption =
    caption === true ? "Sample photo for prototype" : typeof caption === "string" ? caption : null;

  return (
    <div className={`flex flex-col ${isDetail ? "w-full" : "shrink-0"}`}>
      <div
        className={`relative overflow-hidden border border-[#E3E8E5] bg-[#FFFFFF] ${containerClasses} ${className}`}
      >
        {hasError || !resolvedSrc ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center text-center p-2 transition-colors select-none"
            style={{
              backgroundColor: tileBg,
              color: tileColor,
              borderColor: tileBorder,
            }}
            title={`${displayName} (${sectorLabel})`}
          >
            <SectorIcon className={isDetail ? "w-10 h-10 mb-1" : "w-6 h-6 mb-0.5"} />
            <span className="text-[10px] font-semibold uppercase tracking-wider truncate max-w-full">
              {sectorLabel}
            </span>
          </div>
        ) : (
          <img
            src={resolvedSrc}
            alt={meaningfulAlt}
            loading="lazy"
            onError={() => setHasError(true)}
            className="w-full h-full object-cover project-thumbnail-img transition-transform duration-200 ease-out"
          />
        )}
      </div>

      {effectiveCaption && (
        <p className="text-[11px] text-[#5B6B63] mt-1.5 text-center font-normal">
          {effectiveCaption}
        </p>
      )}
    </div>
  );
}
