import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";

export default function ConnectWallet() {
  const navigate = useNavigate();
  const { openWalletModal } = useWallet();

  useEffect(() => {
    openWalletModal();
    navigate("/dashboard?connect=true", { replace: true });
  }, [navigate, openWalletModal]);

  return null;
}
