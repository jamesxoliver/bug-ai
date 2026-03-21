import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { isRateLimited } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

const client = new Anthropic();

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

function cleanText(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ", ")                     // em/en dashes → comma
    .replace(/\s+-\s+/g, ", ")                         // spaced hyphens (used as dashes) → comma
    .replace(/[""]/g, '"')                           // smart double quotes → straight
    .replace(/['']/g, "'")                           // smart single quotes → straight
    .replace(/;(\s*)([a-z])/g, (_, ws, ch) => `.${ws}${ch.toUpperCase()}`) // semicolons → period + capitalize
    .replace(/\s{2,}/g, " ")                         // double spaces → single
    .replace(/\b(However|Moreover|Furthermore|Additionally|Indeed|In fact), /g, "") // AI filler openers
    .replace(/\*([^*]+)\*/g, "$1");                    // *markdown emphasis* → plain text
}

function cleanResult(obj: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    cleaned[k] = typeof v === "string" ? cleanText(v) : v;
  }
  return cleaned;
}

function extractJSON(text: string): Record<string, string> | null {
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

function isValidResult(
  r: Record<string, string> | null
): r is { bugName: string; explanation: string; falsification: string; recalculated: string } {
  return !!(r && r.bugName && r.explanation && r.falsification && r.recalculated);
}

async function saveToDb(email: string, input: string, result: Record<string, string>) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from("history").insert({
      user_email: email,
      input,
      bug_name: result.bugName,
      explanation: result.explanation,
      falsification: result.falsification,
      recalculated: result.recalculated,
    });
  } catch (e) {
    console.error("DB save error:", e);
  }
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
    const thought: string | undefined = body.thought;
    const history: ConversationMessage[] | undefined = body.history;

    // Build messages array
    let messages: ConversationMessage[];

    if (history && Array.isArray(history) && history.length > 0) {
      // Follow-up: use full conversation history
      if (!thought || typeof thought !== "string" || thought.trim().length < 2) {
        return NextResponse.json(
          { error: "tell me what's still bugging you." },
          { status: 400 }
        );
      }
      messages = [...history, { role: "user", content: thought.trim() }];
    } else {
      // First message
      if (!thought || typeof thought !== "string") {
        return NextResponse.json(
          { error: "please share what's on your mind." },
          { status: 400 }
        );
      }

      const trimmed = thought.trim();

      if (trimmed.length < 10) {
        return NextResponse.json(
          { error: "tell me a bit more about what you're thinking." },
          { status: 400 }
        );
      }

      if (trimmed.length > 2000) {
        return NextResponse.json(
          { error: "let's keep it under 2000 characters. focus on the core thought." },
          { status: 400 }
        );
      }

      messages = [{ role: "user", content: trimmed }];
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    const result = extractJSON(text);

    if (!isValidResult(result)) {
      // Retry once
      const retry = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages,
      });

      const retryText =
        retry.content[0]?.type === "text" ? retry.content[0].text : "";

      const retryResult = extractJSON(retryText);

      if (!isValidResult(retryResult)) {
        throw new Error("Could not parse response");
      }

      const cleanedRetry = cleanResult(retryResult);
      try {
        const session = await auth();
        if (session?.user?.email) saveToDb(session.user.email, thought!, cleanedRetry);
      } catch {}
      return NextResponse.json(cleanedRetry);
    }

    const cleaned = cleanResult(result);
    try {
      const session = await auth();
      if (session?.user?.email) saveToDb(session.user.email, thought!, cleaned);
    } catch {}
    return NextResponse.json(cleaned);
  } catch (e) {
    console.error("Analysis error:", e);
    return NextResponse.json(
      { error: "something went wrong. try again." },
      { status: 500 }
    );
  }
}
