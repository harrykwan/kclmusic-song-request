"use client";

import { useState, useEffect, useRef } from "react";

interface Song {
  id: number;
  youtube_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  votes: number;
  requester_name: string | null;
  performed: boolean;
  created_at: string;
}

interface YTResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YTResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [voted, setVoted] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<"request" | "queue">("queue");
  const [toast, setToast] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchSongs();
    const saved = localStorage.getItem("voted");
    if (saved) setVoted(new Set(JSON.parse(saved)));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSongs = async () => {
    const res = await fetch("/api/songs");
    const data = await res.json();
    setSongs(data);
  };

  const searchYT = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setSearching(false);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchYT(val), 500);
  };

  const requestSong = async (song: YTResult) => {
    setSubmitting(song.id);
    const res = await fetch("/api/songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...song, requester_name: name || null }),
    });
    const data = await res.json();
    if (data.error) {
      showToast(data.error === "already_exists" ? "⚠️ 呢首歌已經有人點過啦！" : "❌ 出錯了，請再試");
    } else {
      showToast("✅ 已點歌！");
      setTab("queue");
      setQuery("");
      setResults([]);
    }
    fetchSongs();
    setSubmitting(null);
  };

  const vote = async (id: number) => {
    if (voted.has(id)) return;
    await fetch(`/api/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const newVoted = new Set([...voted, id]);
    setVoted(newVoted);
    localStorage.setItem("voted", JSON.stringify([...newVoted]));
    fetchSongs();
  };

  const active = songs.filter(s => !s.performed).sort((a, b) => b.votes - a.votes);
  const performed = songs.filter(s => s.performed);

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🎵</div>
        <h1 className="text-2xl font-bold">Harry Kwan 點歌台</h1>
        <p className="text-zinc-400 text-sm mt-1">Song Requests · 想聽咩就話我知</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-zinc-800 mb-6">
        {(["queue", "request"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            {t === "queue" ? `🎤 歌單 (${active.length})` : "➕ 點歌"}
          </button>
        ))}
      </div>

      {/* REQUEST TAB */}
      {tab === "request" && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="你叫咩名？（可以唔填）What's your name? (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-500 text-zinc-300 placeholder-zinc-600"
          />
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 搜尋歌曲 Search a song..."
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-500 placeholder-zinc-600"
            />
            {searching && <div className="absolute right-4 top-3.5 text-zinc-500 text-xs">搜尋中...</div>}
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map(r => (
                <div key={r.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:border-zinc-600 transition-colors">
                  <img src={r.thumbnail} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    <div className="text-xs text-zinc-500 truncate">{r.channel}</div>
                  </div>
                  <button
                    onClick={() => requestSong(r)}
                    disabled={submitting === r.id}
                    className="text-xs bg-white text-black px-3 py-1.5 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {submitting === r.id ? "..." : "點歌"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUEUE TAB */}
      {tab === "queue" && (
        <div className="space-y-3">
          {active.length === 0 && (
            <div className="text-center text-zinc-600 py-12">
              <div className="text-3xl mb-2">🎶</div>
              <div>未有歌單 · No requests yet</div>
              <button onClick={() => setTab("request")} className="mt-3 text-sm text-zinc-400 underline">去點歌 →</button>
            </div>
          )}
          {active.map((song, i) => (
            <div key={song.id} className={`flex items-center gap-3 rounded-xl p-3 border transition-colors ${
              i === 0 ? "bg-zinc-800 border-zinc-600" : "bg-zinc-900 border-zinc-800"
            }`}>
              {i === 0 && <div className="text-yellow-400 text-lg flex-shrink-0">🔥</div>}
              {i > 0 && <div className="text-zinc-600 text-sm w-5 text-center flex-shrink-0">{i + 1}</div>}
              <img src={song.thumbnail} alt="" className="w-14 h-10 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{song.title}</div>
                <div className="text-xs text-zinc-500 truncate">
                  {song.channel}
                  {song.requester_name && <span className="ml-1 text-zinc-600">· by {song.requester_name}</span>}
                </div>
              </div>
              <button
                onClick={() => vote(song.id)}
                disabled={voted.has(song.id)}
                className={`flex flex-col items-center px-2 py-1 rounded-lg text-xs font-bold transition-colors flex-shrink-0 ${
                  voted.has(song.id) ? "text-pink-400 bg-pink-400/10" : "text-zinc-500 hover:text-pink-400 hover:bg-pink-400/10"
                }`}
              >
                <span>▲</span>
                <span>{song.votes}</span>
              </button>
            </div>
          ))}

          {performed.length > 0 && (
            <div className="mt-6">
              <div className="text-xs text-zinc-600 uppercase tracking-widest mb-2">已演唱 Performed</div>
              {performed.map(song => (
                <div key={song.id} className="flex items-center gap-3 rounded-xl p-3 opacity-40">
                  <div className="text-green-400 text-sm flex-shrink-0">✓</div>
                  <img src={song.thumbnail} alt="" className="w-12 h-9 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate line-through">{song.title}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-black text-sm px-5 py-3 rounded-full shadow-xl font-medium z-50 animate-bounce">
          {toast}
        </div>
      )}
    </main>
  );
}
