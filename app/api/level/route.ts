import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const levelParam = searchParams.get("level");
  const tujuanParam = searchParams.get("tujuan");

  const level = parseInt(levelParam ?? "1", 10);
  const tujuan = parseInt(tujuanParam ?? level.toString(), 10);

  if (isNaN(level) || isNaN(tujuan)) {
    return NextResponse.json(
      { error: "Parameter 'level' dan 'tujuan' harus angka" },
      { status: 400 }
    );
  }

  let ayam = 0;
  for (let i = level; i <= tujuan; i++) {
    const bebek = Math.floor(1.5 * Math.pow(i, 1.5) + 10);
    ayam += bebek;
  }

  return NextResponse.json({ result: ayam });
}