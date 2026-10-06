import React from "react";

/**
 * StatusBadge per spec §1:
 * Pending amber, Listed or Approved green, Sold blue, Retired gray, Completed gray,
 * Rejected red, Requested amber, Cancelled gray.
 */
export default function StatusBadge({ status, className = "" }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase().trim().replace(/_/g, " ");

  let badgeStyle = "badge-pending";
  let label = status;

  if (normalized === "0" || normalized === "pending" || normalized === "under review" || normalized === "sent back for review") {
    badgeStyle = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200";
    label = status === "0" ? "Pending" : status;
  } else if (normalized === "1" || normalized === "approved" || normalized === "approved listed" || normalized === "listed") {
    badgeStyle = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200";
    label = status === "1" ? "Approved" : status;
  } else if (normalized === "sold" || normalized === "sold out" || normalized === "active listing") {
    badgeStyle = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200";
    label = status;
  } else if (normalized === "retired") {
    badgeStyle = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200";
    label = "Retired";
  } else if (normalized === "completed" || normalized === "concluded") {
    badgeStyle = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200";
    label = "Completed";
  } else if (normalized === "2" || normalized === "rejected") {
    badgeStyle = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-800 border border-red-200";
    label = status === "2" ? "Rejected" : "Rejected";
  } else if (normalized === "requested") {
    badgeStyle = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200";
    label = "Requested";
  } else if (normalized === "cancelled") {
    badgeStyle = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200";
    label = "Cancelled";
  } else if (normalized === "owned") {
    badgeStyle = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200";
    label = "Owned";
  }

  return (
    <span className={`${badgeStyle} ${className}`}>
      {label}
    </span>
  );
}
