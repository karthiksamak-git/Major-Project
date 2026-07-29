"use client";

import React, { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useGame } from "@/lib/game-context";
import { generateDojoChallenges, generateEasierRetryChallenge, DojoChallenge, QuestionType } from "@/lib/ai-dojo";
import { CleanSamuraiImg } from "@/lib/clean-samurai";

/* ═══════════════════════════════════════════
   ADAPTIVE DUOLINGO-STYLE AI DOJO CHAMBER
   - Multi-format questions (Quiz, Pseudocode, Code Fill, Bug Hunt)
   - Dynamic capacity tracking & difficulty scaling
   - Wrong answer mistake analysis & instant easier retry loop
   ═══════════════════════════════════════════ */

type Phase = "intro" | "battle" | "victory" | "defeat";

function DojoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { completeMission, addCoins, updateCapacity, player } = useGame();

  const missionId = searchParams.get("missionId") || "m1";
  const missionTitle = searchParams.get("title") || "Foundations Trial";
  const domain = searchParams.get("domain") || player.recommendedDomain || player.realmName || "Backend Development";
  const lore = searchParams.get("lore") || "Test your practical knowledge and prove your competence.";
  const initialXp = parseInt(searchParams.get("xp") || "150", 10);

  const [challenges, setChallenges] = useState<DojoChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("intro");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [lives, setLives] = useState(4);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isGeneratingRetry, setIsGeneratingRetry] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Load initial dynamic AI challenges for this specific mission node & capacity level
  useEffect(() => {
    async function loadChallenges() {
      setLoading(true);
      try {
        const generated = await generateDojoChallenges(missionTitle, domain, lore, player.capacityLevel || "Apprentice");
        setChallenges(generated);
      } catch (err) {
        console.error("Failed to load Dojo challenges:", err);
      } finally {
        setLoading(false);
      }
    }
    loadChallenges();
  }, [missionTitle, domain, lore, player.capacityLevel]);

  const currentChallenge = challenges[questionIdx] || null;
  const totalQuestions = challenges.length;

  const startBattle = useCallback(() => setPhase("battle"), []);

  // Handle user answer submission
  async function submitAnswer(idx: number) {
    if (selectedAnswer !== null || !currentChallenge) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);

    const isCorrect = idx === currentChallenge.correct;

    if (isCorrect) {
      setScore((s) => s + 1);
      updateCapacity(5); // Increase capacity score
      const points = Math.round(initialXp / Math.max(1, 4));
      setXpEarned((x) => x + points);
    } else {
      setLives((l) => Math.max(0, l - 1));
      updateCapacity(-3); // Adjust capacity down on mistake

      // Generate a simpler retry question for this concept and append to the queue
      setIsGeneratingRetry(true);
      try {
        const retryChallenge = await generateEasierRetryChallenge(
          domain,
          currentChallenge.conceptKey || "foundations",
          currentChallenge.question
        );
        setChallenges((prev) => [...prev, retryChallenge]);
      } catch (err) {
        console.error("Failed to generate retry challenge:", err);
      } finally {
        setIsGeneratingRetry(false);
      }
    }
  }

  function nextQuestion() {
    setSelectedAnswer(null);
    setShowExplanation(false);

    if (lives <= 0) {
      setPhase("defeat");
      return;
    }

    if (questionIdx + 1 >= challenges.length) {
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
              Formulating Adaptive AI Scenarios
            </h3>
            <p className="text-xs text-[#06b6d4] animate-pulse">
              Matching challenge complexity to your <strong className="text-[#e8dfc8]">{player.capacityLevel}</strong> level ({domain})...
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
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] font-mono text-[#06b6d4] uppercase tracking-widest px-3 py-1 rounded-full border border-[#06b6d4]/30 bg-[#06b6d4]/10">
                    {domain} • Adaptive Practice Trial
                  </span>
                  <span className="text-[10px] font-mono text-[#a855f7] uppercase tracking-widest px-3 py-1 rounded-full border border-[#a855f7]/30 bg-[#a855f7]/10">
                    {player.capacityLevel} Level
                  </span>
                </div>
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
                  &quot;Welcome to the Adaptive Dojo. If you get a question right, your capacity will rise! If you make a mistake, I will break down the concept and guide you through an easier step-by-step retry.&quot;
                </p>
                <p className="mt-3 text-[10px] font-mono text-[#06b6d4] uppercase tracking-widest">
                  — AI Mentor
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs font-mono text-[#6b6358]">
                <span>{totalQuestions} Scenarios</span>
                <span>·</span>
                <span className="text-[#06b6d4] font-bold">+{initialXp} XP</span>
                <span>·</span>
                <span>4 Hearts</span>
              </div>

              <button
                onClick={startBattle}
                className="btn-primary px-10 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest mx-auto block shadow-lg cursor-pointer"
              >
                <span>Start Practice Trial →</span>
              </button>
            </motion.div>
          )}

          {/* ══════ BATTLE / ADAPTIVE QUESTION ══════ */}
          {phase === "battle" && currentChallenge && (
            <motion.div
              key={`battle-${currentChallenge.id}-${questionIdx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 surface rounded-2xl p-6 md:p-8 border border-[#2a2520]"
            >
              {/* HUD: Hearts + Progress Bar + Difficulty Indicator */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} className={`text-base transition-all ${i < lives ? "opacity-100 scale-100" : "opacity-20 scale-90"}`}>
                      ❤️
                    </span>
                  ))}
                </div>

                <div className="flex-1 max-w-xs mx-4">
                  <div className="xp-track h-2 rounded-full overflow-hidden">
                    <div
                      className="xp-fill-teal rounded-full transition-all duration-300"
                      style={{ width: `${((questionIdx + 1) / Math.max(1, challenges.length)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                    currentChallenge.difficulty === "Easier"
                      ? "border-[#10b981]/40 text-[#34d399] bg-[#10b981]/10"
                      : currentChallenge.difficulty === "Challenging"
                      ? "border-[#a855f7]/40 text-[#c084fc] bg-[#a855f7]/10"
                      : "border-[#06b6d4]/40 text-[#22d3ee] bg-[#06b6d4]/10"
                  }`}>
                    {currentChallenge.difficulty}
                  </span>
                  <span className="font-mono text-[10px] text-[#6b6358]">
                    {questionIdx + 1}/{challenges.length}
                  </span>
                </div>
              </div>

              {/* Question Header & Sensei Tip */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#06b6d4] uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-[#06b6d4]/30 bg-[#06b6d4]/10">
                    {currentChallenge.type === "code-fill" ? "💻 Code Fill" : currentChallenge.type === "bug-hunt" ? "🔍 Bug Hunt" : currentChallenge.type === "pseudocode-order" ? "🧩 Logic Sequence" : "🎯 Quiz Challenge"}
                  </span>
                </div>

                <div className="dialogue-box-teal p-3.5 rounded-xl text-xs text-[#c8c0b0] italic flex items-center gap-3">
                  <span className="text-lg">💡</span>
                  <p>&quot;{currentChallenge.senseiSays}&quot;</p>
                </div>

                <h2 className="font-cinzel text-lg md:text-xl font-bold text-[#e8dfc8] leading-snug">
                  {currentChallenge.question}
                </h2>
              </div>

              {/* Code Snippet Box (For code-fill / bug-hunt) */}
              {currentChallenge.codeSnippet && (
                <div className="bg-[#050608] border border-[#2a2520] rounded-xl p-4 font-mono text-xs text-[#34d399] overflow-x-auto leading-relaxed shadow-inner">
                  <pre>{currentChallenge.codeSnippet}</pre>
                </div>
              )}

              {/* Options / Answer Cards */}
              <div className="space-y-3 pt-2">
                {currentChallenge.options.map((optText, i) => {
                  let cardStyle = "border-[#2a2520] bg-[#0a0b0d]/80 text-[#c8c0b0] hover:border-[#06b6d4]/50 hover:bg-[#06b6d4]/5";

                  if (selectedAnswer !== null) {
                    if (i === currentChallenge.correct) {
                      cardStyle = "border-[#10b981] bg-[#10b981]/15 text-[#34d399] shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                    } else if (i === selectedAnswer) {
                      cardStyle = "border-[#fb7185] bg-[#fb7185]/15 text-[#fb7185]";
                    } else {
                      cardStyle = "border-[#1e1a16] bg-[#060708]/40 text-[#4a443a] opacity-50";
                    }
                  }

                  return (
                    <motion.button
                      key={i}
                      whileHover={selectedAnswer === null ? { scale: 1.01 } : {}}
                      whileTap={selectedAnswer === null ? { scale: 0.99 } : {}}
                      onClick={() => submitAnswer(i)}
                      disabled={selectedAnswer !== null}
                      className={`w-full p-4 rounded-xl text-left border text-xs md:text-sm font-medium transition-all flex items-start gap-3 ${cardStyle}`}
                    >
                      <span className="font-mono text-xs opacity-60 w-5 text-center mt-0.5">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1 leading-relaxed">{optText}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Instant Feedback Drawer */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-2"
                  >
                    <div
                      className={`rounded-xl p-5 space-y-3 border ${
                        selectedAnswer === currentChallenge.correct
                          ? "border-[#10b981]/40 bg-[#10b981]/10 text-[#34d399]"
                          : "border-[#fb7185]/40 bg-[#fb7185]/10 text-[#fb7185]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <span>{selectedAnswer === currentChallenge.correct ? "✅ Correct!" : "❌ Not Quite!"}</span>
                          {selectedAnswer === currentChallenge.correct && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10b981]/20 border border-[#10b981]/30">
                              +5 Capacity XP
                            </span>
                          )}
                          {selectedAnswer !== currentChallenge.correct && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#fb7185]/20 border border-[#fb7185]/30">
                              Queueing Simplified Retry
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#e8dfc8] leading-relaxed">
                        {currentChallenge.explanation}
                      </p>

                      {isGeneratingRetry && (
                        <p className="text-[10px] font-mono text-[#fbbf24] animate-pulse">
                          ⚡ AI Mentor is formulating an easier step-by-step question to reinforce this concept...
                        </p>
                      )}

                      <button
                        onClick={nextQuestion}
                        disabled={isGeneratingRetry}
                        className="btn-primary w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider mt-2 shadow-md cursor-pointer"
                      >
                        <span>
                          {selectedAnswer === currentChallenge.correct
                            ? "Next Challenge →"
                            : "Got it! Try Simplified Concept Question →"}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ══════ VICTORY SUMMARY ══════ */}
          {phase === "victory" && (
            <motion.div
              key="victory"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center surface-teal rounded-2xl p-8 md:p-10 border border-[#10b981]/40 shadow-2xl"
            >
              <div className="w-20 h-20 mx-auto rounded-full border-2 border-[#10b981]/50 bg-[#10b981]/10 flex items-center justify-center">
                <CleanSamuraiImg alt="Victory Mascot" className="w-16 h-16 object-contain" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#34d399] uppercase tracking-widest px-3 py-1 rounded-full border border-[#10b981]/30 bg-[#10b981]/10">
                  Trial Mastered • Milestone Unlocked!
                </span>
                <h1 className="font-cinzel text-3xl font-extrabold text-[#e8dfc8]">
                  Victory Achieved!
                </h1>
                <p className="text-xs text-[#6b6358] max-w-sm mx-auto">
                  You successfully demonstrated capacity and completed <strong className="text-[#e8dfc8]">{missionTitle}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div className="surface rounded-xl p-3 border border-[#06b6d4]/20 space-y-1">
                  <span className="text-[9px] text-[#6b6358] block">XP EARNED</span>
                  <span className="font-mono text-base font-bold text-[#22d3ee]">+{xpEarned > 0 ? xpEarned : initialXp}</span>
                </div>
                <div className="surface rounded-xl p-3 border border-[#fbbf24]/20 space-y-1">
                  <span className="text-[9px] text-[#6b6358] block">COINS</span>
                  <span className="font-mono text-base font-bold text-[#fbbf24]">+{Math.floor((xpEarned > 0 ? xpEarned : initialXp) * 0.8)}</span>
                </div>
                <div className="surface rounded-xl p-3 border border-[#a855f7]/20 space-y-1">
                  <span className="text-[9px] text-[#6b6358] block">CAPACITY</span>
                  <span className="font-mono text-xs font-bold text-[#c084fc]">{player.capacityLevel}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-4">
                <Link
                  href="/world-map"
                  className="btn-primary px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest"
                >
                  <span>Return to World Map & Unlock Next Level →</span>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ══════ DEFEAT SUMMARY ══════ */}
          {phase === "defeat" && (
            <motion.div
              key="defeat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center surface-rose rounded-2xl p-8 md:p-10 border border-[#fb7185]/40 shadow-2xl"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#fb7185] uppercase tracking-widest px-3 py-1 rounded-full border border-[#fb7185]/30 bg-[#fb7185]/10">
                  Trial Incomplete
                </span>
                <h1 className="font-cinzel text-3xl font-extrabold text-[#e8dfc8]">
                  Out of Hearts
                </h1>
                <p className="text-xs text-[#6b6358] max-w-sm mx-auto">
                  Don&apos;t worry — every mistake is a step toward mastery! Review the concepts and try again.
                </p>
              </div>

              <button
                onClick={() => {
                  setLives(4);
                  setQuestionIdx(0);
                  setScore(0);
                  setPhase("battle");
                }}
                className="btn-primary px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest mx-auto block"
              >
                <span>Retry Trial →</span>
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default function DojoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DojoContent />
    </Suspense>
  );
}
