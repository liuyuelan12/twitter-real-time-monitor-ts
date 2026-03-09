import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold">
            <span className="text-blue-400">Twitter</span> Monitor
          </Link>
          <h2 className="text-xl text-gray-400 mt-4">Simple Pricing</h2>
        </div>

        {/* Free Trial */}
        <div className="p-6 bg-gray-900 rounded-xl border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Free Trial</h3>
            <span className="px-3 py-1 bg-green-500/10 text-green-400 text-sm rounded-full">Free</span>
          </div>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>3 hours of monitoring</li>
            <li>Up to 30 Twitter accounts</li>
            <li>Real-time Telegram forwarding</li>
          </ul>
        </div>

        {/* Paid Plan */}
        <div className="p-6 bg-gray-900 rounded-xl border border-blue-500/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Pro Plan</h3>
            <span className="text-2xl font-bold text-blue-400">200 USDT</span>
          </div>
          <p className="text-gray-400 text-sm mb-6">Unlimited monitoring access</p>

          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">BEP20 (BSC)</div>
              <code className="text-sm text-yellow-400 break-all">
                0xa1a267a24316a039d3f9feff2968e3e0d1029848
              </code>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">TRC20 (Tron)</div>
              <code className="text-sm text-yellow-400 break-all">
                TEfJbc178R6NzogDakY2Q1Xritm24VnxL7
              </code>
            </div>
          </div>

          <p className="text-sm text-gray-400 mt-4">
            After payment, contact support to activate your subscription:
          </p>
          <a
            href="https://t.me/kowliep"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold text-center transition"
          >
            Contact Support on Telegram
          </a>
        </div>

        <div className="text-center">
          <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
