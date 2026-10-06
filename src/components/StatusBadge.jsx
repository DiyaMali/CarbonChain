import React from "react";

export default function StatusBadge({ status, className = "" }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  let badgeStyle = "badge-pending";
  let label = status;

  if (normalized === "0" || normalized === "pending") {
    badgeStyle = "badge-pending";
    label = "Pending";
  } else if (normalized === "1" || normalized === "approved") {
    badgeStyle = "badge-approved";
    label = "Approved";
  } else if (normalized === "2" || normalized === "rejected") {
    badgeStyle = "badge-rejected";
    label = "Rejected";
  } else if (normalized === "listed") {
    badgeStyle = "badge-listed";
    label = "Listed";
  } else if (normalized === "retired") {
    badgeStyle = "badge-retired";
    label = "Retired";
  } else if (normalized === "owned") {
    badgeStyle = "badge-approved";
    label = "Owned";
  }

  return (
    <span className={`${badgeStyle} ${className}`}>
      {label}
    </span>
  );
}
