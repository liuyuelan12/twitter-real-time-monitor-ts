import { redirect } from "next/navigation";
import { getCurrentUser, isSubscriptionActive } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const active = isSubscriptionActive(user);

  return (
    <DashboardClient
      user={{
        email: user.email,
        botToken: user.botToken ? "***configured***" : "",
        chatId: user.chatId ?? "",
        trialExpiresAt: user.trialExpiresAt.toISOString(),
        subscriptionActive: user.subscriptionActive,
        subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
        isActive: active,
      }}
      monitors={user.monitors.map((m) => ({
        id: m.id,
        twitterUsername: m.twitterUsername,
        enabled: m.enabled,
      }))}
    />
  );
}
