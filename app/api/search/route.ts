import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json([]);

  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(q)}&key=${apiKey}`;
  
  const res = await fetch(url);
  const data = await res.json();

  if (!data.items) {
    console.error('YouTube API error:', JSON.stringify(data));
    return NextResponse.json({ error: data?.error?.message || 'no items', data }, { status: 500 });
  }

  const results = data.items.map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
  }));

  return NextResponse.json(results);
}
