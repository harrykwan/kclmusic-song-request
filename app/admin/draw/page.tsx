"use client";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";

interface DrawEntry {
  timestamp: string;
  name: string;
  email: string;
  entryId: string;
}

function fireWinnerConfetti() {
  confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors: ["#fbbf24", "#f59e0b", "#fcd34d", "#fff", "#a855f7"] });
  setTimeout(() => confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#fbbf24", "#a855f7"] }), 300);
  setTimeout(() => confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#fbbf24", "#a855f7"] }), 500);
}

export default function AdminDrawPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [entries, setEntries] = useState<DrawEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<DrawEntry | null>(null);
  const [msg, setMsg] = useState("");

  async function load(pw: string) {
    setLoading(true);
    const res = await fetch(`/api/draw/entries?password=${encodeURIComponent(pw)}`);
    if (res.status === 401) {
      setMsg("❌ Wrong password");
      setAuthed(false);
      setLoading(false);
      return;
    }
    const data = await res.json();
    if (data.entries) setEntries(data.entries);
    setLoading(false);
  }

  async function handleLogin() {
    setMsg("");
    const res = await fetch(`/api/draw/entries?password=${encodeURIComponent(password)}`);
    if (res.status === 401) { setMsg("❌ Wrong password"); return; }
    const data = await res.json();
    if (data.entries) { setEntries(data.entries); setAuthed(true); }
  }

  async function handlePick() {
    setWinner(null);
    setLoading(true);
    const res = await fetch("/api/draw/pick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.winner) {
      setWinner(data.winner);
      fireWinnerConfetti();
    } else {
      setMsg(data.error || "Error picking winner");
    }
  }

  function exportCSV() {
    const header = "Timestamp,Name,Email,EntryID\n";
    const rows = entries.map(e => `"${e.timestamp}","${e.name}","${e.email}","${e.entryId}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "draw-entries.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-zinc-900 rounded-2xl p-8 w-80 flex flex-col gap-4">
          <h1 className="text-white text-xl font-bold text-center">🔐 Admin Login</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="bg-zinc-800 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500"
          />
          {msg && <p className="text-red-400 text-sm text-center">{msg}</p>}
          <button
            onClick={handleLogin}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 font-semibold transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🎰 抽獎管理</h1>
          <div className="flex gap-2">
            <button onClick={() => load(password)} className="bg-zinc-700 hover:bg-zinc-600 rounded-lg px-4 py-2 text-sm transition-colors">
              🔄 重新整理
            </button>
            <button onClick={exportCSV} className="bg-zinc-700 hover:bg-zinc-600 rounded-lg px-4 py-2 text-sm transition-colors">
              📥 匯出 CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-zinc-900 rounded-2xl p-6 flex items-center gap-4">
          <div className="text-5xl font-bold text-purple-400">{entries.length}</div>
          <div>
            <div className="text-white font-semibold text-lg">登記人數</div>
            <div className="text-zinc-400 text-sm">Total Entries</div>
          </div>
        </div>

        {/* Draw button */}
        <button
          onClick={handlePick}
          disabled={loading || entries.length === 0}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-5 text-2xl font-bold transition-all transform hover:scale-105 active:scale-95"
        >
          {loading ? "抽緊..." : "🎰 抽獎！"}
        </button>

        {msg && <p className="text-red-400 text-center">{msg}</p>}

        {/* Winner */}
        {winner && (
          <div className="bg-yellow-900/20 border-2 border-yellow-400 rounded-2xl p-6 flex flex-col gap-3 text-center animate-pulse">
            <div className="text-4xl">🏆</div>
            <div className="text-yellow-300 text-2xl font-bold">{winner.name}</div>
            <div className="text-yellow-400 text-lg">{winner.email}</div>
            <div className="text-zinc-500 text-xs font-mono">ID: {winner.entryId}</div>
            <div className="text-zinc-500 text-xs">{new Date(winner.timestamp).toLocaleString("zh-HK")}</div>
            <button
              onClick={handlePick}
              className="mt-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg px-6 py-2 text-sm font-semibold transition-colors mx-auto"
            >
              再抽 🎲
            </button>
          </div>
        )}

        {/* Entries table */}
        <div className="bg-zinc-900 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-semibold text-zinc-300">所有登記 All Entries</h2>
          </div>
          {entries.length === 0 ? (
            <div className="p-8 text-center text-zinc-600">暫時未有登記</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 text-xs uppercase border-b border-zinc-800">
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">時間</th>
                    <th className="text-left p-3">姓名</th>
                    <th className="text-left p-3">電郵</th>
                    <th className="text-left p-3">Entry ID</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={e.entryId} className={`border-b border-zinc-800 ${winner?.entryId === e.entryId ? "bg-yellow-900/20 text-yellow-300" : "hover:bg-zinc-800"}`}>
                      <td className="p-3 text-zinc-500">{i + 1}</td>
                      <td className="p-3 text-zinc-400 text-xs">{new Date(e.timestamp).toLocaleString("zh-HK")}</td>
                      <td className="p-3 font-medium">{e.name}</td>
                      <td className="p-3 text-zinc-300">{e.email}</td>
                      <td className="p-3 text-zinc-600 font-mono text-xs">{e.entryId.slice(0, 8)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
