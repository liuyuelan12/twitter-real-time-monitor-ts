"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  email: string;
  createdAt: string;
  trialExpiresAt: string;
  subscriptionActive: boolean;
  subscriptionExpiresAt: string | null;
  botToken: string | null;
  chatId: string | null;
  monitors: { id: string; twitterUsername: string; enabled: boolean }[];
}

type ModalType =
  | { kind: "activate"; user: UserData }
  | { kind: "extend_trial"; user: UserData }
  | { kind: "extend_sub"; user: UserData }
  | { kind: "create_user" }
  | { kind: "delete"; user: UserData }
  | null;

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [days, setDays] = useState("30");
  const [newEmail, setNewEmail] = useState("");
  const [newTrialHours, setNewTrialHours] = useState("3");
  const [newSubDays, setNewSubDays] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState("");

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleAction(userId: string, action: string, extraDays?: number) {
    setActionLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, days: extraDays }),
    });
    setActionLoading(false);

    if (!res.ok) {
      const data = await res.json();
      showToast(`Error: ${data.error}`);
      return;
    }

    setModal(null);
    showToast("Done");
    fetchUsers();
  }

  async function handleCreateUser() {
    if (!newEmail.trim()) return;
    setActionLoading(true);

    const res = await fetch("/api/admin/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newEmail.trim(),
        trialHours: Number(newTrialHours) || 3,
        subscriptionDays: newSubDays ? Number(newSubDays) : undefined,
      }),
    });

    const data = await res.json();
    setActionLoading(false);

    if (!res.ok) {
      showToast(`Error: ${data.error}`);
      return;
    }

    setModal(null);
    setNewEmail("");
    setNewTrialHours("3");
    setNewSubDays("");
    showToast("User created");
    fetchUsers();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  function getStatus(u: UserData): { label: string; color: string } {
    const now = new Date();
    if (u.subscriptionActive && u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) > now) {
      return { label: "Pro", color: "text-brand-400 bg-brand-500/10 border-brand-500/20" };
    }
    if (new Date(u.trialExpiresAt) > now) {
      return { label: "Trial", color: "text-success bg-success/10 border-success/20" };
    }
    return { label: "Expired", color: "text-danger bg-danger/10 border-danger/20" };
  }

  function formatDate(d: string | null): string {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function timeRemaining(d: string): string {
    const diff = new Date(d).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const totalMins = Math.floor(diff / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs > 24) {
      const daysLeft = Math.floor(hrs / 24);
      return `${daysLeft}d ${hrs % 24}h`;
    }
    return `${hrs}h ${mins}m`;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-warning">
              <path d="M12 15v-2m0-4h.01M5.07 19h13.86c1.5 0 2.47-1.6 1.73-2.88L13.73 3.24a2 2 0 00-3.46 0L3.34 16.12C2.6 17.4 3.57 19 5.07 19z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal({ kind: "create_user" })}
            className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            + Add User
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-surface-3 rounded-lg transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: users.length },
          { label: "Active", value: users.filter((u) => getStatus(u).label !== "Expired").length },
          { label: "Pro", value: users.filter((u) => getStatus(u).label === "Pro").length },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-surface-1 border border-border">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm font-medium shadow-lg animate-slide-in z-50">
          {toast}
        </div>
      )}

      {/* User Table */}
      <section className="rounded-2xl border border-border bg-surface-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">All Users</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-text-muted text-sm">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-sm">No users yet</div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u) => {
              const status = getStatus(u);
              return (
                <div key={u.id} className="px-6 py-4 hover:bg-surface-2/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-sm font-medium truncate">{u.email}</span>
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted">
                        <span>Joined {formatDate(u.createdAt)}</span>
                        <span>Trial: {timeRemaining(u.trialExpiresAt)}</span>
                        {u.subscriptionExpiresAt && (
                          <span>Sub: {timeRemaining(u.subscriptionExpiresAt)}</span>
                        )}
                        <span>Monitors: {u.monitors.length}</span>
                        <span>Bot: {u.botToken ? "Set" : "No"}</span>
                        <span>Groups: {u.chatId ? u.chatId.split(",").length : 0}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      {status.label !== "Pro" && (
                        <button
                          onClick={() => { setDays("30"); setModal({ kind: "activate", user: u }); }}
                          className="px-2.5 py-1 text-[11px] font-medium text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          Activate
                        </button>
                      )}
                      {status.label === "Pro" && (
                        <button
                          onClick={() => { setDays("30"); setModal({ kind: "extend_sub", user: u }); }}
                          className="px-2.5 py-1 text-[11px] font-medium text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          Extend
                        </button>
                      )}
                      <button
                        onClick={() => { setDays("1"); setModal({ kind: "extend_trial", user: u }); }}
                        className="px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:bg-surface-3 rounded-lg transition-colors cursor-pointer"
                      >
                        +Trial
                      </button>
                      {u.subscriptionActive && (
                        <button
                          onClick={() => handleAction(u.id, "deactivate_subscription")}
                          className="px-2.5 py-1 text-[11px] font-medium text-warning hover:bg-warning/10 rounded-lg transition-colors cursor-pointer"
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => setModal({ kind: "delete", user: u })}
                        className="px-2.5 py-1 text-[11px] font-medium text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Overlay */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setModal(null)}>
          <div
            className="w-full max-w-sm bg-surface-1 border border-border rounded-2xl p-6 space-y-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {modal.kind === "activate" && (
              <>
                <h3 className="text-sm font-semibold">Activate Subscription</h3>
                <p className="text-xs text-text-muted">
                  Activate Pro plan for <span className="text-text-primary">{modal.user.email}</span>
                </p>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Duration (days)</label>
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModal(null)}
                    className="flex-1 py-2 bg-surface-3 hover:bg-surface-4 rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAction(modal.user.id, "activate_subscription", Number(days))}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {actionLoading ? "..." : "Activate"}
                  </button>
                </div>
              </>
            )}

            {modal.kind === "extend_trial" && (
              <>
                <h3 className="text-sm font-semibold">Extend Trial</h3>
                <p className="text-xs text-text-muted">
                  Extend trial for <span className="text-text-primary">{modal.user.email}</span>
                </p>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Add days</label>
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModal(null)} className="flex-1 py-2 bg-surface-3 hover:bg-surface-4 rounded-xl text-sm transition-colors cursor-pointer">Cancel</button>
                  <button
                    onClick={() => handleAction(modal.user.id, "extend_trial", Number(days))}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {actionLoading ? "..." : "Extend"}
                  </button>
                </div>
              </>
            )}

            {modal.kind === "extend_sub" && (
              <>
                <h3 className="text-sm font-semibold">Extend Subscription</h3>
                <p className="text-xs text-text-muted">
                  Extend Pro plan for <span className="text-text-primary">{modal.user.email}</span>
                </p>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Add days</label>
                  <input
                    type="number"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand-500/50 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModal(null)} className="flex-1 py-2 bg-surface-3 hover:bg-surface-4 rounded-xl text-sm transition-colors cursor-pointer">Cancel</button>
                  <button
                    onClick={() => handleAction(modal.user.id, "extend_subscription", Number(days))}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {actionLoading ? "..." : "Extend"}
                  </button>
                </div>
              </>
            )}

            {modal.kind === "create_user" && (
              <>
                <h3 className="text-sm font-semibold">Create User</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="user@example.com"
                      autoFocus
                      className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Trial hours</label>
                    <input
                      type="number"
                      value={newTrialHours}
                      onChange={(e) => setNewTrialHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm focus:outline-none focus:border-brand-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Subscription days (optional, auto-activate Pro)</label>
                    <input
                      type="number"
                      value={newSubDays}
                      onChange={(e) => setNewSubDays(e.target.value)}
                      placeholder="Leave empty for trial only"
                      className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModal(null)} className="flex-1 py-2 bg-surface-3 hover:bg-surface-4 rounded-xl text-sm transition-colors cursor-pointer">Cancel</button>
                  <button
                    onClick={handleCreateUser}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {actionLoading ? "..." : "Create"}
                  </button>
                </div>
              </>
            )}

            {modal.kind === "delete" && (
              <>
                <h3 className="text-sm font-semibold text-danger">Delete User</h3>
                <p className="text-xs text-text-muted">
                  Permanently delete <span className="text-text-primary">{modal.user.email}</span> and all their monitors?
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setModal(null)} className="flex-1 py-2 bg-surface-3 hover:bg-surface-4 rounded-xl text-sm transition-colors cursor-pointer">Cancel</button>
                  <button
                    onClick={() => handleAction(modal.user.id, "delete")}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-danger hover:bg-danger/80 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {actionLoading ? "..." : "Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
