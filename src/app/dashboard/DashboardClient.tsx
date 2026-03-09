"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  email: string;
  botToken: string;
  chatId: string;
  trialExpiresAt: string;
  subscriptionActive: boolean;
  subscriptionExpiresAt: string | null;
  isActive: boolean;
}

interface MonitorInfo {
  id: string;
  twitterUsername: string;
  enabled: boolean;
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
  const [chatId, setChatId] = useState(user.chatId);
  const [configSaved, setConfigSaved] = useState(false);
  const [error, setError] = useState("");

  const trialEnd = new Date(user.trialExpiresAt);
  const now = new Date();
  const trialRemaining = Math.max(0, trialEnd.getTime() - now.getTime());
  const trialMinutes = Math.floor(trialRemaining / 60000);
  const trialHours = Math.floor(trialMinutes / 60);
  const trialMins = trialMinutes % 60;

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

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setConfigSaved(false);

    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken: botToken || undefined, chatId }),
    });

    setConfigSaved(true);
    setBotToken("");
    setTimeout(() => setConfigSaved(false), 3000);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          <span className="text-blue-400">Twitter</span> Monitor
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-white transition">
            Logout
          </button>
        </div>
      </div>

      {/* Subscription Status */}
      <div className={`p-4 rounded-xl border ${user.isActive ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="font-semibold">
              {user.subscriptionActive ? "Pro Plan" : "Free Trial"}
            </div>
            <div className="text-sm text-gray-400">
              {user.isActive
                ? user.subscriptionActive
                  ? `Active until ${new Date(user.subscriptionExpiresAt!).toLocaleDateString()}`
                  : `${trialHours}h ${trialMins}m remaining`
                : "Expired"}
            </div>
          </div>
          {!user.subscriptionActive && (
            <a
              href="/pricing"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition"
            >
              Upgrade
            </a>
          )}
        </div>
      </div>

      {/* Telegram Config */}
      <div className="p-6 bg-gray-900 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold">Telegram Configuration</h2>
        <p className="text-sm text-gray-400">
          Get a Bot Token from{" "}
          <a href="https://t.me/BotFather" target="_blank" className="text-blue-400 hover:underline">
            @BotFather
          </a>{" "}
          and your Chat ID from{" "}
          <a href="https://t.me/userinfobot" target="_blank" className="text-blue-400 hover:underline">
            @userinfobot
          </a>
        </p>
        <form onSubmit={saveConfig} className="space-y-3">
          <input
            type="text"
            placeholder={user.botToken || "Bot Token (from @BotFather)"}
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
          />
          <input
            type="text"
            placeholder="Chat ID (e.g., -1001234567890)"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition"
          >
            {configSaved ? "Saved!" : "Save Config"}
          </button>
        </form>
      </div>

      {/* Monitors */}
      <div className="p-6 bg-gray-900 rounded-xl space-y-4">
        <h2 className="text-lg font-semibold">Monitored Accounts</h2>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={addMonitor} className="flex gap-2">
          <input
            type="text"
            placeholder="@username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
            className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition"
          >
            Add
          </button>
        </form>

        {monitors.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">
            No monitors yet. Add a Twitter account to start.
          </p>
        ) : (
          <div className="space-y-2">
            {monitors.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMonitor(m.id, !m.enabled)}
                    className={`w-10 h-5 rounded-full relative transition ${m.enabled ? "bg-blue-500" : "bg-gray-600"}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${m.enabled ? "translate-x-5" : "translate-x-0.5"}`}
                    />
                  </button>
                  <span className={m.enabled ? "text-white" : "text-gray-500"}>
                    @{m.twitterUsername}
                  </span>
                </div>
                <button
                  onClick={() => deleteMonitor(m.id)}
                  className="text-gray-500 hover:text-red-400 text-sm transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500">{monitors.length}/10 monitors used</p>
      </div>
    </div>
  );
}
