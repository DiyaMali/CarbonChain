import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { routeGuard, isVerifierUser, canSell, canBuy } from "../services/roleService";

/**
 * Wraps a page and enforces the access matrix per spec §3.2.
 * On violation it redirects with a ?blocked=true query param so the
 * dashboard can show an inline message.
 */
export default function RouteGuard({ children, requireSell, requireBuy, requireVerifier }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (requireVerifier && !isVerifierUser(user)) {
      navigate("/dashboard?blocked=verifier", { replace: true });
      return;
    }
    if (requireVerifier && isVerifierUser(user)) return; // verifier OK

    if (isVerifierUser(user)) {
      // Verifiers can only access verifier routes
      if (requireSell || requireBuy) {
        navigate("/verifier/queue?blocked=role", { replace: true });
      }
      return;
    }

    if (requireSell && !canSell(user)) {
      navigate("/dashboard?blocked=sell", { replace: true });
      return;
    }
    if (requireBuy && !canBuy(user)) {
      navigate("/dashboard?blocked=buy", { replace: true });
      return;
    }
  }, [user, loading, requireSell, requireBuy, requireVerifier, navigate, location]);

  if (loading) return null;
  if (!user) return null;

  // Enforce inline before rendering
  if (requireVerifier && !isVerifierUser(user)) return null;
  if (!requireVerifier && isVerifierUser(user) && (requireSell || requireBuy)) return null;
  if (requireSell && !canSell(user)) return null;
  if (requireBuy && !canBuy(user)) return null;

  return children;
}
