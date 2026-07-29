"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { CleanSamuraiImg } from "@/lib/clean-samurai";
import { GlobalMentorAgent } from "@/components/global-mentor-agent";

/* ═══════════════════════════════════════════
   APP LAYOUT — Top navigation bar
   Professional labels, colorful accents
   ═══════════════════════════════════════════ */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  const { player, signOut } = useGame();

  const routes = [
    { label: "Dashboard", href: "/dashboard", color: "text-[#22d3ee]" },
    { label: "Learning Path", href: "/world-map", color: "text-[#c084fc]" },
    { label: "Practice Lab", href: "/worlds/backend", color: "text-[#fbbf24]" },
    { label: "Mock Interview", href: "/interview", color: "text-[#fb7185]" },
    { label: "Jobs", href: "/opportunities", color: "text-[#34d399]" },
    { label: "My Progress", href: "/discover", color: "text-[#60a5fa]" },
    { label: "Portfolio", href: "/portfolio", color: "text-[#c084fc]" },
  ];

  const isBoarding = pathname === "/onboarding";

  return (
    <div className="relative min-h-screen bg-[#040506] text-[#c8c0b0]">
      {/* Vignette */}
      <div className="vignette" />

      {/* ══════ TOP BAR (Hidden on Onboarding) ══════ */}
      {!isBoarding && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#0a0b0d]/95 backdrop-blur-md border-b border-[#2a2520]/40">
          <div className="flex items-center justify-between px-4 md:px-5 h-14 max-w-6xl mx-auto">

            {/* Left: Identity */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full border border-[#06b6d4]/40 bg-[#0a0b0d] flex items-center justify-center p-0.5 overflow-hidden">
                <CleanSamuraiImg alt="Avatar" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xs font-semibold text-[#e8dfc8] tracking-wider group-hover:text-[#22d3ee] transition-colors">
                  {player.characterName}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[9px] text-[#6b6358]">Lv.{player.level}</span>
                  {/* XP bar */}
                  <div className="xp-track w-16 h-[3px] rounded-full">
                    <div className="xp-fill-teal rounded-full" style={{ width: `${player.xpToNext > 0 ? Math.min(100, (player.xp / player.xpToNext) * 100) : 0}%` }} />
                  </div>
                  <span className="font-mono text-[9px] text-[#3d3830]">{player.xp}/{player.xpToNext}</span>
                </div>
              </div>
            </Link>

            {/* Center: Navigation */}
            <nav className="hidden md:flex items-center gap-0.5">
              {routes.map((r) => {
                const active = pathname === r.href || pathname?.startsWith(r.href + "/");
                return (
                  <Link
                    key={r.href}
                    href={r.href}
                    className={`px-3 py-1.5 text-[11px] tracking-wider font-medium transition-all rounded-lg ${
                      active
                        ? `${r.color} bg-white/5 border border-white/10`
                        : "text-[#6b6358] hover:text-[#c8c0b0] hover:bg-white/[0.03]"
                    }`}
                  >
                    {r.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Stats & Sign Out */}
            <div className="flex items-center gap-3">
              {/* Streak */}
              <div className="flex items-center gap-1">
                <span className="text-[10px]">🔥</span>
                <span className="text-xs font-mono font-bold text-[#fbbf24]">{player.streak}</span>
              </div>
              {/* Coins */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#c084fc]">⬡</span>
                <span className="text-xs font-mono font-bold text-[#c084fc]">{player.coins.toLocaleString()}</span>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={signOut}
                className="hidden sm:flex items-center text-[11px] font-semibold text-[#fb7185] bg-[#fb7185]/10 hover:bg-[#fb7185]/20 px-2.5 py-1 rounded-lg border border-[#fb7185]/30 transition-all cursor-pointer"
                title="Sign Out"
              >
                Sign Out
              </button>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileNav(!mobileNav)}
                className="md:hidden text-[#6b6358] hover:text-[#c8c0b0] transition-colors px-1"
              >
                <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile nav dropdown */}
          <AnimatePresence>
            {mobileNav && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden border-t border-[#2a2520]/30 overflow-hidden"
              >
                <div className="px-5 py-3 space-y-1">
                  {routes.map((r) => {
                    const active = pathname === r.href;
                    return (
                      <Link
                        key={r.href}
                        href={r.href}
                        onClick={() => setMobileNav(false)}
                        className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                          active ? `${r.color} bg-white/5` : "text-[#6b6358] hover:text-[#c8c0b0]"
                        }`}
                      >
                        {r.label}
                      </Link>
                    );
                  })}
                  <button
                    onClick={() => { setMobileNav(false); signOut(); }}
                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#fb7185] hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      {/* ══════ MAIN CONTENT ══════ */}
      <main className={`relative z-10 min-h-screen ${isBoarding ? "pt-0" : "pt-14"}`}>
        {children}
      </main>

      {/* ══════ PERSISTENT AI MENTOR ══════ */}
      <GlobalMentorAgent />
    </div>
  );
}
