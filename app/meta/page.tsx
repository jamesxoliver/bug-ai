"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getHistory, type HistoryEntry } from "@/lib/usage";

interface MetaResult {
  bugName: string;
  explanation: string;
  recalculated: string;
}

const LOADING_MESSAGES = [
  "connecting the dots...",
  "mapping your mind...",
  "finding the pattern...",
];

export default function MetaPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [result, setResult] = useState<MetaResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingMsg] = useState(
    () => LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]
  );

  useEffect(() => {
    async function loadAndAnalyze() {
      let entries: HistoryEntry[];

      if (session?.user?.email) {
        try {
          const res = await fetch("/api/history");
          entries = res.ok ? await res.json() : getHistory();
        } catch {
          entries = getHistory();
        }
      } else {
        entries = getHistory();
      }

      setHistory(entries);

      if (entries.length < 3) {
        setError("need at least 3 bugs squashed for pattern analysis.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/meta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "something went wrong.");
        }

        setResult(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "something went wrong.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAndAnalyze();
  }, [session?.user?.email]);

  return (
    <main className="min-h-dvh bg-warm-bg flex flex-col items-center pt-[8vh] sm:pt-[10vh] pb-12 px-4">
      <div className="w-full max-w-lg mx-auto">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center mt-20">
            <p className="text-warm-muted animate-pulse-text text-sm">
              {loadingMsg}
            </p>
            <p className="text-warm-muted/40 text-xs mt-2">
              analyzing {history.length} bugs
            </p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="text-center mt-20">
            <p className="text-warm-muted text-sm">{error}</p>
            <Link
              href="/"
              className="text-warm-accent text-xs font-medium hover:text-warm-accent/80 transition-colors mt-3 inline-block"
            >
              squash more bugs
            </Link>
          </div>
        )}

        {/* Result */}
        {!isLoading && result && (
          <div className="px-4 sm:px-6">
            <div className="bg-white border border-warm-border/40 rounded-lg p-5 sm:p-8 md:p-10">
              {/* Badge */}
              <div className="stagger-1 flex items-center gap-2 mb-8">
                <div className="w-5 h-5 rounded-full bg-warm-accent/10 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M9 8L7 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-warm-accent"/>
                    <path d="M15 8L17 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-warm-accent"/>
                    <ellipse cx="12" cy="14" rx="5" ry="6" stroke="currentColor" strokeWidth="3" className="text-warm-accent"/>
                  </svg>
                </div>
                <span className="text-warm-accent text-xs font-semibold tracking-wider uppercase">
                  root bug · {history.length} bugs analyzed
                </span>
              </div>

              {/* Bug name */}
              <h2 className="stagger-2 text-2xl font-bold text-warm-text mb-4 leading-tight">
                {result.bugName}
              </h2>

              {/* Explanation */}
              <p className="stagger-2 text-warm-muted text-base leading-relaxed mb-8">
                {result.explanation}
              </p>

              {/* Recalculated */}
              <div className="stagger-4 bg-warm-accent rounded-lg p-5 mb-8">
                <p className="text-xs text-white/60 font-semibold tracking-widest uppercase mb-2.5">
                  the corrected lens
                </p>
                <p className="text-white text-base font-medium leading-relaxed">
                  {result.recalculated}
                </p>
              </div>

              {/* Action */}
              <div className="stagger-5">
                <Link
                  href="/"
                  className="block text-center bg-warm-accent hover:bg-warm-accent/90 active:scale-[0.98] text-white font-semibold py-3 rounded-lg transition-all text-sm"
                >
                  squash another bug
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
