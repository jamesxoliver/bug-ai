"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getHistory, type HistoryEntry } from "@/lib/usage";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/history")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data) setHistory(data); })
        .catch(() => setHistory(getHistory()));
    } else {
      setHistory(getHistory());
    }
  }, [session?.user?.email]);

  return (
    <main className="min-h-dvh bg-warm-bg pb-12 px-4">
      <div className="max-w-lg mx-auto pt-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-warm-text">squash history</h1>
          <Link
            href="/"
            className="text-warm-accent text-sm font-medium hover:text-warm-accent/80 transition-colors"
          >
            &larr; back
          </Link>
        </div>

        {history.length === 0 ? (
          <p className="text-warm-muted text-sm text-center mt-20">
            no bugs squashed yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((entry, i) => (
              <button
                key={`${entry.timestamp}-${i}`}
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="text-left bg-warm-card/60 border border-warm-border/30 rounded-lg px-4 py-3 transition-all hover:bg-warm-card/80 active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-warm-text text-sm font-semibold">{entry.bugName}</p>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-warm-muted/40 text-[11px] tabular-nums">
                      {formatDate(entry.timestamp)} · {formatTime(entry.timestamp)}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={`text-warm-muted/40 transition-transform duration-200 ${expandedIndex === i ? "rotate-180" : ""}`}
                    >
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                {expandedIndex === i ? (
                  <div className="mt-3 space-y-3 animate-in">
                    <div>
                      <p className="text-warm-muted/60 text-[11px] font-medium uppercase tracking-wider">thought</p>
                      <p className="text-warm-muted text-xs mt-0.5 leading-relaxed italic">&ldquo;{entry.input}&rdquo;</p>
                    </div>
                    <div>
                      <p className="text-warm-muted/60 text-[11px] font-medium uppercase tracking-wider">the bug</p>
                      <p className="text-warm-muted text-xs mt-0.5 leading-relaxed">{entry.explanation}</p>
                    </div>
                    <div>
                      <p className="text-warm-muted/60 text-[11px] font-medium uppercase tracking-wider">counterexample</p>
                      <p className="text-warm-muted text-xs mt-0.5 leading-relaxed">{entry.falsification}</p>
                    </div>
                    <div className="bg-warm-bg/80 rounded-lg px-3 py-2">
                      <p className="text-warm-muted/60 text-[11px] font-medium uppercase tracking-wider">recalculated</p>
                      <p className="text-warm-text text-xs mt-0.5 leading-relaxed font-medium">{entry.recalculated}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-warm-muted text-xs mt-1 leading-relaxed">{entry.recalculated}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
