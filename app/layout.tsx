import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commodity Pulse — Builder's Brief",
  description:
    "Weekly supply chain intelligence for hardware and manufacturing companies. Live raw material prices and AI-generated procurement analysis.",
  keywords: "supply chain, commodities, aluminum, steel, copper, manufacturing, procurement",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface antialiased">{children}</body>
    </html>
  );
}
