"use client";

import React, { useEffect, useState } from "react";
import { UserPill } from "@privy-io/react-auth/ui";
import { usePrivy } from "@privy-io/react-auth";
import { usePathname } from "next/navigation";

export const ConnectButton = () => {
  const [mounted, setMounted] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const pathname = usePathname();
  const { logout, user, ready } = usePrivy();
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-24 rounded-full border border-[#333] bg-[rgba(31,31,31,0.62)]" />;
  }

  return (
    <div style={{ position: "relative", zIndex: 1000 }}>
      {/* The Privy pill (login when logged out; shows identity when logged in) */}
      <UserPill
        action={{
          type: "login",
          options: {
            loginMethods: ["email", "wallet"],
            walletChainType: "ethereum-only",
          },
        }}
      />
      {/* Intercept clicks only on home and only when logged in, to open our simple modal */}
      {ready && user && pathname === "/" && (
        <button
          type="button"
          aria-label="Open disconnect modal"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDisconnect(true);
          }}
          className="absolute inset-0 rounded-full"
          style={{ background: "transparent" }}
        />
      )}

      {/* Simple modal for disconnect (only rendered when requested) */}
      {showDisconnect && (
        <div
          className="fixed inset-0 z-[1001] flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDisconnect(false)}
          />
          <div className="relative z-[1002] mt-20 w-full max-w-sm rounded-2xl border border-[#333] bg-[#1f1f1f] p-5 shadow-xl text-center">
            <div className="mb-4 text-lg font-semibold text-white">Desconectar</div>
            <p className="mb-6 text-sm text-gray-300">
              Você está conectado. Deseja sair desta conta?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDisconnect(false)}
                className="rounded-full border border-[#3a3a3a] px-4 py-2 text-sm text-gray-200 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setShowDisconnect(false);
                }}
                className="rounded-full bg-[#7b6cff] px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


