"use client";

import React, { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useGame } from "@/lib/game-context";
import { generateDojoChallenges, DojoChallenge } from "@/lib/ai-dojo";
import { CleanSamuraiImg } from "@/lib/clean-samurai";

/* ═══════════════════════════════════════════
   DYNAMIC AI DOJO BATTLE CHAMBER
   Generates personalized questions per domain & mission node.
   Completing a trial unlocks the next level on the World Map!
   ═══════════════════════════════════════════ */

type Phase = "intro" | "battle" | "victory" | "defeat";

function DojoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { completeMission, addCoins, player } = useGame();

  const missionId = searchParams.get("missionId") || "m1";
  const missionTitle = searchParams.get("title") || "Foundations Trial";
  const domain = searchParams.get("domain") || player.recommendedDomain || player.realmName || "Backend Development";
  const lore = searchParams.get("lore") || "Test your practical knowledge and prove your competence.";
  const initialXp = parseInt(searchParams.get("xp") || "150", 10);

  const [challenges, setChallenges] = useState<DojoChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("intro");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Generate dynamic AI challenges for this specific mission node & domain
  useEffect(() => {
    async function loadChallenges() {
      setLoading(true);
      try {
        const generated = await generateDojoChallenges(missionTitle, domain, lore);
        setChallenges(generated);
      } catch (err) {
        console.error("Failed to load Dojo challenges:", err);
      } finally {
        setLoading(false);
      }
    }
    loadChallenges();
  }, [missionTitle, domain, lore]);

  const currentChallenge = challenges[questionIdx] || null;
  const totalQuestions = challenges.length;

  const startBattle = useCallback(() => setPhase("battle"), []);

  function submitAnswer(idx: number) {
    if (selectedAnswer !== null || !currentChallenge) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);

    if (idx === currentChallenge.correct) {
      setScore((s) => s + 1);
      const points = Math.round(initialXp / Math.max(1, challenges.length));
      setXpEarned((x) => x + points);
    } else {
      setHealth((h) => Math.max(0, h - 25));
    }
  }

  function nextQuestion() {
    setSelectedAnswer(null);
    setShowExplanation(false);

    if (health <= 0) {
      setPhase("defeat");
      return;
    }

    if (questionIdx + 1 >= totalQuestions) {
      setPhase("victory");
    } else {
      setQuestionIdx((q) => q + 1);
    }
  }

  // Award XP and complete EXACT mission ID when victory is achieved
  useEffect(() => {
    if (phase === "victory") {
      const finalXp = xpEarned > 0 ? xpEarned : initialXp;
      completeMission(missionId, finalXp);
      addCoins(Math.floor(finalXp * 0.8));
    }
  }, [phase, xpEarned, initialXp, missionId, completeMission, addCoins]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4">
        <div className="surface rounded-2xl p-10 text-center space-y-4 max-w-md bg-[#090b0f]/95 border-2 border-[#06b6d4]/30 shadow-2xl">
          <div className="relative w-12 h-12 mx-auto">
            <div className="w-12 h-12 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-1 w-10 h-10 border-2 border-[#a855f7]/40 border-b-transparent rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <div className="space-y-1">
            <h3 className="font-cinzel text-lg font-bold text-[#e8dfc8]">
              Generating AI Practice Trial
            </h3>
            <p className="text-xs text-[#06b6d4] animate-pulse">
              AI Mentor is formulating scenarios for <strong className="text-[#e8dfc8]">{domain}</strong>...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">

          {/* ══════ INTRO ══════ */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8 text-center surface-teal rounded-2xl p-8 md:p-10 border border-[#06b6d4]/30 shadow-2xl"
            >
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-[#06b6d4] uppercase tracking-widest px-3 py-1 rounded-full border border-[#06b6d4]/30 bg-[#06b6d4]/10">
                  {domain} • Practice Trial
                </span>
                <h1 className="font-cinzel text-2xl md:text-4xl font-extrabold text-[#e8dfc8] tracking-wide">
                  {missionTitle}
                </h1>
                <p className="text-xs text-[#6b6358] max-w-md mx-auto">
                  {lore}
                </p>
              </div>

              <div className="ink-divider-teal max-w-xs mx-auto" />

              <div className="dialogue-box-teal rounded-xl px-6 py-5 max-w-md mx-auto text-left">
                <p className="font-cinzel text-sm text-[#c8c0b0] leading-relaxed italic">
                  &quot;Show me your understanding, learner. Answer these practical scenarios correctly to complete this milestone and unlock your next step on the path.&quot;
                </p>
                <p className="mt-3 text-[10px] font-mono text-[#06b6d4] uppercase tracking-widest">
                  — AI Mentor
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs font-mono text-[#6b6358]">
                <span>{totalQuestions} Questions</span>
                <span>·</span>
                <span className="text-[#06b6d4] font-bold">+{initialXp} XP</span>
                <span>·</span>
                <span>Survive to Unlock</span>
              </div>

              <button
                onClick={startBattle}
                className="btn-primary px-10 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest mx-auto block shadow-lg"
              >
                <span>Start Practice Trial →</span>
              </button>
            </motion.div>
          )}

          {/* ══════ BATTLE / QUIZ ══════ */}
          {phase === "battle" && currentChallenge && (
            <motion.div
              key={`battle-${questionIdx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 surface rounded-2xl p-6 md:p-8 border border-[#2a2520]"
            >
              {/* HUD: Health + Progress */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#fb7185]">HP</span>
                    <span className="text-[#6b6358]">{health}/100</span>
                  </div>
                  <div className="health-track h-[6px]">
                    <div
                      className="health-fill"
                      style={{ width: `${health}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[10px] text-[#06b6d4] font-semibold">
                    Question {questionIdx + 1} of {totalQuestions}
                  </span>
                </div>
              </div>

              {/* Mentor Context */}
              <div className="dialogue-box-teal rounded-xl px-5 py-4">
                <p className="font-cinzel text-xs text-[#22d3ee] italic leading-relaxed font-medium">
                  &quot;{currentChallenge.senseiSays}&quot;
                </p>
              </div>

              {/* Question */}
              <h2 className="font-cinzel text-base md:text-lg font-bold text-[#e8dfc8] leading-relaxed">
                {currentChallenge.question}
              </h2>

              {/* Answer options */}
              <div className="space-y-2.5">
                {currentChallenge.options.map((opt, i) => {
                  let optStyle = "surface hover:border-[#06b6d4]/40 hover:bg-[#06b6d4]/5";
                  if (selectedAnswer !== null) {
                    if (i === currentChallenge.correct) {
                      optStyle = "border-[#10b981]/60 bg-[#10b981]/15 ring-1 ring-[#10b981]/40";
                    } else if (i === selectedAnswer && i !== currentChallenge.correct) {
                      optStyle = "border-[#f43f5e]/60 bg-[#f43f5e]/15 ring-1 ring-[#f43f5e]/40";
                    } else {
                      optStyle = "surface opacity-30";
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => submitAnswer(i)}
                      disabled={selectedAnswer !== null}
                      className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-200 border ${optStyle} ${
                        selectedAnswer !== null ? "cursor-default" : "cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-xs text-[#06b6d4] mt-0.5 w-5 flex-shrink-0 font-bold">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span className={`text-sm leading-relaxed font-medium ${
                          selectedAnswer !== null && i === currentChallenge.correct
                            ? "text-[#34d399]"
                            : selectedAnswer === i && i !== currentChallenge.correct
                            ? "text-[#fb7185]"
                            : "text-[#e8dfc8]"
                        }`}>
                          {opt}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation (after answering) */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 pt-2"
                  >
                    <div className={`rounded-xl px-5 py-4 border ${
                      selectedAnswer === currentChallenge.correct
                        ? "border-[#10b981]/30 bg-[#10b981]/10 text-[#34d399]"
                        : "border-[#f43f5e]/30 bg-[#f43f5e]/10 text-[#fb7185]"
                    }`}>
                      <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5 font-bold">
                        {selectedAnswer === currentChallenge.correct ? "✓ Correct Answer!" : "⚡ Incorrect"}
                      </p>
                      <p className="text-xs text-[#e8dfc8] leading-relaxed">
                        {currentChallenge.explanation}
                      </p>
                    </div>

                    <button
                      onClick={nextQuestion}
                      className="btn-primary px-8 py-3 rounded-xl text-xs uppercase tracking-widest w-full font-bold"
                    >
                      <span>
                        {questionIdx + 1 >= totalQuestions ? "Finish Trial & See Results →" : "Next Question →"}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ══════ VICTORY ══════ */}
          {phase === "victory" && (
            <motion.div
              key="victory"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-center surface-emerald rounded-2xl p-8 md:p-10 border border-[#10b981]/30 shadow-2xl"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#34d399] uppercase tracking-widest px-3 py-1 rounded-full border border-[#10b981]/30 bg-[#10b981]/10">
                  Trial Completed • Level Unlocked!
                </span>
                <h2 className="font-cinzel text-3xl font-extrabold text-[#34d399]">
                  Victory!
                </h2>
                <p className="text-sm text-[#e8dfc8]">
                  You have successfully cleared <strong className="text-[#34d399]">{missionTitle}</strong>!
                </p>
              </div>

              {/* Rewards */}
              <div className="bg-[#090b0f]/90 rounded-xl p-6 max-w-sm mx-auto space-y-4 border border-[#10b981]/20">
                <p className="font-mono text-[10px] text-[#34d399] tracking-widest uppercase font-bold">
                  Rewards & Progress
                </p>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b6358]">Accuracy</span>
                    <span className="font-bold text-[#e8dfc8]">
                      {score} / {totalQuestions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b6358]">XP Earned</span>
                    <span className="font-bold text-[#22d3ee]">
                      +{xpEarned > 0 ? xpEarned : initialXp} XP
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b6358]">Coins Awarded</span>
                    <span className="font-bold text-[#c084fc]">
                      +{(Math.floor((xpEarned > 0 ? xpEarned : initialXp) * 0.8))} Coins
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b6358]">Next Level</span>
                    <span className="font-bold text-[#34d399]">
                      ✓ Unlocked on World Map
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => router.push("/world-map")}
                  className="btn-primary px-10 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg"
                >
                  <span>Return to World Map & Continue →</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════ DEFEAT ══════ */}
          {phase === "defeat" && (
            <motion.div
              key="defeat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8 text-center surface-rose rounded-2xl p-8 md:p-10 border border-[#f43f5e]/30 shadow-2xl"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#fb7185] uppercase tracking-widest px-3 py-1 rounded-full border border-[#f43f5e]/30 bg-[#f43f5e]/10">
                  Trial Incomplete
                </span>
                <h2 className="font-cinzel text-3xl font-extrabold text-[#fb7185]">
                  Need More Practice
                </h2>
                <p className="text-xs text-[#9a9182] max-w-md mx-auto">
                  Don&apos;t worry! Review the concepts and try again — every attempt builds stronger skills.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setPhase("intro");
                    setQuestionIdx(0);
                    setHealth(100);
                    setScore(0);
                    setXpEarned(0);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                  }}
                  className="btn-rose px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push("/world-map")}
                  className="btn-scroll px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
                >
                  Return to Map
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default function DynamicDojoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-48px)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DojoContent />
    </Suspense>
  );
}
