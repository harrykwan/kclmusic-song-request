-- Run this once in Vercel Postgres to create the table
CREATE TABLE IF NOT EXISTS song_requests (
  id SERIAL PRIMARY KEY,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  votes INTEGER DEFAULT 1,
  requester_name TEXT,
  performed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
