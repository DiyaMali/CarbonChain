import React, { useState, useRef, useEffect } from "react";

// Curated definitions strictly under 20 words with plain text, no em dashes, no emoji
export const TERM_DEFINITIONS = {
  tco2e: "Metric tonne of carbon dioxide equivalent emissions averted or sequestered.",
  "tco₂e": "Metric tonne of carbon dioxide equivalent emissions averted or sequestered.",
  acva: "Accredited Carbon Verification Agency validating emissions calculations and methodology.",
  ccc: "Carbon Credit Certificate proving permanent and audited unit retirement.",
  pdd: "Project Design Document specifying baseline calculations and operational parameters.",
  cri: "Carbon Registry India regulatory standard for voluntary carbon markets.",
  mcu: "Marketable Carbon Unit representing one certified tonne of carbon reduction.",
  ipp: "Independent Project Proponent developing and registering carbon reduction projects.",
  vvb: "Validation and Verification Body executing third party methodological audits.",
  to: "Transactional Organisation purchasing verified credits for compliance or ESG goals.",
  listed: "Credits verified and actively tradable on the open registry marketplace.",
  pending: "Documentation undergoing independent audit by an accredited verification body.",
  "acva review": "Auditor reviewing project baseline calculations before credits can be issued.",
  rejected: "Audit returned with non compliance findings requiring proponent revisions.",
  "sold out": "All verified credits issued for this project batch were procured.",
  concluded: "All credits from this project batch were retired and permanently locked.",
  retired: "Credit serial numbers permanently burned to offset verified organizational emissions.",
  solar: "Grid connected photovoltaic installation displacing fossil generation.",
  wind: "High efficiency coastal wind installation generating renewable energy.",
  agroforestry: "Multi strata agroforestry and shelterbelt plantation sequestering biological carbon.",
  waste: "Anaerobic digestion biogas station capturing methane emissions from organic waste.",
};

/**
 * Reusable TermTooltip component:
 * - Appears after 300ms delay on hover or focus.
 * - Plain language definition under 20 words.
 * - Positioned safely inside the viewport so it never clips.
 * - Works seamlessly on hover, keyboard focus, and touch taps.
 */
export default function TermTooltip({
  term,
  text,
  definition: propsDefinition,
  children,
  className = "",
  inline = true,
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, align: "center" });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  const key = (term || "").toLowerCase().trim();
  const definition = propsDefinition || text || TERM_DEFINITIONS[key] || "CarbonChain verified regulatory registry term.";

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Position above by default; flip below if near top
        const showBelow = rect.top < 60;
        const top = showBelow ? rect.bottom + 6 : rect.top - 6;

        // Clamp horizontal center so tooltip never clips at left or right edges
        let left = rect.left + rect.width / 2;
        let align = "center";
        if (left < 130) {
          left = Math.max(12, rect.left);
          align = "left";
        } else if (left > viewportWidth - 130) {
          left = Math.min(viewportWidth - 12, rect.right);
          align = "right";
        }

        setCoords({ top, left, align, showBelow });
        setVisible(true);
      }
    }, 300);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onClick={() => setVisible((prev) => !prev)}
      tabIndex={0}
      className={`relative cursor-help ${inline ? "inline-flex items-center" : "inline-block"} ${className}`}
      aria-label={`${children?.toString() || term}: ${definition}`}
    >
      {children}

      {visible && (
        <span
          role="tooltip"
          className="fixed z-50 text-[11px] leading-snug p-2.5 rounded-[6px] shadow-lg pointer-events-none transition-opacity duration-150 max-w-[220px]"
          style={{
            backgroundColor: "#14452F",
            color: "#FFFFFF",
            border: "1px solid #2F7A57",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform:
              coords.align === "left"
                ? coords.showBelow
                  ? "translateY(0)"
                  : "translateY(-100%)"
                : coords.align === "right"
                ? coords.showBelow
                  ? "translate(-100%, 0)"
                  : "translate(-100%, -100%)"
                : coords.showBelow
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
          }}
        >
          {definition}
        </span>
      )}
    </span>
  );
}
