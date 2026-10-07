import React from "react";
import EcoIcon from "./EcoIcon";

const TYPE_CONFIG = {
  Agroforestry: { ecoIcon: "sprout", label: "Agroforestry" },
  Afforestation: { ecoIcon: "leaves", label: "Afforestation" },
  Solar: { ecoIcon: "solar", label: "Solar Energy" },
  Wind: { ecoIcon: "wind", label: "Wind Energy" },
  Transport: { ecoIcon: "battery", label: "Transport" },
  Waste: { ecoIcon: "o2", label: "Waste" },
  Biomass: { ecoIcon: "sprout", label: "Biomass" },
  Hydro: { ecoIcon: "power", label: "Hydro" },
  Industrial: { ecoIcon: "industry", label: "Industrial" },
  Other: { ecoIcon: "leaf", label: "Other" },
};

export default function ProjectTypeIcon({ type, size = "md", showLabel = false, imageUrl = "" }) {
  const [imgError, setImgError] = React.useState(false);
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.Other;

  const iconSizes = { sm: "w-6 h-6", md: "w-9 h-9", lg: "w-14 h-14" };
  const wrapSizes = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-16 h-16" };

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className={`${wrapSizes[size]} flex items-center justify-center overflow-hidden flex-shrink-0`}>
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={type || "Project"}
            className="w-full h-full object-cover rounded"
            onError={() => setImgError(true)}
          />
        ) : (
          <EcoIcon name={cfg.ecoIcon} size={size} className={iconSizes[size]} />
        )}
      </div>
      {showLabel && (
        <span className="text-[10px] font-medium text-charcoal-muted">{cfg.label}</span>
      )}
    </div>
  );
}
