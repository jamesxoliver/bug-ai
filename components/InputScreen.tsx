"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { getUsageCount, getTierProgress, getHistory, type HistoryEntry } from "@/lib/usage";

interface InputScreenProps {
  onSubmit: (thought: string) => void;
  isLoading: boolean;
  onViewEntry: (entry: HistoryEntry) => void;
  serverHistory?: HistoryEntry[] | null;
}

const LOADING_MESSAGES = [
  "reading between the lines...",
  "finding the bug...",
  "checking the logic...",
];

const EXAMPLE_PLACEHOLDERS = [
  "i always mess everything up...",
  "nobody actually cares about me...",
  "i'm not smart enough for this...",
  "everyone else has it figured out...",
  "i'll never be good enough...",
  "nothing i do ever works out...",
  "i'm falling behind everyone...",
  "they're all judging me...",
  "i should have known better...",
  "things will never get better...",
  "i don't deserve good things...",
  "it's all my fault...",
  "i'm a burden to everyone...",
  "if i fail at this, it's over...",
  "i can't do anything right...",
  "everyone is moving on without me...",
];


export default function InputScreen({ onSubmit, isLoading, onViewEntry, serverHistory }: InputScreenProps) {
  const { data: session } = useSession();
  const [thought, setThought] = useState("");
  const [loadingMsg] = useState(
    () => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]
  );
  const [placeholderIndex, setPlaceholderIndex] = useState(
    () => Math.floor(Math.random() * EXAMPLE_PLACEHOLDERS.length)
  );
  const [usageCount, setUsageCount] = useState(0);
  const [tierInfo, setTierInfo] = useState(() => getTierProgress());
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setUsageCount(getUsageCount());
    setTierInfo(getTierProgress());
    if (!serverHistory) {
      setHistoryEntries(getHistory());
    }
  }, [serverHistory]);

  // Prefer server history when available
  useEffect(() => {
    if (serverHistory) {
      setHistoryEntries(serverHistory);
      setUsageCount(serverHistory.length);
    }
  }, [serverHistory]);

  const hasInput = thought.length > 0;
  useEffect(() => {
    if (hasInput) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % EXAMPLE_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [hasInput]);

  const canSubmit = thought.trim().length >= 10 && !isLoading;

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit(thought.trim());
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto page-enter">
      {/* Wordmark + tier */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-0.5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-warm-accent">
            {/* Antennae */}
            <path d="M9 8L7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M15 8L17 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            {/* Body */}
            <ellipse cx="12" cy="14" rx="5" ry="6" stroke="currentColor" strokeWidth="2"/>
            {/* Head */}
            <circle cx="12" cy="8" r="2.5" stroke="currentColor" strokeWidth="2"/>
            {/* Legs */}
            <path d="M7 12L4 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M7 15L4 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M17 12L20 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M17 15L20 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            {/* Body segment line */}
            <path d="M7.5 14H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h1 className="text-4xl font-bold text-warm-text tracking-tight">bug</h1>
        </div>
        {session?.user ? (
          <button
            onClick={() => signOut()}
            className="block mt-2 text-warm-muted/50 text-xs hover:text-warm-muted transition-colors"
          >
            {session.user.email}
          </button>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="block mt-2 text-warm-muted/50 text-xs hover:text-warm-muted transition-colors"
          >
            sign in to save history
          </button>
        )}
      </div>

      {/* Input area */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-warm-muted text-base font-medium">what&apos;s bugging you?</p>
          <span className="text-base text-warm-muted/70 tabular-nums">
            {thought.length > 0 && thought.trim().length < 10
              ? `${thought.trim().length}/10 min`
              : thought.length > 0
                ? `${thought.length}/2000`
                : ""}
          </span>
        </div>
        <textarea
          value={thought}
          onChange={(e) => setThought(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
          placeholder={EXAMPLE_PLACEHOLDERS[placeholderIndex]}
          className="w-full h-40 bg-warm-card border border-warm-border/50 rounded-lg p-5 text-warm-text placeholder-warm-muted/80 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-warm-accent/20 focus:border-transparent transition-all"
          maxLength={2000}
          disabled={isLoading}
          autoFocus
        />

        <div className="mt-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full sm:w-auto sm:float-right bg-warm-accent hover:bg-warm-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 sm:py-2.5 rounded-lg transition-all text-base press"
          >
            {isLoading ? (
              <span className="animate-pulse-text">
                {loadingMsg}
              </span>
            ) : (
              "find the bug"
            )}
          </button>
        </div>
      </div>

      {/* Recently squashed */}
      {historyEntries.length > 0 && (
        <div className="w-full mt-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-warm-muted text-base font-medium">recently squashed</p>
            {usageCount >= 10 ? (
              <Link href="/meta" className="text-warm-accent text-base font-medium hover:text-warm-accent/80 transition-colors">
                map your mind
              </Link>
            ) : (
              <p className="text-warm-muted/70 text-base">
                {10 - usageCount} more to map your mind
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {historyEntries.slice(0, 5).map((bug, i) => (
              <button
                key={`${bug.timestamp}-${i}`}
                onClick={() => onViewEntry(bug)}
                className="text-left bg-warm-card/60 border border-warm-border/30 rounded-lg px-4 py-3 transition-all hover:bg-warm-card/80 press"
              >
                <p className="text-warm-muted text-base truncate">{bug.input}</p>
              </button>
            ))}
          </div>
          {historyEntries.length > 5 && (
            <div className="mt-3 text-center">
              <Link
                href="/history"
                className="text-warm-muted text-xs font-medium hover:text-warm-text transition-colors"
              >
                see all {historyEntries.length} &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
