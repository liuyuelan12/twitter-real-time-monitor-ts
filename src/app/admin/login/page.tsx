"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-warning">
                <path d="M12 15v-2m0-4h.01M5.07 19h13.86c1.5 0 2.47-1.6 1.73-2.88L13.73 3.24a2 2 0 00-3.46 0L3.34 16.12C2.6 17.4 3.57 19 5.07 19z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Admin
            </h1>
          </div>
          <p className="text-text-muted text-sm">Enter admin password to continue</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2.5 p-3.5 bg-danger/5 border border-danger/15 rounded-xl text-danger text-sm animate-slide-in">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
            </svg>
            {error}
          </div>
        )}

        <div className="p-6 bg-surface-1 border border-border rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Admin password"
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
