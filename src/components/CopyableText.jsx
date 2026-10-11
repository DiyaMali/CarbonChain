import React, { useState, useRef } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Reusable CopyableText component for monospace IDs, hashes, and serials.
 * - Fades in on table row hover (.copy-btn-inline).
 * - Always visible on focus-visible and on touch devices.
 * - Shows "Copied" confirmation badge for 1.5 seconds.
 * - Accessible with aria-label and keyboard focus.
 */
export default function CopyableText({
  text,
  displayText,
  label = "identifier",
  className = "",
  inline = true,
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  const rawValue = text !== undefined && text !== null ? String(text) : "";
  const renderedText = displayText || rawValue;

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!rawValue) return;
    navigator.clipboard.writeText(rawValue);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${inline ? "" : "w-full"} ${className}`}>
      <span className="font-mono truncate select-all">{renderedText}</span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
        title={copied ? "Copied" : `Copy ${label}`}
        className="copy-btn-inline relative p-1 rounded hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors shrink-0 cursor-pointer focus:outline-none"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-700" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        {copied && (
          <span
            className="absolute left-1/2 -top-6 -translate-x-1/2 text-[10px] font-sans font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-30"
            style={{
              backgroundColor: "#14452F",
              color: "#FFFFFF",
              border: "1px solid #2F7A57",
            }}
          >
            Copied
          </span>
        )}
      </button>
    </span>
  );
}
