"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { matchJobsWithUserSkills, JobOpportunity } from "@/lib/ai-client";

/* ═══════════════════════════════════════════
   JOBS & INTERNSHIPS
   AI-matched opportunities based on
   user skills, domain, and interests
   ═══════════════════════════════════════════ */

export default function OpportunitiesPage() {
  const { player } = useGame();
  const [opportunities, setOpportunities] = useState<JobOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"All" | "Job" | "Internship">("All");

  async function fetchOpportunities() {
    setLoading(true);
    try {
      const res = await matchJobsWithUserSkills({
        characterName: player.characterName,
        realmName: player.realmName,
        level: player.level,
        completedMissions: player.completedMissions,
        skills: player.suggestedTopics?.length > 0 ? player.suggestedTopics : ["HTML", "CSS", "JavaScript", "Problem Solving"],
        interests: player.interests,
        recommendedDomain: player.recommendedDomain,
      });
      setOpportunities(res);
    } catch (err) {
      console.error("Failed to fetch opportunities:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOpportunities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredList = opportunities.filter((o) => {
    if (filterType === "All") return true;
    return o.type === filterType;
  });

  const filterBtnClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      active
        ? "bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30"
        : "text-[#6b6358] hover:text-[#c8c0b0] hover:bg-white/[0.03]"
    }`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-[10px] font-mono text-[#10b981] uppercase tracking-widest px-3 py-1 rounded-full border border-[#10b981]/30 bg-[#10b981]/10">
          AI-Matched for You
        </span>
        <h1 className="font-cinzel text-3xl font-bold text-[#e8dfc8] tracking-wider">
          Jobs & Internships
        </h1>
        <p className="text-xs text-[#6b6358] max-w-xl mx-auto">
          AI finds opportunities that match your skills and interests.
          {player.recommendedDomain && (
            <> Focused on <strong className="text-[#34d399]">{player.recommendedDomain}</strong> roles.</>
          )}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 surface rounded-xl p-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setFilterType("All")} className={filterBtnClass(filterType === "All")}>
            All ({opportunities.length})
          </button>
          <button onClick={() => setFilterType("Job")} className={filterBtnClass(filterType === "Job")}>
            Full-time Jobs
          </button>
          <button onClick={() => setFilterType("Internship")} className={filterBtnClass(filterType === "Internship")}>
            Internships
          </button>
        </div>

        <button
          onClick={fetchOpportunities}
          disabled={loading}
          className="btn-emerald px-4 py-1.5 rounded-lg text-xs flex items-center gap-2"
        >
          🔄 Refresh Matches
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="p-12 text-center surface rounded-xl space-y-3">
          <div className="w-8 h-8 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#34d399] animate-pulse">
            AI is finding the best opportunities for you...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredList.map((op) => {
              const matchColor =
                op.matchScore >= 85
                  ? "text-[#34d399]"
                  : op.matchScore >= 70
                  ? "text-[#fbbf24]"
                  : "text-[#fb7185]";

              return (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="surface rounded-xl p-6 space-y-4 hover:border-[#10b981]/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a2520]/30 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${
                          op.type === "Internship"
                            ? "border-[#a855f7]/30 bg-[#a855f7]/10 text-[#c084fc]"
                            : "border-[#06b6d4]/30 bg-[#06b6d4]/10 text-[#22d3ee]"
                        }`}>
                          {op.type}
                        </span>
                        <span className="text-[10px] text-[#6b6358]">{op.location}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#e8dfc8] tracking-wide">
                        {op.title}
                      </h3>
                      <p className="text-xs text-[#6b6358]">
                        {op.company} • <span className="text-[#c8c0b0]">{op.salaryOrStipend}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#6b6358]">Match:</span>
                        <span className={`font-mono text-2xl font-bold ${matchColor}`}>
                          {op.matchScore}%
                        </span>
                      </div>
                      <span className="text-[9px] text-[#3d3830]">AI Compatibility</span>
                    </div>
                  </div>

                  {/* Why this fits */}
                  <div className="dialogue-box-teal rounded-lg p-3 text-xs text-[#9a9182] leading-relaxed">
                    {op.reason}
                  </div>

                  {/* Skill breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <span className="text-[#34d399] font-medium">✓ Skills You Have:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {op.userSkillsMet.map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 text-[#34d399]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[#fbbf24] font-medium">⚡ Skills to Learn:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {op.skillGaps.map((sg, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#fbbf24]">
                            {sg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Apply */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-[#3d3830]">
                      AI-recommended based on your profile
                    </span>
                    <a
                      href={op.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-emerald px-6 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2"
                    >
                      Apply Now →
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredList.length === 0 && !loading && (
            <div className="text-center py-12 surface rounded-xl">
              <p className="text-sm text-[#6b6358]">No {filterType === "All" ? "" : filterType.toLowerCase()} opportunities found. Try refreshing!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
