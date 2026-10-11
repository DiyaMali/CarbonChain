import React, { useState, useRef, useMemo } from "react";

/**
 * Interactive "Issued vs sold" SVG chart for Seller Dashboard.
 * 
 * Complies with CRI platform specifications:
 * - 6-month dynamic window ending at today's date.
 * - Interactive hover & touch tracking with snapped vertical guide line.
 * - Tooltip flipped near edges so it never clips at 1024px or 1440px.
 * - Legend toggles with min 1 series visible requirement.
 * - Keyboard accessible with arrow key navigation, Escape to clear, and aria-live announcements.
 * - No em dashes in any UI text, no heavy animation.
 */
export default function IssuedVsSoldChart({ totalIssued = 3500, totalSold = 2300 }) {
  const [activeMonthIndex, setActiveMonthIndex] = useState(null);
  const [showIssued, setShowIssued] = useState(true);
  const [showSold, setShowSold] = useState(true);

  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // Dynamic 6 months ending at current month
  const chartMonths = useMemo(() => {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        name: monthNames[d.getMonth()],
        full: d.toLocaleString("en-US", { month: "long" }),
        year: d.getFullYear(),
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        isCurrent: i === 0,
        monthIndex: 5 - i,
      });
    }
    return result;
  }, []);

  // Cumulative series ending at totalIssued and totalSold from ledger
  // Strictly non-decreasing month to month
  const monthlyData = useMemo(() => {
    const ratios = [
      { issuedRatio: 0.1714, soldRatio: 0.1522 },
      { issuedRatio: 0.3857, soldRatio: 0.3478 },
      { issuedRatio: 0.5857, soldRatio: 0.5000 },
      { issuedRatio: 0.7857, soldRatio: 0.7609 },
      { issuedRatio: 0.9143, soldRatio: 0.9130 },
      { issuedRatio: 1.0000, soldRatio: 1.0000 },
    ];

    let prevIssued = 0;
    let prevSold = 0;

    return chartMonths.map((m, idx) => {
      let issued = idx === 5 ? totalIssued : Math.round(totalIssued * ratios[idx].issuedRatio);
      let sold = idx === 5 ? totalSold : Math.round(totalSold * ratios[idx].soldRatio);

      // Enforce non-decreasing constraint
      issued = Math.max(prevIssued, issued);
      sold = Math.max(prevSold, sold);
      // Sold cannot exceed issued
      sold = Math.min(issued, sold);

      prevIssued = issued;
      prevSold = sold;

      const available = Math.max(0, issued - sold);
      const soldThrough = issued > 0 ? ((sold / issued) * 100).toFixed(1) : "0.0";

      return {
        ...m,
        issued,
        sold,
        available,
        soldThrough,
      };
    });
  }, [chartMonths, totalIssued, totalSold]);

  // Max Y scale for chart (at least 4,000 to maintain standard grid spacing)
  const maxY = useMemo(() => {
    return Math.max(4000, Math.ceil(totalIssued / 1000) * 1000);
  }, [totalIssued]);

  // Coordinate helpers (viewBox: 0 0 500 160)
  const getX = (idx) => (idx / 5) * 500;
  const getY = (val) => 160 - (val / maxY) * 160;

  // Path definitions
  const issuedPath = useMemo(() => {
    return monthlyData
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.issued)}`)
      .join(" ");
  }, [monthlyData, maxY]);

  const soldPath = useMemo(() => {
    return monthlyData
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.sold)}`)
      .join(" ");
  }, [monthlyData, maxY]);

  // Pointer event handlers (hover & mobile touch)
  const handlePointerMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const clientX =
      e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    if (clientX === undefined) return;

    const relX = (clientX - rect.left) / rect.width;
    const clampedX = Math.max(0, Math.min(1, relX));
    const nearest = Math.round(clampedX * 5);
    setActiveMonthIndex(nearest);
  };

  const handlePointerLeave = () => {
    setActiveMonthIndex(null);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveMonthIndex((prev) => (prev === null ? 0 : Math.min(5, prev + 1)));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveMonthIndex((prev) => (prev === null ? 5 : Math.max(0, prev - 1)));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveMonthIndex(null);
    }
  };

  // Legend toggles (keep at least one series visible)
  const toggleIssued = () => {
    if (showIssued && !showSold) return;
    setShowIssued((prev) => !prev);
  };

  const toggleSold = () => {
    if (showSold && !showIssued) return;
    setShowSold((prev) => !prev);
  };

  const activeItem = activeMonthIndex !== null ? monthlyData[activeMonthIndex] : null;

  return (
    <div
      className="rounded-[12px] p-5 flex flex-col justify-between shadow-sm"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid #EAE5DC" }}
    >
      {/* Header and Legend */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 leading-tight">
            Issued vs sold
          </h3>
          <p className="text-xs text-stone-500 mt-2">
            Cumulative credit volume (tCO2e) over the past 6 months
          </p>
        </div>

        {/* Clickable Legend Toggles */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={toggleIssued}
            aria-pressed={showIssued}
            className={`flex items-center gap-1.5 transition-opacity select-none ${
              showIssued ? "text-stone-800 opacity-100" : "text-stone-400 opacity-40 line-through"
            } ${showIssued && !showSold ? "cursor-default" : "cursor-pointer"}`}
            title={showIssued && !showSold ? "At least one series must remain visible" : "Toggle Issued line"}
          >
            <span
              className="w-3 h-0.5 inline-block"
              style={{ backgroundColor: "#14452F" }}
            />
            <span>Issued</span>
          </button>

          <button
            type="button"
            onClick={toggleSold}
            aria-pressed={showSold}
            className={`flex items-center gap-1.5 transition-opacity select-none ${
              showSold ? "text-stone-700 opacity-100" : "text-stone-400 opacity-40 line-through"
            } ${showSold && !showIssued ? "cursor-default" : "cursor-pointer"}`}
            title={showSold && !showIssued ? "At least one series must remain visible" : "Toggle Sold line"}
          >
            <span className="w-3 h-0.5 bg-stone-400 inline-block border-t border-dashed" />
            <span>Sold</span>
          </button>
        </div>
      </div>

      {/* Screen Reader Live Region for Keyboard Navigation */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {activeItem ? (
          `${activeItem.label}${activeItem.isCurrent ? " (Current)" : ""}: ${
            showIssued ? `Issued ${activeItem.issued.toLocaleString("en-IN")} tCO2e, ` : ""
          }${
            showSold ? `Sold ${activeItem.sold.toLocaleString("en-IN")} tCO2e, ` : ""
          }Available ${activeItem.available.toLocaleString("en-IN")} tCO2e, Sold-through ${activeItem.soldThrough}%`
        ) : (
          "Cumulative chart unselected. Focus chart and use left or right arrow keys to inspect month."
        )}
      </div>

      {/* Interactive Plot Area */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="region"
        aria-label="Cumulative credits issued and sold by month"
        onKeyDown={handleKeyDown}
        className="relative h-60 w-full flex items-end pt-4 pb-2 focus:outline-none focus:ring-2 focus:ring-[#14452F] focus:ring-offset-2 rounded-lg"
      >
        <svg
          ref={svgRef}
          className="w-full h-48 overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 500 160"
        >
          {/* Horizontal Grid lines */}
          <line stroke="#F2EEE6" strokeWidth="1" x1="0" x2="500" y1="0" y2="0" />
          <line stroke="#F2EEE6" strokeWidth="1" x1="0" x2="500" y1="40" y2="40" />
          <line stroke="#F2EEE6" strokeWidth="1" x1="0" x2="500" y1="80" y2="80" />
          <line stroke="#F2EEE6" strokeWidth="1" x1="0" x2="500" y1="120" y2="120" />
          <line stroke="#EAE5DC" strokeWidth="1" x1="0" x2="500" y1="160" y2="160" />

          {/* Sold Series */}
          {showSold && (
            <>
              <path
                d={soldPath}
                fill="none"
                stroke="#78716C"
                strokeDasharray="4 3"
                strokeWidth="2"
              />
              {monthlyData.map((d, i) => {
                const cx = getX(i);
                const cy = getY(d.sold);
                const isActive = activeMonthIndex === i;
                return (
                  <g key={`sold-dot-${i}`}>
                    {isActive && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="10"
                        fill="none"
                        stroke="#78716C"
                        strokeWidth="2"
                        strokeOpacity="0.25"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      fill="#78716C"
                      r={isActive ? 6 : 3}
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* Issued Series */}
          {showIssued && (
            <>
              <path
                d={issuedPath}
                fill="none"
                stroke="#14452F"
                strokeWidth="2.5"
              />
              {monthlyData.map((d, i) => {
                const cx = getX(i);
                const cy = getY(d.issued);
                const isActive = activeMonthIndex === i;
                return (
                  <g key={`issued-dot-${i}`}>
                    {isActive && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="10"
                        fill="none"
                        stroke="#14452F"
                        strokeWidth="2"
                        strokeOpacity="0.25"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      fill="#14452F"
                      r={isActive ? 6 : 3.5}
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* Snapped thin vertical guide line (only while active) */}
          {activeMonthIndex !== null && (
            <line
              x1={getX(activeMonthIndex)}
              x2={getX(activeMonthIndex)}
              y1="0"
              y2="160"
              stroke="#14452F"
              strokeDasharray="2 2"
              strokeOpacity="0.5"
              strokeWidth="1"
            />
          )}

          {/* Transparent pointer capture overlay rect */}
          <rect
            x="0"
            y="0"
            width="500"
            height="160"
            fill="transparent"
            className="cursor-crosshair"
            onMouseMove={handlePointerMove}
            onMouseLeave={handlePointerLeave}
            onTouchStart={handlePointerMove}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerLeave}
            onTouchCancel={handlePointerLeave}
          />
        </svg>

        {/* Dynamic Tooltip: follows snapped month, flipped near right edge */}
        {activeMonthIndex !== null && activeItem && (
          <div
            className="absolute top-2 p-3 rounded-[8px] shadow-lg text-xs pointer-events-none z-20 min-w-[180px]"
            style={{
              backgroundColor: "#14452F",
              border: "1px solid #2F7A57",
              left: `${(activeMonthIndex / 5) * 100}%`,
              transform:
                activeMonthIndex >= 3
                  ? "translateX(calc(-100% - 12px))"
                  : "translateX(12px)",
            }}
          >
            {/* Tooltip Header */}
            <div
              className="font-semibold text-stone-200 pb-1.5 mb-2 flex items-center justify-between gap-3"
              style={{ borderBottom: "1px solid #2F7A57" }}
            >
              <span>
                {activeItem.label}
                {activeItem.isCurrent ? " (Current)" : ""}
              </span>
            </div>

            {/* Tooltip Content Rows */}
            <div className="space-y-1.5">
              {showIssued && (
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-stone-300">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "#5EE6A8" }}
                    />
                    <span>Issued:</span>
                  </span>
                  <span className="font-bold text-white">
                    {activeItem.issued.toLocaleString("en-IN")} tCO2e
                  </span>
                </div>
              )}

              {showSold && (
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-stone-300">
                    <span className="w-2 h-2 rounded-full bg-stone-400" />
                    <span>Sold:</span>
                  </span>
                  <span className="font-bold text-stone-200">
                    {activeItem.sold.toLocaleString("en-IN")} tCO2e
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <span className="text-stone-300">Available:</span>
                <span className="font-bold text-stone-200">
                  {activeItem.available.toLocaleString("en-IN")} tCO2e
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-stone-300">Sold-through:</span>
                <span className="font-bold text-stone-200">
                  {activeItem.soldThrough}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* X Axis Month Labels (last 6 months ending at current month) */}
      <div
        className="flex justify-between text-xs text-stone-500 pt-2.5 px-1"
        style={{ borderTop: "1px solid #EAE5DC" }}
      >
        {monthlyData.map((m, idx) => {
          const isSelected = activeMonthIndex === idx;
          return (
            <span
              key={idx}
              className={`${m.isCurrent ? "font-bold" : ""} ${isSelected ? "underline" : ""}`}
              style={m.isCurrent || isSelected ? { color: "#14452F" } : {}}
            >
              {m.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
