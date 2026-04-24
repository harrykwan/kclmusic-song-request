import { NextRequest, NextResponse } from "next/server";
import { getDrawEntries } from "@/lib/sheets";

const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "kclmusic2026").trim();

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const entries = await getDrawEntries();
    if (entries.length === 0) {
      return NextResponse.json({ error: "No entries yet" }, { status: 404 });
    }
    const winner = entries[Math.floor(Math.random() * entries.length)];
    return NextResponse.json({ winner });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
