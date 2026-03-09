import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-xl text-center space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand-400">
              <path d="M22 4s-1.2.6-2 .7a4 4 0 00-5.8 3.6V9A10 10 0 013 4s-4 9 5 13a11 11 0 01-7 2c9 5 20 0 20-11.5 0-.3 0-.5 0-.8A7 7 0 0022 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <h1 className="text-5xl font-bold tracking-tight">
          Tweet<span className="text-brand-400">Pipe</span>
        </h1>
        <p className="text-lg text-text-secondary max-w-md mx-auto">
          Real-time monitoring of Twitter accounts with automatic forwarding to your Telegram groups.
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-3 justify-center pt-4">
          <a
            href="/login?mode=signup"
            className="px-8 py-3 bg-brand-500 hover:bg-brand-600 rounded-xl font-semibold text-sm transition-colors"
          >
            Sign Up Free
          </a>
          <a
            href="/login"
            className="px-8 py-3 bg-surface-2 hover:bg-surface-3 border border-border hover:border-border-hover rounded-xl font-semibold text-sm transition-colors"
          >
            Log In
          </a>
          <a
            href="/pricing"
            className="px-8 py-3 bg-surface-2 hover:bg-surface-3 border border-border hover:border-border-hover rounded-xl font-semibold text-sm transition-colors"
          >
            Pricing
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-8">
          {[
            { value: "Real-time", label: "60s polling interval" },
            { value: "10", label: "accounts per user" },
            { value: "3h", label: "free trial" },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-surface-1 border border-border rounded-2xl">
              <div className="text-2xl font-bold text-text-primary">{item.value}</div>
              <div className="text-xs text-text-muted mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
