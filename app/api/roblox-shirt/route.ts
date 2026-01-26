import { NextResponse } from "next/server";

const API = "https://api.coolpixels.net/roblox/assetdelivery/";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get("id");

  if (!assetId) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 }
    );
  }

  // 1. fetch XML asset
  const xmlRes = await fetch(`${API}${assetId}`, {
    cache: "no-store"
  });

  if (!xmlRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch asset XML" },
      { status: 502 }
    );
  }

  const xml = await xmlRes.text();

  // 2. extract ShirtTemplate ID
  const match = xml.match(/asset\/\?id=(\d+)/);

  if (!match) {
    return NextResponse.json(
      { error: "ShirtTemplate not found" },
      { status: 404 }
    );
  }

  const templateId = match[1];

  // 3. fetch PNG image
  const imgRes = await fetch(`${API}${templateId}`, {
    cache: "no-store"
  });

  if (!imgRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 }
    );
  }

  const buffer = Buffer.from(await imgRes.arrayBuffer());

  // 4. return image
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400"
    }
  });
}

export const dynamic = "force-dynamic";