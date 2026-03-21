# Bug AI

## Status: SHELVED

Shelved 2026-03-18. Do not invest time here until Atlas exit closes ($7-10M).

## What It Is
Thought debugger. User submits a belief, gets back: named bug, explanation, counterexample, what's actually true. Next.js + Claude Sonnet API + Supabase + NextAuth.

## Why Shelved
- No moat. Wraps a single prompt that any free chatbot can replicate.
- Doesn't compound. No recurring revenue, no network effects, no flywheel.
- Opportunity cost is geometric. Every hour here is an hour not on Atlas exit → Anti scaling.

## What's Worth Keeping
- The "named bug" concept is strong. Naming a flaw gives cognitive power over it.
- The code works. Web app is functional with auth, history, follow-ups.

## If Revisited
- Needs retention mechanics: daily push prompts, personal bug log with pattern detection, decision journaling mode.
- Kill the "recalculated" field, replace with "the question you should be asking."
- Increase max_tokens from 400 to 800+.
- SMS/Telegram distribution is the trigger mechanism, not the web app.
- Custom-coined bug names (beyond standard fallacy taxonomy) are the brand differentiator.
