import { NextResponse } from "next/server";
import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL,
});

let connected = false;
async function getRedis() {
  if (!connected) {
    await redis.connect();
    connected = true;
  }
  return redis;
}

// GET: ambil semua chat terbaru lalu kosongkan
export async function GET() {
  try {
    const client = await getRedis();

    const messages = await client.lRange("chat:queue", 0, -1);

    if (messages.length > 0) {
      await client.del("chat:queue"); // clear setelah dibaca
    }

    const parsed = messages
      .map((m) => JSON.parse(m))
      .reverse(); // biar urutan lama → baru

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: tambah chat baru
export async function POST(req: Request) {
  try {
    const { text, from } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "text wajib ada" },
        { status: 400 }
      );
    }

    const payload = {
      text,
      from: from || "unknown",
      ts: Date.now(),
    };

    const client = await getRedis();
    await client.lPush("chat:queue", JSON.stringify(payload));

    // optional: batasi max 10 pesan
    await client.lTrim("chat:queue", 0, 9);

    return NextResponse.json({ message: "ok" });
  } catch (err: any) {
    console.error("POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
