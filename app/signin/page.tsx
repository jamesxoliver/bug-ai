"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <div className="min-h-dvh bg-warm-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {/* Wordmark */}
        <div className="mb-10 inline-flex items-center gap-0.5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-warm-accent">
            <path d="M9 8L7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M15 8L17 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <ellipse cx="12" cy="14" rx="5" ry="6" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="8" r="2.5" stroke="currentColor" strokeWidth="2"/>
            <path d="M7 12L4 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M7 15L4 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M17 12L20 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M17 15L20 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M7.5 14H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h1 className="text-4xl font-bold text-warm-text tracking-tight">bug</h1>
        </div>

        <p className="text-warm-muted text-base mb-8">
          sign in to unlock pattern analysis and full history
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full flex items-center justify-center gap-3 bg-white border border-warm-border/50 hover:border-warm-border rounded-lg px-6 py-3 text-warm-text font-semibold text-base transition-all press"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          continue with google
        </button>

        <p className="text-warm-muted/60 text-xs mt-6">
          free features don&apos;t require an account
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-warm-bg" />}>
      <SignInContent />
    </Suspense>
  );
}
