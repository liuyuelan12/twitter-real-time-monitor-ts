"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface UserInfo {
  email: string;
  botToken: string;
  chatIds: string[];
  trialExpiresAt: string;
  subscriptionActive: boolean;
  subscriptionExpiresAt: string | null;
  isActive: boolean;
  hasPassword: boolean;
}

interface MonitorInfo {
  id: string;
  twitterUsername: string;
  enabled: boolean;
}

interface DetectedChat {
  id: number;
  title: string;
  username?: string;
  type: string;
}

// --- Icons ---
function IconTwitter({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-1.2.6-2 .7a4 4 0 00-5.8 3.6V9A10 10 0 013 4s-4 9 5 13a11 11 0 01-7 2c9 5 20 0 20-11.5 0-.3 0-.5 0-.8A7 7 0 0022 4z" />
    </svg>
  );
}

function IconTelegram({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.2 4.6L2.5 11.1c-.6.2-.6.6 0 .8l4.6 1.5 1.8 5.6c.2.5.7.5 1 .2l2.6-2.1 4.6 3.4c.5.4 1 .2 1.1-.4L21.8 5.4c.2-.7-.3-1.1-.6-.8z" />
      <path d="M8.9 13.4l9.3-7.5" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

export default function DashboardClient({
  user,
  monitors: initialMonitors,
}: {
  user: UserInfo;
  monitors: MonitorInfo[];
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [monitors, setMonitors] = useState(initialMonitors);
  const [newUsername, setNewUsername] = useState("");
  const [botToken, setBotToken] = useState("");
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>(user.chatIds);
  const [manualChatId, setManualChatId] = useState("");
  const [configSaved, setConfigSaved] = useState(false);
  const [error, setError] = useState("");
  const [detectedChats, setDetectedChats] = useState<DetectedChat[]>([]);
  const [detectingChats, setDetectingChats] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [hasPassword, setHasPassword] = useState(user.hasPassword);

  const trialEnd = new Date(user.trialExpiresAt);
  const now = new Date();
  const trialRemaining = Math.max(0, trialEnd.getTime() - now.getTime());
  const trialMinutes = Math.floor(trialRemaining / 60000);
  const trialHours = Math.floor(trialMinutes / 60);
  const trialMins = trialMinutes % 60;

  function toggleChatId(id: string) {
    setSelectedChatIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function addManualChatId(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = manualChatId.trim();
    if (!trimmed || selectedChatIds.includes(trimmed)) return;
    setSelectedChatIds([...selectedChatIds, trimmed]);
    setManualChatId("");
  }

  function removeChatId(id: string) {
    setSelectedChatIds(selectedChatIds.filter((c) => c !== id));
  }

  async function addMonitor(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!user.isActive) {
      setError("Your trial has expired. Please subscribe to continue.");
      return;
    }

    const res = await fetch("/api/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ twitterUsername: newUsername }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setMonitors([{ id: data.id, twitterUsername: data.twitterUsername, enabled: data.enabled }, ...monitors]);
    setNewUsername("");
  }

  async function toggleMonitor(id: string, enabled: boolean) {
    await fetch(`/api/monitors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setMonitors(monitors.map((m) => (m.id === id ? { ...m, enabled } : m)));
  }

  async function deleteMonitor(id: string) {
    await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    setMonitors(monitors.filter((m) => m.id !== id));
  }

  async function detectChats() {
    setDetectingChats(true);
    setDetectedChats([]);
    setError("");

    const res = await fetch("/api/telegram/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken: botToken || undefined }),
    });

    const data = await res.json();
    setDetectingChats(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    if (data.chats.length === 0) {
      setError("No groups found. Add the bot to a group, send a message, then try again.");
      return;
    }

    setDetectedChats(data.chats);
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setConfigSaved(false);

    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken: botToken || undefined, chatIds: selectedChatIds }),
    });

    setConfigSaved(true);
    setBotToken("");
    setTimeout(() => setConfigSaved(false), 3000);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!res.ok) {
      const data = await res.json();
      setPasswordError(data.error);
      return;
    }

    setPasswordSaved(true);
    setHasPassword(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 3000);
  }

  function getChatLabel(id: string): string {
    const chat = detectedChats.find((c) => String(c.id) === id);
    if (chat) {
      return chat.username ? `@${chat.username}` : chat.title;
    }
    return id;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10 animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center bg-surface-1/50 backdrop-blur-md sticky top-0 z-40 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <IconTwitter className="w-5 h-5 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t.dashboard.monitoredAccounts.includes("监控") ? "推管" : "Tweet"}<span className="text-brand-400">Pipe</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-text-primary">{user.email}</span>
            <button
              onClick={logout}
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-widest cursor-pointer"
            >
              {t.dashboard.signOut}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className={`relative overflow-hidden p-8 rounded-[2rem] glass transition-all ${user.isActive ? "shadow-lg shadow-success/5" : "shadow-lg shadow-danger/5"
        }`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${user.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              }`}>
              <div className={`w-4 h-4 rounded-full ${user.isActive ? "bg-success animate-pulse-soft" : "bg-danger"}`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {user.subscriptionActive ? t.dashboard.proPlan : t.dashboard.freeTrial}
              </h2>
              <p className="text-text-secondary font-medium">
                {user.isActive
                  ? user.subscriptionActive
                    ? `${t.dashboard.activeUntil} ${new Date(user.subscriptionExpiresAt!).toLocaleDateString()}`
                    : `${trialHours}h ${trialMins}m ${t.dashboard.remaining}`
                  : t.dashboard.expired}
              </p>
            </div>
          </div>
          {!user.subscriptionActive && (
            <a
              href="/pricing"
              className="px-8 py-3.5 bg-brand-500 hover:bg-brand-600 rounded-2xl text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-brand-500/20"
            >
              {t.dashboard.upgrade}
            </a>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-danger/5 border border-danger/15 rounded-xl text-danger text-sm animate-slide-in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 shrink-0">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
          </svg>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
            <IconX />
          </button>
        </div>
      )}

      {/* Telegram Configuration */}
      <section className="rounded-2xl border border-border bg-surface-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2.5">
          <IconTelegram className="w-[18px] h-[18px] text-brand-400" />
          <h2 className="text-sm font-semibold">Telegram Configuration</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Steps Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: "1", text: <>Get a Bot Token from <a href="https://t.me/BotFather" target="_blank" className="text-brand-400 hover:underline">@BotFather</a></> },
              { step: "2", text: "Add the bot to your group and make it admin" },
              { step: "3", text: "Send a message in the group, then detect below" },
            ].map((item) => (
              <div key={item.step} className="flex gap-2.5 p-3 rounded-xl bg-surface-2/50">
                <span className="shrink-0 w-5 h-5 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-bold flex items-center justify-center">
                  {item.step}
                </span>
                <p className="text-xs text-text-muted leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={saveConfig} className="space-y-4">
            {/* Bot Token Input */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Bot Token</label>
              <input
                type="text"
                placeholder={user.botToken || "Paste your bot token here"}
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm font-mono placeholder:text-text-muted focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>

            {/* Detect Groups Button */}
            <button
              type="button"
              onClick={detectChats}
              disabled={detectingChats}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-3 hover:bg-surface-4 border border-border hover:border-border-hover disabled:opacity-50 rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              {detectingChats ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Detecting...
                </>
              ) : (
                <>
                  <IconSearch />
                  Detect Groups
                </>
              )}
            </button>

            {/* Detected Chats */}
            {detectedChats.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <div className="text-xs font-medium text-text-muted">
                  Select groups to forward tweets to:
                </div>
                {detectedChats.map((c) => {
                  const idStr = String(c.id);
                  const isSelected = selectedChatIds.includes(idStr);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected
                        ? "bg-brand-500/[0.06] border border-brand-500/25 shadow-[0_0_0_1px_rgba(59,130,246,0.08)]"
                        : "bg-surface-2 border border-border hover:border-border-hover"
                        }`}
                    >
                      <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${isSelected
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "border-border-hover bg-surface-3"
                        }`}>
                        {isSelected && <IconCheck />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {c.username ? `@${c.username}` : c.title}
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {c.type} &middot; {c.id}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Selected Chat Tags */}
            {selectedChatIds.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-text-muted">
                  {selectedChatIds.length} group{selectedChatIds.length > 1 ? "s" : ""} selected
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedChatIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-brand-500/8 border border-brand-500/15 rounded-lg text-xs font-medium text-brand-400 animate-slide-in"
                    >
                      {getChatLabel(id)}
                      <button
                        type="button"
                        onClick={() => removeChatId(id)}
                        className="p-0.5 rounded hover:bg-danger/10 hover:text-danger transition-colors cursor-pointer"
                      >
                        <IconX />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Chat ID */}
            {showManualInput ? (
              <div className="flex gap-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="-1001234567890"
                  value={manualChatId}
                  onChange={(e) => setManualChatId(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-surface-2 border border-border rounded-xl text-sm font-mono placeholder:text-text-muted focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={addManualChatId}
                  className="px-3.5 py-2 bg-surface-3 hover:bg-surface-4 border border-border rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
              >
                + Add Chat ID manually
              </button>
            )}

            {/* Save Button */}
            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${configSaved
                ? "bg-success/10 text-success border border-success/20"
                : "bg-brand-500 hover:bg-brand-600 text-white"
                }`}
            >
              {configSaved ? (
                <span className="inline-flex items-center gap-1.5">
                  <IconCheck /> Saved
                </span>
              ) : "Save Configuration"}
            </button>
          </form>
        </div>
      </section>

      <div className="space-y-10">
        {/* Monitored Accounts */}
        <section className="rounded-[2rem] glass overflow-hidden">
          <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconTwitter className="w-5 h-5 text-brand-400" />
              <h3 className="text-lg font-bold">{t.dashboard.monitoredAccounts}</h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-brand-500/10 text-brand-400 rounded-full border border-brand-500/20">
              {monitors.length}/10
            </span>
          </div>

          <div className="p-8 space-y-6">
            <form onSubmit={addMonitor} className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">@</span>
                <input
                  type="text"
                  placeholder={t.dashboard.username}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-3 bg-surface-2 border border-border rounded-xl text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-brand-500 hover:bg-brand-600 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2"
              >
                <IconPlus /> {t.dashboard.add}
              </button>
            </form>

            {monitors.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-20 h-20 rounded-3xl bg-surface-2/60 flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <IconTwitter className="w-10 h-10 text-text-muted/40" />
                </div>
                <p className="text-text-primary font-bold">{t.dashboard.noAccountsMonitored}</p>
                <p className="text-text-muted text-sm mt-2">{t.dashboard.addTwitterUsername}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monitors.map((m, i) => (
                  <div
                    key={m.id}
                    className="group flex items-center justify-between p-4 rounded-2xl bg-surface-2/40 border border-white/5 hover:border-brand-500/30 hover:bg-brand-500/[0.03] transition-all animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleMonitor(m.id, !m.enabled)}
                        className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${m.enabled ? "bg-brand-500" : "bg-surface-4 shadow-inner"
                          }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform ${m.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                      </button>
                      <span className={`text-base font-bold transition-colors ${m.enabled ? "text-text-primary" : "text-text-muted"
                        }`}>
                        @{m.twitterUsername}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteMonitor(m.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-danger/10 text-text-muted hover:text-danger transition-all cursor-pointer"
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Account Security */}
        <section className="rounded-[2rem] glass overflow-hidden">
          <div className="px-8 py-6 border-b border-border/50 flex items-center gap-3">
            <div className="w-5 h-5 text-brand-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold">{t.dashboard.accountSecurity}</h3>
            {hasPassword && (
              <span className="ml-auto text-xs font-bold text-success bg-success/10 px-3 py-1 rounded-full border border-success/20">
                {t.dashboard.passwordSet}
              </span>
            )}
          </div>
          <div className="p-8">
            <p className="text-sm text-text-secondary font-medium mb-8">
              {hasPassword ? t.dashboard.updatePasswordMsg : t.dashboard.setPasswordMsg}
            </p>

            <form onSubmit={handleSetPassword} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-widest">
                    {hasPassword ? t.dashboard.newPassword : t.dashboard.password}
                  </label>
                  <input
                    type="password"
                    placeholder={t.dashboard.atLeast6Chars}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-widest">{t.dashboard.confirmPassword}</label>
                  <input
                    type="password"
                    placeholder={t.dashboard.reenterPassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg ${passwordSaved
                  ? "bg-success/10 text-success border border-success/30 shadow-success/10"
                  : "bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/25"
                  }`}
              >
                {passwordSaved ? t.dashboard.passwordSaved : hasPassword ? t.dashboard.updatePassword : t.dashboard.setPassword}
              </button>
            </form>
          </div>
        </section>
      </div>
      {/* Footer */}
      <footer className="text-center pt-10 pb-4 border-t border-border/30">
        <p className="text-xs font-medium text-text-muted uppercase tracking-[0.2em]">
          {t.dashboard.footerMsg} {selectedChatIds.length} {t.dashboard.groupsSelected}
        </p>
      </footer>
    </div>
  );
}
