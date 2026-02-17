import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sephirot — Agentic Hub",
  description: "Multi-model AI agent platform with stateful workflows",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="noise">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
