"use client";
import { useState } from "react";
import confetti from "canvas-confetti";

export default function LuckyDrawPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/draw/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSuccess(true);
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ["#a855f7", "#ec4899", "#f59e0b", "#fff"] });
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-md flex flex-col gap-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🎟️</div>
          <h1 className="text-white text-2xl font-bold">KCL Music 抽獎</h1>
          <p className="text-zinc-400 text-sm mt-1">登記電郵，有機會獲得驚喜獎品！</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-5xl">🎉</div>
            <p className="text-green-400 text-xl font-bold text-center">已登記！</p>
            <p className="text-zinc-400 text-center">等待抽獎結果，祝你好運 🍀</p>
            <p className="text-zinc-600 text-sm text-center">（{email}）</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">姓名 Name</label>
              <input
                type="text"
                placeholder="你的名字"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-600"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">電郵 Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-600"
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 font-semibold transition-colors"
            >
              {submitting ? "登記中..." : "立即登記 🎟️"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
