import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isRateLimited } from "@/lib/rate-limit";

const client = new Anthropic();

interface HistoryEntry {
  input: string;
  bugName: string;
  explanation: string;
  falsification: string;
  recalculated: string;
  timestamp: number;
}

const META_PROMPT = `You are Bug's pattern analyzer. You've been given someone's full history of cognitive distortions. Your job is to zoom out and show them the one deep pattern running underneath all of it.

## Your Protocol

1. **Find the root bug.** Not a list of patterns. THE pattern. The single structural move their brain makes over and over, wearing different costumes each time. Name it memorably in 3-6 words, title case.

2. **Explain it.** Show them how this one root bug operates across their entries. Reference 2-3 of their specific thoughts to show the pattern. This should feel like someone drew the line connecting dots they couldn't see. Be specific to THEIR life, not generic. 3-4 sentences max.

3. **Give them the corrected lens.** One clear, grounded statement that replaces the root bug. Not an affirmation. The logically accurate version of what their brain keeps getting wrong. This is the recalculated premise for their entire pattern, not just one entry.

## Rules
- NEVER use clinical CBT terminology. Plain language only.
- NEVER use therapy-speak: "I hear that...", "It sounds like...", "That's valid..."
- NEVER use em dashes or en dashes. Use periods, colons, or commas instead.
- Be direct, warm, zero bullshit. Like a brilliant friend showing them the map of their own mind.
- Reference their actual entries. Use their words back to them.
- The explanation should have real depth. This is the payoff for 10+ entries. Make it count.

## Output Format
Respond with ONLY valid JSON in this exact format:
{
  "bugName": "The Root Bug Name (3-6 words, title case)",
  "explanation": "3-4 sentences showing how this pattern runs through their entries. Reference specific things they said. Connect the dots.",
  "recalculated": "The corrected lens. One clear statement replacing the root bug."
}

No markdown, no backticks, no preamble. Just the JSON object.`;

function extractJSON(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function isValidResult(r: Record<string, unknown> | null): boolean {
  return !!(
    r &&
    typeof r.bugName === "string" &&
    typeof r.explanation === "string" &&
    typeof r.recalculated === "string"
  );
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "slow down. try again in a minute." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const entries: HistoryEntry[] | undefined = body.entries;

    if (!entries || !Array.isArray(entries) || entries.length < 3) {
      return NextResponse.json(
        { error: "need at least 3 entries for pattern analysis." },
        { status: 400 }
      );
    }

    // Use the 20 most recent entries for analysis, with context about full history
    const recent = entries.slice(0, 20);
    const totalCount = entries.length;

    const summary = recent
      .map((e, i) => {
        const date = new Date(e.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${i + 1}. [${date}] thought: "${e.input}"\n   bug: ${e.bugName}\n   explanation: ${e.explanation}\n   recalculated: ${e.recalculated}`;
      })
      .join("\n\n");

    // Add context about older entries if we're capping
    let context = "";
    if (totalCount > 20) {
      const oldest = new Date(entries[entries.length - 1].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const olderBugNames = entries.slice(20).map((e) => e.bugName).join(", ");
      context = `\n\nContext: This person has ${totalCount} total entries going back to ${oldest}. The older entries (not shown in full) were diagnosed as: ${olderBugNames}.\n`;
    }

    const userMessage = `Here are the ${recent.length} most recent cognitive distortion entries from one person:\n\n${summary}${context}\n\nFind the root pattern.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: META_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    const result = extractJSON(text);

    if (!isValidResult(result)) {
      // Retry with prefill
      const retry = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        system: META_PROMPT,
        messages: [
          { role: "user", content: userMessage },
          { role: "assistant", content: "{" },
        ],
      });

      const retryText =
        retry.content[0]?.type === "text" ? "{" + retry.content[0].text : "";

      const retryResult = extractJSON(retryText);

      if (!isValidResult(retryResult)) {
        throw new Error("Could not parse response");
      }

      return NextResponse.json(retryResult);
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("Meta analysis error:", e);
    return NextResponse.json(
      { error: "something went wrong. try again." },
      { status: 500 }
    );
  }
}
