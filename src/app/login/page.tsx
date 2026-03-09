"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "choose" | "otp_email" | "otp_verify" | "password";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setError("");
    setCode("");
    setPassword("");
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setMode("otp_verify");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/dashboard");
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-brand-400">
                <path d="M22 4s-1.2.6-2 .7a4 4 0 00-5.8 3.6V9A10 10 0 013 4s-4 9 5 13a11 11 0 01-7 2c9 5 20 0 20-11.5 0-.3 0-.5 0-.8A7 7 0 0022 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tweet<span className="text-brand-400">Pipe</span>
            </h1>
          </div>
          <p className="text-text-muted text-sm">
            {mode === "choose" && "Sign in or create an account"}
            {mode === "otp_email" && "We'll send a verification code to your email"}
            {mode === "otp_verify" && "Enter the code we sent to your email"}
            {mode === "password" && "Sign in with your email and password"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-danger/5 border border-danger/15 rounded-xl text-danger text-sm animate-slide-in">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 shrink-0">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
            </svg>
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="p-6 bg-surface-1 border border-border rounded-2xl">

          {/* Mode: Choose */}
          {mode === "choose" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <button
                onClick={() => { if (!email.trim()) { setError("Please enter your email"); return; } reset(); setMode("password"); }}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Sign in with Password
              </button>
              <button
                onClick={() => { if (!email.trim()) { setError("Please enter your email"); return; } reset(); setMode("otp_email"); }}
                className="w-full py-2.5 bg-surface-3 hover:bg-surface-4 border border-border rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Sign in with Email Code
              </button>
              <p className="text-center text-[11px] text-text-muted pt-1">
                New user? Use Email Code to register automatically.
              </p>
            </div>
          )}

          {/* Mode: OTP - enter email */}
          {mode === "otp_email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                {loading ? <Spinner text="Sending..." /> : "Send Verification Code"}
              </button>
              <BackButton onClick={() => { reset(); setMode("choose"); }} />
            </form>
          )}

          {/* Mode: OTP - verify code */}
          {mode === "otp_verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-sm text-text-secondary">
                  Code sent to <span className="text-text-primary font-medium">{email}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Verification code</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full px-3.5 py-3 bg-surface-2 border border-border rounded-xl text-center text-xl tracking-[0.3em] font-mono placeholder:text-text-muted focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                {loading ? <Spinner text="Verifying..." /> : "Verify & Sign In"}
              </button>
              <BackButton onClick={() => { reset(); setMode("otp_email"); }} label="Resend code" />
            </form>
          )}

          {/* Mode: Password login */}
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                {loading ? <Spinner text="Signing in..." /> : "Sign In"}
              </button>
              <div className="flex items-center justify-between">
                <BackButton onClick={() => { reset(); setMode("choose"); }} />
                <button
                  type="button"
                  onClick={() => { reset(); setMode("otp_email"); }}
                  className="text-xs text-text-muted hover:text-brand-400 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      {text}
    </span>
  );
}

function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
    >
      {label}
    </button>
  );
}
