"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import InputScreen from "@/components/InputScreen";
import ResultCard, { BugResult } from "@/components/ResultCard";
import { incrementUsage, addToHistory, type HistoryEntry } from "@/lib/usage";

type AppState = "input" | "loading" | "result" | "error" | "followup-loading";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [state, setState] = useState<AppState>("input");
  const [result, setResult] = useState<BugResult | null>(null);
  const [error, setError] = useState<string>("");
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [serverHistory, setServerHistory] = useState<HistoryEntry[] | null>(null);

  // Fetch history from DB when authenticated
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch("/api/history")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setServerHistory(data); })
      .catch(() => {});
  }, [session?.user?.email]);

  const handleSubmit = async (thought: string) => {
    setState("loading");
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thought }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "something went wrong.");
      }

      // Start conversation history
      setHistory([
        { role: "user", content: thought },
        { role: "assistant", content: `Bug: ${data.bugName}\n${data.explanation}\nCounterexample: ${data.falsification}\nWhat's true: ${data.recalculated}` },
      ]);
      setResult(data);
      addToHistory({ input: thought, ...data });
      incrementUsage();
      setState("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong.");
      setState("error");
    }
  };

  const handleFollowUp = async (thought: string) => {
    setState("followup-loading");
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thought, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "something went wrong.");
      }

      // Append to history
      setHistory((prev) => [
        ...prev,
        { role: "user", content: thought },
        { role: "assistant", content: `Bug: ${data.bugName}\n${data.explanation}\nCounterexample: ${data.falsification}\nWhat's true: ${data.recalculated}` },
      ]);
      setResult(data);
      setState("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong.");
      setState("result"); // Stay on result card, show error there
    }
  };

  const handleReset = () => {
    setResult(null);
    setError("");
    setHistory([]);
    setState("input");
  };

  const handleViewEntry = (entry: HistoryEntry) => {
    setResult({
      bugName: entry.bugName,
      explanation: entry.explanation,
      falsification: entry.falsification,
      recalculated: entry.recalculated,
    });
    setHistory([]);
    setState("result");
  };

  const isFollowUpLoading = state === "followup-loading";
  const threadDepth = Math.floor(history.length / 2); // number of exchanges
  const maxDepthReached = threadDepth >= 10;

  return (
    <main className="min-h-dvh bg-warm-bg flex flex-col items-center pt-[8vh] sm:pt-[10vh] pb-12 px-4">
      {(state === "result" || state === "followup-loading") && result ? (
        <ResultCard
          result={result}
          onReset={handleReset}
          onFollowUp={handleFollowUp}
          isFollowUpLoading={isFollowUpLoading}
          followUpError={error}
          threadDepth={threadDepth}
          maxDepthReached={maxDepthReached}
        />
      ) : (
        <>
          <InputScreen
            onSubmit={handleSubmit}
            isLoading={state === "loading"}
            onViewEntry={handleViewEntry}
            serverHistory={serverHistory}
          />

          {state === "error" && (
            <div className="mt-6 max-w-lg mx-auto text-center">
              <p className="text-red-400/80 text-sm">{error}</p>
              <button
                onClick={handleReset}
                className="mt-2 text-warm-muted text-xs hover:text-warm-text transition-colors"
              >
                try again
              </button>
            </div>
          )}

        </>
      )}
    </main>
  );
}
