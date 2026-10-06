import React from "react";
import { Trees, Sun, Wind, Train, Trash2, Leaf, Factory } from "lucide-react";

const TYPE_CONFIG = {
  Agroforestry: { icon: Trees, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Agroforestry" },
  Afforestation: { icon: Leaf, color: "text-green-700", bg: "bg-green-50", border: "border-green-200", label: "Afforestation" },
  Solar: { icon: Sun, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Solar Energy" },
  Wind: { icon: Wind, color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", label: "Wind Energy" },
  Transport: { icon: Train, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", label: "Transport" },
  Waste: { icon: Trash2, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", label: "Waste" },
  Other: { icon: Factory, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", label: "Other" },
};

export default function ProjectTypeIcon({ type, size = "md", showLabel = false, imageUrl = "" }) {
  const [imgError, setImgError] = React.useState(false);
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.Other;
  const Icon = cfg.icon;

  const iconSizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  const wrapSizes = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-16 h-16" };

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className={`${wrapSizes[size]} rounded border ${cfg.border} ${cfg.bg} flex items-center justify-center overflow-hidden flex-shrink-0`}>
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={type || "Project"}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Icon className={`${iconSizes[size]} ${cfg.color}`} />
        )}
      </div>
      {showLabel && (
        <span className="text-[10px] font-medium text-charcoal-muted">{cfg.label}</span>
      )}
    </div>
  );
}
