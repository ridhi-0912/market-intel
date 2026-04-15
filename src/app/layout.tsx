import type { Metadata } from "next";
import NavBar from "../components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Market Intelligence",
  description: "Collect, analyze, and summarize competitive intelligence from web sources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <NavBar />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
