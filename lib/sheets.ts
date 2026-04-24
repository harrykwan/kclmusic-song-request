import { google } from "googleapis";

function getAuth() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN! });
  return oauth2;
}

export interface DrawEntry {
  timestamp: string;
  name: string;
  email: string;
  entryId: string;
}

export async function appendDrawEntry(entry: DrawEntry) {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_DRAW_SHEET_ID!,
    range: "Draw Entries!A:D",
    valueInputOption: "RAW",
    requestBody: {
      values: [[entry.timestamp, entry.name, entry.email, entry.entryId]],
    },
  });
}

export async function getDrawEntries(): Promise<DrawEntry[]> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_DRAW_SHEET_ID!,
    range: "Draw Entries!A:D",
  });
  const rows = res.data.values || [];
  return rows
    .slice(1)
    .filter((r) => r[2])
    .map((r) => ({
      timestamp: r[0] || "",
      name: r[1] || "",
      email: r[2] || "",
      entryId: r[3] || "",
    }));
}
