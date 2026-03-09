import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TweetPipe - Real-time Tweet to Telegram",
  description: "Monitor Twitter accounts and forward tweets to Telegram in real-time",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface-0 text-text-primary min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
