"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-1.2.6-2 .7a4 4 0 00-5.8 3.6V9A10 10 0 013 4s-4 9 5 13a11 11 0 01-7 2c9 5 20 0 20-11.5 0-.3 0-.5 0-.8A7 7 0 0022 4z"/>
    </svg>
  );
}

function IconTelegram({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.2 4.6L2.5 11.1c-.6.2-.6.6 0 .8l4.6 1.5 1.8 5.6c.2.5.7.5 1 .2l2.6-2.1 4.6 3.4c.5.4 1 .2 1.1-.4L21.8 5.4c.2-.7-.3-1.1-.6-.8z"/>
      <path d="M8.9 13.4l9.3-7.5"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2.5a.75.75 0 01.75.75v4h4a.75.75 0 010 1.5h-4v4a.75.75 0 01-1.5 0v-4h-4a.75.75 0 010-1.5h4v-4A.75.75 0 018 2.5z"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.28 3.22a.75.75 0 00-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 101.06 1.06L8 9.06l3.72 3.72a.75.75 0 101.06-1.06L9.06 8l3.72-3.72a.75.75 0 00-1.06-1.06L8 6.94 4.28 3.22z"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
      <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zM11 3V1.75A1.75 1.75 0 009.25 0h-2.5A1.75 1.75 0 005 1.75V3H2.75a.75.75 0 000 1.5h.68l.71 9.25A1.75 1.75 0 005.89 15.5h4.22a1.75 1.75 0 001.75-1.75L12.57 4.5h.68a.75.75 0 000-1.5H11z"/>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="opacity-50">
      <path d="M11.5 7a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z"/>
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <IconTwitter className="w-[18px] h-[18px] text-brand-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Tweet<span className="text-brand-400">Pipe</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted hidden sm:block">{user.email}</span>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-surface-3 rounded-lg transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Status Banner */}
      <div className={`relative overflow-hidden p-4 rounded-2xl border ${
        user.isActive
          ? "bg-success/[0.03] border-success/15"
          : "bg-danger/[0.03] border-danger/15"
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${user.isActive ? "bg-success animate-pulse-dot" : "bg-danger"}`} />
            <div>
              <div className="text-sm font-semibold">
                {user.subscriptionActive ? "Pro Plan" : "Free Trial"}
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {user.isActive
                  ? user.subscriptionActive
                    ? `Active until ${new Date(user.subscriptionExpiresAt!).toLocaleDateString()}`
                    : `${trialHours}h ${trialMins}m remaining`
                  : "Expired — upgrade to continue monitoring"}
              </div>
            </div>
          </div>
          {!user.subscriptionActive && (
            <a
              href="/pricing"
              className="shrink-0 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 rounded-lg text-xs font-semibold transition-colors"
            >
              Upgrade
            </a>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-danger/5 border border-danger/15 rounded-xl text-danger text-sm animate-slide-in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 shrink-0">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
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
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-brand-500/[0.06] border border-brand-500/25 shadow-[0_0_0_1px_rgba(59,130,246,0.08)]"
                          : "bg-surface-2 border border-border hover:border-border-hover"
                      }`}
                    >
                      <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected
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
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                configSaved
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

      {/* Monitored Accounts */}
      <section className="rounded-2xl border border-border bg-surface-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconTwitter className="w-[18px] h-[18px] text-brand-400" />
            <h2 className="text-sm font-semibold">Monitored Accounts</h2>
          </div>
          <span className="text-[11px] text-text-muted font-medium px-2 py-0.5 bg-surface-3 rounded-md">
            {monitors.length}/10
          </span>
        </div>

        <div className="p-6 space-y-4">
          {/* Add Monitor */}
          <form onSubmit={addMonitor} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
              <input
                type="text"
                placeholder="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                className="w-full pl-7 pr-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <IconPlus /> Add
            </button>
          </form>

          {/* Monitor List */}
          {monitors.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-3">
                <IconTwitter className="w-6 h-6 text-text-muted" />
              </div>
              <p className="text-text-muted text-sm">No accounts monitored yet</p>
              <p className="text-text-muted text-xs mt-1">Add a Twitter username above to start</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {monitors.map((m, i) => (
                <div
                  key={m.id}
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-surface-2/80 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleMonitor(m.id, !m.enabled)}
                      className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                        m.enabled ? "bg-brand-500" : "bg-surface-4"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                          m.enabled ? "left-[18px]" : "left-0.5"
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium transition-colors ${
                      m.enabled ? "text-text-primary" : "text-text-muted"
                    }`}>
                      @{m.twitterUsername}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteMonitor(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-all cursor-pointer"
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
      <section className="rounded-2xl border border-border bg-surface-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-brand-400" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <h2 className="text-sm font-semibold">Account Security</h2>
          {hasPassword && (
            <span className="ml-auto text-[11px] text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-md font-medium">
              Password set
            </span>
          )}
        </div>
        <div className="p-6">
          <p className="text-xs text-text-muted mb-4">
            {hasPassword ? "Update your login password." : "Set a password so you can sign in without email code."}
          </p>

          {passwordError && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-danger/5 border border-danger/15 rounded-xl text-danger text-sm animate-slide-in">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
              </svg>
              {passwordError}
            </div>
          )}

          <form onSubmit={handleSetPassword} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {hasPassword ? "New password" : "Password"}
              </label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm password</label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                passwordSaved
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-brand-500 hover:bg-brand-600 text-white"
              }`}
            >
              {passwordSaved ? "Password Saved" : hasPassword ? "Update Password" : "Set Password"}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-4">
        <p className="text-[11px] text-text-muted">
          Polling every 60s &middot; Tweets forwarded to {selectedChatIds.length} group{selectedChatIds.length !== 1 ? "s" : ""}
        </p>
      </footer>
    </div>
  );
}
