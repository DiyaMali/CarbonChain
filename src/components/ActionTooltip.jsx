import React, { useState, useRef } from "react";

/**
 * Reusable ActionTooltip wrapper for icon-only controls.
 * Adds aria-label and accessible tooltip label on hover/focus.
 */
export default function ActionTooltip({
  label,
  children,
  position = "bottom", // "top" | "bottom" | "left" | "right"
  className = "",
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  const show = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    let top = r.bottom + 6;
    let left = r.left + r.width / 2;

    if (position === "top") {
      top = r.top - 6;
    } else if (position === "left") {
      top = r.top + r.height / 2;
      left = r.left - 6;
    } else if (position === "right") {
      top = r.top + r.height / 2;
      left = r.right + 6;
    }

    setCoords({ top, left });
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
  };

  return (
    <span
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            "aria-label": children.props["aria-label"] || label,
          })
        : children}

      {visible && (
        <span
          role="tooltip"
          className="fixed z-50 text-[11px] font-medium leading-none px-2 py-1 rounded shadow-md pointer-events-none transition-opacity duration-150 whitespace-nowrap"
          style={{
            backgroundColor: "#14452F",
            color: "#FFFFFF",
            border: "1px solid #2F7A57",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform:
              position === "top"
                ? "translate(-50%, -100%)"
                : position === "left"
                ? "translate(-100%, -50%)"
                : position === "right"
                ? "translate(0, -50%)"
                : "translate(-50%, 0)",
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
