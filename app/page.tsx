"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";

interface Song {
  id: number;
  youtube_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  votes: number;
  requester_name: string | null;
  performed: boolean;
  now_playing: boolean;
  created_at: string;
}

interface YTResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#a855f7", "#ec4899", "#f59e0b", "#fff"] });
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YTResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [voted, setVoted] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<"request" | "queue">("queue");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "warn" | "err" } | null>(null);
  const [preview, setPreview] = useState<YTResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevVotesRef = useRef<Record<number, number>>({});

  const showToast = (msg: string, type: "ok" | "warn" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSongs = useCallback(async () => {
    const [songsRes, npRes] = await Promise.all([
      fetch("/api/songs"),
      fetch("/api/now-playing"),
    ]);
    const data: Song[] = await songsRes.json();
    const np: Song | null = await npRes.json();

    // Animate vote bumps
    data.forEach(s => {
      const prev = prevVotesRef.current[s.id];
      if (prev !== undefined && s.votes > prev) {
        const el = document.getElementById(`vote-${s.id}`);
        el?.classList.remove("vote-bump");
        void el?.offsetWidth;
        el?.classList.add("vote-bump");
      }
    });
    prevVotesRef.current = Object.fromEntries(data.map(s => [s.id, s.votes]));

    setSongs(data);
    setNowPlaying(np);
  }, []);

  useEffect(() => {
    fetchSongs();
    const saved = localStorage.getItem("voted");
    if (saved) setVoted(new Set(JSON.parse(saved)));
    // Auto-refresh every 10s
    const interval = setInterval(fetchSongs, 10000);
    return () => clearInterval(interval);
  }, [fetchSongs]);

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
      showToast(data.error === "already_exists" ? "⚠️ 呢首歌已經有人點過啦！" : "❌ 出錯了，請再試", data.error === "already_exists" ? "warn" : "err");
    } else {
      fireConfetti();
      showToast("🎵 點歌成功！", "ok");
      setTab("queue");
      setQuery("");
      setResults([]);
      setPreview(null);
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
  const topSong = active[0];

  const toastBg = toast?.type === "warn" ? "bg-yellow-400 text-black"
    : toast?.type === "err" ? "bg-red-500 text-white"
    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white";

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Ambient glow top */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-purple-700/20 blur-[100px]" />
        <div className="absolute top-20 -left-20 w-[300px] h-[300px] rounded-full bg-pink-700/10 blur-[80px]" />
        <div className="absolute top-20 -right-20 w-[300px] h-[300px] rounded-full bg-blue-700/10 blur-[80px]" />
      </div>

      <div className="relative max-w-xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-block text-5xl mb-3 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">🎵</div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
            Harry Kwan 點歌台
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Song Requests · 想聽咩就話我知</p>
          <p className="text-zinc-700 text-xs mt-1">{active.length} songs in queue · auto-refreshes every 10s</p>
        </div>

        {/* Now Playing Banner */}
        {nowPlaying && (
          <div className="mb-5 rounded-2xl overflow-hidden border border-purple-500/40 bg-gradient-to-r from-purple-900/60 to-pink-900/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border-b border-purple-500/30">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">Now Playing · 正在演唱</span>
            </div>
            <div className="flex items-center gap-3 p-3">
              <img src={nowPlaying.thumbnail} alt="" className="w-16 h-12 object-cover rounded-xl ring-2 ring-purple-500/50" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{nowPlaying.title}</div>
                <div className="text-xs text-zinc-400 truncate">{nowPlaying.channel}</div>
                {nowPlaying.requester_name && (
                  <div className="text-xs text-purple-400 mt-0.5">♪ requested by {nowPlaying.requester_name}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex rounded-2xl overflow-hidden border border-zinc-800 mb-6 p-1 bg-zinc-900/60 gap-1">
          {(["queue", "request"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                tab === t
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t === "queue" ? `🎤 歌單 (${active.length})` : "➕ 點歌"}
            </button>
          ))}
        </div>

        {/* REQUEST TAB */}
        {tab === "request" && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="你叫咩名？ Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-700/60 rounded-2xl px-4 py-3 text-sm outline-none focus:border-purple-500/60 text-zinc-300 placeholder-zinc-600 backdrop-blur-sm"
            />
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 搜尋歌曲 Search a song..."
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-700/60 rounded-2xl px-4 py-3 text-sm outline-none focus:border-purple-500/60 placeholder-zinc-600 backdrop-blur-sm"
              />
              {searching && <div className="absolute right-4 top-3.5 text-zinc-500 text-xs animate-pulse">搜尋中...</div>}
            </div>

            {results.length > 0 && (
              <div className="space-y-2">
                {results.map(r => (
                  <div key={r.id} className="group flex items-center gap-3 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-3 hover:border-purple-500/40 transition-all backdrop-blur-sm">
                    <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setPreview(preview?.id === r.id ? null : r)}>
                      <img src={r.thumbnail} alt="" className="w-16 h-12 object-cover rounded-xl" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-lg">▶</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.title}</div>
                      <div className="text-xs text-zinc-500 truncate">{r.channel}</div>
                    </div>
                    <button
                      onClick={() => requestSong(r)}
                      disabled={submitting === r.id}
                      className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0 shadow-lg shadow-purple-500/20"
                    >
                      {submitting === r.id ? "..." : "點歌"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* YouTube preview embed */}
            {preview && (
              <div className="rounded-2xl overflow-hidden border border-zinc-700/60 bg-zinc-900/80 backdrop-blur-sm">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                  <span className="text-xs text-zinc-400 truncate flex-1 mr-2">{preview.title}</span>
                  <button onClick={() => setPreview(null)} className="text-zinc-600 hover:text-white text-sm">✕</button>
                </div>
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${preview.id}?autoplay=1`}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* QUEUE TAB */}
        {tab === "queue" && (
          <div className="space-y-3">
            {active.length === 0 && (
              <div className="text-center text-zinc-600 py-16">
                <div className="text-4xl mb-3 opacity-50">🎶</div>
                <div className="text-sm">未有歌單 · No requests yet</div>
                <button onClick={() => setTab("request")} className="mt-3 text-sm text-purple-400 hover:text-purple-300 underline">去點歌 →</button>
              </div>
            )}
            {active.map((song, i) => {
              const isTop = i === 0;
              const isTrending = !isTop && song.votes >= 3 && song.votes >= (topSong?.votes ?? 0) * 0.7;
              return (
                <div
                  key={song.id}
                  className={`flex items-center gap-3 rounded-2xl p-3 border transition-all ${
                    song.now_playing
                      ? "bg-gradient-to-r from-purple-900/70 to-pink-900/50 border-purple-500/50 ring-1 ring-purple-500/30"
                      : isTop
                      ? "bg-gradient-to-r from-yellow-900/30 to-orange-900/20 border-yellow-600/30"
                      : "bg-zinc-900/60 border-zinc-800/60 hover:border-zinc-700/60"
                  } backdrop-blur-sm`}
                >
                  {/* Rank */}
                  <div className="w-6 flex-shrink-0 text-center">
                    {song.now_playing ? <span className="text-purple-400 text-base animate-pulse">♪</span>
                      : isTop ? <span className="text-yellow-400 text-base">🔥</span>
                      : isTrending ? <span className="text-pink-400 text-xs font-bold">↑</span>
                      : <span className="text-zinc-700 text-xs">{i + 1}</span>}
                  </div>

                  <img src={song.thumbnail} alt="" className="w-14 h-10 object-cover rounded-xl flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold truncate">{song.title}</span>
                      {isTop && !song.now_playing && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">TOP</span>
                      )}
                      {isTrending && (
                        <span className="text-xs bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">🔥 趨勢</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {song.channel}
                      {song.requester_name && <span className="ml-1 text-zinc-600">· {song.requester_name}</span>}
                    </div>
                  </div>

                  {/* Vote button */}
                  <button
                    id={`vote-${song.id}`}
                    onClick={() => vote(song.id)}
                    disabled={voted.has(song.id)}
                    className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex-shrink-0 ${
                      voted.has(song.id)
                        ? "text-pink-400 bg-pink-400/15 shadow-inner shadow-pink-500/10"
                        : "text-zinc-500 hover:text-pink-400 hover:bg-pink-400/10 hover:scale-110"
                    }`}
                  >
                    <span className="text-base leading-none">♥</span>
                    <span className="mt-0.5 tabular-nums">{song.votes}</span>
                  </button>
                </div>
              );
            })}

            {performed.length > 0 && (
              <div className="mt-6 pt-4 border-t border-zinc-800/60">
                <div className="text-xs text-zinc-700 uppercase tracking-widest mb-3 font-semibold">✓ 已演唱 Performed ({performed.length})</div>
                <div className="space-y-2">
                  {performed.map(song => (
                    <div key={song.id} className="flex items-center gap-3 opacity-30 py-1">
                      <span className="text-green-500 text-xs w-6 text-center">✓</span>
                      <img src={song.thumbnail} alt="" className="w-10 h-8 object-cover rounded-lg flex-shrink-0" />
                      <div className="text-xs truncate line-through text-zinc-500">{song.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer QR link */}
        <div className="mt-10 text-center">
          <a href="/qr" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
            📱 顯示 QR Code · Show QR
          </a>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 ${toastBg} text-sm px-6 py-3 rounded-full shadow-2xl font-semibold z-50 whitespace-nowrap`}
          style={{ animation: "slideUp 0.3s ease" }}>
          {toast.msg}
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .vote-bump {
          animation: voteBump 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        @keyframes voteBump {
          0%  { transform: scale(1); }
          40% { transform: scale(1.4); }
          100%{ transform: scale(1); }
        }
      `}</style>
    </main>
  );
}
