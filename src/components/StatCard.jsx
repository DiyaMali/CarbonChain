import React from "react";
import { STAT_CARD_THEMES } from "../styles/tokens";

/**
 * Reusable StatCard component:
 * 3px top border in meaning colour (credits green, pending amber, rejected red, money teal, blocks slate)
 * and a tinted icon tile. Plain hex values only.
 */
export default function StatCard({
  type = "credits", // credits | pending | rejected | money | blocks
  theme: themeProp,
  title,
  label,
  value,
  unit,
  subtext,
  icon,
  className = "",
  onClick,
}) {
  const chosenThemeKey = themeProp || type || "credits";
  const theme = STAT_CARD_THEMES[chosenThemeKey] || STAT_CARD_THEMES.credits;
  const displayTitle = title || label;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === "function" || (typeof icon === "object" && icon !== null && (icon.render || icon.$$typeof))) {
      const IconComponent = icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <div
      onClick={onClick}
      className={`hover-card p-5 rounded-[8px] flex flex-col justify-between shadow-xs ${
        onClick ? "hover-card-clickable cursor-pointer" : ""
      } ${className}`}
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E3E8E5",
        borderTop: `3px solid ${theme.topBorder}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className="text-xs font-semibold uppercase tracking-wider truncate"
          style={{ color: "#5B6B63" }}
        >
          {displayTitle}
        </span>
        {icon && (
          <div
            className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0"
            style={{
              backgroundColor: theme.iconBg,
              color: theme.iconColor,
            }}
          >
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className="text-2xl font-bold font-mono tracking-tight"
          style={{ color: "#14201A" }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium" style={{ color: "#5B6B63" }}>
            {unit}
          </span>
        )}
      </div>

      {subtext && (
        <div
          className="mt-3 pt-2 text-[11px] truncate"
          style={{
            borderTop: "1px solid #E3E8E5",
            color: "#5B6B63",
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}
