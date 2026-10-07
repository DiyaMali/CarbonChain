import React from "react";

/**
 * EcoIcon - Green & White Circular Eco Icon System
 * Exactly based on the user-provided green badge icon sheet:
 * - Solid forest green circular badge (#1F5C3F / #1F4D3A)
 * - Crisp white silhouette vector graphic in center
 * - Scalable vector paths with viewBox 0 0 100 100
 */

const ICONS = {
  // 1. User / Profile (Row 1, Col 1)
  user: (
    <g>
      <circle cx="50" cy="35" r="14" />
      <path d="M26 76 C26 58, 36 52, 50 52 C64 52, 74 58, 74 76 Z" />
    </g>
  ),

  // 2. Sprout / Seedling / Agroforestry (Row 1, Col 2)
  sprout: (
    <g>
      <path d="M50 78 V48" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M50 48 C50 32, 40 22, 28 22 C28 36, 36 46, 50 48 Z" />
      <path d="M50 48 C50 32, 60 22, 72 22 C72 36, 64 46, 50 48 Z" />
      <path d="M50 38 C50 22, 50 16, 50 16 C50 16, 50 22, 50 38 Z" />
      <path d="M50 34 C44 26, 46 16, 50 14 C54 16, 56 26, 50 34 Z" />
    </g>
  ),

  // 3. Growth Chart / Analytics / Impact (Row 1, Col 3)
  chart: (
    <g>
      {/* Bars */}
      <rect x="22" y="60" width="10" height="18" rx="2" />
      <rect x="36" y="50" width="10" height="28" rx="2" />
      <rect x="50" y="40" width="10" height="38" rx="2" />
      <rect x="64" y="32" width="10" height="46" rx="2" />
      {/* Ascending Trend Line with Arrow */}
      <path
        d="M20 54 L38 42 L52 48 L76 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M66 20 L78 20 L78 32 Z" />
    </g>
  ),

  // 4. Magnifying Glass / Audit / Search (Row 1, Col 4)
  search: (
    <g>
      <circle cx="44" cy="42" r="18" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M58 56 L76 74" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    </g>
  ),

  // 5. Checklist / Audit / Submissions / Queue (Row 1, Col 5)
  checklist: (
    <g>
      <rect x="26" y="24" width="48" height="56" rx="6" fill="none" stroke="currentColor" strokeWidth="5" />
      {/* Clip top */}
      <rect x="40" y="18" width="20" height="10" rx="3" />
      {/* Checkmarks & Lines */}
      <path d="M34 40 L38 44 L44 38" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="50" y1="41" x2="66" y2="41" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M34 52 L38 56 L44 50" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="50" y1="53" x2="66" y2="53" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M34 64 L38 68 L44 62" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="50" y1="65" x2="66" y2="65" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),

  // 6. Wind Turbines / Wind Energy (Row 2, Col 1)
  wind: (
    <g>
      {/* Primary large turbine */}
      <path d="M58 78 L60 40 L64 40 L66 78 Z" />
      <circle cx="62" cy="40" r="3.5" />
      <path d="M62 40 L62 16 C63.5 24, 63.5 32, 62 40 Z" />
      <path d="M62 40 L41 52 C48 50, 55 46, 62 40 Z" />
      <path d="M62 40 L83 52 C76 50, 69 46, 62 40 Z" />
      {/* Secondary smaller turbine */}
      <path d="M34 78 L35.5 54 L38.5 54 L40 78 Z" />
      <circle cx="37" cy="54" r="2.5" />
      <path d="M37 54 L37 36 C38 42, 38 48, 37 54 Z" />
      <path d="M37 54 L21 63 C26 61, 31 58, 37 54 Z" />
      <path d="M37 54 L53 63 C48 61, 43 58, 37 54 Z" />
    </g>
  ),

  // 7. Industrial / Cooling Towers / Thermal (Row 2, Col 2)
  industry: (
    <g>
      {/* Left cooling tower */}
      <path d="M26 76 L32 44 L44 44 L48 76 Z" />
      {/* Right cooling tower */}
      <path d="M48 76 L52 50 L62 50 L65 76 Z" />
      {/* Third stack */}
      <path d="M65 76 L68 56 L76 56 L78 76 Z" />
      {/* Steam curves */}
      <path d="M35 38 Q33 32, 37 26" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M41 38 Q39 30, 43 22" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M55 44 Q53 36, 57 28" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  ),

  // 8. Battery / Energy Storage / EV (Row 2, Col 3)
  battery: (
    <g>
      {/* Terminal */}
      <rect x="42" y="20" width="16" height="6" rx="2" />
      {/* Body */}
      <rect x="32" y="26" width="36" height="52" rx="6" fill="none" stroke="currentColor" strokeWidth="5" />
      {/* Lightning bolt inside */}
      <path d="M52 36 L44 50 L50 50 L48 66 L58 48 L52 48 Z" />
    </g>
  ),

  // 9. O2 / Carbon Offsets (Row 2, Col 4)
  o2: (
    <g>
      {/* Circular Arrows */}
      <path
        d="M50 18 A32 32 0 1 1 20 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M24 72 L18 58 L32 60 Z" />
      {/* Text O2 */}
      <text
        x="44"
        y="58"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="26"
        fill="currentColor"
        textAnchor="middle"
      >
        O
      </text>
      <text
        x="62"
        y="66"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="16"
        fill="currentColor"
        textAnchor="middle"
      >
        2
      </text>
    </g>
  ),

  // 10. H2 / Clean Hydrogen (Row 2, Col 5)
  h2: (
    <g>
      {/* Circular Arrows */}
      <path
        d="M50 18 A32 32 0 1 1 20 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M24 72 L18 58 L32 60 Z" />
      {/* Text H2 */}
      <text
        x="44"
        y="58"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="24"
        fill="currentColor"
        textAnchor="middle"
      >
        H
      </text>
      <text
        x="62"
        y="66"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="16"
        fill="currentColor"
        textAnchor="middle"
      >
        2
      </text>
    </g>
  ),

  // 11. Globe / Earth / Registry (Row 3, Col 1)
  globe: (
    <g fill="none" stroke="currentColor" strokeWidth="5">
      <circle cx="50" cy="50" r="28" />
      <line x1="22" y1="50" x2="78" y2="50" />
      <line x1="50" y1="22" x2="50" y2="78" />
      <ellipse cx="50" cy="50" rx="14" ry="28" />
      <path d="M26 36 Q50 42 74 36" />
      <path d="M26 64 Q50 58 74 64" />
    </g>
  ),

  // 12. Twin Leaves / Afforestation (Row 3, Col 2)
  leaves: (
    <g>
      {/* Left Leaf */}
      <path d="M48 68 C34 66, 24 54, 24 38 C38 38, 50 48, 50 68 Z" />
      {/* Right Leaf */}
      <path d="M50 68 C50 46, 62 34, 76 34 C76 50, 66 66, 48 68 Z" />
      {/* Stem */}
      <path d="M48 68 Q50 76 52 80" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
    </g>
  ),

  // 13. Shield with Check / Verify / Compliance (Row 3, Col 3)
  shieldCheck: (
    <g>
      <path
        d="M50 20 L74 30 C74 54, 62 70, 50 78 C38 70, 26 54, 26 30 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M38 48 L46 56 L62 38"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  ),

  // 14. Community / Organisation / Stakeholders (Row 3, Col 4)
  team: (
    <g>
      {/* Center user */}
      <circle cx="50" cy="36" r="10" />
      <path d="M34 68 C34 54, 42 50, 50 50 C58 50, 66 54, 66 68 Z" />
      {/* Left user */}
      <circle cx="30" cy="42" r="8" />
      <path d="M18 70 C18 60, 24 56, 30 56 C34 56, 38 58, 40 62 L32 70 Z" />
      {/* Right user */}
      <circle cx="70" cy="42" r="8" />
      <path d="M82 70 C82 60, 76 56, 70 56 C66 56, 62 58, 60 62 L68 70 Z" />
    </g>
  ),

  // 15. Heart / Environmental Impact (Row 3, Col 5)
  heart: (
    <g>
      <path d="M50 76 L44 70 C24 50, 18 38, 26 26 C32 18, 42 20, 50 28 C58 20, 68 18, 74 26 C82 38, 76 50, 56 70 Z" />
    </g>
  ),

  // 16. Factory / Facility / Manufacturing (Row 4, Col 1)
  factory: (
    <g>
      <path d="M24 76 L24 44 L38 54 L38 44 L52 54 L52 38 L68 38 L68 76 Z" />
      {/* Chimney */}
      <rect x="66" y="26" width="10" height="50" />
      {/* Windows */}
      <rect x="30" y="62" width="6" height="8" fill="#1F5C3F" />
      <rect x="42" y="62" width="6" height="8" fill="#1F5C3F" />
      <rect x="54" y="62" width="6" height="8" fill="#1F5C3F" />
    </g>
  ),

  // 17. Eco House / Sustainable Buildings (Row 4, Col 2)
  ecoHouse: (
    <g>
      <path d="M50 20 L24 42 L30 42 L30 76 L70 76 L70 42 L76 42 Z" />
      {/* Door */}
      <rect x="44" y="56" width="12" height="20" fill="#1F5C3F" rx="2" />
      {/* Window */}
      <rect x="34" y="46" width="8" height="8" fill="#1F5C3F" rx="1" />
      <rect x="58" y="46" width="8" height="8" fill="#1F5C3F" rx="1" />
    </g>
  ),

  // 18. House / Hub (Row 4, Col 3)
  home: (
    <g>
      <path
        d="M50 22 L22 46 L28 46 L28 76 L42 76 L42 56 L58 56 L58 76 L72 76 L72 46 L78 46 Z"
      />
    </g>
  ),

  // 19. Sun / Clean Radiant Power (Row 4, Col 4)
  sun: (
    <g>
      <circle cx="50" cy="50" r="14" />
      {/* Radiating Rays */}
      <line x1="50" y1="18" x2="50" y2="28" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="72" x2="50" y2="82" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="18" y1="50" x2="28" y2="50" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="72" y1="50" x2="82" y2="50" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="27" y1="27" x2="35" y2="35" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="65" y1="65" x2="73" y2="73" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="27" y1="73" x2="35" y2="65" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="65" y1="35" x2="73" y2="27" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </g>
  ),

  // 20. Solar Array / PV Panel with Sun (Row 4, Col 5)
  solar: (
    <g>
      {/* Sun top left */}
      <circle cx="30" cy="28" r="6" />
      <path d="M30 14 L30 18 M30 38 L30 42 M16 28 L20 28 M40 28 L44 28 M20 18 L23 21 M37 35 L40 38 M20 38 L23 35 M37 21 L40 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Tilted Solar Grid */}
      <polygon points="32,48 76,48 84,72 24,72" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
      {/* Internal Grid Lines */}
      <line x1="46" y1="48" x2="42" y2="72" stroke="currentColor" strokeWidth="3" />
      <line x1="62" y1="48" x2="64" y2="72" stroke="currentColor" strokeWidth="3" />
      <line x1="28" y1="60" x2="80" y2="60" stroke="currentColor" strokeWidth="3" />
      {/* Mount post */}
      <line x1="53" y1="72" x2="53" y2="80" stroke="currentColor" strokeWidth="5" />
    </g>
  ),

  // 21. Electricity / Clean Grid / Power (Row 5, Col 1)
  power: (
    <g>
      <polygon points="56,18 28,52 48,52 42,82 72,46 52,46" />
    </g>
  ),

  // 22. Single Leaf / Carbon Units (Row 5, Col 2)
  leaf: (
    <g>
      <path d="M74 24 C50 24, 26 40, 26 68 C54 68, 74 54, 74 24 Z" />
      {/* Center vein */}
      <path d="M26 68 Q50 48 72 26" fill="none" stroke="#1F5C3F" strokeWidth="3.5" strokeLinecap="round" />
      {/* Stem */}
      <path d="M26 68 Q24 74 22 78" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),

  // 23. Currency / Dollar / Tokenize (Row 5, Col 3)
  currency: (
    <g>
      <text
        x="50"
        y="72"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="54"
        fill="currentColor"
        textAnchor="middle"
      >
        $
      </text>
    </g>
  ),

  // 24. Hand Holding Currency / Trading / Marketplace (Row 5, Col 4)
  trade: (
    <g>
      {/* Currency sign floating */}
      <text
        x="50"
        y="42"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="30"
        fill="currentColor"
        textAnchor="middle"
      >
        $
      </text>
      {/* Open Hand */}
      <path
        d="M26 62 L40 62 L50 68 L74 68 C76 68, 78 66, 76 64 L68 56 L54 56 C50 56, 48 58, 44 58 L26 58 Z"
      />
    </g>
  ),

  // 25. Lightbulb / Innovation / Efficiency (Row 5, Col 5)
  lightbulb: (
    <g>
      {/* Bulb body */}
      <path d="M50 22 C38 22, 32 32, 32 42 C32 50, 38 56, 40 62 L60 62 C62 56, 68 50, 68 42 C68 32, 62 22, 50 22 Z" />
      {/* Base screw */}
      <rect x="42" y="66" width="16" height="4" rx="1" />
      <rect x="44" y="72" width="12" height="4" rx="1" />
      {/* Glow rays */}
      <line x1="50" y1="12" x2="50" y2="17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="22" y1="24" x2="26" y2="28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="78" y1="24" x2="74" y2="28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="16" y1="42" x2="21" y2="42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="84" y1="42" x2="79" y2="42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),

  // Lock / Irreversible Retirement (Badge match)
  lock: (
    <g>
      <rect x="30" y="44" width="40" height="34" rx="6" />
      <path d="M38 44 V34 C38 26, 62 26, 62 34 V44" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="58" r="4" fill="#1F5C3F" />
      <path d="M50 62 V68" stroke="#1F5C3F" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
};

const SIZES = {
  xs: "w-4 h-4",
  sm: "w-6 h-6",
  md: "w-9 h-9",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

export default function EcoIcon({
  name = "leaf",
  size = "md",
  className = "",
  withCircle = true,
  circleColor = "#1F5C3F", // rich forest green from the icon reference
  iconColor = "#FFFFFF",
  title,
}) {
  const iconKey = (name || "leaf").toLowerCase().trim();
  const glyph = ICONS[iconKey] || ICONS.leaf;
  const sizeClass = SIZES[size] || (typeof size === "string" ? size : "w-8 h-8");

  if (!withCircle) {
    return (
      <svg
        viewBox="0 0 100 100"
        className={`${sizeClass} ${className} flex-shrink-0 inline-block`}
        fill={iconColor}
        stroke={iconColor}
        aria-label={title || name}
      >
        {glyph}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${sizeClass} ${className} flex-shrink-0 inline-block drop-shadow-xs transition-transform hover:scale-105`}
      aria-label={title || name}
    >
      {/* Green circular badge base */}
      <circle cx="50" cy="50" r="47" fill={circleColor} />
      {/* Inner white silhouette icon */}
      <g fill={iconColor} stroke={iconColor}>
        {glyph}
      </g>
    </svg>
  );
}
