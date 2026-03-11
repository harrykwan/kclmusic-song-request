import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "kclmusic2026").trim();

export async function POST(req: NextRequest) {
  const { password, action, id } = await req.json();
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    if (action === "performed") {
      await sql`UPDATE song_requests SET performed = true, now_playing = false WHERE id = ${id}`;
    } else if (action === "delete") {
      await sql`DELETE FROM song_requests WHERE id = ${id}`;
    } else if (action === "clear_performed") {
      await sql`DELETE FROM song_requests WHERE performed = true`;
    } else if (action === "unperform") {
      await sql`UPDATE song_requests SET performed = false WHERE id = ${id}`;
    } else if (action === "now_playing") {
      // Clear existing, set new
      await sql`UPDATE song_requests SET now_playing = false`;
      if (id) await sql`UPDATE song_requests SET now_playing = true WHERE id = ${id}`;
    } else if (action === "clear_now_playing") {
      await sql`UPDATE song_requests SET now_playing = false`;
    } else if (action === "migrate") {
      // Add now_playing column if it doesn't exist
      await sql`ALTER TABLE song_requests ADD COLUMN IF NOT EXISTS now_playing BOOLEAN DEFAULT false`;
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
