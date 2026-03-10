import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harry Kwan — Song Requests 點歌",
  description: "Request a song for Harry's next live performance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-HK">
      <body className="min-h-screen bg-[#0a0a0a] text-white">{children}</body>
    </html>
  );
}
