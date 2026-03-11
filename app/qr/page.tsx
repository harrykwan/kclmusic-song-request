"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

const URL = "https://request.kclmusic.com";

export default function QRPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(URL, {
      width: 400,
      margin: 2,
      color: { dark: "#ffffff", light: "#00000000" }, // white dots, transparent bg
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl);
  }, []);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[120px]" />
      </div>

      <div className="relative text-center">
        {/* Title */}
        <div className="mb-8">
          <div className="text-5xl mb-3 drop-shadow-[0_0_30px_rgba(168,85,247,0.9)]">🎵</div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent mb-2">
            Harry Kwan
          </h1>
          <p className="text-zinc-400 text-xl font-semibold">點歌台 · Song Request</p>
        </div>

        {/* QR Code */}
        <div className="relative mx-auto mb-8">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 blur-2xl opacity-40 scale-110" />
          <div className="relative bg-gradient-to-br from-purple-900/80 to-pink-900/60 border border-purple-500/40 rounded-3xl p-8 backdrop-blur-sm inline-block">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 block" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-zinc-600 animate-pulse">
                生成中...
              </div>
            )}
            {/* Center logo overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black rounded-xl p-2 border border-purple-500/40">
              <div className="text-2xl">🎵</div>
            </div>
          </div>
        </div>

        {/* URL */}
        <div className="bg-zinc-900/60 border border-zinc-700/60 rounded-2xl px-6 py-3 backdrop-blur-sm inline-block mb-6">
          <p className="text-purple-300 font-mono text-lg font-semibold tracking-wide">{URL}</p>
        </div>

        <p className="text-zinc-500 text-sm">掃碼點你想聽的歌 · Scan to request a song</p>

        {/* Back link */}
        <div className="mt-10">
          <a href="/" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
            ← 返回歌單 Back to queue
          </a>
        </div>
      </div>
    </main>
  );
}
