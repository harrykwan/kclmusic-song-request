import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

// GET /api/now-playing → returns currently playing song (or null)
export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM song_requests 
      WHERE now_playing = true 
      LIMIT 1
    `;
    return NextResponse.json(rows[0] || null);
  } catch {
    return NextResponse.json(null);
  }
}
