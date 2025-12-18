import { NextRequest, NextResponse } from "next/server";

function streakToTime(streak: number): string {
  const totalSeconds = streak * 210; // 1 streak = 3m30s = 210s

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} Hari`);
  if (hours > 0) parts.push(`${hours} Jam`);
  if (minutes > 0) parts.push(`${minutes} Menit`);
  if (seconds > 0) parts.push(`${seconds} Detik`);

  return parts.join(" ");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const streakParam = searchParams.get("streak");

  if (streakParam === null) {
    return NextResponse.json({ error: "Missing 'streak' parameter" }, { status: 400 });
  }

  const streakCount = parseInt(streakParam, 10);
  if (isNaN(streakCount) || streakCount < 0) {
    return NextResponse.json(
      { error: "'streak' must be a non-negative integer" },
      { status: 400 }
    );
  }

  const result = streakToTime(streakCount);
  return NextResponse.json({ streak: streakCount, time: result });
}