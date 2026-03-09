"use client";

import { useLanguage } from "@/components/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center glass">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-brand-400">
              <path d="M22 4s-1.2.6-2 .7a4 4 0 00-5.8 3.6V9A10 10 0 013 4s-4 9 5 13a11 11 0 01-7 2c9 5 20 0 20-11.5 0-.3 0-.5 0-.8A7 7 0 0022 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">{t.title}</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/pricing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            {t.pricing}
          </a>
          <a href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            {t.logIn}
          </a>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-8 max-w-3xl animate-fade-in">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-4 animate-pulse-soft">
            ✨ {t.stats.realtimeLabel}
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            {t.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">Pipe</span>
          </h1>

          <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
            {t.tagline}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="/login?mode=signup"
              className="px-10 py-4 bg-brand-500 hover:bg-brand-600 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-brand-500/20"
            >
              {t.signUpFree}
            </a>
            <a
              href="/login"
              className="px-10 py-4 bg-surface-2 hover:bg-surface-3 border border-border hover:border-border-hover rounded-2xl font-bold text-lg transition-all"
            >
              {t.logIn}
            </a>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full animate-slide-up">
          {[
            { value: t.stats.realtime, label: t.stats.realtimeLabel, icon: "⚡" },
            { value: t.stats.accounts, label: t.stats.accountsLabel, icon: "👥" },
            { value: t.stats.trial, label: t.stats.trialLabel, icon: "🎁" },
          ].map((item) => (
            <div key={item.label} className="p-8 rounded-3xl glass glass-hover transition-all">
              <div className="text-3xl mb-4">{item.icon}</div>
              <div className="text-3xl font-bold text-text-primary">{item.value}</div>
              <div className="text-sm text-text-muted mt-2">{item.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full h-[800px] pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[-10%] right-[10%] w-[30%] h-[30%] bg-brand-600/5 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}
