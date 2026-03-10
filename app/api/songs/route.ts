import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT * FROM song_requests ORDER BY votes DESC, created_at ASC
    `;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id: youtube_id, title, channel, thumbnail, requester_name } = body;

  try {
    // Check if already exists
    const existing = await sql`SELECT id FROM song_requests WHERE youtube_id = ${youtube_id} AND performed = false`;
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "already_exists" }, { status: 409 });
    }

    const { rows } = await sql`
      INSERT INTO song_requests (youtube_id, title, channel, thumbnail, votes, requester_name, performed)
      VALUES (${youtube_id}, ${title}, ${channel}, ${thumbnail}, 1, ${requester_name || null}, false)
      RETURNING *
    `;
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
