"use client";
import { useState, useEffect } from "react";

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

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [migrated, setMigrated] = useState(false);

  const pending = songs.filter((s) => !s.performed).sort((a, b) => b.votes - a.votes);
  const performed = songs.filter((s) => s.performed).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const nowPlaying = songs.find((s) => s.now_playing);

  async function load() {
    const res = await fetch("/api/songs");
    const data = await res.json();
    if (Array.isArray(data)) setSongs(data);
  }

  useEffect(() => {
    if (authed) {
      // Run migration to add now_playing column
      if (!migrated) {
        fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, action: "migrate" }),
        }).then(() => setMigrated(true));
      }
      load();
      const interval = setInterval(load, 10000);
      return () => clearInterval(interval);
    }
  }, [authed]);

  async function adminAction(action: string, id?: number) {
    setLoading(true);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, action, id }),
    });
    const data = await res.json();
    if (data.error === "unauthorized") {
      setMsg("❌ Wrong password");
    } else {
      setMsg("✅ Done");
      await load();
    }
    setLoading(false);
    setTimeout(() => setMsg(""), 2000);
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
            onKeyDown={(e) => e.key === "Enter" && setAuthed(true)}
            className="bg-zinc-800 text-white rounded-lg px-4 py-2 outline-none"
          />
          <button
            onClick={() => setAuthed(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🎛️ Song Request Admin</h1>
        <div className="flex items-center gap-3">
          <a href="/qr" target="_blank" className="text-xs text-zinc-500 hover:text-white">📱 QR</a>
          <button onClick={() => setAuthed(false)} className="text-zinc-400 text-sm hover:text-white">Logout</button>
        </div>
      </div>

      {msg && <div className="mb-4 text-center text-sm font-medium">{msg}</div>}

      {/* Now Playing banner */}
      {nowPlaying && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-900/60 to-pink-900/40 border border-purple-500/40 p-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-xs text-purple-300 font-bold uppercase tracking-widest flex-shrink-0">Now Playing</span>
          <img src={nowPlaying.thumbnail} alt="" className="w-10 h-8 rounded object-cover flex-shrink-0" />
          <span className="text-sm font-medium truncate flex-1">{nowPlaying.title}</span>
          <button
            onClick={() => adminAction("clear_now_playing")}
            className="text-xs text-zinc-500 hover:text-red-400 flex-shrink-0"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Pending queue */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-purple-400">
          📋 Queue ({pending.length})
        </h2>
        {pending.length === 0 && <p className="text-zinc-500 text-sm">No pending requests</p>}
        <div className="flex flex-col gap-3">
          {pending.map((song) => (
            <div key={song.id} className={`rounded-xl p-4 flex gap-3 items-center transition-all ${
              song.now_playing ? "bg-purple-900/40 border border-purple-500/50" : "bg-zinc-900"
            }`}>
              <img src={song.thumbnail} alt="" className="w-16 h-12 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{song.title}</p>
                <p className="text-xs text-zinc-400">{song.channel} · {song.votes} vote{song.votes !== 1 ? "s" : ""}</p>
                {song.requester_name && <p className="text-xs text-purple-400">by {song.requester_name}</p>}
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => adminAction("now_playing", song.now_playing ? undefined : song.id)}
                  disabled={loading}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${
                    song.now_playing
                      ? "bg-purple-600 text-white"
                      : "bg-zinc-700 hover:bg-purple-700 text-zinc-300"
                  }`}
                >
                  {song.now_playing ? "♪ Playing" : "▶ Play"}
                </button>
                <button
                  onClick={() => adminAction("performed", song.id)}
                  disabled={loading}
                  className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded-lg"
                >
                  ✓ Done
                </button>
                <button
                  onClick={() => adminAction("delete", song.id)}
                  disabled={loading}
                  className="bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-red-300 text-xs px-3 py-1 rounded-lg"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performed history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-zinc-400">
            ✅ Performed ({performed.length})
          </h2>
          {performed.length > 0 && (
            <button
              onClick={() => { if (confirm("Clear all performed history?")) adminAction("clear_performed"); }}
              disabled={loading}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear all
            </button>
          )}
        </div>
        {performed.length === 0 && <p className="text-zinc-600 text-sm">Nothing yet</p>}
        <div className="flex flex-col gap-2">
          {performed.map((song) => (
            <div key={song.id} className="bg-zinc-900/50 rounded-xl p-3 flex gap-3 items-center opacity-60">
              <img src={song.thumbnail} alt="" className="w-12 h-9 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate line-through">{song.title}</p>
                <p className="text-xs text-zinc-500">{song.votes} vote{song.votes !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => adminAction("unperform", song.id)}
                  disabled={loading}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded"
                >
                  ↩ Undo
                </button>
                <button
                  onClick={() => adminAction("delete", song.id)}
                  disabled={loading}
                  className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
