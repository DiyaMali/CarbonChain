import React from "react";
import { STATUS_COLORS } from "../styles/tokens";
import TermTooltip from "./TermTooltip";

/**
 * Unified StatusBadge component per specification:
 * Listed: #E6F4EC / #14452F
 * Pending: #FFF4D6 / #8A5A00
 * Rejected: #FDECEC / #A12A2A
 * Sold out: #EDEFEE / #4A5550
 * Concluded: #E8EDF3 / #1F3A5F
 */
export default function StatusBadge({ status, className = "" }) {
  if (!status) return null;

  const raw = String(status).trim();
  const lower = raw.toLowerCase().replace(/_/g, " ");

  let colors = STATUS_COLORS.Listed;
  let label = raw;

  if (
    lower === "0" ||
    lower === "pending" ||
    lower === "under review" ||
    lower === "sent back for review" ||
    lower === "requested" ||
    lower === "acva review"
  ) {
    colors = STATUS_COLORS.Pending;
    label = lower === "0" ? "Pending" : raw;
  } else if (
    lower === "1" ||
    lower === "approved" ||
    lower === "listed" ||
    lower === "active" ||
    lower === "verified" ||
    lower === "owned"
  ) {
    colors = STATUS_COLORS.Listed;
    label = lower === "1" ? "Listed" : raw;
  } else if (
    lower === "2" ||
    lower === "rejected" ||
    lower === "declined"
  ) {
    colors = STATUS_COLORS.Rejected;
    label = "Rejected";
  } else if (
    lower === "sold out" ||
    lower === "sold" ||
    lower === "cancelled"
  ) {
    colors = STATUS_COLORS["Sold out"];
    label = "Sold out";
  } else if (
    lower === "concluded" ||
    lower === "completed" ||
    lower === "retired"
  ) {
    colors = STATUS_COLORS.Concluded;
    label = lower === "retired" ? "Retired" : lower === "completed" ? "Completed" : "Concluded";
  }

  return (
    <TermTooltip term={label} className={className}>
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.text}25`,
        }}
      >
        {label}
      </span>
    </TermTooltip>
  );
}
