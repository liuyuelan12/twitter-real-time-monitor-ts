"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLanguage } from "@/components/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type AuthMode = "choose" | "otp_email" | "otp_verify" | "password";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignup = searchParams.get("mode") === "signup";
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>(isSignup ? "otp_email" : "choose");
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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-12">
      <div className="absolute top-8 right-8">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand-400">
                <path d="M22 4s-1.2.6-2 .7a4 4 0 00-5.8 3.6V9A10 10 0 013 4s-4 9 5 13a11 11 0 01-7 2c9 5 20 0 20-11.5 0-.3 0-.5 0-.8A7 7 0 0022 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          </div>
          <p className="text-text-secondary text-sm">
            {mode === "choose" && t.login.signInAccount}
            {mode === "otp_email" && (isSignup ? t.login.createAccount : t.login.sendCode)}
            {mode === "otp_verify" && t.login.enterCode}
            {mode === "password" && t.login.signInEmailPassword}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-sm animate-slide-up">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
            </svg>
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="p-8 glass rounded-[2rem] shadow-2xl">

          {/* Mode: Choose */}
          {mode === "choose" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">{t.login.emailAddress}</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-base placeholder:text-text-muted focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                />
              </div>
              <button
                onClick={() => { if (!email.trim()) { setError("Please enter your email"); return; } reset(); setMode("password"); }}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-500/25 cursor-pointer"
              >
                {t.login.signInPassword}
              </button>
              <button
                onClick={() => { if (!email.trim()) { setError("Please enter your email"); return; } reset(); setMode("otp_email"); }}
                className="w-full py-3.5 bg-surface-3 hover:bg-surface-4 border border-border rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                {t.login.signInEmailCode}
              </button>
              <div className="relative flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-muted font-medium">{t.login.or}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <p className="text-center text-sm text-text-secondary">
                {t.login.noAccount}{" "}
                <button
                  onClick={() => { reset(); setMode("otp_email"); }}
                  className="text-brand-400 font-bold hover:text-brand-300 transition-colors cursor-pointer"
                >
                  {t.login.signUpEmailCode}
                </button>
              </p>
            </div>
          )}

          {/* Mode: OTP - enter email */}
          {mode === "otp_email" && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">{t.login.emailAddress}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-base focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] shadow-lg shadow-brand-500/25 cursor-pointer"
              >
                {loading ? <Spinner text={t.login.sending} /> : t.login.sendVerificationCode}
              </button>
              <BackButton onClick={() => { reset(); setMode("choose"); }} />
            </form>
          )}

          {/* Mode: OTP - verify code */}
          {mode === "otp_verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center">
                <div className="text-sm text-text-secondary">
                  {t.login.codeSentTo} <span className="text-text-primary font-bold">{email}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider text-center">{t.login.verificationCode}</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full px-4 py-4 bg-surface-2 border border-border rounded-xl text-center text-3xl tracking-[0.4em] font-bold font-mono placeholder:text-text-muted focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] shadow-lg shadow-brand-500/25 cursor-pointer"
              >
                {loading ? <Spinner text={t.login.verifying} /> : t.login.verifySignIn}
              </button>
              <BackButton onClick={() => { reset(); setMode("otp_email"); }} label={t.login.resendCode} />
            </form>
          )}

          {/* Mode: Password login */}
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">{t.login.emailAddress}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-base focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">{t.login.password}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-base placeholder:text-text-muted focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] shadow-lg shadow-brand-500/25 cursor-pointer"
              >
                {loading ? <Spinner text={t.login.signingIn} /> : t.logIn}
              </button>
              <div className="flex items-center justify-between px-1">
                <BackButton onClick={() => { reset(); setMode("choose"); }} />
                <button
                  type="button"
                  onClick={() => { reset(); setMode("otp_email"); }}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
                >
                  {t.login.forgotPassword}
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
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {text}
    </span>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label?: string }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1 mx-auto"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {label || t.login.back}
    </button>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
