import { NextRequest, NextResponse } from "next/server";
import { getDrawEntries } from "@/lib/sheets";

const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "kclmusic2026").trim();

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get("password");
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const entries = await getDrawEntries();
    return NextResponse.json({ entries });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
