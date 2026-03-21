import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  let session;
  try { session = await auth(); } catch { return NextResponse.json({ error: "auth not configured" }, { status: 401 }); }
  if (!session?.user?.email) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "database not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("history")
    .select("*")
    .eq("user_email", session.user.email)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "failed to fetch history" }, { status: 500 });
  }

  const entries = data.map((row: Record<string, unknown>) => ({
    input: row.input,
    bugName: row.bug_name,
    explanation: row.explanation,
    falsification: row.falsification,
    recalculated: row.recalculated,
    timestamp: new Date(row.created_at as string).getTime(),
  }));

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  let session;
  try { session = await auth(); } catch { return NextResponse.json({ error: "auth not configured" }, { status: 401 }); }
  if (!session?.user?.email) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "database not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { input, bugName, explanation, falsification, recalculated } = body;

  if (!input || !bugName || !explanation || !falsification || !recalculated) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { error } = await supabase.from("history").insert({
    user_email: session.user.email,
    input,
    bug_name: bugName,
    explanation,
    falsification,
    recalculated,
  });

  if (error) {
    console.error("History save error:", error);
    return NextResponse.json({ error: "failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
