import { NextRequest, NextResponse } from "next/server";
import { appendDrawEntry, getDrawEntries } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  try {
    const entries = await getDrawEntries();
    const duplicate = entries.find(
      (e) => e.email.toLowerCase() === email.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const entryId = crypto.randomUUID();
    await appendDrawEntry({
      timestamp: new Date().toISOString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      entryId,
    });

    return NextResponse.json({ success: true, entryId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
