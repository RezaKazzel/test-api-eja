import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  const URL = "https://evade-nextbot.fandom.com/wiki/Codes";

  try {
    const res = await fetch(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch page: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const activeData: any[] = [];

    $("tr").each((_, row) => {
      const cols = $(row).find("td");
      if (cols.length === 4) {
        const id = $(cols[0]).text().trim();
        const points = $(cols[1]).text().trim().replace(/'/g, "");
        const status = $(cols[2]).text().trim();
        const date = $(cols[3]).text().trim();

        if (status.toLowerCase() === "true") {
          activeData.push({ id, points, status, date });
        }
      }
    });

    return NextResponse.json(activeData);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
