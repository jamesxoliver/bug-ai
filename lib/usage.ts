const FREE_LIMIT = 5;
const HISTORY_MAX = 500;
const STORAGE_KEY = "bug_uses_total";
const HISTORY_KEY = "bug_history";

export interface HistoryEntry {
  input: string;
  bugName: string;
  explanation: string;
  falsification: string;
  recalculated: string;
  timestamp: number;
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addToHistory(entry: Omit<HistoryEntry, "timestamp">): void {
  try {
    const history = getHistory();
    history.unshift({ ...entry, timestamp: Date.now() });
    if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // localStorage quota exceeded — silently drop oldest entries and retry
    try {
      const history = getHistory();
      history.length = Math.min(history.length, Math.floor(HISTORY_MAX / 2));
      history.unshift({ ...entry, timestamp: Date.now() });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // still failing — give up silently
    }
  }
}

interface Tier {
  name: string;
  threshold: number;
}

const TIERS: Tier[] = [
  { name: "bug spotter", threshold: 1 },
  { name: "flyswatter", threshold: 5 },
  { name: "bug zapper", threshold: 10 },
  { name: "exterminator", threshold: 20 },
  { name: "fumigator", threshold: 50 },
  { name: "pest control", threshold: 100 },
  { name: "bug hunter", threshold: 250 },
  { name: "infestation cleared", threshold: 500 },
  { name: "bug free", threshold: 1000 },
];

export function getUsageCount(): number {
  if (typeof window === "undefined") return 0;
  const count = localStorage.getItem(STORAGE_KEY);
  return count ? parseInt(count, 10) : 0;
}

export function incrementUsage(): number {
  const current = getUsageCount();
  const next = current + 1;
  try {
    localStorage.setItem(STORAGE_KEY, next.toString());
  } catch {
    // quota exceeded — usage count is a small string, unlikely but safe
  }
  return next;
}

export function isOverLimit(): boolean {
  return getUsageCount() >= FREE_LIMIT;
}

export function remainingUses(): number {
  return Math.max(0, FREE_LIMIT - getUsageCount());
}

export function getCurrentTier(): Tier {
  const count = getUsageCount();
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (count >= tier.threshold) current = tier;
  }
  return current;
}

export function getNextTier(): Tier | null {
  const count = getUsageCount();
  for (const tier of TIERS) {
    if (count < tier.threshold) return tier;
  }
  return null;
}

export function getTierProgress(): { current: Tier; next: Tier | null; progress: number } {
  const count = getUsageCount();
  const current = getCurrentTier();
  const next = getNextTier();

  if (!next) return { current, next: null, progress: 1 };

  const range = next.threshold - current.threshold;
  const elapsed = count - current.threshold;
  return { current, next, progress: elapsed / range };
}
