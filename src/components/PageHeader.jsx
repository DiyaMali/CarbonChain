import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleAccent } from "../styles/tokens";

/**
 * Reusable PageHeader component per design specification:
 * Coloured header band in current role accent holding eyebrow label, title, subtitle,
 * and main action as an outlined white button.
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  role,
  children,
  className = "",
}) {
  const { user } = useAuth();
  const accent = role ? getRoleAccent(role) : getRoleAccent(user);

  return (
    <div
      className={`w-full px-6 py-6 md:px-8 md:py-7 text-white shadow-xs ${className}`}
      style={{ backgroundColor: accent, borderBottom: "1px solid rgba(0,0,0,0.08)" }}
    >
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          {eyebrow && (
            <div
              className="text-[11px] font-mono uppercase tracking-wider font-semibold opacity-90"
              style={{ color: "#BFE8D0" }}
            >
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-white/80 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side action or extra controls */}
        {(action || children) && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {children}
            {action && (
              action.to ? (
                <Link
                  to={action.to}
                  onClick={action.onClick}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold text-white transition-colors cursor-pointer"
                  style={{
                    border: "1px solid #FFFFFF",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {action.icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{action.icon}</span>}
                  <span>{action.label}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-60"
                  style={{
                    border: "1px solid #FFFFFF",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!action.disabled) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {action.icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
