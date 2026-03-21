"use client";

import { useState, useRef, useEffect } from "react";

export interface BugResult {
  bugName: string;
  explanation: string;
  falsification: string;
  recalculated: string;
}

interface ResultCardProps {
  result: BugResult;
  onReset: () => void;
  onFollowUp: (thought: string) => void;
  isFollowUpLoading: boolean;
  followUpError: string;
  threadDepth: number;
  maxDepthReached: boolean;
}

const FOLLOWUP_LOADING_MESSAGES = [
  "following the thread...",
  "tracking the root...",
  "going deeper...",
];

export default function ResultCard({
  result,
  onReset,
  onFollowUp,
  isFollowUpLoading,
  followUpError,
  threadDepth,
  maxDepthReached,
}: ResultCardProps) {
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [loadingMsg] = useState(
    () =>
      FOLLOWUP_LOADING_MESSAGES[
        Math.floor(Math.random() * FOLLOWUP_LOADING_MESSAGES.length)
      ]
  );

  useEffect(() => {
    if (showFollowUp && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showFollowUp]);

  const canSubmitFollowUp = followUpText.trim().length >= 2 && !isFollowUpLoading;

  const handleFollowUpSubmit = () => {
    if (canSubmitFollowUp) {
      onFollowUp(followUpText.trim());
      setFollowUpText("");
      setShowFollowUp(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto view-transition">
      <div className="bg-white border border-warm-border/40 rounded-lg p-5 sm:p-8 md:p-10">
        {/* Bug name — standalone title */}
        <p className="stagger-1 text-warm-text text-base font-semibold leading-snug capitalize mb-4">
          {result.bugName}
        </p>

        {/* 1. The Bug */}
        <div className="stagger-1 bg-warm-card border border-warm-border/30 rounded-lg p-5 mb-4 min-h-[120px]">
          <p className="text-xs text-warm-muted/70 font-semibold tracking-widest uppercase mb-2">
            The Bug
          </p>
          <p className="text-warm-text text-sm leading-relaxed">
            {result.explanation}
          </p>
        </div>

        {/* 2. The Counterexample */}
        <div className="stagger-2 bg-warm-card border border-warm-border/30 rounded-lg p-5 mb-4 min-h-[120px]">
          <p className="text-xs text-warm-muted/70 font-semibold tracking-widest uppercase mb-2">
            The Counterexample
          </p>
          <p className="text-warm-text text-sm leading-relaxed">
            {result.falsification}
          </p>
        </div>

        {/* 3. What's Actually True */}
        <div className="stagger-3 bg-warm-card border border-warm-border/30 rounded-lg p-5 mb-8 min-h-[120px]">
          <p className="text-xs text-warm-muted/70 font-semibold tracking-widest uppercase mb-2">
            What&apos;s Actually True
          </p>
          <p className="text-warm-text text-sm leading-relaxed">
            {result.recalculated}
          </p>
        </div>

        {/* Follow-up input */}
        {showFollowUp && (
          <div className="mb-6 animate-in">
            <textarea
              ref={textareaRef}
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleFollowUpSubmit();
                }
                if (e.key === "Escape") {
                  setShowFollowUp(false);
                  setFollowUpText("");
                }
              }}
              placeholder="what's still there?"
              className="w-full h-24 bg-warm-card border border-warm-border/50 rounded-lg p-4 text-warm-text placeholder-warm-muted/40 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-warm-accent/20 focus:border-transparent transition-all"
              maxLength={2000}
              disabled={isFollowUpLoading}
            />
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => { setShowFollowUp(false); setFollowUpText(""); }}
                className="text-warm-muted/70 text-xs hover:text-warm-muted transition-colors"
              >
                cancel
              </button>
              <button
                onClick={handleFollowUpSubmit}
                disabled={!canSubmitFollowUp}
                className="bg-warm-accent hover:bg-warm-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg transition-all text-base press"
              >
                {isFollowUpLoading ? (
                  <span className="animate-pulse-text">{loadingMsg}</span>
                ) : (
                  "go deeper"
                )}
              </button>
            </div>
            {followUpError && (
              <p className="text-red-400/80 text-xs mt-2">{followUpError}</p>
            )}
          </div>
        )}

        {/* Actions */}
        {!showFollowUp && (
          <div className="stagger-5 flex items-center gap-3">
            {!maxDepthReached && (
              <button
                onClick={() => setShowFollowUp(true)}
                disabled={isFollowUpLoading}
                className="flex-1 bg-warm-card border border-warm-border/50 hover:border-warm-accent/30 text-warm-muted hover:text-warm-text font-semibold py-3 rounded-lg transition-all text-base press"
              >
                {isFollowUpLoading ? (
                  <span className="animate-pulse-text">{loadingMsg}</span>
                ) : (
                  "it's still there"
                )}
              </button>
            )}
            <button
              onClick={onReset}
              className="flex-1 bg-warm-accent hover:bg-warm-accent/90 text-white font-semibold py-3 rounded-lg transition-all text-base press"
            >
              bug squashed
            </button>
          </div>
        )}
      </div>

      {/* Safety disclaimer */}
      <p className="stagger-5 text-center text-xs text-warm-muted/70 mt-6 leading-relaxed max-w-sm mx-auto">
        bug finds logical errors in your thinking. it&apos;s not a replacement for
        professional treatment. if you&apos;re in crisis, call{" "}
        <a href="tel:988" className="underline hover:text-warm-muted transition-colors">
          988
        </a>
        .
      </p>
    </div>
  );
}
