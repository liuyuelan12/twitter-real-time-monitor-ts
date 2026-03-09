import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="text-blue-400">Twitter</span> Monitor
        </h1>
        <p className="text-xl text-gray-400">
          Real-time monitoring of Twitter accounts with automatic forwarding to your Telegram bot.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/login"
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
          >
            Get Started
          </a>
          <a
            href="/pricing"
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition"
          >
            Pricing
          </a>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-8 text-sm text-gray-500">
          <div className="p-4 bg-gray-900 rounded-lg">
            <div className="text-2xl font-bold text-white">Real-time</div>
            <div>60s polling interval</div>
          </div>
          <div className="p-4 bg-gray-900 rounded-lg">
            <div className="text-2xl font-bold text-white">10</div>
            <div>accounts per user</div>
          </div>
          <div className="p-4 bg-gray-900 rounded-lg">
            <div className="text-2xl font-bold text-white">3h</div>
            <div>free trial</div>
          </div>
        </div>
      </div>
    </div>
  );
}
